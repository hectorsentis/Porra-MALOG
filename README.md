# PORRA MUNDIAL 2026 MALOG

Web publica para sustituir el dashboard Power BI de la porra, con Next.js App Router, Prisma/PostgreSQL, importacion Excel, admin privado, motor TypeScript y preparacion Vercel.

## Stack

- Next.js App Router + React + TypeScript estricto.
- Tailwind CSS con componentes estilo shadcn/ui.
- Prisma ORM + PostgreSQL.
- `xlsx` para leer el Excel oficial.
- Zod para validacion.
- Recharts y TanStack Table.
- Vitest para el motor de juego.

## Local

1. Copia `.env.example` a `.env`.
2. Configura `DATABASE_URL`. Si no tienes `DIRECT_URL`, el runner local `scripts/prisma-env-runner.cjs` usa `DATABASE_URL` como conexion directa de proceso.
3. Configura `ADMIN_USERNAME`, `ADMIN_PASSWORD` y `ADMIN_SESSION_SECRET`.
4. Ejecuta:

```bash
npm install
npx prisma generate
npx prisma migrate dev
npm run import:excel:dry-run
npm run import:excel
npm run dev
```

Admin local sugerido: `admin` / `porra2026-local-change-me`. Cambiar siempre en produccion.

## Scripts

- `npm run dev`
- `npm run build`
- `npm run start`
- `npm run lint`
- `npm run test`
- `npm run prisma:generate`
- `npm run prisma:migrate`
- `npm run prisma:deploy`
- `npm run import:excel:dry-run`
- `npm run import:excel`

## Vercel

Variables requeridas:

- `DATABASE_URL`
- `DIRECT_URL`
- `ADMIN_USERNAME`
- `ADMIN_PASSWORD`
- `ADMIN_SESSION_SECRET`
- `NEXT_PUBLIC_APP_NAME`
- `NEXT_PUBLIC_SITE_URL`
- `REVALIDATE_SECRET`

En produccion usar:

```bash
npx prisma migrate deploy
```

No se debe depender del Excel local para resultados online: el admin escribe resultados en PostgreSQL, recalcula y publica snapshots.

## Estado verificado

- `npx prisma generate`: OK.
- `npx prisma migrate deploy`: OK, sin migraciones pendientes.
- `npx prisma migrate dev`: OK, schema sincronizado y cliente generado.
- `npx prisma migrate status`: OK, schema actualizado.
- `npm run import:excel:dry-run`: OK, salida sanitizada.
- `npm run import:excel`: OK.
- `npm run test`: OK.
- `npm run lint`: OK.
- `npm run build`: OK.

Conteos importados:

- Participantes: 47.
- Equipos: 48.
- Partidos: 104.
- Apuestas partidos: 4056.
- Apuestas grupos: 1872.
- Apuestas bonus: 47.
- Clasificacion: 47.

Nota: `NODE_ENV` no debe definirse en `.env`; Next lo gestiona automaticamente. En este workspace no existe `data/input/Porra_mundial2026.xlsx`; el script usa `Porra_mundial2026_test.xlsx` y emite aviso. Para produccion, colocar el Excel oficial con el nombre esperado.
