---
name: porra-match-viewer
description: Use this skill when implementing the public match viewer, calendar, results display, match details, admin match editor or result status flow.
---

# PORRA Match Viewer

## Public route

Add or complete:

- /partidos
- /partidos/[matchId] if useful

## Public match viewer must show

- matchday/date
- phase
- group
- home team
- away team
- kickoff time if available
- result if official
- qualified team if applicable
- status: pending, official, void
- points distributed when official
- exact score count when official
- 1-X-2 prediction distribution
- most predicted result
- link to predictions/statistics for match

## Filters

Use dropdowns:

- phase
- group
- matchday
- team
- status
- date

## Admin routes

- /admin/partidos
- /admin/resultados

Admin must allow:

- create/edit match
- set home/away teams
- set phase/group/matchday
- set kickoff
- enter result
- save draft
- publish official
- void result
- trigger recalculation

## Status rule

Only official results affect public scoring.

## Empty production data

If final Excel has no results:

- matches display as pending
- public pages do not break
- admin can add results
