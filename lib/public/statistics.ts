import { prisma } from "@/lib/prisma";
import type { PublicFilters } from "./filters";
import { toPublicClassificationRow } from "./mappers";

function avg(values: number[]) {
  return values.length ? values.reduce((sum, value) => sum + value, 0) / values.length : 0;
}

function median(values: number[]) {
  if (values.length === 0) return 0;
  const sorted = [...values].sort((a, b) => a - b);
  const middle = Math.floor(sorted.length / 2);
  return sorted.length % 2 ? sorted[middle] : (sorted[middle - 1] + sorted[middle]) / 2;
}

function std(values: number[]) {
  const average = avg(values);
  return Math.sqrt(avg(values.map((value) => (value - average) ** 2)));
}

function includes(value: string | null | undefined, filter: string | undefined) {
  if (!filter) return true;
  return (value ?? "").toLocaleLowerCase("es-ES").includes(filter.toLocaleLowerCase("es-ES"));
}

export async function getAdvancedStatistics(filters: PublicFilters) {
  const [classificationRows, snapshots, betBonusRows, scoringMatches, boteConfig] = await Promise.all([
    prisma.classification.findMany({ orderBy: { pos: "asc" }, include: { participant: { select: { slug: true } } } }),
    prisma.participantScoreSnapshot.findMany({ orderBy: { createdAt: "asc" }, take: 5000 }),
    prisma.betBonus.findMany({
      select: {
        participantId: true,
        campeon: true,
        subcampeon: true,
        maximoGoleador: true,
        seleccionMasGoleadora: true,
        seleccionMasGoleada: true,
        seleccionMenosGoleada: true,
        equipoRevelacion: true,
        equipoDecepcion: true
      }
    }),
    prisma.scoringMatch.findMany({
      select: {
        participantId: true,
        matchId: true,
        exactOk: true,
        diffOk: true,
        signOk: true,
        qualifiedOk: true,
        pointsTotal: true,
        match: { select: { fase: true, jornadaId: true, grupo: true, homeTeamId: true, awayTeamId: true, homeTeam: true, awayTeam: true } }
      }
    }),
    prisma.boteConfig.findUnique({ where: { id: "default" } }).catch(() => null)
  ]);

  const ranking = classificationRows
    .map(toPublicClassificationRow)
    .filter((row) => includes(row.alias, filters.alias))
    .filter((row) => includes(row.departamento, filters.departamento))
    .filter((row) => includes(row.rango, filters.rango));

  const publicRowsBySlug = new Map(ranking.map((row) => [row.slug, row]));
  const filteredClassificationRows = classificationRows.filter((row) => publicRowsBySlug.has(row.participant?.slug ?? ""));
  const filteredParticipantIds = new Set(filteredClassificationRows.map((row) => row.participantId));
  const points = ranking.map((row) => row.pointsTotal);
  const leaderPoints = ranking[0]?.pointsTotal ?? 0;
  const gaps = ranking.map((row, index) => ({
    alias: row.alias,
    gapLeader: leaderPoints - row.pointsTotal,
    gapPrevious: index === 0 ? 0 : ranking[index - 1].pointsTotal - row.pointsTotal
  }));
  const biggestGap = Math.max(0, ...gaps.map((gap) => gap.gapPrevious));
  const closestGap = Math.min(...gaps.slice(1).map((gap) => gap.gapPrevious).filter((gap) => gap >= 0), 0);

  const departmentMap = new Map<string, { total: number; participants: number; values: number[]; best: string; bestPoints: number }>();
  for (const row of ranking) {
    const key = row.departamento ?? "Sin departamento";
    const current = departmentMap.get(key) ?? { total: 0, participants: 0, values: [], best: row.alias, bestPoints: -1 };
    current.total += row.pointsTotal;
    current.participants += 1;
    current.values.push(row.pointsTotal);
    if (row.pointsTotal > current.bestPoints) {
      current.best = row.alias;
      current.bestPoints = row.pointsTotal;
    }
    departmentMap.set(key, current);
  }

  const departments = [...departmentMap.entries()].map(([departamento, value]) => ({
    departamento,
    participants: value.participants,
    total: value.total,
    average: Math.round(value.total / value.participants),
    min: Math.min(...value.values),
    max: Math.max(...value.values),
    dispersion: Math.round(std(value.values) * 10) / 10,
    mvp: value.best
  }));

  const scoreByParticipant = new Map<string, { exact: number; sign: number; diff: number; qualified: number; total: number }>();
  const filteredScoring = scoringMatches.filter((score) => {
    const match = score.match;
    return (
      includes(match.fase, filters.fase) &&
      includes(match.jornadaId, filters.jornada) &&
      includes(match.grupo, filters.grupo) &&
      (!filters.equipo ||
        includes(match.homeTeamId, filters.equipo) ||
        includes(match.awayTeamId, filters.equipo) ||
        includes(match.homeTeam, filters.equipo) ||
        includes(match.awayTeam, filters.equipo))
    );
  });
  for (const score of filteredScoring) {
    const current = scoreByParticipant.get(score.participantId) ?? { exact: 0, sign: 0, diff: 0, qualified: 0, total: 0 };
    current.exact += score.exactOk ? 1 : 0;
    current.sign += score.signOk ? 1 : 0;
    current.diff += score.diffOk ? 1 : 0;
    current.qualified += score.qualifiedOk ? 1 : 0;
    current.total += 1;
    scoreByParticipant.set(score.participantId, current);
  }

  const accuracy = ranking.map((row) => {
    const raw = classificationRows.find((item) => item.participant?.slug === row.slug);
    const scoring = raw ? scoreByParticipant.get(raw.participantId) : undefined;
    const totalHits = (raw?.exactScores ?? 0) + (raw?.correctDiff ?? 0) + (raw?.correctSigns ?? 0);
    return {
      alias: row.alias,
      exactScores: raw?.exactScores ?? scoring?.exact ?? 0,
      correctSigns: raw?.correctSigns ?? scoring?.sign ?? 0,
      correctDiff: raw?.correctDiff ?? scoring?.diff ?? 0,
      groupQualified: raw?.correctGroupQualified ?? 0,
      groupPositions: raw?.correctGroupPositions ?? 0,
      hitRate: scoring?.total ? Math.round(((scoring.exact + scoring.sign + scoring.diff + scoring.qualified) / (scoring.total * 4)) * 100) : totalHits
    };
  });

  const history = snapshots
    .filter((row) => ranking.some((current) => current.alias === row.alias))
    .map((row) => ({
      alias: row.alias,
      eventLabel: row.eventLabel ?? "Clasificacion",
      createdAt: row.createdAt.toISOString(),
      pos: row.pos,
      pointsTotal: row.pointsTotal,
      pointsGainedThisRun: row.pointsGainedThisRun,
      deltaPos: row.deltaPos
    }));

  const volatility = ranking.map((row) => {
    const rows = snapshots.filter((snapshot) => snapshot.alias === row.alias);
    return {
      alias: row.alias,
      deltaPos: row.deltaPos,
      deltaPoints: row.deltaPoints,
      averageMovement: Math.round(avg(rows.map((snapshot) => Math.abs(snapshot.deltaPos))) * 10) / 10,
      positionStd: Math.round(std(rows.map((snapshot) => snapshot.pos)) * 10) / 10,
      pointsStd: Math.round(std(rows.map((snapshot) => snapshot.pointsTotal)) * 10) / 10
    };
  });

  const filteredBetBonusRows = betBonusRows.filter((bet) => filteredParticipantIds.has(bet.participantId));
  const countMarket = (field: keyof (typeof betBonusRows)[number]) => {
    const counts = new Map<string, number>();
    for (const bet of filteredBetBonusRows) {
      const value = bet[field];
      if (typeof value !== "string" || !value) continue;
      counts.set(value, (counts.get(value) ?? 0) + 1);
    }
    return [...counts.entries()].map(([name, value]) => ({ name, value })).sort((a, b) => b.value - a.value);
  };

  const rarityByParticipant = filteredBetBonusRows.map((bet) => {
    const picks = [bet.campeon, bet.subcampeon, bet.maximoGoleador, bet.seleccionMasGoleadora, bet.seleccionMasGoleada].filter(Boolean);
    const popularity = picks.reduce((sum, pick) => sum + filteredBetBonusRows.filter((other) => Object.values(other).includes(pick)).length, 0);
    const rankingRow = classificationRows.find((row) => row.participantId === bet.participantId);
    return {
      alias: rankingRow?.alias ?? bet.participantId,
      rarity: picks.length ? Math.round(100 - popularity / picks.length) : 0,
      points: rankingRow?.pointsTotal ?? 0
    };
  });

  const totalBoteParticipants = await prisma.participant.count({ where: { OR: [{ pay: { equals: "SI", mode: "insensitive" } }, { pagado: { not: null } }] } });
  const totalBote = totalBoteParticipants * Number(boteConfig?.amountPerParticipant ?? 5) + Number(boteConfig?.manualAdjustment ?? 0);

  return {
    ranking,
    summary: {
      average: Math.round(avg(points) * 10) / 10,
      median: Math.round(median(points) * 10) / 10,
      deviation: Math.round(std(points) * 10) / 10,
      biggestGap,
      closestGap,
      leaderGap: gaps
    },
    pointComposition: ranking.map((row) => ({
      alias: row.alias,
      partidos: row.pointsMatches,
      grupos: row.pointsGroups,
      eliminatorias: row.pointsEliminatorias,
      bonus: row.pointsBonus,
      total: row.pointsTotal,
      pctPartidos: row.pointsTotal ? Math.round((row.pointsMatches / row.pointsTotal) * 100) : 0,
      pctGrupos: row.pointsTotal ? Math.round((row.pointsGroups / row.pointsTotal) * 100) : 0,
      pctBonus: row.pointsTotal ? Math.round((row.pointsBonus / row.pointsTotal) * 100) : 0
    })),
    accuracy,
    history,
    departments,
    bets: {
      champions: countMarket("campeon"),
      runnerUps: countMarket("subcampeon"),
      scorers: countMarket("maximoGoleador"),
      mostScoring: countMarket("seleccionMasGoleadora"),
      mostConceded: countMarket("seleccionMasGoleada"),
      leastConceded: countMarket("seleccionMenosGoleada"),
      rarityByParticipant
    },
    volatility,
    bote: {
      total: totalBote,
      participants: totalBoteParticipants,
      first: totalBote * ((boteConfig?.firstPrizePct ?? 60) / 100),
      second: totalBote * ((boteConfig?.secondPrizePct ?? 30) / 100),
      third: totalBote * ((boteConfig?.thirdPrizePct ?? 10) / 100)
    },
    participantIds: [...filteredParticipantIds]
  };
}
