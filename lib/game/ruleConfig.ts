import { prisma } from "@/lib/prisma";
import { defaultRules, type GameRules } from "./rules";

export type RuleMetadata = {
  category: string;
  label: string;
  sortOrder: number;
};

export const ruleMetadata: Record<string, RuleMetadata> = {
  GROUP_EXACT_SCORE: { category: "Partidos fase de grupos", label: "Resultado exacto", sortOrder: 10 },
  GROUP_GOAL_DIFF: { category: "Partidos fase de grupos", label: "Diferencia correcta", sortOrder: 20 },
  GROUP_SIGN: { category: "Partidos fase de grupos", label: "Signo correcto", sortOrder: 30 },
  GROUP_TEAM_QUALIFIED: { category: "Clasificacion de grupos", label: "Equipo clasificado", sortOrder: 40 },
  GROUP_EXACT_POSITION: { category: "Clasificacion de grupos", label: "Posicion exacta", sortOrder: 50 },
  KO_R32_QUALIFIED: { category: "Eliminatorias", label: "Clasificado correcto 1/16", sortOrder: 110 },
  KO_R16_QUALIFIED: { category: "Eliminatorias", label: "Clasificado correcto octavos", sortOrder: 120 },
  KO_QF_QUALIFIED: { category: "Eliminatorias", label: "Clasificado correcto cuartos", sortOrder: 130 },
  KO_SF_QUALIFIED: { category: "Eliminatorias", label: "Clasificado correcto semifinales", sortOrder: 140 },
  KO_CHAMPION: { category: "Eliminatorias", label: "Campeon por cuadro final", sortOrder: 150 },
  KO_CRUCE_EXACTO: { category: "Eliminatorias", label: "Cruce exacto", sortOrder: 160 },
  KO_THIRD_PLACE: { category: "Eliminatorias", label: "Tercer puesto", sortOrder: 170 },
  SPAIN_MULTIPLIER: { category: "Multiplicadores", label: "Multiplicador partidos de Espana", sortOrder: 210 },
  BONUS_CAMPEON: { category: "Bonus final", label: "Campeon", sortOrder: 310 },
  BONUS_SUBCAMPEON: { category: "Bonus final", label: "Subcampeon", sortOrder: 320 },
  BONUS_SEMIFINALISTA: { category: "Bonus final", label: "Semifinalista", sortOrder: 330 },
  BONUS_MAX_GOLEADOR: { category: "Bonus final", label: "Maximo goleador", sortOrder: 340 },
  BONUS_REVELACION: { category: "Bonus final", label: "Equipo revelacion", sortOrder: 350 },
  BONUS_DECEPCION: { category: "Bonus final", label: "Equipo decepcion", sortOrder: 360 },
  BONUS_SELECCION_MAS_GOLEADORA: { category: "Bonus final", label: "Seleccion mas goleadora", sortOrder: 370 },
  BONUS_SELECCION_MENOS_GOLEADORA: { category: "Bonus final", label: "Seleccion menos goleadora", sortOrder: 380 },
  BONUS_SELECCION_MAS_GOLEADA: { category: "Bonus final", label: "Seleccion mas goleada", sortOrder: 390 },
  BONUS_SELECCION_MENOS_GOLEADA: { category: "Bonus final", label: "Seleccion menos goleada", sortOrder: 400 },
  BONUS_TOTAL_GOLES_BEST: { category: "Bonus total goles", label: "Total goles exacto/mejor", sortOrder: 410 },
  BONUS_TOTAL_GOLES_CLOSE_10: { category: "Bonus total goles", label: "Total goles margen 10", sortOrder: 420 },
  BONUS_TOTAL_GOLES_CLOSE_20: { category: "Bonus total goles", label: "Total goles margen 20", sortOrder: 430 }
};

export const excelRuleKeys = Object.keys(ruleMetadata);

export function metadataForRule(key: string): RuleMetadata {
  return ruleMetadata[key] ?? { category: "Otras reglas", label: key.replaceAll("_", " "), sortOrder: 900 };
}

type DbRule = {
  key: string;
  value: number;
  active: boolean;
  description: string | null;
  category?: string | null;
  label?: string | null;
  sortOrder?: number | null;
};

export function defaultValueForRule(key: string): number {
  const rules = defaultRules;
  const values: Record<string, number> = {
    GROUP_EXACT_SCORE: rules.exactScore,
    GROUP_GOAL_DIFF: rules.correctGoalDiff,
    GROUP_SIGN: rules.correctSign,
    GROUP_TEAM_QUALIFIED: rules.groupQualified,
    GROUP_EXACT_POSITION: rules.groupExactPosition,
    KO_R32_QUALIFIED: rules.koR32Qualified,
    KO_R16_QUALIFIED: rules.koR16Qualified,
    KO_QF_QUALIFIED: rules.koQfQualified,
    KO_SF_QUALIFIED: rules.koSfQualified,
    KO_CHAMPION: rules.koChampion,
    KO_CRUCE_EXACTO: rules.exactCrossing,
    KO_THIRD_PLACE: rules.koThirdPlace,
    SPAIN_MULTIPLIER: rules.spainMultiplier,
    BONUS_CAMPEON: rules.champion,
    BONUS_SUBCAMPEON: rules.runnerUp,
    BONUS_SEMIFINALISTA: rules.semifinalist,
    BONUS_MAX_GOLEADOR: rules.topScorer,
    BONUS_REVELACION: rules.revelation,
    BONUS_DECEPCION: rules.disappointment,
    BONUS_SELECCION_MAS_GOLEADORA: rules.teamMostGoalsFor,
    BONUS_SELECCION_MENOS_GOLEADORA: rules.teamLeastGoalsFor,
    BONUS_SELECCION_MAS_GOLEADA: rules.teamMostGoalsAgainst,
    BONUS_SELECCION_MENOS_GOLEADA: rules.teamLeastGoalsAgainst,
    BONUS_TOTAL_GOLES_BEST: rules.totalGoals,
    BONUS_TOTAL_GOLES_CLOSE_10: rules.totalGoalsClose10,
    BONUS_TOTAL_GOLES_CLOSE_20: rules.totalGoalsClose20
  };
  return values[key] ?? 0;
}
export function rulesToGameRules(rows: DbRule[]): GameRules {
  const active = new Map(rows.filter((row) => row.active).map((row) => [row.key, row.value]));
  const value = (key: string, fallback: number) => active.get(key) ?? fallback;
  return {
    ...defaultRules,
    exactScore: value("GROUP_EXACT_SCORE", defaultRules.exactScore),
    correctGoalDiff: value("GROUP_GOAL_DIFF", defaultRules.correctGoalDiff),
    correctSign: value("GROUP_SIGN", defaultRules.correctSign),
    groupQualified: value("GROUP_TEAM_QUALIFIED", defaultRules.groupQualified),
    groupExactPosition: value("GROUP_EXACT_POSITION", defaultRules.groupExactPosition),
    koR32Qualified: value("KO_R32_QUALIFIED", defaultRules.koR32Qualified),
    koR16Qualified: value("KO_R16_QUALIFIED", defaultRules.koR16Qualified),
    koQfQualified: value("KO_QF_QUALIFIED", defaultRules.koQfQualified),
    koSfQualified: value("KO_SF_QUALIFIED", defaultRules.koSfQualified),
    koChampion: value("KO_CHAMPION", defaultRules.koChampion),
    qualifiedTeam: value("KO_R16_QUALIFIED", defaultRules.qualifiedTeam),
    exactCrossing: value("KO_CRUCE_EXACTO", defaultRules.exactCrossing),
    koThirdPlace: value("KO_THIRD_PLACE", defaultRules.koThirdPlace),
    spainMultiplier: value("SPAIN_MULTIPLIER", defaultRules.spainMultiplier),
    champion: value("BONUS_CAMPEON", defaultRules.champion),
    runnerUp: value("BONUS_SUBCAMPEON", defaultRules.runnerUp),
    semifinalist: value("BONUS_SEMIFINALISTA", defaultRules.semifinalist),
    topScorer: value("BONUS_MAX_GOLEADOR", defaultRules.topScorer),
    revelation: value("BONUS_REVELACION", defaultRules.revelation),
    disappointment: value("BONUS_DECEPCION", defaultRules.disappointment),
    teamMostGoalsFor: value("BONUS_SELECCION_MAS_GOLEADORA", defaultRules.teamMostGoalsFor),
    teamLeastGoalsFor: value("BONUS_SELECCION_MENOS_GOLEADORA", defaultRules.teamLeastGoalsFor),
    teamMostGoalsAgainst: value("BONUS_SELECCION_MAS_GOLEADA", defaultRules.teamMostGoalsAgainst),
    teamLeastGoalsAgainst: value("BONUS_SELECCION_MENOS_GOLEADA", defaultRules.teamLeastGoalsAgainst),
    totalGoals: value("BONUS_TOTAL_GOLES_BEST", defaultRules.totalGoals),
    totalGoalsClose10: value("BONUS_TOTAL_GOLES_CLOSE_10", defaultRules.totalGoalsClose10),
    totalGoalsClose20: value("BONUS_TOTAL_GOLES_CLOSE_20", defaultRules.totalGoalsClose20)
  };
}

export async function getActiveGameRules(): Promise<GameRules> {
  const rows = await prisma.gameRule.findMany({ where: { active: true } }).catch(() => []);
  return rulesToGameRules(rows);
}

export async function getRuleRows() {
  const rows = await prisma.gameRule.findMany({ orderBy: [{ sortOrder: "asc" }, { key: "asc" }] }).catch(() => []);
  const existing = new Set(rows.map((row) => row.key));
  const fallbackRows = excelRuleKeys
    .filter((key) => !existing.has(key))
    .map((key) => {
      const meta = metadataForRule(key);
      return {
        id: key,
        key,
        value: defaultValueForRule(key),
        active: true,
        description: null,
        category: meta.category,
        label: meta.label,
        sortOrder: meta.sortOrder,
        updatedAt: new Date(0)
      };
    });
  return [...rows, ...fallbackRows]
    .map((row) => {
      const meta = metadataForRule(row.key);
      return {
        ...row,
        category: row.category ?? meta.category,
        label: row.label ?? meta.label,
        sortOrder: row.sortOrder ?? meta.sortOrder
      };
    })
    .sort((a, b) => a.sortOrder - b.sortOrder || a.key.localeCompare(b.key, "es-ES"));
}

export async function getRuleSections() {
  const rows = await getRuleRows();
  const grouped = new Map<string, typeof rows>();
  for (const row of rows.filter((item) => item.active)) {
    const group = grouped.get(row.category) ?? [];
    group.push(row);
    grouped.set(row.category, group);
  }
  return [...grouped.entries()].map(([title, rules]) => ({ title, rules }));
}

