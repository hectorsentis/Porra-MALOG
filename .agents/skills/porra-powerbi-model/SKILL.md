---
name: porra-powerbi-model
description: Use this skill for Power BI model replication, PBIX/Excel table mapping, Prisma schema design, relationships, public/private fields, and semantic model preservation for the PORRA MALOG app.
---

# PORRA Power BI Model Skill

Use when working with the data model.

## Baseline tables

- tbl_participantes
- tbl_bets_matches
- tbl_bets_group_positions
- tbl_bets_bonus
- tbl_scoring_matches
- tbl_scoring_groups
- tbl_scoring_bonus
- tbl_clasificacion_general

## Core rule

Do not invent a new schema if the Power BI model supports the feature.

Use Prisma readable model names with `@@map` to preserve original table names.

## Public fields

- Alias
- Departamento
- Rango
- Pos
- Delta_Pos
- Points_Total
- Points_Matches
- Points_Groups
- Points_Eliminatorias
- Points_Bonus

## Private fields

Never expose publicly:

- Email
- Nombre
- PAY
- Pagado
- payment details
- internal admin status

## Required docs

Update:

- docs/data-model.md
- docs/excel-analysis.md
