---
name: porra-engine-validation
description: Use this skill for Vitest tests, Excel parity checks, scoring engine validation, ranking comparison, simulation tests, and discrepancy reporting.
---

# PORRA Engine Validation Skill

## Goal

Prove that the migrated TypeScript game engine works.

## Required tests

Create tests for:

- exact score
- correct sign
- correct goal difference
- wrong result
- qualified team
- exact KO crossing
- group qualified
- exact group position
- champion bonus
- runner-up bonus
- semifinalists bonus
- top scorer bonus
- team goals bonus
- total goals tolerance
- ranking sorting
- tie-breakers
- Delta_Pos
- simulator without persistence

## Excel parity

If `tbl_clasificacion_general` is imported, compare:

- Pos
- Participant_ID
- Alias
- Points_Matches
- Points_Groups
- Points_Eliminatorias
- Points_Bonus
- Points_Total

Create `docs/engine-validation.md` with:

- checks run
- passed checks
- discrepancies
- likely reason
- whether production engine is safe

## Rule

Do not declare the engine valid until tests and parity checks either pass or discrepancies are explained.
