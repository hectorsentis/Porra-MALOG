---
name: porra-admin-import
description: Use this skill for protected admin routes: login, Excel upload, result entry, rules, logs, rollback and operational controls.
---

# PORRA Admin Skill

## Required routes

- `/admin`
- `/admin/import`
- `/admin/resultados`
- `/admin/reglas`
- `/admin/logs`
- `/admin/rollback`

## Protection

Use env vars:

- ADMIN_USERNAME
- ADMIN_PASSWORD
- ADMIN_SESSION_SECRET

Local default recommendation:

- admin / porra2026-local-change-me

Do not hardcode production secrets.

## Admin capabilities

- Upload Excel.
- Validate.
- Preview.
- Import.
- Enter official match results.
- Recalculate.
- See logs.
- Rollback.
- View/edit rules if implemented in DB.
