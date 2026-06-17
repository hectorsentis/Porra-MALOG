# Deployment

Despliegue objetivo: GitHub + Vercel + **Supabase Postgres** (migrado desde prisma.io el 2026-06-17).

## Base de datos activa: Supabase

Proyecto Supabase: `cpewwteymcpndbwbvnns` (región eu-west-1).
Este proyecto aloja **tanto la BBDD principal (Prisma) como el chat** (`tbl_chat_*`).

### URLs de conexión (Supabase → Project Settings → Database)

| Variable | Puerto | Uso |
|---|---|---|
| `DATABASE_URL` | 6543 (Transaction pooler) | Runtime app en Vercel/serverless |
| `DIRECT_URL` | 5432 (Session pooler) | `prisma migrate deploy` |

Formato de `DATABASE_URL`:
```
postgresql://postgres.<ref>:<password>@<region>.pooler.supabase.com:6543/postgres?pgbouncer=true&connection_limit=1
```

Formato de `DIRECT_URL`:
```
postgresql://postgres.<ref>:<password>@<region>.pooler.supabase.com:5432/postgres
```

> **Nota**: La contraseña puede contener `/`. En las URLs de Prisma debe ir URL-encoded como `%2F`.

## Variables de entorno requeridas en Vercel

```
DATABASE_URL          # Transaction pooler Supabase 6543
DIRECT_URL            # Session pooler Supabase 5432
ADMIN_USERNAME
ADMIN_PASSWORD
ADMIN_SESSION_SECRET
JWT_SECRET
NEXT_PUBLIC_APP_NAME
NEXT_PUBLIC_SITE_URL
NEXT_PUBLIC_SUPABASE_URL
NEXT_PUBLIC_SUPABASE_ANON_KEY
SUPABASE_SERVICE_ROLE
SUPABASE_DIRECT_URL   # Session pooler 5432 (usado por el chat)
CRON_SECRET
FOOTBALL_DATA_KEY
```

## Aplicar migraciones

```bash
npx prisma migrate deploy   # usa DIRECT_URL (session pooler 5432)
npx prisma generate
```

**No usar** `migrate dev` en producción.

## Importar datos desde Excel

```bash
npx tsx --tsconfig tsconfig.json scripts/import-excel.ts --dry-run  # preview
npx tsx --tsconfig tsconfig.json scripts/import-excel.ts             # import real
```

O desde el panel admin: `/admin/import` → subir `data/input/Porra_mundial2026.xlsx`.

## Corte de producción (cambiar de prisma.io a Supabase en Vercel)

Orden para minimizar downtime:
1. Aplicar migraciones e importar datos (ya hecho en rama `migracion-supabase`).
2. En Vercel → Settings → Environment Variables, actualizar **en este orden**:
   - `DIRECT_URL` → URL session pooler Supabase 5432
   - `DATABASE_URL` → URL transaction pooler Supabase 6543
3. Hacer redeploy (Vercel → Deployments → Redeploy último build).
4. Verificar en producción: home, clasificación, partidos, admin.

## Rollback a prisma.io

> Solo aplicable si el plan de prisma.io se reactiva.

1. En Vercel, revertir `DATABASE_URL` y `DIRECT_URL` a las URLs de `pooled.db.prisma.io`.
2. Redeploy.
3. Los datos introducidos en Supabase tras el corte se perderían (usar el Excel actualizado para reimportar).

## Migración manual formalizada

El archivo `prisma/manual/2026_clasificacion_part1_deltas.sql` fue aplicado manualmente
a prisma.io. Se formalizó como `prisma/migrations/20260617000000_manual_ranking_columns/migration.sql`
y se marcó como aplicado en Supabase con `prisma migrate resolve --applied`.

## Build

```bash
npm install
npm run build
```
