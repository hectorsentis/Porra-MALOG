---
name: porra-database-schema-contract
description: Use this skill when editing Prisma schema or database relationships for participants, matches, scoring, ranking, snapshots and historical deltas.
---

# PORRA Database Schema Contract

## Main keys

- Participant_ID is the stable participant business key.
- Match_ID is the stable match business key.
- Use String if Excel may mix numeric/text IDs.
- Do not use Email or Alias as keys.

## Main relationships

Participant 1:N:

- BetMatch
- BetGroupPosition
- BetBonus if multiple rows, otherwise 1:1
- ScoringMatch
- ScoringGroup
- ScoringBonus if multiple rows, otherwise 1:1
- RankingSnapshotRow
- ParticipantScoreSnapshot

Participant 1:1:

- GeneralRanking current row

Match 1:N:

- BetMatch
- ScoringMatch
- MatchResult
- MatchResultEvent
- RecalculationRun
- RankingSnapshot when created from a match result

RankingSnapshot 1:N:

- RankingSnapshotRow

## Required history

Every official recalculation must store a complete historical state:

- RankingSnapshot
- RankingSnapshotRow for every participant
- ParticipantScoreSnapshot or equivalent daily history row
- RecalculationRun
- MatchResultEvent when triggered by result

Rows must include:

- participantId
- date/day
- position
- previousPosition
- deltaPosition
- pointsTotal
- previousPointsTotal
- deltaPoints
- pointsMatches
- pointsGroups
- pointsEliminatorias
- pointsBonus
- phase
- matchday
- matchId/event label when relevant

## Constraints

Recommended:

- Participant.participantId unique or @id
- Match.matchId unique or @id
- GeneralRanking.participantId unique
- RankingSnapshotRow unique(snapshotId, participantId)
- ScoringMatch unique(participantId, matchId), unless Bet.ID is the reliable technical key
- BetMatch unique(participantId, matchId), unless Bet.ID is the reliable technical key

## Public DTOs

Never expose raw Prisma models on public routes.
