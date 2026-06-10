---
name: porra-production-release
description: Use this skill when hardening the PORRA MUNDIAL 2026 MALOG app for production: online results, historical snapshots, complete dashboard tabs, filters, statistics, money pot, admin operations and production cleanup.
---

# PORRA Production Release Skill

Use this skill when moving from preliminary version to production.

## Production goal

The app must be usable during the Mundial without Power BI.

It must support:

- public dashboard
- admin result entry
- automatic recalculation
- historical rankings
- advanced statistics
- active filters
- money pot page
- production Excel with empty results
- rollback or previous valid snapshot recovery

## Mandatory public pages

- /
- /clasificacion
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
- /admin/resultados
- /admin/partidos
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

Each snapshot row must store:

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

This history powers:

- position evolution
- points evolution
- points by matchday
- consistency
- volatility
- biggest rises
- biggest drops
- leaderboard density
- participant profiles

## Active filters

Every dashboard page must have functional filters where relevant.

Required filters:

- alias
- department
- rank
- phase
- matchday
- group
- team

Home should keep only:

- alias
- department
- rank

Every page must show active filter chips.

Required buttons:

- clear one filter
- clear all filters

Filters must affect charts and tables.

## UI wording rule

The public UI must not contain internal control phrases.

Forbidden examples:

- "La UI de escenarios usará..."
- "Resultados pendientes importados desde PostgreSQL"
- "Placeholder"
- "Coming soon"
- "TODO"
- "Data from database"
- "Mock data"
- "This section will show"

Use final product language only.

## Money pot page

Add /bote.

It must show:

- bote total
- participantes pagados
- participantes pendientes, only in admin
- prize distribution
- first prize
- second prize
- third prize
- optional special prizes
- rules of payout

Public /bote must not expose payment status per person unless explicitly allowed.

Admin /admin/bote may allow:

- amount per participant
- prize percentages
- manual adjustment
- paid/unpaid status if already present in private data
- notes

## Success criteria

- No page is empty.
- No page shows placeholder text.
- All filters work.
- Results can be entered online.
- Recalculation produces a new snapshot.
- Historical pages use database history.
- Bote page exists.
- Production mode supports blank results.
- Tests cover scoring and snapshots.