---
name: porra-final-production-contract
description: Use this skill for the final production pass of PORRA MUNDIAL 2026 MALOG: finish all pending work, validate autonomy, scoring, stats, history, match viewer, admin and deploy readiness.
---

# PORRA Final Production Contract

The final release must be an autonomous production app, not a demo.

## Final expected product

After importing the final Excel with all bets, the app must work independently from Excel and Power BI.

The app must support:

- public dashboard
- public ranking
- public match viewer
- public evolution
- public statistics
- public participants
- public departments
- public bets analytics
- public money pot
- admin import
- admin match management
- admin result entry
- admin pot editing
- admin logs/rollback
- automatic scoring
- historical score snapshots
- daily position deltas
- production deployment to Vercel

## Hard no

Do not leave:

- mock data
- placeholders
- TODOs
- coming soon sections
- data from database labels
- raw table names in public UI
- Power BI dependency
- Excel formula dependency for production scoring
- public exposure of Email, Nombre, PAY, Pagado or payment details

## Required final checks

Run and fix:

```bash
npx prisma generate
npx prisma migrate dev
npm run import:excel
npm run test
npm run build
```

If a command is impossible in the current environment, document the exact reason and the equivalent command to run locally/Vercel.

## Deliverables

- working code
- updated schema
- updated importers
- complete admin
- complete public pages
- tests
- docs/final-release-check.md
- docs/scoring-validation.md if discrepancies exist
- docs/statistics-coverage.md
