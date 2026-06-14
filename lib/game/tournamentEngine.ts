import type { PrismaClient } from "@prisma/client";
import { isOfficialMatchForScoring } from "./matchStatus";

type TournamentMatch = {
  matchId: string;
  matchNo: number | null;
  fase: string | null;
  grupo: string | null;
  homeSlot: string | null;
  awaySlot: string | null;
  homeTeamId: string | null;
  homeTeamIdManual?: string | null;
  awayTeamId: string | null;
  awayTeamIdManual?: string | null;
  homeTeam: string | null;
  awayTeam: string | null;
  homeGoals: number | null;
  awayGoals: number | null;
  homePens: number | null;
  awayPens: number | null;
  finished: boolean;
  winnerTeamId: string | null;
  qualifiedTeamId: string | null;
  overrideQualifiedTeamId: string | null;
  status: string;
};

type TournamentTeam = {
  teamId: string;
  seleccion: string;
  grupo: string | null;
  tieBreakerRank: number | null;
  fifaRank: number | null;
};

type ThirdCombo = {
  qualifiedKey: string;
  opp1A: string | null;
  opp1B: string | null;
  opp1D: string | null;
  opp1E: string | null;
  opp1G: string | null;
  opp1I: string | null;
  opp1K: string | null;
  opp1L: string | null;
};

type TournamentDb = {
  thirdPlaceComboMapping: { findMany: () => Promise<ThirdCombo[]> };
  tournamentGroupStanding: {
    deleteMany: () => Promise<unknown>;
    createMany: (args: { data: TournamentGroupStandingCreate[] }) => Promise<unknown>;
  };
  tournamentThirdPlace: {
    deleteMany: () => Promise<unknown>;
    createMany: (args: { data: TournamentThirdPlaceCreate[] }) => Promise<unknown>;
  };
  tournamentSlot: {
    deleteMany: () => Promise<unknown>;
    createMany: (args: { data: SlotRow[] }) => Promise<unknown>;
  };
  tournamentTeamPerformance: {
    deleteMany: () => Promise<unknown>;
    createMany: (args: { data: TournamentTeamPerformanceCreate[] }) => Promise<unknown>;
  };
};

export type TournamentStandingRow = {
  grupo: string;
  teamId: string;
  pos: number;
  pj: number;
  pg: number;
  pe: number;
  pp: number;
  gf: number;
  gc: number;
  dg: number;
  pts: number;
  status: "PENDING" | "CLASSIFIED" | "THIRD_CLASSIFIED" | "OUT";
  groupCode: string;
  tieBreakerRank: number;
  fifaRank: number | null;
};

type SlotRow = {
  slot: string;
  slotType: string;
  grupo: string | null;
  pos: number | null;
  matchIdSource: string | null;
  teamId: string | null;
  sourceDescription: string | null;
};

type TournamentGroupStandingCreate = Omit<TournamentStandingRow, "tieBreakerRank" | "fifaRank">;
type TournamentThirdPlaceCreate = {
  grupo: string;
  teamId: string;
  pts: number;
  dg: number;
  gf: number;
  fairPlayPoints: number;
  fifaRank: number | null;
  rank3rd: number;
  qualified3rd: boolean;
  thirdSlot: string | null;
  qualifiedKey: string | null;
};
type TournamentTeamPerformanceCreate = {
  teamId: string;
  grupo: string | null;
  groupPos: number | null;
  groupPts: number;
  groupGf: number;
  groupGc: number;
  groupDg: number;
  qualifiedR32: boolean;
  reachedR32: boolean;
  reachedR16: boolean;
  reachedQf: boolean;
  reachedSf: boolean;
  reachedFinal: boolean;
  champion: boolean;
  runnerUp: boolean;
  thirdPlace: boolean;
  reachedRound: string;
  roundValue: number;
  tournamentGf: number;
  tournamentGc: number;
  tournamentDg: number;
};

const GROUP_PHASE = "GRUPOS";
const THIRD_PLACE_QUALIFIERS = 8;
const ROUND_VALUE: Record<string, number> = {
  GRUPOS: 1,
  R32: 2,
  R16: 3,
  QF: 4,
  SF: 5,
  TERCER_PUESTO: 5,
  FINAL: 6
};

function isGroupMatch(match: TournamentMatch) {
  return (match.fase ?? "").toLocaleUpperCase("es-ES").includes("GRUPO") && Boolean(match.grupo);
}

function phaseKey(fase: string | null | undefined) {
  const value = (fase ?? "").toLocaleUpperCase("es-ES");
  if (value.includes("R32") || value.includes("1/16")) return "R32";
  if (value.includes("R16") || value.includes("OCTAV") || value.includes("1/8")) return "R16";
  if (value.includes("QF") || value.includes("CUART")) return "QF";
  if (value.includes("SF") || value.includes("SEMI")) return "SF";
  if (value.includes("TERCER")) return "TERCER_PUESTO";
  if (value.includes("FINAL")) return "FINAL";
  return GROUP_PHASE;
}

function qualifiedTeam(match: TournamentMatch) {
  return match.overrideQualifiedTeamId ?? match.qualifiedTeamId ?? match.winnerTeamId;
}

function loserTeam(match: TournamentMatch) {
  const winner = qualifiedTeam(match);
  if (!winner) return null;
  if (match.homeTeamId === winner) return match.awayTeamId;
  if (match.awayTeamId === winner) return match.homeTeamId;
  return null;
}

function buildTable(grupo: string, teams: TournamentTeam[], matches: TournamentMatch[]): TournamentStandingRow[] {
  const stats = new Map<string, { pj: number; pg: number; pe: number; pp: number; gf: number; gc: number }>();
  for (const team of teams) stats.set(team.teamId, { pj: 0, pg: 0, pe: 0, pp: 0, gf: 0, gc: 0 });

  for (const match of matches.filter(isOfficialMatchForScoring)) {
    const home = stats.get(match.homeTeamId ?? "");
    const away = stats.get(match.awayTeamId ?? "");
    if (!home || !away || match.homeGoals == null || match.awayGoals == null) continue;
    home.pj += 1;
    away.pj += 1;
    home.gf += match.homeGoals;
    home.gc += match.awayGoals;
    away.gf += match.awayGoals;
    away.gc += match.homeGoals;
    if (match.homeGoals > match.awayGoals) {
      home.pg += 1;
      away.pp += 1;
    } else if (match.homeGoals < match.awayGoals) {
      away.pg += 1;
      home.pp += 1;
    } else {
      home.pe += 1;
      away.pe += 1;
    }
  }

  return teams.map((team) => {
    const row = stats.get(team.teamId)!;
    return {
      grupo,
      teamId: team.teamId,
      pos: 0,
      pj: row.pj,
      pg: row.pg,
      pe: row.pe,
      pp: row.pp,
      gf: row.gf,
      gc: row.gc,
      dg: row.gf - row.gc,
      pts: row.pg * 3 + row.pe,
      status: "PENDING",
      groupCode: "",
      tieBreakerRank: team.tieBreakerRank ?? Number.MAX_SAFE_INTEGER,
      fifaRank: team.fifaRank
    };
  });
}

function headToHead(rows: TournamentStandingRow[], matches: TournamentMatch[]) {
  const ids = new Set(rows.map((row) => row.teamId));
  const table = new Map(rows.map((row) => [row.teamId, { pts: 0, gf: 0, gc: 0 }]));
  for (const match of matches.filter(isOfficialMatchForScoring)) {
    const homeId = match.homeTeamId ?? "";
    const awayId = match.awayTeamId ?? "";
    if (!ids.has(homeId) || !ids.has(awayId) || match.homeGoals == null || match.awayGoals == null) continue;
    const home = table.get(homeId)!;
    const away = table.get(awayId)!;
    home.gf += match.homeGoals;
    home.gc += match.awayGoals;
    away.gf += match.awayGoals;
    away.gc += match.homeGoals;
    if (match.homeGoals > match.awayGoals) home.pts += 3;
    else if (match.homeGoals < match.awayGoals) away.pts += 3;
    else {
      home.pts += 1;
      away.pts += 1;
    }
  }
  return table;
}

function sortGroup(rows: TournamentStandingRow[], matches: TournamentMatch[]) {
  const byPoints = [...rows].sort((a, b) => b.pts - a.pts);
  const result: TournamentStandingRow[] = [];
  for (let i = 0; i < byPoints.length; ) {
    let j = i;
    while (j + 1 < byPoints.length && byPoints[j + 1].pts === byPoints[i].pts) j += 1;
    const tied = byPoints.slice(i, j + 1);
    if (tied.length === 1) {
      result.push(tied[0]);
    } else {
      const h2h = headToHead(tied, matches);
      result.push(
        ...tied.sort((a, b) => {
          const aH = h2h.get(a.teamId)!;
          const bH = h2h.get(b.teamId)!;
          return (
            b.dg - a.dg ||
            b.gf - a.gf ||
            bH.pts - aH.pts ||
            bH.gf - bH.gc - (aH.gf - aH.gc) ||
            bH.gf - aH.gf ||
            (a.fifaRank ?? Number.MAX_SAFE_INTEGER) - (b.fifaRank ?? Number.MAX_SAFE_INTEGER) ||
            a.tieBreakerRank - b.tieBreakerRank ||
            a.teamId.localeCompare(b.teamId, "es-ES")
          );
        })
      );
    }
    i = j + 1;
  }
  return result.map((row, index) => ({ ...row, pos: index + 1, groupCode: `${index + 1}${row.grupo}` }));
}

function sortThirds(rows: TournamentStandingRow[]) {
  return [...rows].sort(
    (a, b) =>
      b.pts - a.pts ||
      b.dg - a.dg ||
      b.gf - a.gf ||
      (a.fifaRank ?? Number.MAX_SAFE_INTEGER) - (b.fifaRank ?? Number.MAX_SAFE_INTEGER) ||
      a.tieBreakerRank - b.tieBreakerRank ||
      a.teamId.localeCompare(b.teamId, "es-ES")
  );
}

function comboForKey(combos: ThirdCombo[], key: string) {
  return combos.find((combo) => combo.qualifiedKey === key) ?? null;
}

function mappingColumn(slot: string) {
  const value = slot.trim().toUpperCase();
  if (value === "1A") return "opp1A";
  if (value === "1B") return "opp1B";
  if (value === "1D") return "opp1D";
  if (value === "1E") return "opp1E";
  if (value === "1G") return "opp1G";
  if (value === "1I") return "opp1I";
  if (value === "1K") return "opp1K";
  if (value === "1L") return "opp1L";
  return null;
}

function resolveThirdSlot(slot: string, pairedSlot: string | null, combo: ThirdCombo | null) {
  const normalized = slot.trim().toUpperCase();
  if (!/^3[A-L]+$/.test(normalized) || normalized.length <= 2) return normalized;
  if (!combo || !pairedSlot) return null;
  const column = mappingColumn(pairedSlot);
  return column ? combo[column] : null;
}

function resolveSlotTeam(
  slot: string | null,
  pairedSlot: string | null,
  slotTeamByCode: Map<string, string>,
  matchesById: Map<string, TournamentMatch>,
  combo: ThirdCombo | null
) {
  if (!slot) return null;
  const normalized = slot.trim().toUpperCase();
  const mappedThird = resolveThirdSlot(normalized, pairedSlot, combo);
  if (!mappedThird) return null;
  if (/^[123][A-L]$/.test(mappedThird)) return slotTeamByCode.get(mappedThird) ?? null;
  if (/^W\d{3}$/.test(mappedThird)) {
    const source = matchesById.get(`M${mappedThird.slice(1)}`);
    return source && isOfficialMatchForScoring(source) ? qualifiedTeam(source) : null;
  }
  if (/^L\d{3}$/.test(mappedThird)) {
    const source = matchesById.get(`M${mappedThird.slice(1)}`);
    return source && isOfficialMatchForScoring(source) ? loserTeam(source) : null;
  }
  return slotTeamByCode.get(mappedThird) ?? null;
}

export function computeTournamentState(matches: TournamentMatch[], teams: TournamentTeam[], combos: ThirdCombo[]) {
  const groupMatches = matches.filter(isGroupMatch);
  const matchesByGroup = new Map<string, TournamentMatch[]>();
  for (const match of groupMatches) {
    const list = matchesByGroup.get(match.grupo!) ?? [];
    list.push(match);
    matchesByGroup.set(match.grupo!, list);
  }

  const teamsByGroup = new Map<string, TournamentTeam[]>();
  for (const team of teams) {
    if (!team.grupo) continue;
    const list = teamsByGroup.get(team.grupo) ?? [];
    list.push(team);
    teamsByGroup.set(team.grupo, list);
  }

  const standings: TournamentStandingRow[] = [];
  const completeGroups = new Set<string>();
  for (const [grupo, groupTeams] of teamsByGroup) {
    const groupMatchList = matchesByGroup.get(grupo) ?? [];
    const complete = groupMatchList.length > 0 && groupMatchList.every(isOfficialMatchForScoring);
    if (complete) completeGroups.add(grupo);
    const sorted = sortGroup(buildTable(grupo, groupTeams, groupMatchList), groupMatchList).map((row) => {
      const status: TournamentStandingRow["status"] = complete && row.pos <= 2 ? "CLASSIFIED" : complete ? "OUT" : "PENDING";
      return { ...row, status };
    });
    standings.push(...sorted);
  }

  const groupStageComplete = teamsByGroup.size > 0 && completeGroups.size === teamsByGroup.size;
  const thirdRows = sortThirds(standings.filter((row) => row.pos === 3));
  const qualifiedThirds = groupStageComplete ? thirdRows.slice(0, THIRD_PLACE_QUALIFIERS) : [];
  const qualifiedKey = qualifiedThirds.map((row) => row.grupo).sort().join("");
  const combo = groupStageComplete ? comboForKey(combos, qualifiedKey) : null;
  const qualifiedThirdGroups = new Set(qualifiedThirds.map((row) => row.grupo));
  const standingRows = standings.map((row) => {
    if (row.pos !== 3 || !groupStageComplete) return row;
    const status: TournamentStandingRow["status"] = qualifiedThirdGroups.has(row.grupo) ? "THIRD_CLASSIFIED" : "OUT";
    return { ...row, status };
  });

  const slotTeamByCode = new Map(standingRows.map((row) => [row.groupCode, row.teamId]));
  const matchesById = new Map(matches.map((match) => [match.matchId, match]));
  const slotRows: SlotRow[] = [];
  for (const row of standingRows) {
    slotRows.push({
      slot: row.groupCode,
      slotType: "GROUP",
      grupo: row.grupo,
      pos: row.pos,
      matchIdSource: null,
      teamId: row.status === "PENDING" ? null : row.teamId,
      sourceDescription: `${row.pos} Grupo ${row.grupo}`
    });
  }
  for (const match of matches) {
    if (!match.matchNo || phaseKey(match.fase) === GROUP_PHASE) continue;
    const winSlot = `W${String(match.matchNo).padStart(3, "0")}`;
    const loseSlot = `L${String(match.matchNo).padStart(3, "0")}`;
    slotRows.push({
      slot: winSlot,
      slotType: "WINNER",
      grupo: null,
      pos: null,
      matchIdSource: match.matchId,
      teamId: isOfficialMatchForScoring(match) ? qualifiedTeam(match) : null,
      sourceDescription: `Ganador ${match.matchId}`
    });
    slotRows.push({
      slot: loseSlot,
      slotType: "LOSER",
      grupo: null,
      pos: null,
      matchIdSource: match.matchId,
      teamId: isOfficialMatchForScoring(match) ? loserTeam(match) : null,
      sourceDescription: `Perdedor ${match.matchId}`
    });
  }

  const matchUpdates = matches
    .filter((match) => phaseKey(match.fase) !== GROUP_PHASE)
    .map((match) => {
      const homeTeamId = match.homeTeamIdManual ?? resolveSlotTeam(match.homeSlot, match.awaySlot, slotTeamByCode, matchesById, combo);
      const awayTeamId = match.awayTeamIdManual ?? resolveSlotTeam(match.awaySlot, match.homeSlot, slotTeamByCode, matchesById, combo);
      return { matchId: match.matchId, homeTeamId, awayTeamId };
    })
    .filter((update) => update.homeTeamId || update.awayTeamId);

  const thirdPlaces = thirdRows.map((row, index) => ({
    grupo: row.grupo,
    teamId: row.teamId,
    pts: row.pts,
    dg: row.dg,
    gf: row.gf,
    fairPlayPoints: row.tieBreakerRank,
    fifaRank: row.fifaRank,
    rank3rd: index + 1,
    qualified3rd: groupStageComplete && index < THIRD_PLACE_QUALIFIERS,
    thirdSlot: groupStageComplete && index < THIRD_PLACE_QUALIFIERS ? row.groupCode : null,
    qualifiedKey: groupStageComplete ? qualifiedKey : null
  }));

  const performances = teams.map((team) => {
    const standing = standingRows.find((row) => row.teamId === team.teamId);
    const playedMatches = matches.filter(
      (match) => isOfficialMatchForScoring(match) && (match.homeTeamId === team.teamId || match.awayTeamId === team.teamId)
    );
    const tournamentGf = playedMatches.reduce((sum, match) => sum + (match.homeTeamId === team.teamId ? match.homeGoals ?? 0 : match.awayGoals ?? 0), 0);
    const tournamentGc = playedMatches.reduce((sum, match) => sum + (match.homeTeamId === team.teamId ? match.awayGoals ?? 0 : match.homeGoals ?? 0), 0);
    const reached = new Set<string>();
    for (const match of playedMatches) reached.add(phaseKey(match.fase));
    const final = matches.find((match) => phaseKey(match.fase) === "FINAL" && isOfficialMatchForScoring(match));
    return {
      teamId: team.teamId,
      grupo: team.grupo,
      groupPos: standing?.pos ?? null,
      groupPts: standing?.pts ?? 0,
      groupGf: standing?.gf ?? 0,
      groupGc: standing?.gc ?? 0,
      groupDg: standing?.dg ?? 0,
      qualifiedR32: standing?.status === "CLASSIFIED" || standing?.status === "THIRD_CLASSIFIED",
      reachedR32: reached.has("R32"),
      reachedR16: reached.has("R16"),
      reachedQf: reached.has("QF"),
      reachedSf: reached.has("SF"),
      reachedFinal: reached.has("FINAL"),
      champion: Boolean(final && qualifiedTeam(final) === team.teamId),
      runnerUp: Boolean(final && loserTeam(final) === team.teamId),
      thirdPlace: false,
      reachedRound: [...reached].sort((a, b) => (ROUND_VALUE[b] ?? 0) - (ROUND_VALUE[a] ?? 0))[0] ?? GROUP_PHASE,
      roundValue: Math.max(...[GROUP_PHASE, ...reached].map((round) => ROUND_VALUE[round] ?? 1)),
      tournamentGf,
      tournamentGc,
      tournamentDg: tournamentGf - tournamentGc
    };
  });

  return { standings: standingRows, thirdPlaces, slots: slotRows, performances, matchUpdates, groupStageComplete, qualifiedKey };
}

export async function recalculateTournamentEngine(prisma: PrismaClient) {
  const tournamentDb = prisma as unknown as TournamentDb;
  const [matches, teams, combos] = await Promise.all([
    prisma.match.findMany(),
    prisma.team.findMany(),
    tournamentDb.thirdPlaceComboMapping.findMany()
  ]);
  const state = computeTournamentState(matches, teams, combos);

  await prisma.$transaction(async (tx) => {
    const tournamentTx = tx as unknown as TournamentDb;
    await tournamentTx.tournamentGroupStanding.deleteMany();
    await tournamentTx.tournamentThirdPlace.deleteMany();
    await tournamentTx.tournamentSlot.deleteMany();
    await tournamentTx.tournamentTeamPerformance.deleteMany();

    if (state.standings.length > 0) {
      const standingsData: TournamentGroupStandingCreate[] = state.standings.map((row) => ({
        grupo: row.grupo,
        teamId: row.teamId,
        pos: row.pos,
        pj: row.pj,
        pg: row.pg,
        pe: row.pe,
        pp: row.pp,
        gf: row.gf,
        gc: row.gc,
        dg: row.dg,
        pts: row.pts,
        status: row.status,
        groupCode: row.groupCode
      }));
      await tournamentTx.tournamentGroupStanding.createMany({
        data: standingsData
      });
    }
    if (state.thirdPlaces.length > 0) await tournamentTx.tournamentThirdPlace.createMany({ data: state.thirdPlaces });
    if (state.slots.length > 0) await tournamentTx.tournamentSlot.createMany({ data: state.slots });
    if (state.performances.length > 0) await tournamentTx.tournamentTeamPerformance.createMany({ data: state.performances });

    for (const update of state.matchUpdates) {
      const current = matches.find((match) => match.matchId === update.matchId);
      if (!current) continue;
      if (current.homeTeamId === update.homeTeamId && current.awayTeamId === update.awayTeamId) continue;
      const home = update.homeTeamId ? teams.find((team) => team.teamId === update.homeTeamId) : null;
      const away = update.awayTeamId ? teams.find((team) => team.teamId === update.awayTeamId) : null;
      await tx.match.update({
        where: { matchId: update.matchId },
        data: {
          homeTeamId: update.homeTeamId ?? current.homeTeamId,
          awayTeamId: update.awayTeamId ?? current.awayTeamId,
          homeTeam: home?.seleccion ?? current.homeTeam,
          awayTeam: away?.seleccion ?? current.awayTeam
        }
      });
    }
  });

  return state;
}
