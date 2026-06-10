---
name: porra-vercel-deploy
description: Use this skill for Vercel deployment, GitHub integration, env vars, Prisma production migration, build scripts, Postgres providers and deployment documentation.
---

# PORRA Vercel Deploy Skill

## Target

Deploy to Vercel through GitHub.

## Database

Use external PostgreSQL:

- Neon
- Supabase
- Vercel Postgres if available

## Required env vars

- DATABASE_URL
- DIRECT_URL
- ADMIN_USERNAME
- ADMIN_PASSWORD
- ADMIN_SESSION_SECRET
- NEXT_PUBLIC_APP_NAME
- NEXT_PUBLIC_SITE_URL
- REVALIDATE_SECRET

## package.json scripts

Expected:

- dev
- build
- start
- lint
- test
- prisma:generate
- prisma:migrate
- prisma:deploy
- import:excel
- import:excel:dry-run

## Production

Use `prisma migrate deploy`, not `prisma migrate dev`.

Do not rely on local files for online result updates.
