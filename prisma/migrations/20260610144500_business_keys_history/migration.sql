-- AlterTable
ALTER TABLE "RankingSnapshot" ADD COLUMN     "recalculationRunId" TEXT;

-- CreateTable
CREATE TABLE "MatchResult" (
    "id" TEXT NOT NULL,
    "Match_ID" TEXT NOT NULL,
    "status" "MatchStatus" NOT NULL DEFAULT 'PENDING',
    "homeGoals" INTEGER,
    "awayGoals" INTEGER,
    "homePens" INTEGER,
    "awayPens" INTEGER,
    "qualifiedTeamId" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT false,
    "isOfficial" BOOLEAN NOT NULL DEFAULT false,
    "source" TEXT NOT NULL DEFAULT 'admin',
    "createdBy" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "MatchResult_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "MatchResult_Match_ID_status_isActive_idx" ON "MatchResult"("Match_ID", "status", "isActive");

-- CreateIndex
CREATE INDEX "MatchResult_Match_ID_createdAt_idx" ON "MatchResult"("Match_ID", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "MatchResult_one_active_official_per_match_idx"
ON "MatchResult"("Match_ID")
WHERE "status" = 'OFFICIAL' AND "isActive" = true;

-- AddCheck
ALTER TABLE "MatchResult"
ADD CONSTRAINT "MatchResult_official_status_consistency_chk"
CHECK (
  ("status" = 'OFFICIAL' AND "isOfficial" = true)
  OR ("status" <> 'OFFICIAL' AND "isOfficial" = false)
);

-- CreateIndex
CREATE UNIQUE INDEX "ParticipantScoreSnapshot_snapshotId_participantId_key" ON "ParticipantScoreSnapshot"("snapshotId", "participantId");

-- CreateIndex
CREATE INDEX "RankingSnapshot_matchId_createdAt_idx" ON "RankingSnapshot"("matchId", "createdAt");

-- CreateIndex
CREATE INDEX "RankingSnapshot_recalculationRunId_idx" ON "RankingSnapshot"("recalculationRunId");

-- CreateIndex
CREATE UNIQUE INDEX "RankingSnapshotRow_snapshotId_participantId_key" ON "RankingSnapshotRow"("snapshotId", "participantId");

-- CreateIndex
CREATE UNIQUE INDEX "tbl_bets_matches_Participant_ID_Match_ID_key" ON "tbl_bets_matches"("Participant_ID", "Match_ID");

-- CreateIndex
CREATE UNIQUE INDEX "tbl_scoring_matches_Participant_ID_Match_ID_key" ON "tbl_scoring_matches"("Participant_ID", "Match_ID");

-- AddForeignKey
ALTER TABLE "tbl_scoring_groups" ADD CONSTRAINT "tbl_scoring_groups_Participant_ID_fkey" FOREIGN KEY ("Participant_ID") REFERENCES "tbl_participantes"("Participant_ID") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tbl_scoring_bonus" ADD CONSTRAINT "tbl_scoring_bonus_Participant_ID_fkey" FOREIGN KEY ("Participant_ID") REFERENCES "tbl_participantes"("Participant_ID") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RankingSnapshot" ADD CONSTRAINT "RankingSnapshot_matchId_fkey" FOREIGN KEY ("matchId") REFERENCES "tbl_matches"("Match_ID") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RankingSnapshot" ADD CONSTRAINT "RankingSnapshot_recalculationRunId_fkey" FOREIGN KEY ("recalculationRunId") REFERENCES "RecalculationRun"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RankingSnapshotRow" ADD CONSTRAINT "RankingSnapshotRow_participantId_fkey" FOREIGN KEY ("participantId") REFERENCES "tbl_participantes"("Participant_ID") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ParticipantScoreSnapshot" ADD CONSTRAINT "ParticipantScoreSnapshot_participantId_fkey" FOREIGN KEY ("participantId") REFERENCES "tbl_participantes"("Participant_ID") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MatchResult" ADD CONSTRAINT "MatchResult_Match_ID_fkey" FOREIGN KEY ("Match_ID") REFERENCES "tbl_matches"("Match_ID") ON DELETE CASCADE ON UPDATE CASCADE;
