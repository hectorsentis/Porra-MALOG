---
name: porra-results-history
description: Use this skill when implementing match setup, admin result entry, official result updates, recalculation, ranking snapshots, score history, evolution charts and production result workflows.
---

# PORRA Results and History Skill

Use this skill for online scoring and historical data.

## Goal

The admin must be able to enter match results from the website and the public dashboard must update after recalculation.

## Match management

Admin page:

- /admin/partidos

Features:

- create match
- edit home team
- edit away team
- edit phase
- edit group
- edit matchday
- edit kickoff time
- set Spain match flag if needed
- mark match active/inactive

## Result management

Admin page:

- /admin/resultados

Features:

- select match
- enter home goals
- enter away goals
- select qualified team when needed
- save as draft
- publish as official
- trigger recalculation
- show affected scoring rows
- show ranking changes
- create snapshot

## Production blank results

The app must support official results being empty.

States:

- pending
- draft
- official
- void

Only official results affect public scoring.

## Recalculation run

Create RecalculationRun records.

Fields:

- id
- trigger
- matchId
- phase
- matchday
- status
- warnings
- errors
- startedAt
- finishedAt
- createdBy

## Snapshots

After a successful recalculation:

1. Create RankingSnapshot.
2. Create RankingSnapshotRow for every participant.
3. Create ParticipantScoreSnapshot for every participant.
4. Mark snapshot as latest.
5. Keep previous snapshot for rollback and evolution.

## Evolution charts

Use snapshots for:

- position evolution
- points evolution
- points gained by event
- movement charts
- consistency
- volatility
- participant profiles

Never fake evolution from current ranking only.

## Rollback

Minimum viable rollback:

- mark latest snapshot inactive
- restore previous snapshot as public latest
- keep log entry

Better rollback:

- revert match result official status too

## Tests

Required tests:

- result update creates recalculation run
- official result changes ranking
- draft result does not affect ranking
- empty result remains pending
- snapshot contains all participants
- rollback restores previous snapshot
- evolution query returns chronological data