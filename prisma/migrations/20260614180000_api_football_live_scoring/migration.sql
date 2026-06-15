ALTER TABLE "tbl_matches" ADD COLUMN IF NOT EXISTS "Kickoff_Time" TIMESTAMP(3);

UPDATE "tbl_matches"
SET "Kickoff_Time" = "Fecha"
WHERE "Kickoff_Time" IS NULL
  AND "Fecha" IS NOT NULL;

CREATE TABLE IF NOT EXISTS "tbl_api_football_sync" (
    "id" TEXT NOT NULL,
    "matchId" TEXT NOT NULL,
    "apiMatchId" INTEGER NOT NULL,
    "competition" TEXT NOT NULL DEFAULT 'FIFA World Cup 2026',
    "lastPolledAt" TIMESTAMP(3),
    "pollIntervalSec" INTEGER NOT NULL DEFAULT 300,
    "isPollingActive" BOOLEAN NOT NULL DEFAULT false,
    "lastStatus" TEXT,
    "lastHomeGoals" INTEGER,
    "lastAwayGoals" INTEGER,
    "errorCount" INTEGER NOT NULL DEFAULT 0,
    "lastError" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "tbl_api_football_sync_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "tbl_api_football_sync_matchId_key" ON "tbl_api_football_sync"("matchId");
CREATE INDEX IF NOT EXISTS "tbl_api_football_sync_isPollingActive_idx" ON "tbl_api_football_sync"("isPollingActive");

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE constraint_name = 'tbl_api_football_sync_matchId_fkey'
      AND table_name = 'tbl_api_football_sync'
  ) THEN
    ALTER TABLE "tbl_api_football_sync"
      ADD CONSTRAINT "tbl_api_football_sync_matchId_fkey"
      FOREIGN KEY ("matchId") REFERENCES "tbl_matches"("Match_ID")
      ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
END $$;

CREATE TABLE IF NOT EXISTS "tbl_api_call_log" (
    "id" TEXT NOT NULL,
    "dayKey" TEXT NOT NULL,
    "matchId" TEXT,
    "endpoint" TEXT NOT NULL,
    "statusCode" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "tbl_api_call_log_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "tbl_api_call_log_dayKey_idx" ON "tbl_api_call_log"("dayKey");
CREATE INDEX IF NOT EXISTS "tbl_api_call_log_createdAt_idx" ON "tbl_api_call_log"("createdAt");
