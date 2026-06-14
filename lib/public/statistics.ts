import { prisma } from "@/lib/prisma";
import { formatCountry } from "@/lib/countries";
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
  const [classificationRows, snapshots, betBonusRows, scoringMatches, betMatchRows, boteConfig] = await Promise.all([
    prisma.generalRanking.findMany({ orderBy: { pos: "asc" }, include: { participant: { select: { slug: true, alias: true, departamento: true, rango: true } } } }),
    prisma.participantScoreSnapshot.findMany({ orderBy: { createdAt: "asc" }, take: 5000 }),
    prisma.betBonus.findMany({
      select: {
        participantId: true,
        campeon: true,
        subcampeon: true,
        semifinalista1: true,
        semifinalista2: true,
        semifinalista3: true,
        semifinalista4: true,
        maximoGoleador: true,
        seleccionMasGoleadora: true,
        seleccionMenosGoleadora: true,
        seleccionMasGoleada: true,
        seleccionMenosGoleada: true,
        equipoRevelacion: true,
        equipoDecepcion: true,
        totalGolesTorneo: true
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
        cruceExactoOk: true,
        spainMatch: true,
        pointsTotal: true,
        match: { select: { status: true, fase: true, jornadaId: true, grupo: true, homeTeamId: true, awayTeamId: true, homeTeam: true, awayTeam: true } }
      }
    }),
    prisma.betMatch.findMany({
      select: { participantId: true, predHomeGoals: true, predAwayGoals: true }
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


  const rangeMap = new Map<string, { total: number; participants: number; values: number[]; best: string; bestPoints: number }>();
  for (const row of ranking) {
    const key = row.rango ?? "Sin rango";
    const current = rangeMap.get(key) ?? { total: 0, participants: 0, values: [], best: row.alias, bestPoints: -1 };
    current.total += row.pointsTotal;
    current.participants += 1;
    current.values.push(row.pointsTotal);
    if (row.pointsTotal > current.bestPoints) {
      current.best = row.alias;
      current.bestPoints = row.pointsTotal;
    }
    rangeMap.set(key, current);
  }

  const ranges = [...rangeMap.entries()].map(([rango, value]) => ({
    rango,
    name: rango,
    participants: value.participants,
    total: value.total,
    average: Math.round(value.total / value.participants),
    averagePoints: Math.round(value.total / value.participants),
    min: Math.min(...value.values),
    max: Math.max(...value.values),
    dispersion: Math.round(std(value.values) * 10) / 10,
    mvp: value.best
  })).sort((a, b) => b.average - a.average || a.rango.localeCompare(b.rango, "es-ES"));

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
        includes(match.awayTeam, filters.equipo) ||
        includes(formatCountry(match.homeTeamId, match.homeTeam), filters.equipo) ||
        includes(formatCountry(match.awayTeamId, match.awayTeam), filters.equipo))
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

  const participantMeta = new Map(filteredClassificationRows.map((row) => [row.participantId, {
    alias: row.participant.alias,
    slug: row.participant.slug,
    departamento: row.participant.departamento,
    rango: row.participant.rango
  }]));

  type AwardCandidate = { participantId: string; metric: number; detail: string };

  function makeAward(key: string, title: string, icon: string, definition: string, candidates: AwardCandidate[], formatValue: (value: number) => string) {
    const valid = candidates.filter((candidate) => participantMeta.has(candidate.participantId) && Number.isFinite(candidate.metric));
    const max = Math.max(0, ...valid.map((candidate) => candidate.metric));
    const winners = max > 0
      ? valid
          .filter((candidate) => candidate.metric === max)
          .map((candidate) => {
            const meta = participantMeta.get(candidate.participantId)!;
            return { alias: meta.alias, slug: meta.slug, detail: candidate.detail };
          })
      : [];
    return {
      key,
      title,
      icon,
      definition,
      value: max > 0 ? formatValue(max) : "Sin datos",
      winners
    };
  }

  const officialScoring = filteredScoring.filter((score) => score.match.status === "OFFICIAL" && filteredParticipantIds.has(score.participantId));
  const countByParticipant = (rows: typeof officialScoring, predicate: (score: (typeof officialScoring)[number]) => boolean, value: (score: (typeof officialScoring)[number]) => number = () => 1) => {
    const counts = new Map<string, number>();
    for (const score of rows) {
      if (!predicate(score)) continue;
      counts.set(score.participantId, (counts.get(score.participantId) ?? 0) + value(score));
    }
    return counts;
  };
  const gafeCounts = countByParticipant(officialScoring, (score) => score.pointsTotal === 0);
  const regularCounts = countByParticipant(officialScoring, (score) => score.pointsTotal > 0);
  const patriotaCounts = countByParticipant(
    officialScoring,
    (score) => score.spainMatch || score.match.homeTeamId === "ESP" || score.match.awayTeamId === "ESP",
    (score) => score.pointsTotal
  );
  const amarrateguiCounts = new Map<string, number>();
  for (const bet of betMatchRows) {
    if (!filteredParticipantIds.has(bet.participantId) || bet.predHomeGoals == null || bet.predAwayGoals == null || bet.predHomeGoals !== bet.predAwayGoals) continue;
    amarrateguiCounts.set(bet.participantId, (amarrateguiCounts.get(bet.participantId) ?? 0) + 1);
  }
  const fromCountMap = (map: Map<string, number>, suffix: string): AwardCandidate[] => [...filteredParticipantIds].map((participantId) => {
    const value = map.get(participantId) ?? 0;
    return { participantId, metric: value, detail: `${value} ${suffix}` };
  });

  const specialAwards = [
    makeAward("nostradamus", "Nostradamus", "\u25CE", "M\u00e1s resultados exactos clavados en el marcador.", filteredClassificationRows.map((row) => ({ participantId: row.participantId, metric: row.exactScores, detail: `${row.exactScores} exactos` })), (value) => `${value} exactos`),
    makeAward("rey-signo", "Rey del signo", "\u2611", "M\u00e1s signos acertados: victoria local, empate o visitante.", filteredClassificationRows.map((row) => ({ participantId: row.participantId, metric: row.correctSigns, detail: `${row.correctSigns} signos` })), (value) => `${value} signos`),
    makeAward("cirujano-grupos", "Cirujano de grupos", "\u25A5", "M\u00e1s posiciones exactas en la clasificaci\u00f3n de grupos.", filteredClassificationRows.map((row) => ({ participantId: row.participantId, metric: row.correctGroupPositions, detail: `${row.correctGroupPositions} posiciones` })), (value) => `${value} posiciones`),
    makeAward("rey-cruces", "Rey de cruces", "\u2694", "M\u00e1s cruces exactos en el cuadro del Mundial.", filteredClassificationRows.map((row) => ({ participantId: row.participantId, metric: row.correctCruces, detail: `${row.correctCruces} cruces` })), (value) => `${value} cruces`),
    makeAward("killer-ko", "Killer de eliminatorias", "\u2715", "M\u00e1s puntos sumados en partidos KO.", filteredClassificationRows.map((row) => ({ participantId: row.participantId, metric: row.pointsEliminatorias, detail: `${row.pointsEliminatorias} puntos KO` })), (value) => `${value} pts`),
    makeAward("bonusman", "Bonusman", "\u25A3", "M\u00e1s puntos conseguidos en bonus iniciales.", filteredClassificationRows.map((row) => ({ participantId: row.participantId, metric: row.pointsBonus, detail: `${row.pointsBonus} puntos bonus` })), (value) => `${value} pts`),
    makeAward("florero", "Florero oficial", "\u2726", "M\u00e1s puntos con pocos resultados exactos: ratio puntos por exacto.", filteredClassificationRows.map((row) => {
      const ratio = row.pointsTotal > 0 ? row.pointsTotal / Math.max(1, row.exactScores) : 0;
      return { participantId: row.participantId, metric: Math.round(ratio * 10) / 10, detail: `${row.pointsTotal} pts con ${row.exactScores} exactos` };
    }), (value) => `${value.toFixed(1)} pts/exacto`),
    makeAward("gafe", "Gafe", "\u25B3", "M\u00e1s partidos oficiales puntuados con cero.", fromCountMap(gafeCounts, "ceros"), (value) => `${value} ceros`),
    makeAward("amarrategui", "Amarrategui", "\u25A4", "M\u00e1s empates apostados en marcadores.", fromCountMap(amarrateguiCounts, "empates"), (value) => `${value} empates`),
    makeAward("patriota", "Patriota", "\u2605", "M\u00e1s puntos en partidos de Espa\u00f1a.", fromCountMap(patriotaCounts, "puntos con Espa\u00f1a"), (value) => `${value} pts`),
    makeAward("cohete", "Cohete", "\u2197", "Mayor subida de posiciones en la clasificaci\u00f3n.", filteredClassificationRows.map((row) => ({ participantId: row.participantId, metric: Math.max(0, row.deltaPos), detail: `+${Math.max(0, row.deltaPos)} posiciones` })), (value) => `+${value}`),
    makeAward("regular", "Regular", "\u25EB", "M\u00e1s partidos oficiales sumando al menos un punto.", fromCountMap(regularCounts, "partidos puntuando"), (value) => `${value} partidos`)
  ];
  const filteredBetBonusRows = betBonusRows.filter((bet) => filteredParticipantIds.has(bet.participantId));
  const countMarket = (field: keyof (typeof betBonusRows)[number]) => {
    const counts = new Map<string, number>();
    for (const bet of filteredBetBonusRows) {
      const value = bet[field];
      if (typeof value !== "string" || !value) continue;
      const displayName = field === "maximoGoleador" ? value : formatCountry(null, value);
      counts.set(displayName, (counts.get(displayName) ?? 0) + 1);
    }
    return [...counts.entries()].map(([name, value]) => ({ name, value })).sort((a, b) => b.value - a.value);
  };


  const countTotalGoals = () => {
    const values = filteredBetBonusRows
      .map((bet) => bet.totalGolesTorneo)
      .filter((value): value is number => typeof value === "number");
    if (values.length === 0) return { average: 0, min: 0, max: 0, mode: 0, deviation: 0, distribution: [] as Array<{ name: string; value: number }> };
    const distribution = [...values.reduce((map, value) => map.set(String(value), (map.get(String(value)) ?? 0) + 1), new Map<string, number>()).entries()]
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value || Number(a.name) - Number(b.name));
    return {
      average: Math.round(avg(values) * 10) / 10,
      min: Math.min(...values),
      max: Math.max(...values),
      mode: Number(distribution[0]?.name ?? 0),
      deviation: Math.round(std(values) * 10) / 10,
      distribution
    };
  };

  const mergeMarkets = (...markets: Array<Array<{ name: string; value: number }>>) => {
    const counts = new Map<string, number>();
    for (const market of markets) {
      for (const item of market) counts.set(item.name, (counts.get(item.name) ?? 0) + item.value);
    }
    return [...counts.entries()].map(([name, value]) => ({ name, value })).sort((a, b) => b.value - a.value || a.name.localeCompare(b.name, "es-ES"));
  };
  const rarityByParticipant = filteredBetBonusRows.map((bet) => {
    const picks = [bet.campeon, bet.subcampeon, bet.semifinalista1, bet.semifinalista2, bet.semifinalista3, bet.semifinalista4, bet.maximoGoleador, bet.seleccionMasGoleadora, bet.seleccionMenosGoleadora, bet.seleccionMasGoleada, bet.seleccionMenosGoleada, bet.equipoRevelacion, bet.equipoDecepcion].filter(Boolean);
    const popularity = picks.reduce((sum, pick) => sum + filteredBetBonusRows.filter((other) => Object.values(other).includes(pick)).length, 0);
    const rankingRow = classificationRows.find((row) => row.participantId === bet.participantId);
    return {
      alias: rankingRow?.participant.alias ?? bet.participantId,
      rarity: picks.length ? Math.round(100 - popularity / picks.length) : 0,
      points: rankingRow?.pointsTotal ?? 0
    };
  });

  const totalBote = Number(boteConfig?.totalAmount ?? 0);
  const firstPrize = Number(boteConfig?.firstPrize ?? 0);
  const secondPrize = Number(boteConfig?.secondPrize ?? 0);
  const thirdPrize = Number(boteConfig?.thirdPrize ?? 0);
  const consolationPrize = Number(boteConfig?.consolationPrize ?? 0);
  const prizeSum = firstPrize + secondPrize + thirdPrize + consolationPrize;

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
    ranges,
    bets: {
      champions: countMarket("campeon"),
      runnerUps: countMarket("subcampeon"),
      semifinalist1: countMarket("semifinalista1"),
      semifinalist2: countMarket("semifinalista2"),
      semifinalist3: countMarket("semifinalista3"),
      semifinalist4: countMarket("semifinalista4"),
      semifinalists: mergeMarkets(countMarket("semifinalista1"), countMarket("semifinalista2"), countMarket("semifinalista3"), countMarket("semifinalista4")),
      scorers: countMarket("maximoGoleador"),
      mostScoring: countMarket("seleccionMasGoleadora"),
      leastScoring: countMarket("seleccionMenosGoleadora"),
      mostConceded: countMarket("seleccionMasGoleada"),
      leastConceded: countMarket("seleccionMenosGoleada"),
      revelation: countMarket("equipoRevelacion"),
      disappointment: countMarket("equipoDecepcion"),
      totalGoals: countTotalGoals(),
      rarityByParticipant
    },
    volatility,
    specialAwards,
    bote: {
      total: totalBote,
      currency: boteConfig?.currency ?? "EUR",
      first: firstPrize,
      second: secondPrize,
      third: thirdPrize,
      consolation: consolationPrize,
      prizeSum,
      balance: totalBote - prizeSum
    },
    participantIds: [...filteredParticipantIds]
  };
}



