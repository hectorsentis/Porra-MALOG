import { unstable_noStore as noStore } from "next/cache";
import { prisma } from "@/lib/prisma";
import type { PublicFilters } from "./filters";
import { predictionSign, summarizePredictionDistribution } from "./matchStats";
import { participantLabels } from "./participantLabels";

function includes(value: string | null | undefined, filter: string | undefined) {
  if (!filter) return true;
  return (value ?? "").toLocaleLowerCase("es-ES").includes(filter.toLocaleLowerCase("es-ES"));
}

function countValues(values: Array<string | null | undefined>) {
  const counts = new Map<string, number>();
  for (const value of values) {
    if (!value) continue;
    counts.set(value, (counts.get(value) ?? 0) + 1);
  }
  return [...counts.entries()].map(([name, value]) => ({ name, value })).sort((a, b) => b.value - a.value || a.name.localeCompare(b.name, "es-ES"));
}

function bump(map: Map<string, number>, key: string | null | undefined, amount = 1) {
  if (!key) return;
  map.set(key, (map.get(key) ?? 0) + amount);
}

function rowsFromMap(map: Map<string, number>) {
  return [...map.entries()].map(([name, value]) => ({ name, value })).sort((a, b) => b.value - a.value || a.name.localeCompare(b.name, "es-ES"));
}

function statsNumber(values: number[]) {
  if (values.length === 0) return { average: 0, min: 0, max: 0, mode: 0, deviation: 0 };
  const average = values.reduce((sum, value) => sum + value, 0) / values.length;
  const mode = countValues(values.map(String))[0]?.name ?? "0";
  const deviation = Math.sqrt(values.reduce((sum, value) => sum + (value - average) ** 2, 0) / values.length);
  return {
    average: Math.round(average * 10) / 10,
    min: Math.min(...values),
    max: Math.max(...values),
    mode: Number(mode),
    deviation: Math.round(deviation * 10) / 10
  };
}

export async function getBonusBetInsights(filters: PublicFilters) {
  noStore();
  const rows = await prisma.betBonus.findMany({
    select: {
      campeon: true,
      subcampeon: true,
      semifinalista1: true,
      semifinalista2: true,
      semifinalista3: true,
      semifinalista4: true,
      maximoGoleador: true,
      seleccionMasGoleadora: true,
      seleccionMasGoleada: true,
      seleccionMenosGoleadora: true,
      seleccionMenosGoleada: true,
      equipoRevelacion: true,
      equipoDecepcion: true,
      totalGolesTorneo: true,
      participant: { select: { alias: true, departamento: true, rango: true } }
    }
  });
  const filtered = rows.filter((row) => includes(row.participant.alias, filters.alias) && includes(row.participant.departamento, filters.departamento) && includes(row.participant.rango, filters.rango));
  const hype = new Map<string, number>();
  const distrust = new Map<string, number>();
  for (const row of filtered) {
    bump(hype, row.campeon, 3);
    bump(hype, row.subcampeon, 2);
    for (const semi of [row.semifinalista1, row.semifinalista2, row.semifinalista3, row.semifinalista4]) bump(hype, semi, 1);
    bump(distrust, row.equipoDecepcion, 2);
    bump(distrust, row.seleccionMasGoleada, 1);
    bump(distrust, row.seleccionMenosGoleadora, 1);
  }
  const totalGoals = filtered.map((row) => row.totalGolesTorneo).filter((value): value is number => typeof value === "number");
  return {
    totalBets: filtered.length,
    champions: countValues(filtered.map((row) => row.campeon)),
    runnerUps: countValues(filtered.map((row) => row.subcampeon)),
    semifinalist1: countValues(filtered.map((row) => row.semifinalista1)),
    semifinalist2: countValues(filtered.map((row) => row.semifinalista2)),
    semifinalist3: countValues(filtered.map((row) => row.semifinalista3)),
    semifinalist4: countValues(filtered.map((row) => row.semifinalista4)),
    semifinalists: countValues(filtered.flatMap((row) => [row.semifinalista1, row.semifinalista2, row.semifinalista3, row.semifinalista4])),
    scorers: countValues(filtered.map((row) => row.maximoGoleador)),
    revelation: countValues(filtered.map((row) => row.equipoRevelacion)),
    disappointment: countValues(filtered.map((row) => row.equipoDecepcion)),
    mostScoring: countValues(filtered.map((row) => row.seleccionMasGoleadora)),
    leastScoring: countValues(filtered.map((row) => row.seleccionMenosGoleadora)),
    mostConceded: countValues(filtered.map((row) => row.seleccionMasGoleada)),
    leastConceded: countValues(filtered.map((row) => row.seleccionMenosGoleada)),
    totalGoals: statsNumber(totalGoals),
    totalGoalsDistribution: countValues(totalGoals.map(String)),
    hype: rowsFromMap(hype),
    distrust: rowsFromMap(distrust)
  };
}

export async function getGroupMatchBetInsights(filters: PublicFilters) {
  noStore();
  const rows = await prisma.betMatch.findMany({
    where: {
      match: {
        ...(filters.fase ? { fase: { contains: filters.fase, mode: "insensitive" } } : { fase: { contains: "Grupo", mode: "insensitive" } }),
        ...(filters.grupo ? { grupo: { contains: filters.grupo, mode: "insensitive" } } : {}),
        ...(filters.jornada ? { jornadaId: { contains: filters.jornada, mode: "insensitive" } } : {})
      }
    },
    select: {
      participantId: true,
      predHomeGoals: true,
      predAwayGoals: true,
      participant: { select: { alias: true, departamento: true, rango: true } },
      match: { select: { homeTeam: true, awayTeam: true, homeTeamId: true, awayTeamId: true, fase: true, grupo: true, jornadaId: true } }
    }
  });
  const filtered = rows.filter((row) => {
    const teamHit = !filters.equipo || includes(row.match.homeTeam, filters.equipo) || includes(row.match.awayTeam, filters.equipo) || includes(row.match.homeTeamId, filters.equipo) || includes(row.match.awayTeamId, filters.equipo);
    return teamHit && includes(row.participant.alias, filters.alias) && includes(row.participant.departamento, filters.departamento) && includes(row.participant.rango, filters.rango);
  });
  const prediction = summarizePredictionDistribution(filtered);
  const resultadistas = new Map<string, { alias: string; departamento: string | null; goals: number; bets: number }>();
  const amarrategui = new Map<string, { alias: string; departamento: string | null; count: number }>();
  const trusted = new Map<string, number>();
  const despised = new Map<string, number>();
  const goalsFor = new Map<string, number>();
  const goalsAgainst = new Map<string, number>();

  for (const row of filtered) {
    const sign = predictionSign(row.predHomeGoals, row.predAwayGoals);
    const homeName = row.match.homeTeam ?? row.match.homeTeamId;
    const awayName = row.match.awayTeam ?? row.match.awayTeamId;
    const goals = (row.predHomeGoals ?? 0) + (row.predAwayGoals ?? 0);
    const player = resultadistas.get(row.participantId) ?? { alias: row.participant.alias, departamento: row.participant.departamento, goals: 0, bets: 0 };
    player.goals += goals;
    player.bets += row.predHomeGoals == null || row.predAwayGoals == null ? 0 : 1;
    resultadistas.set(row.participantId, player);
    if (sign === "X") {
      const entry = amarrategui.get(row.participantId) ?? { alias: row.participant.alias, departamento: row.participant.departamento, count: 0 };
      entry.count += 1;
      amarrategui.set(row.participantId, entry);
    }
    if (sign === "1") {
      bump(trusted, homeName);
      bump(despised, awayName);
    }
    if (sign === "2") {
      bump(trusted, awayName);
      bump(despised, homeName);
    }
    bump(goalsFor, homeName, row.predHomeGoals ?? 0);
    bump(goalsFor, awayName, row.predAwayGoals ?? 0);
    bump(goalsAgainst, homeName, row.predAwayGoals ?? 0);
    bump(goalsAgainst, awayName, row.predHomeGoals ?? 0);
  }

  const topResults = countValues(filtered.map((row) => row.predHomeGoals == null || row.predAwayGoals == null ? null : `${row.predHomeGoals}-${row.predAwayGoals}`));
  const complete = filtered.filter((row) => row.predHomeGoals != null && row.predAwayGoals != null);
  const resultadistaLabels = participantLabels(resultadistas);
  const amarrateguiLabels = participantLabels(amarrategui);
  return {
    totalBets: filtered.length,
    prediction,
    topResults,
    averageHomeGoals: complete.length ? Math.round((complete.reduce((sum, row) => sum + (row.predHomeGoals ?? 0), 0) / complete.length) * 100) / 100 : 0,
    averageAwayGoals: complete.length ? Math.round((complete.reduce((sum, row) => sum + (row.predAwayGoals ?? 0), 0) / complete.length) * 100) / 100 : 0,
    resultadistas: [...resultadistas.entries()]
      .map(([id, value]) => ({ name: resultadistaLabels.get(id)!, value: value.bets ? Math.round((value.goals / value.bets) * 100) / 100 : 0 }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 20),
    amarrategui: [...amarrategui.entries()]
      .map(([id, value]) => ({ name: amarrateguiLabels.get(id)!, value: value.count }))
      .sort((a, b) => b.value - a.value || a.name.localeCompare(b.name, "es-ES"))
      .slice(0, 20),
    trusted: rowsFromMap(trusted).slice(0, 20),
    despised: rowsFromMap(despised).slice(0, 20),
    goalsFor: rowsFromMap(goalsFor).slice(0, 20),
    goalsAgainst: rowsFromMap(goalsAgainst).slice(0, 20)
  };
}

export async function getGroupClassificationBetInsights(filters: PublicFilters) {
  noStore();
  const rows = await prisma.betGroupPosition.findMany({
    where: {
      valid: true,
      ...(filters.grupo ? { grupo: { contains: filters.grupo, mode: "insensitive" } } : {}),
      ...(filters.equipo ? { predTeamId: { contains: filters.equipo, mode: "insensitive" } } : {})
    },
    select: {
      grupo: true,
      predPos: true,
      predTeamId: true,
      participant: { select: { alias: true, departamento: true, rango: true } }
    }
  });
  const filtered = rows.filter((row) => includes(row.participant.alias, filters.alias) && includes(row.participant.departamento, filters.departamento) && includes(row.participant.rango, filters.rango));
  const byTeam = new Map<string, { team: string; totalPos: number; bets: number; first: number; second: number; third: number; fourth: number }>();
  for (const row of filtered) {
    if (!row.predTeamId) continue;
    const current = byTeam.get(row.predTeamId) ?? { team: row.predTeamId, totalPos: 0, bets: 0, first: 0, second: 0, third: 0, fourth: 0 };
    current.totalPos += row.predPos;
    current.bets += 1;
    if (row.predPos === 1) current.first += 1;
    if (row.predPos === 2) current.second += 1;
    if (row.predPos === 3) current.third += 1;
    if (row.predPos === 4) current.fourth += 1;
    byTeam.set(row.predTeamId, current);
  }
  const table = [...byTeam.values()].map((row) => ({
    ...row,
    averagePos: row.bets ? Math.round((row.totalPos / row.bets) * 100) / 100 : 0,
    confidence: row.first + row.second - row.fourth
  })).sort((a, b) => a.averagePos - b.averagePos || b.first - a.first || a.team.localeCompare(b.team, "es-ES"));
  return {
    totalBets: filtered.length,
    first: table.map((row) => ({ name: row.team, value: row.first })).sort((a, b) => b.value - a.value).slice(0, 20),
    second: table.map((row) => ({ name: row.team, value: row.second })).sort((a, b) => b.value - a.value).slice(0, 20),
    third: table.map((row) => ({ name: row.team, value: row.third })).sort((a, b) => b.value - a.value).slice(0, 20),
    fourth: table.map((row) => ({ name: row.team, value: row.fourth })).sort((a, b) => b.value - a.value).slice(0, 20),
    table,
    spainMorocco: table.filter((row) => ["ESP", "ESPANA", "ESPAÑA", "MAR", "MARRUECOS", "MOROCCO"].includes(row.team.toLocaleUpperCase("es-ES")))
  };
}

