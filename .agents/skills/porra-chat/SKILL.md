---
name: porra-chat
description: >
  Use this skill whenever implementing, editing, or reviewing the "Chat" feature
  for the PORRA MUNDIAL 2026 MALOG app. Triggers: any work on /chat, chat auth
  (register/login), chat messages, the tbl_chat_* tables, Supabase Realtime for
  the chat, or any code that reads tbl_participantes from the production Prisma
  Postgres database. This skill encodes hard safety rules to protect the
  production database. Read it before writing any chat-related code or SQL.
---
 
# Porra Chat — Implementation Skill
 
## What this feature is
A text-only chat tab for the porra app. Anyone can browse the rest of the app
freely. In `/chat`, a user registers or logs in using an email that **must
already exist** in `tbl_participantes`. They set their own password; their alias
is pulled from `tbl_participantes`. All chat data lives in a **separate Supabase
project**, not in production.
 
## Two databases — never confuse them
1. **Prisma Postgres (PRODUCTION)** — holds `tbl_participantes` (email, alias)
   and the rest of the live porra data. Near 50% of its monthly operations quota.
2. **Supabase (CHAT, separate project)** — holds the new `tbl_chat_usuarios` and
   `tbl_chat_mensajes` tables. All chat reads/writes happen here.
## Inviolable rules (check every single change against these)
1. **Production is read-only, and only `tbl_participantes`.** Never emit
   INSERT/UPDATE/DELETE/ALTER/DROP/TRUNCATE against Prisma. Only SELECT, and only
   on `tbl_participantes`.
2. **Touch Prisma exactly once: during registration.** The email→alias lookup is
   a single SELECT per signup. Never query Prisma on login or when sending/reading
   messages.
3. **No polling against Prisma, ever.** Chat message updates use Supabase Realtime
   (websocket subscription), not interval polling — this also protects the Prisma
   operations quota.
4. **Use a dedicated read-only connection for Prisma.** Do not reuse the app's
   main Prisma client inside the chat module. Use a separate client built from
   `CHAT_PRISMA_READONLY_URL`, whose DB role has only `SELECT` on
   `tbl_participantes`. The read-only guarantee must hold at the database-role
   level, not just in code.
5. **Passwords are always hashed** (argon2id or bcrypt cost ≥ 12). Never stored or
   logged in plaintext.
6. **Text only.** Max 1000 chars per message, validated server-side. No images,
   files, or attachments.
## Why these rules exist (don't relax them under pressure)
- In Prisma Postgres every DB interaction counts as one operation, and quotas are
  shared across all databases in the account — so a second Prisma DB would NOT
  isolate cost. That's why the chat lives in Supabase instead.
- A direct TCP connection can do anything; the only real safeguard against
  corrupting production is a DB role limited to SELECT.
## Implementation order
1. Confirm exact column names for email/alias in `tbl_participantes`.
2. Confirm a *new* Supabase project exists (not production) with its keys.
3. Create the `chat_readonly` Postgres role (SELECT only on `tbl_participantes`)
   → `CHAT_PRISMA_READONLY_URL`. If the Prisma plan disallows custom SQL roles,
   fall back to an internal verify-participant endpoint in the existing app,
   protected by a shared secret — ask the user before choosing this path.
4. Create `tbl_chat_usuarios` and `tbl_chat_mensajes` in Supabase, enable RLS.
5. Build register (the only Prisma touch), login, message read (Realtime) + write.
6. Add `/chat` route and the "Chat" nav link, matching existing tab styling.
## Env vars
`SUPABASE_URL`, `SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE` (server only),
`CHAT_PRISMA_READONLY_URL`, `JWT_SECRET`. Never commit any of these.
 
## Pre-merge checklist
- [ ] Zero write statements against Prisma.
- [ ] `chat_readonly` role has SELECT on `tbl_participantes` only — verified.
- [ ] Prisma is queried only in `/api/chat/register`.
- [ ] Messages use Supabase Realtime, not polling.
- [ ] Passwords hashed; no secrets in logs or repo.
- [ ] Message length validated server-side; text-only enforced.
 