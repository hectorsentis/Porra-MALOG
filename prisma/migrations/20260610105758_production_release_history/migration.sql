-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "MatchStatus" ADD VALUE 'DRAFT';
ALTER TYPE "MatchStatus" ADD VALUE 'VOID';

-- AlterTable
ALTER TABLE "RankingSnapshot" ADD COLUMN     "eventLabel" TEXT,
ADD COLUMN     "isLatest" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "matchId" TEXT,
ADD COLUMN     "matchday" TEXT,
ADD COLUMN     "phase" TEXT;

-- AlterTable
ALTER TABLE "RankingSnapshotRow" ADD COLUMN     "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "eventLabel" TEXT,
ADD COLUMN     "matchId" TEXT,
ADD COLUMN     "matchday" TEXT,
ADD COLUMN     "phase" TEXT,
ADD COLUMN     "pointsGainedThisRun" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "previousPos" INTEGER;

-- AlterTable
ALTER TABLE "RecalculationRun" ADD COLUMN     "createdBy" TEXT,
ADD COLUMN     "errors" JSONB NOT NULL DEFAULT '[]',
ADD COLUMN     "matchId" TEXT,
ADD COLUMN     "matchday" TEXT,
ADD COLUMN     "phase" TEXT,
ADD COLUMN     "trigger" TEXT NOT NULL DEFAULT 'manual',
ADD COLUMN     "warnings" JSONB NOT NULL DEFAULT '[]';

-- CreateTable
CREATE TABLE "ParticipantScoreSnapshot" (
    "id" TEXT NOT NULL,
    "snapshotId" TEXT NOT NULL,
    "participantId" TEXT NOT NULL,
    "alias" TEXT NOT NULL,
    "departamento" TEXT,
    "rango" TEXT,
    "pos" INTEGER NOT NULL,
    "previousPos" INTEGER,
    "deltaPos" INTEGER NOT NULL,
    "deltaPoints" INTEGER NOT NULL,
    "pointsMatches" INTEGER NOT NULL,
    "pointsGroups" INTEGER NOT NULL,
    "pointsEliminatorias" INTEGER NOT NULL,
    "pointsBonus" INTEGER NOT NULL,
    "pointsTotal" INTEGER NOT NULL,
    "pointsGainedThisRun" INTEGER NOT NULL DEFAULT 0,
    "eventLabel" TEXT,
    "phase" TEXT,
    "matchday" TEXT,
    "matchId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ParticipantScoreSnapshot_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MatchResultEvent" (
    "id" TEXT NOT NULL,
    "matchId" TEXT,
    "eventType" TEXT NOT NULL,
    "previousStatus" "MatchStatus",
    "nextStatus" "MatchStatus" NOT NULL,
    "previousHomeGoals" INTEGER,
    "previousAwayGoals" INTEGER,
    "nextHomeGoals" INTEGER,
    "nextAwayGoals" INTEGER,
    "qualifiedTeamId" TEXT,
    "phase" TEXT,
    "matchday" TEXT,
    "createdBy" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "MatchResultEvent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BoteConfig" (
    "id" TEXT NOT NULL DEFAULT 'default',
    "amountPerParticipant" DECIMAL(10,2) NOT NULL DEFAULT 5.00,
    "manualAdjustment" DECIMAL(10,2) NOT NULL DEFAULT 0.00,
    "firstPrizePct" INTEGER NOT NULL DEFAULT 60,
    "secondPrizePct" INTEGER NOT NULL DEFAULT 30,
    "thirdPrizePct" INTEGER NOT NULL DEFAULT 10,
    "specialPrizeLabel" TEXT,
    "specialPrizeAmount" DECIMAL(10,2) NOT NULL DEFAULT 0.00,
    "rules" TEXT NOT NULL DEFAULT 'Reparto del bote entre primer, segundo y tercer clasificado.',
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "BoteConfig_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ParticipantScoreSnapshot_participantId_createdAt_idx" ON "ParticipantScoreSnapshot"("participantId", "createdAt");

-- CreateIndex
CREATE INDEX "ParticipantScoreSnapshot_snapshotId_pos_idx" ON "ParticipantScoreSnapshot"("snapshotId", "pos");

-- CreateIndex
CREATE INDEX "MatchResultEvent_matchId_createdAt_idx" ON "MatchResultEvent"("matchId", "createdAt");

-- CreateIndex
CREATE INDEX "RankingSnapshotRow_participantId_createdAt_idx" ON "RankingSnapshotRow"("participantId", "createdAt");

-- AddForeignKey
ALTER TABLE "ParticipantScoreSnapshot" ADD CONSTRAINT "ParticipantScoreSnapshot_snapshotId_fkey" FOREIGN KEY ("snapshotId") REFERENCES "RankingSnapshot"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RecalculationRun" ADD CONSTRAINT "RecalculationRun_matchId_fkey" FOREIGN KEY ("matchId") REFERENCES "tbl_matches"("Match_ID") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MatchResultEvent" ADD CONSTRAINT "MatchResultEvent_matchId_fkey" FOREIGN KEY ("matchId") REFERENCES "tbl_matches"("Match_ID") ON DELETE SET NULL ON UPDATE CASCADE;
