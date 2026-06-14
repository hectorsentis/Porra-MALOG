import { defaultRules, type GameRules } from "./rules";
import type { BonusBetInput, BonusResultInput, BonusScore } from "./types";

function normalize(value?: string | null): string {
  return (value ?? "").trim().toLocaleUpperCase("es-ES");
}

function same(left?: string | null, right?: string | string[] | null): boolean {
  if (!left || !right) return false;
  const actual = Array.isArray(right) ? right : [right];
  const expected = normalize(left);
  return actual.map(normalize).some((value) => value && value === expected);
}

function countOverlap(left: Array<string | null | undefined> = [], right: Array<string | null | undefined> = []): number {
  const actual = new Set(right.map(normalize).filter(Boolean));
  return left.map(normalize).filter((value) => value && actual.has(value)).length;
}

export function scoreBonus(
  bet: BonusBetInput,
  result: BonusResultInput,
  rules: GameRules = defaultRules
): BonusScore {
  const campeonOk = same(bet.campeon, result.campeon);
  const subcampeonOk = same(bet.subcampeon, result.subcampeon);
  const semifinalistasOk = countOverlap(bet.semifinalistas, result.semifinalistas);
  const maximoGoleadorOk = same(bet.maximoGoleador, result.maximoGoleador);
  const seleccionMasGoleadoraOk = same(bet.seleccionMasGoleadora, result.seleccionMasGoleadora);
  const seleccionMasGoleadaOk = same(bet.seleccionMasGoleada, result.seleccionMasGoleada);
  const seleccionMenosGoleadoraOk = same(bet.seleccionMenosGoleadora, result.seleccionMenosGoleadora);
  const seleccionMenosGoleadaOk = same(bet.seleccionMenosGoleada, result.seleccionMenosGoleada);
  const equipoRevelacionOk = same(bet.equipoRevelacion, result.equipoRevelacion);
  const equipoDecepcionOk = same(bet.equipoDecepcion, result.equipoDecepcion);
  const totalGolesTorneoOk =
    bet.totalGolesTorneo != null &&
    result.totalGolesTorneo != null &&
    Math.abs(bet.totalGolesTorneo - result.totalGolesTorneo) <= rules.totalGoalsTolerance;

  const pointsTotal =
    (campeonOk ? rules.champion : 0) +
    (subcampeonOk ? rules.runnerUp : 0) +
    semifinalistasOk * rules.semifinalist +
    (maximoGoleadorOk ? rules.topScorer : 0) +
    (seleccionMasGoleadoraOk ? rules.teamMostGoalsFor : 0) +
    (seleccionMasGoleadaOk ? rules.teamMostGoalsAgainst : 0) +
    (seleccionMenosGoleadoraOk ? rules.teamLeastGoalsFor : 0) +
    (seleccionMenosGoleadaOk ? rules.teamLeastGoalsAgainst : 0) +
    (equipoRevelacionOk ? rules.revelation : 0) +
    (equipoDecepcionOk ? rules.disappointment : 0) +
    (totalGolesTorneoOk ? rules.totalGoals : 0);

  return {
    participantId: bet.participantId,
    alias: bet.alias,
    campeonOk,
    subcampeonOk,
    semifinalistasOk,
    maximoGoleadorOk,
    seleccionMasGoleadoraOk,
    seleccionMasGoleadaOk,
    seleccionMenosGoleadoraOk,
    seleccionMenosGoleadaOk,
    equipoRevelacionOk,
    equipoDecepcionOk,
    totalGolesTorneoOk,
    pointsTotal
  };
}
