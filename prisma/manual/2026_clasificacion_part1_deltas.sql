-- AlterTable
ALTER TABLE "RankingSnapshot" ADD COLUMN     "dayKey" TEXT,
ADD COLUMN     "phaseGroup" TEXT,
ADD COLUMN     "trigger" TEXT;

-- AlterTable
ALTER TABLE "tbl_clasificacion_general" ADD COLUMN     "Delta_Pos_Day" INTEGER,
ADD COLUMN     "Delta_Pos_Phase" INTEGER;
