DO $$
BEGIN
  IF to_regclass('public."tbl_puntuacion_config"') IS NULL THEN
    IF to_regclass('public."GameRule"') IS NOT NULL THEN
      ALTER TABLE "GameRule" RENAME TO "tbl_puntuacion_config";
    ELSE
      CREATE TABLE "tbl_puntuacion_config" (
        "id" TEXT NOT NULL,
        "Concepto" TEXT NOT NULL,
        "Puntos" INTEGER NOT NULL,
        "Activo" BOOLEAN NOT NULL DEFAULT true,
        "Comentario" TEXT,
        "category" TEXT,
        "label" TEXT,
        "sortOrder" INTEGER NOT NULL DEFAULT 0,
        "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT "tbl_puntuacion_config_pkey" PRIMARY KEY ("id")
      );
    END IF;
  END IF;
END $$;

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'tbl_puntuacion_config' AND column_name = 'key') THEN
    ALTER TABLE "tbl_puntuacion_config" RENAME COLUMN "key" TO "Concepto";
  END IF;
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'tbl_puntuacion_config' AND column_name = 'value') THEN
    ALTER TABLE "tbl_puntuacion_config" RENAME COLUMN "value" TO "Puntos";
  END IF;
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'tbl_puntuacion_config' AND column_name = 'active') THEN
    ALTER TABLE "tbl_puntuacion_config" RENAME COLUMN "active" TO "Activo";
  END IF;
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'tbl_puntuacion_config' AND column_name = 'description') THEN
    ALTER TABLE "tbl_puntuacion_config" RENAME COLUMN "description" TO "Comentario";
  END IF;
END $$;

ALTER TABLE "tbl_puntuacion_config" ADD COLUMN IF NOT EXISTS "category" TEXT;
ALTER TABLE "tbl_puntuacion_config" ADD COLUMN IF NOT EXISTS "label" TEXT;
ALTER TABLE "tbl_puntuacion_config" ADD COLUMN IF NOT EXISTS "sortOrder" INTEGER NOT NULL DEFAULT 0;
ALTER TABLE "tbl_puntuacion_config" ADD COLUMN IF NOT EXISTS "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;
ALTER TABLE "tbl_puntuacion_config" ALTER COLUMN "Activo" SET DEFAULT true;

CREATE UNIQUE INDEX IF NOT EXISTS "tbl_puntuacion_config_Concepto_key" ON "tbl_puntuacion_config"("Concepto");