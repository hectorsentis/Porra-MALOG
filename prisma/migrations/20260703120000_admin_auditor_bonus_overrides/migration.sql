-- Adds the manual-override columns used by the admin "Bonus final" panel
-- (lib/admin/bonusOverrides.ts). These were referenced by app code before the
-- table was migrated, so every read/write against them silently failed.
ALTER TABLE "tbl_tournament_bonus_results"
  ADD COLUMN IF NOT EXISTS "campeon" TEXT,
  ADD COLUMN IF NOT EXISTS "subcampeon" TEXT,
  ADD COLUMN IF NOT EXISTS "semifinalistas" TEXT,
  ADD COLUMN IF NOT EXISTS "seleccionMasGoleadora" TEXT,
  ADD COLUMN IF NOT EXISTS "seleccionMasGoleada" TEXT,
  ADD COLUMN IF NOT EXISTS "seleccionMenosGoleadora" TEXT,
  ADD COLUMN IF NOT EXISTS "seleccionMenosGoleada" TEXT,
  ADD COLUMN IF NOT EXISTS "equipoRevelacion" TEXT,
  ADD COLUMN IF NOT EXISTS "equipoDecepcion" TEXT,
  ADD COLUMN IF NOT EXISTS "totalGolesTorneo" INTEGER,
  ADD COLUMN IF NOT EXISTS "bonusLockedOverride" BOOLEAN;
