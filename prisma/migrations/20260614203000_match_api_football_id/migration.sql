ALTER TABLE "tbl_matches" ADD COLUMN IF NOT EXISTS "api_football_id" INTEGER;

UPDATE "tbl_matches" AS match
SET "api_football_id" = sync."apiMatchId"
FROM "tbl_api_football_sync" AS sync
WHERE sync."matchId" = match."Match_ID"
  AND match."api_football_id" IS NULL;

CREATE UNIQUE INDEX IF NOT EXISTS "tbl_matches_api_football_id_key" ON "tbl_matches"("api_football_id");
