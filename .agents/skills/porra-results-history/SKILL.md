---
name: porra-results-history
description: Use this skill when implementing match setup, admin result entry, official result updates, recalculation, ranking snapshots, score history, evolution charts and production result workflows.
---

# PORRA Results and History Skill

## Goal

The admin must be able to enter match results from the website and the public dashboard must update after recalculation.

## Result states

- pending: no official result
- draft: saved but not public
- official: affects public ranking
- void: ignored

Only official results affect public scoring.

## Required admin routes

- /admin/partidos
- /admin/resultados
- /admin/logs
- /admin/rollback

## Result update flow

1. Admin selects or creates match.
2. Admin enters result.
3. Admin saves draft or publishes official.
4. Official publish creates MatchResultEvent.
5. Official publish creates RecalculationRun.
6. Scoring recalculates.
7. GeneralRanking updates.
8. RankingSnapshot is created.
9. RankingSnapshotRow is created for every participant.
10. Public pages are revalidated or dynamically updated.

## Historical requirements

History powers:

- /evolucion
- rankings temporales
- consistency
- volatility
- daily/range rankings
- participant profiles
- delta position
- delta points

Never fake history from current ranking only.

## Empty production results

The app must not break when:

- no official result exists
- no snapshot history exists yet
- bonus results are pending
- imported Excel contains test results that will be cleared

Use clean product empty states.

## Tests

Required tests:

- pending does not score
- draft does not score
- official scores
- recalculation creates snapshot
- snapshot contains all participants
- rollback restores previous public snapshot
- evolution queries chronological history
