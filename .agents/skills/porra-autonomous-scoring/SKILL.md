---
name: porra-autonomous-scoring
description: Use this skill when implementing production scoring, admin result publishing, recalculation, ranking rebuild, snapshots, daily deltas and validation against Excel.
---

# PORRA Autonomous Scoring

## Goal

After the final Excel import, the production app must recalculate points without Excel formulas or Power BI.

## Admin result flow

1. Admin creates/edits a match.
2. Admin enters result.
3. Admin saves draft or publishes official.
4. Draft does not affect public ranking.
5. Official result triggers recalculation.
6. ScoringMatch rows update.
7. GeneralRanking rebuilds.
8. RankingSnapshot is created.
9. Daily score history is created.
10. Public pages refresh without redeploy.

## Minimum scoring

- pending result = 0 points
- draft result = 0 public points
- official result scores
- exact score
- correct sign
- correct goal difference
- qualified team when applicable
- phase multipliers when applicable
- KO/qualified scoring when applicable

## Ranking

Sort by:

1. Points_Total desc
2. Total_Aciertos desc
3. Exact_Scores desc
4. Points_Bonus desc
5. Alias asc

Calculate:

- Pos
- previousPos
- Delta_Pos
- Delta_Points
- points by category
- total hits

## Daily history

At least one row per participant per official result day/snapshot.

Public pages must use this history for:

- /evolucion
- /estadisticas evolution tabs
- /participantes/[slug]
- daily deltas in /clasificacion

## Tests

Required tests:

- pending result does not score
- draft result does not score
- official result scores
- exact score
- sign
- difference
- qualified
- ranking order
- tie-breakers
- delta position
- delta points
- snapshot contains every participant
- daily history exists
- rollback restores previous public snapshot

## Golden validation

If Excel has test results, compare app-calculated ranking with Excel ranking. Write discrepancies to docs/scoring-validation.md.
