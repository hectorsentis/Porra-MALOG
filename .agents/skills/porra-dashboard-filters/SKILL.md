---
name: porra-dashboard-filters
description: Use this skill when creating or changing filters, dropdowns, URL query params, active filter chips and chart/table filtering behaviour in the PORRA app.
---

# PORRA Dashboard Filters Skill

## Core rule

Main filters must be dropdowns/selects, not free text inputs.

Alias may have an optional search box, but the main alias filter should support selecting from existing participants.

## Required dropdown filters

Where relevant:

- alias
- department
- rank
- phase
- matchday
- group
- team
- date
- match
- snapshot/date comparison
- range start
- range end

## Page requirements

Home:

- alias
- department
- rank

Clasificación:

- alias
- department
- rank
- snapshot/date comparison

Predicciones día:

- date
- match
- department
- rank

Rankings temporales:

- day
- range start
- range end
- department
- rank

Apuestas:

- team
- department
- rank
- market/bet type

Departamentos:

- department
- rank

Estadísticas:

- alias
- department
- rank
- phase
- matchday
- group
- team
- snapshot/date

Simulador:

- match
- home team
- away team
- phase
- group

## Behaviour

Filters must:

- load options from database
- show selected values
- show active chips
- allow clearing one filter
- allow clearing all filters
- affect tables
- affect charts
- persist in URL query params when practical

## Empty states

When filters return no data, show clean user-facing messages.

Do not show technical placeholders.
