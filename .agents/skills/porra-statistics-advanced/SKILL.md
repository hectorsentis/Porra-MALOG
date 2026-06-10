---
name: porra-statistics-advanced
description: Use this skill when implementing or reviewing advanced statistics, Excel-statistics parity, salseo awards, prediction analytics, temporal rankings, charts and statistical tabs for PORRA MALOG.
---

# PORRA Advanced Statistics Skill

## Goal

The statistics area must keep all already useful statistics and add all statistics from the Excel workbook as minimum coverage.

Do not replace the Excel statistics with generic dashboard ideas.

## Existing statistics rule

Before changing code:

1. Inspect current pages and components.
2. List implemented statistics.
3. Keep working statistics.
4. Compare against Excel requirements.
5. Add missing statistics.
6. Add useful extras only after minimum coverage is met.

## 09_CLASIFICACION_GENERAL parity

Expose and use:

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

Visual requirements:

- green/red movement arrows based on Delta_Pos
- comparison between current ranking and selected previous snapshot/date
- current vs previous points deltas

## 10_PODIO parity

Create a podium/ranking view suitable for screenshot sharing.

Main podium table:

- Delta position
- current position
- alias
- department
- rank
- match points
- group points
- KO points
- bonus points
- total points

Hits table:

- exact scores
- correct differences
- correct signs
- group qualified teams
- exact group positions
- crosses
- KO hits by round
- Spain bonus
- number of bonus hits
- total hits

Bonus table:

- champion
- runner-up
- semifinalists
- top scorer
- revelation team
- disappointment team
- most goals team
- least goals team
- most conceded team
- least conceded team
- total goals
- total bonus hits
- total bonus points

Visual requirements:

- top 3 highlighted
- green/red movement arrows
- automatic ranking order
- clean layout for sharing/capture

## 11_PREDICCIONES_DIA parity

Create a match/day predictions page or statistics tab.

Required dropdown selectors:

- date
- match
- option TODOS for all matches of selected date

Prediction table:

- alias
- department
- Match_ID when acceptable
- phase
- predicted home team
- predicted away team
- predicted home goals
- predicted away goals
- real result
- exact hit
- difference hit
- sign hit
- qualified hit
- cross hit
- points earned

Statistics:

- 1-X-2 distribution: home/draw/away
- most predicted result
- number of players with that result
- percentage of players with that result
- most profitable match of the day
- points distributed in most profitable match
- massacre match
- points distributed in massacre match
- player of the match/day
- number of exact scores
- number of players with 0 points
- total points distributed

Charts:

- donut chart: 1-X-2 distribution
- horizontal bar chart: top points by player
- column chart: hit types: exact, difference, sign, zero points

Cards:

- most predicted result
- most profitable match
- massacre match
- player of the day
- Nostradamus of match/day
- carnage: players with 0 points
- points distributed

## 12_RANKINGS_TEMPORALES parity

Use real history/snapshots.

Required dropdown selectors:

- selected day
- range start date
- range end date

Daily ranking:

- daily position
- alias
- department
- rank
- daily points
- daily exacts
- daily signs
- daily crosses

Range ranking:

- range position
- alias
- department
- rank
- range points
- range exacts
- range signs
- range crosses

Department competition:

- department
- number of participants
- points in range
- average per player

Rank competition:

- rank
- number of participants
- points in range
- average per player

Cards:

- daily winner
- daily winner points
- range winner
- range winner points
- sharpest department
- leader department average
- sharpest rank
- leader rank average

Charts:

- horizontal bars: top daily
- horizontal bars: top range
- columns: average points by department
- columns: average points by rank

## 13_STATS_SALSEO / 14_STATS parity

Special awards:

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

- grouped columns: points distributed by phase: matches, groups, eliminatorias, bonus

## Bonus bets statistics

Based on tbl_bets_bonus:

- most picked champion
- most picked runner-up
- most picked semifinalists
- most picked revelation team
- most picked disappointment team
- most picked highest-scoring team
- most picked lowest-scoring team
- most picked most-conceding team
- most picked least-conceding team
- total tournament goals: average, minimum, maximum, dispersion, mode
- hype ranking: champion x3, runner-up x2, semifinalist x1
- distrust ranking: disappointment team, predicted defeats
- Spain vs Morocco emotional balance

## Match bets statistics

Based on tbl_bets_matches:

- global 1-X-2 tendency: home, draw, away
- most predicted global result
- top predicted results
- average predicted goals: home, away, total
- biggest predicted win
- most result-heavy players
- most draw-heavy players
- most trusted teams
- most despised teams
- predicted highest-scoring team
- predicted most-conceding team
- emotional balance by team

## Group position bets statistics

Based on tbl_bets_group_positions:

- teams most predicted as group winners
- teams most predicted as group last
- average predicted position by team
- times predicted 1st
- times predicted 2nd
- times predicted 3rd
- times predicted 4th
- Spain vs Morocco comparison

## Salseo phrases

Create or seed phrases with:

- category
- phrase

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

Placeholders:

- {NOMBRE}
- {VALOR}

Tone:

- moderate humor
- no insults
- no personal attacks
- no private data
