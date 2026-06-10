---
name: porra-online-results
description: Use this skill for publishing updated scores online, admin result entry, recalculation, snapshots, dashboard refresh, cache/revalidation, and production data flow.
---

# PORRA Online Results Skill

## Required flow

Admin updates result → database stores result → engine recalculates → ranking snapshot generated → dashboard shows fresh data.

## Required admin result features

- Select match.
- Enter home goals.
- Enter away goals.
- Set qualified team if needed.
- Mark official.
- Save.
- Trigger recalculation.
- Show affected participants.

## Public metadata

Show:

- Last update time.
- Last computed matchday/phase.
- Matches computed.
- Official/pending/simulated status.

## Failure behavior

If recalculation fails:

- Do not publish partial ranking.
- Keep previous successful ranking.
- Log error.
- Allow rollback.
