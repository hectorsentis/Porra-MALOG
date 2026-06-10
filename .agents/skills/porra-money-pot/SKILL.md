---
name: porra-money-pot
description: Use this skill when implementing the PORRA MALOG money pot page, public prize display, admin prize editing, pot configuration, paid participants logic or payout breakdown.
---

# PORRA Money Pot Skill

## Goal

The app must show the public money pot and prize distribution.

The admin must be able to edit exact prize amounts.

## Public page

Route:

```text
/bote
```

Must show exactly:

- total
- 1er premio
- 2º premio
- 3er premio
- premio consolación
- rules/notes if available
- last update

Public page must not show individual payment status unless explicitly requested.

## Admin page

Route:

```text
/admin/bote
```

Must allow editing exact numeric values:

- total
- 1er premio
- 2º premio
- 3er premio
- premio consolación

Do not automatically calculate prizes if the admin enters manual values.

It may show a warning if the sum of prizes differs from total, but do not block save.

## Database model

Create or complete model PotConfig.

Suggested fields:

- id
- totalAmount
- firstPrize
- secondPrize
- thirdPrize
- consolationPrize
- currency
- notes
- updatedAt
- updatedBy

## Validation

Rules:

- values must be numbers
- values cannot be negative
- public values should be formatted as currency
- warn admin if prize sum is greater than total pot
- show remaining amount where useful

## UI

Public /bote:

- card for total pot
- cards for each prize
- simple prize distribution chart
- clean MALOG/Air Force visual style

Admin /admin/bote:

- protected form
- save button
- validation summary
- last saved state
- no hardcoded prize amounts

## Success criteria

- Admin can edit exact amounts.
- Public page updates from database.
- Values survive redeploy.
- No payment status per person is exposed publicly.
