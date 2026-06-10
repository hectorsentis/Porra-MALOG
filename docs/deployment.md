# Deployment

Despliegue objetivo: GitHub + Vercel + PostgreSQL externo.

## Variables requeridas

- `DATABASE_URL`
- `DIRECT_URL`
- `ADMIN_USERNAME`
- `ADMIN_PASSWORD`
- `ADMIN_SESSION_SECRET`
- `NEXT_PUBLIC_APP_NAME`
- `NEXT_PUBLIC_SITE_URL`
- `REVALIDATE_SECRET`

## Base de datos

Usar Neon, Supabase, Prisma Postgres o Vercel Postgres. En produccion aplicar:

```bash
npx prisma migrate deploy
```

No usar `migrate dev` en Vercel.

## Build

```bash
npm install
npm run build
```

## Importacion

El Excel puede importarse desde CLI o admin:

```bash
npm run import:excel:dry-run
npm run import:excel
```

El flujo online de resultados no depende de archivos locales: admin escribe el resultado, Prisma guarda, el motor recalcula y se genera snapshot.
