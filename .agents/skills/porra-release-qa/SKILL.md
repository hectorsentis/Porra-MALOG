---
name: porra-release-qa
description: Use this skill for final QA before delivery: commands, tests, privacy, scoring, statistics coverage, deployment readiness and acceptance criteria.
---

# PORRA Release QA

## Final command sequence

Run:

```bash
npx prisma generate
npx prisma migrate dev
npm run import:excel
npm run test
npm run build
```

If migrations are not appropriate in current environment, explain and run the safe equivalent.

## Functional QA

Check:

- Excel final import works.
- App does not depend on Excel after import.
- Admin login works.
- Admin can create/edit matches.
- Admin can save draft results.
- Draft results do not affect ranking.
- Admin can publish official results.
- Official results recalculate ranking.
- GeneralRanking updates.
- Snapshots are created.
- Daily Delta_Pos and Delta_Points exist.
- /partidos shows results.
- /clasificacion shows current ranking.
- /evolucion shows real history.
- /estadisticas has all required stats.
- /bote shows configured amounts.
- /admin/bote edits exact amounts.

## Privacy QA

Public pages/API/CSV must not expose:

- Email
- Nombre completo
- PAY
- Pagado
- payment details

## UI QA

No public UI text may contain:

- placeholder
- mock data
- TODO
- coming soon
- data from database
- PostgreSQL technical phrases
- raw table names unless clearly in admin/debug docs

## Documentation

Create/update:

- docs/final-release-check.md
- docs/scoring-validation.md if needed
- docs/statistics-coverage.md
