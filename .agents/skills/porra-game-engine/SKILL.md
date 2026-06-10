---
name: porra-game-engine
description: Use this skill for scoring rules, match result updates, group scoring, bonus scoring, ranking, snapshots, simulator, online recalculation and migrating Excel formulas into TypeScript.
---

# PORRA Game Engine Skill

## Goal

If scoring is currently in Excel, migrate it to a TypeScript engine so the app can update results online.

## Required modules

- lib/game/rules.ts
- lib/game/types.ts
- lib/game/scoreMatch.ts
- lib/game/scoreGroups.ts
- lib/game/scoreBonus.ts
- lib/game/ranking.ts
- lib/game/simulator.ts
- lib/game/potentialPoints.ts
- lib/game/snapshots.ts
- lib/game/recalculateAll.ts

## Required scoring fields

Match scoring:

- Exact_OK
- Diff_OK
- Sign_OK
- Qualified_OK
- Cruce_Exacto_OK
- Spain_Match
- Multiplier
- Points_Result
- Points_Qualified
- Points_Cruce_Exacto
- Points_Total

Group scoring:

- Qualified_OK
- Exact_Position_OK
- Points_Qualified
- Points_Position
- Points_Total

Bonus scoring:

- Campeon_OK
- Subcampeon_OK
- Semifinalistas_OK
- Maximo_Goleador_OK
- Seleccion_Mas_Goleadora_OK
- Seleccion_Mas_Goleada_OK
- Seleccion_Menos_Goleadora_OK
- Seleccion_Menos_Goleada_OK
- Equipo_Revelacion_OK
- Equipo_Decepcion_OK
- Total_Goles_Torneo_OK
- Points_Total

## Ranking

Calculate:

- Points_Matches
- Points_Groups
- Points_Eliminatorias
- Points_Bonus
- Points_Total
- Pos
- Delta_Pos
- Delta_Points
- RankingSnapshot

## Simulations

Simulations must not overwrite official data.
