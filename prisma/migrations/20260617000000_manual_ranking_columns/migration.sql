-- Columns added manually to production on 2026-06-10 and formalized here.
ALTER TABLE "RankingSnapshot" ADD COLUMN IF NOT EXISTS "dayKey" TEXT;
ALTER TABLE "RankingSnapshot" ADD COLUMN IF NOT EXISTS "phaseGroup" TEXT;
ALTER TABLE "RankingSnapshot" ADD COLUMN IF NOT EXISTS "trigger" TEXT;

ALTER TABLE "tbl_clasificacion_general" ADD COLUMN IF NOT EXISTS "Delta_Pos_Day" INTEGER;
ALTER TABLE "tbl_clasificacion_general" ADD COLUMN IF NOT EXISTS "Delta_Pos_Phase" INTEGER;
