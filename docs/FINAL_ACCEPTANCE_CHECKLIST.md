# Final acceptance checklist — PORRA MUNDIAL 2026 MALOG

## Data

- [ ] Excel final imports participants.
- [ ] Excel final imports bets.
- [ ] Excel final can have empty results.
- [ ] App works after import without Excel.
- [ ] No Power BI dependency.

## Database

- [ ] Participant_ID is stable business key.
- [ ] Match_ID is stable business key.
- [ ] Participant 1:N dependencies are correct.
- [ ] Match 1:N dependencies are correct.
- [ ] Ranking snapshots exist.
- [ ] Daily history exists.
- [ ] Delta_Pos daily exists.
- [ ] Delta_Points daily exists.

## Admin

- [ ] /admin protected.
- [ ] /admin/partidos works.
- [ ] /admin/resultados works.
- [ ] Draft result does not score.
- [ ] Official result scores.
- [ ] /admin/bote edits exact values.

## Public pages

- [ ] / works.
- [ ] /clasificacion works.
- [ ] /partidos works.
- [ ] /evolucion uses history.
- [ ] /estadisticas complete.
- [ ] /apuestas complete.
- [ ] /departamentos complete.
- [ ] /participantes works.
- [ ] /bote works.

## Statistics

- [ ] Excel statistics coverage documented.
- [ ] Existing good stats preserved.
- [ ] Filters are dropdowns.
- [ ] Active chips exist.

## QA commands

- [ ] npx prisma generate
- [ ] npx prisma migrate dev
- [ ] npm run import:excel
- [ ] npm run test
- [ ] npm run build

## Privacy

- [ ] No public Email.
- [ ] No public Nombre completo.
- [ ] No public PAY.
- [ ] No public Pagado.
- [ ] No payment details.
