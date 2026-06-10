---
name: porra-production-release
description: Use this skill when moving PORRA MUNDIAL 2026 MALOG from preliminary dashboard to production app with Excel-statistics parity, online results, history, filters, pot and clean UI.
---

# PORRA Production Release Skill

## Production goal

The app must be usable during the Mundial without Power BI.

It must support:

- public dashboard
- complete statistics pages
- admin result entry
- automatic recalculation
- historical rankings
- active dropdown filters
- money pot page
- production Excel with empty results
- rollback or previous valid snapshot recovery

## Core rule

Do not remove statistics that already work.

The Excel statistics are the minimum mandatory coverage.

Additional statistics are welcome if they add value, but never at the cost of deleting, simplifying or replacing working statistics.

## Mandatory public pages

- /
- /clasificacion
- /podio or equivalent ranking capture view
- /predicciones or equivalent match/day predictions view
- /evolucion
- /apuestas
- /departamentos
- /simulador
- /participantes
- /participantes/[slug]
- /estadisticas
- /bote
- /reglas

## Mandatory admin pages

- /admin
- /admin/import
- /admin/partidos
- /admin/resultados
- /admin/bote
- /admin/logs
- /admin/rollback

## Production data rule

The Excel may contain test results during development.

The production app must handle:

- empty real results
- pending matches
- manually entered official results
- recalculation after each official result
- clearing test results before production

Do not assume imported results are final.

## Historical database rule

The app must store history after every official recalculation.

Required concepts:

- RankingSnapshot
- RankingSnapshotRow
- ParticipantScoreSnapshot
- RecalculationRun
- MatchResultEvent

Each snapshot row should store:

- snapshotId
- participantId
- alias
- department
- rank
- position
- previousPosition
- deltaPosition
- pointsTotal
- pointsMatches
- pointsGroups
- pointsEliminatorias
- pointsBonus
- pointsGainedThisRun
- eventLabel
- phase
- matchday
- matchId when relevant
- createdAt

## UI wording rule

The public UI must not contain internal control phrases.

Forbidden examples:

- Placeholder
- Mock data
- Coming soon
- TODO
- Data from database
- resultados pendientes importados desde PostgreSQL
- La UI de escenarios usará

Use final product language only.
