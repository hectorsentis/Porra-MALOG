---
name: porra-statistics-advanced
description: Use this skill when implementing advanced statistics tabs, analytics charts, player point composition, ranking density, consistency, volatility, departments, bets, evolution and historical comparisons for the PORRA app.
---

# PORRA Advanced Statistics Skill

Use this skill for /estadisticas and advanced analytics across the app.

## Goal

The statistics area must be substantially richer than the preliminary dashboard.

It must analyze imported Excel data, scoring tables, bets, departments and historical snapshots.

## Main route

- /estadisticas

Use internal tabs:

- Resumen
- Puntos
- Aciertos
- Evolución
- Departamentos
- Apuestas
- Volatilidad
- Bote

## Required charts

### Resumen

- distribution of total points
- ranking density
- gap to leader
- gap to previous position
- points average
- median
- standard deviation
- closest battle group
- biggest points gap

### Puntos

- point composition by player
- stacked bars:
  - matches
  - groups
  - eliminatorias
  - bonus
- top players by each scoring category
- percentage contribution per category
- points gained in latest recalculation

### Aciertos

- exact scores ranking
- correct signs ranking
- correct differences ranking
- correct group qualified ranking
- correct positions ranking
- bonus hits ranking
- hit rate per participant
- hit rate per department

### Evolución

Requires historical snapshots.

- position evolution
- points evolution
- points gained per event
- best event
- worst event
- most stable participants
- most volatile participants
- longest streak in top 10
- number of times each participant was leader

### Departamentos

- average points by department
- total points by department
- participant count by department
- department MVP
- internal ranking
- min/avg/max by department
- department dispersion
- boxplot if supported, otherwise min/avg/max bars

### Apuestas

- champion distribution
- runner-up distribution
- top scorer distribution
- most attacking team distribution
- most conceded team distribution
- rare bets
- differential bets
- mainstream bets
- popularity score per participant
- current points vs bet rarity scatter

### Volatilidad

- biggest rise
- biggest drop
- average position movement
- position standard deviation
- points standard deviation
- most consistent participants
- most chaotic participants

### Bote

- total pot
- projected prizes
- prize distribution chart
- participants included in pot count
- admin-only payment breakdown must not be shown publicly

## Player point composition

Add reusable component:

- PlayerPointCompositionChart

It must be usable in:

- Home
- Clasificación quick profile
- Participantes detail
- Estadísticas / Puntos

## Data requirements

Use:

- GeneralRanking for current data
- RankingSnapshotRow or ParticipantScoreSnapshot for history
- ScoringMatch, ScoringGroup, ScoringBonus for accuracy statistics
- BetBonus and BetMatch for betting analytics
- Participant for department/rank dimensions

## Filters

All statistics tabs must support active filters where relevant:

- alias
- department
- rank
- phase
- matchday
- group
- team

Show active filter chips.

## Success criteria

- /estadisticas has real tabs.
- Each tab has at least one chart and one table/card group.
- Charts read real database data.
- No placeholder text.
- Filters update charts.
- History-based charts use snapshots.