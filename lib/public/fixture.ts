import { unstable_noStore as noStore } from "next/cache";
import { prisma } from "@/lib/prisma";
import { formatCountry } from "@/lib/countries";
import { getTournamentBonusResult, type TournamentBonusResult } from "@/lib/game/bonusResults";

type TournamentStandingRecord = {
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
  status: string;
};

type TournamentThirdRecord = {
  grupo: string;
  teamId: string | null;
  pts: number;
  dg: number;
  gf: number;
  rank3rd: number | null;
  qualified3rd: boolean;
  thirdSlot: string | null;
  qualifiedKey: string | null;
};

type FixtureDb = {
  tournamentGroupStanding: { findMany: (args: { orderBy: Array<Record<string, string>> }) => Promise<TournamentStandingRecord[]> };
  tournamentThirdPlace: { findMany: (args: { orderBy: Array<Record<string, string>> }) => Promise<TournamentThirdRecord[]> };
};

export type FixtureGroup = {
  grupo: string;
  rows: Array<TournamentStandingRecord & { team: string; statusLabel: string }>;
};

export type FixtureOverview = {
  groups: FixtureGroup[];
  thirds: Array<TournamentThirdRecord & { team: string }>;
  bracket: Array<{
    matchId: string;
    matchNo: number | null;
    fase: string | null;
    homeSlot: string | null;
    awaySlot: string | null;
    homeTeam: string;
    awayTeam: string;
    resultText: string | null;
    qualifiedTeam: string;
    status: string;
  }>;
  bonus: TournamentBonusResult & {
    campeonLabel: string;
    subcampeonLabel: string;
    semifinalistasLabels: string[];
    maximoGoleadorLabels: string[];
    seleccionMasGoleadoraLabels: string[];
    seleccionMasGoleadaLabels: string[];
    seleccionMenosGoleadoraLabels: string[];
    seleccionMenosGoleadaLabels: string[];
    equipoRevelacionLabels: string[];
    equipoDecepcionLabels: string[];
  };
};

const PHASE_ORDER = ["R32", "R16", "QF", "SF", "TERCER_PUESTO", "FINAL"];

function phaseRank(fase: string | null) {
  const value = (fase ?? "").toLocaleUpperCase("es-ES");
  const index = PHASE_ORDER.findIndex((phase) => value.includes(phase));
  if (index !== -1) return index;
  if (value.includes("OCTAV") || value.includes("1/8")) return 1;
  if (value.includes("CUART")) return 2;
  if (value.includes("SEMI")) return 3;
  if (value.includes("FINAL")) return 5;
  return 999;
}

function statusLabel(status: string) {
  if (status === "CLASSIFIED") return "Clasificado";
  if (status === "THIRD_CLASSIFIED") return "Mejor tercero";
  if (status === "OUT") return "Eliminado";
  return "Pendiente";
}

export async function getFixtureOverview() {
  noStore();
  const db = prisma as unknown as FixtureDb;
  const [standings, thirds, matches, teams, bonus] = await Promise.all([
    db.tournamentGroupStanding.findMany({ orderBy: [{ grupo: "asc" }, { pos: "asc" }] }),
    db.tournamentThirdPlace.findMany({ orderBy: [{ rank3rd: "asc" }, { grupo: "asc" }] }),
    prisma.match.findMany({
      where: { fase: { not: "GRUPOS" } },
      orderBy: [{ fecha: "asc" }, { matchNo: "asc" }],
      select: {
        matchId: true,
        matchNo: true,
        fase: true,
        homeSlot: true,
        awaySlot: true,
        homeTeamId: true,
        awayTeamId: true,
        homeTeam: true,
        awayTeam: true,
        resultText: true,
        homeGoals: true,
        awayGoals: true,
        qualifiedTeamId: true,
        overrideQualifiedTeamId: true,
        status: true
      }
    }),
    prisma.team.findMany({ select: { teamId: true, seleccion: true } }),
    getTournamentBonusResult(prisma)
  ]);

  const teamNameById = new Map(teams.map((team) => [team.teamId, team.seleccion]));
  const name = (teamId: string | null, fallback: string | null) => formatCountry(teamId, fallback ?? (teamId ? teamNameById.get(teamId) : null) ?? "Por resolver");
  const bonusName = (teamId: string | null | undefined) => (teamId ? name(teamId, teamId) : "-");
  const bonusNames = (value: string | string[] | null | undefined) => (Array.isArray(value) ? value : value ? [value] : []).map(bonusName);

  const groups = new Map<string, FixtureGroup["rows"]>();
  for (const row of standings) {
    const list = groups.get(row.grupo) ?? [];
    list.push({
      grupo: row.grupo,
      teamId: row.teamId,
      team: name(row.teamId, row.teamId),
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
      statusLabel: statusLabel(row.status)
    });
    groups.set(row.grupo, list);
  }

  return {
    groups: [...groups.entries()].map(([grupo, rows]) => ({ grupo, rows })),
    thirds: thirds.map((row) => ({
      grupo: row.grupo,
      teamId: row.teamId,
      team: name(row.teamId, row.teamId),
      pts: row.pts,
      dg: row.dg,
      gf: row.gf,
      rank3rd: row.rank3rd,
      qualified3rd: row.qualified3rd,
      thirdSlot: row.thirdSlot,
      qualifiedKey: row.qualifiedKey
    })),
    bracket: matches
      .sort((a, b) => phaseRank(a.fase) - phaseRank(b.fase) || (a.matchNo ?? 0) - (b.matchNo ?? 0))
      .map((match) => ({
        matchId: match.matchId,
        matchNo: match.matchNo,
        fase: match.fase,
        homeSlot: match.homeSlot,
        awaySlot: match.awaySlot,
        homeTeam: name(match.homeTeamId, match.homeTeam ?? match.homeSlot),
        awayTeam: name(match.awayTeamId, match.awayTeam ?? match.awaySlot),
        resultText: match.resultText ?? (match.homeGoals != null && match.awayGoals != null ? `${match.homeGoals}-${match.awayGoals}` : null),
        qualifiedTeam: name(match.overrideQualifiedTeamId ?? match.qualifiedTeamId, match.overrideQualifiedTeamId ?? match.qualifiedTeamId),
        status: match.status
      })),
    bonus: {
      ...bonus,
      campeonLabel: bonusName(bonus.campeon),
      subcampeonLabel: bonusName(bonus.subcampeon),
      semifinalistasLabels: (bonus.semifinalistas ?? []).map(bonusName),
      maximoGoleadorLabels: Array.isArray(bonus.maximoGoleador) ? bonus.maximoGoleador : bonus.maximoGoleador ? [bonus.maximoGoleador] : [],
      seleccionMasGoleadoraLabels: bonusNames(bonus.seleccionMasGoleadora),
      seleccionMasGoleadaLabels: bonusNames(bonus.seleccionMasGoleada),
      seleccionMenosGoleadoraLabels: bonusNames(bonus.seleccionMenosGoleadora),
      seleccionMenosGoleadaLabels: bonusNames(bonus.seleccionMenosGoleada),
      equipoRevelacionLabels: bonusNames(bonus.equipoRevelacion),
      equipoDecepcionLabels: bonusNames(bonus.equipoDecepcion)
    }
  };
}
