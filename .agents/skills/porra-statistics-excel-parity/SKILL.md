---
name: porra-statistics-excel-parity
description: Use this skill to ensure the web includes at least all statistics from the Excel workbook while preserving additional useful statistics already implemented.
---

# PORRA Statistics Excel Parity

## Rule

Existing good statistics must be preserved.
Excel statistics are the minimum mandatory set.
Additional useful statistics are allowed.

## Required Excel parity

### 09_CLASIFICACION_GENERAL

- Points_Total
- Points_Matches
- Points_Groups
- Points_Eliminatorias
- Points_Bonus
- Total_Aciertos
- Exact_Scores
- Correct_Diff
- Correct_Signs
- Correct_Group_Qualified
- Correct_Group_Positions
- Correct_Cruces
- Correct_Qualified 1/8
- Correct_Qualified 1/4
- Correct_Qualified 1/2
- Correct_Qualified Final
- Correct Champion
- N_Bonus
- Pos
- Points_Matches_Fecha
- Points_Groups_Fecha
- Points_KO_Fecha
- Points_Bonus_Fecha
- Points_Total_Fecha
- Pos_Fecha
- Delta_Pos
- Delta_Points

### 10_PODIO

- ranking visual for screenshot
- points by phase table
- hits table
- bonus table
- top 3 highlighted
- movement arrows

### 11_PREDICCIONES_DIA

- date dropdown
- match dropdown
- TODOS option
- prediction table
- 1-X-2 distribution
- most predicted result
- percentage
- most profitable match
- massacre match
- player of day
- exact count
- zero points count
- points distributed
- donut 1-X-2
- bars top player points
- columns hit types

### 12_RANKINGS_TEMPORALES

- daily ranking
- range ranking
- department competition
- rank competition
- daily/range winner cards
- department/rank leader cards
- charts by daily, range, department, rank

### 13_STATS_SALSEO / 14_STATS

Awards:

- Leader
- Farolillo
- Cohete
- Hundido
- Nostradamus
- Rey del signo
- Cirujano de grupos
- Rey de cruces
- Killer de eliminatorias
- Bonusman
- Florero
- Gafe
- Amarrategui
- Patriota
- Patriota anti-Marruecos
- Regular
- Departamento líder
- Rango líder

Global cards:

- total participants
- total points distributed
- average points
- current leader
- farolillo
- leader department
- leader rank

Chart:

- points distributed by phase

### Bonus bets

- champion
- runner-up
- semifinalists
- revelation
- disappointment
- highest scoring team
- lowest scoring team
- most conceded
- least conceded
- total goals average/min/max/dispersion/mode
- hype ranking
- distrust ranking
- Spain vs Morocco

### Match bets

- global 1-X-2
- most predicted result
- top predicted results
- average goals
- biggest predicted win
- most result-heavy players
- most draw-heavy players
- trusted teams
- despised teams
- predicted highest scoring/conceding teams
- emotional balance by team

### Group bets

- most predicted group winners
- most predicted group last
- average predicted position
- times predicted 1st/2nd/3rd/4th
- Spain vs Morocco comparison

### Salseo phrases

Categories:

- LIDER
- FAROLILLO
- COHETE
- HUNDIDO
- NOSTRADAMUS
- GAFE
- AMARRATEGUI
- REGULAR
- FLORERO
- PATRIOTA
- PATRIOTA_ANTI_MAR
- DEPARTAMENTO
- RANGO
- REY_SIGNO
- CIRUJANO_GRUPOS
- REY_CRUCES
- KILLER_ELIMINATORIAS
- BONUSMAN

Use {NOMBRE} and {VALOR} placeholders.

## Documentation

Update docs/statistics-coverage.md with implemented / missing / reason.
