---
name: porra-data-privacy
description: Use this skill whenever exposing public data through pages, APIs, DTOs, CSV exports, logs, tooltips, admin previews or screenshots.
---

# PORRA Data Privacy Skill

## Public web is public internet

Never expose:

- Email
- Nombre
- PAY
- Pagado
- payment status
- payment method
- IBAN
- phone
- internal admin statuses

## Public DTOs only

Do not return raw Prisma models from public API routes.

Allowed public fields:

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
- aggregated public statistics

## CSV exports

Public CSVs must contain public fields only.
