CREATE TABLE "tbl_tournament_group_standings" (
    "id" TEXT NOT NULL,
    "grupo" TEXT NOT NULL,
    "teamId" TEXT NOT NULL,
    "pos" INTEGER NOT NULL,
    "pj" INTEGER NOT NULL DEFAULT 0,
    "pg" INTEGER NOT NULL DEFAULT 0,
    "pe" INTEGER NOT NULL DEFAULT 0,
    "pp" INTEGER NOT NULL DEFAULT 0,
    "gf" INTEGER NOT NULL DEFAULT 0,
    "gc" INTEGER NOT NULL DEFAULT 0,
    "dg" INTEGER NOT NULL DEFAULT 0,
    "pts" INTEGER NOT NULL DEFAULT 0,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "groupCode" TEXT,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "tbl_tournament_group_standings_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "tbl_tournament_third_places" (
    "id" TEXT NOT NULL,
    "grupo" TEXT NOT NULL,
    "teamId" TEXT,
    "pts" INTEGER NOT NULL DEFAULT 0,
    "dg" INTEGER NOT NULL DEFAULT 0,
    "gf" INTEGER NOT NULL DEFAULT 0,
    "fairPlayPoints" INTEGER NOT NULL DEFAULT 0,
    "fifaRank" INTEGER,
    "rank3rd" INTEGER,
    "qualified3rd" BOOLEAN NOT NULL DEFAULT false,
    "thirdSlot" TEXT,
    "qualifiedKey" TEXT,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "tbl_tournament_third_places_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "tbl_third_place_combo_mapping" (
    "id" TEXT NOT NULL,
    "option" INTEGER NOT NULL,
    "qualifiedKey" TEXT NOT NULL,
    "opp1A" TEXT,
    "opp1B" TEXT,
    "opp1D" TEXT,
    "opp1E" TEXT,
    "opp1G" TEXT,
    "opp1I" TEXT,
    "opp1K" TEXT,
    "opp1L" TEXT,
    CONSTRAINT "tbl_third_place_combo_mapping_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "tbl_tournament_slots" (
    "id" TEXT NOT NULL,
    "slot" TEXT NOT NULL,
    "slotType" TEXT NOT NULL,
    "grupo" TEXT,
    "pos" INTEGER,
    "matchIdSource" TEXT,
    "teamId" TEXT,
    "sourceDescription" TEXT,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "tbl_tournament_slots_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "tbl_tournament_team_performance" (
    "id" TEXT NOT NULL,
    "teamId" TEXT NOT NULL,
    "grupo" TEXT,
    "groupPos" INTEGER,
    "groupPts" INTEGER NOT NULL DEFAULT 0,
    "groupGf" INTEGER NOT NULL DEFAULT 0,
    "groupGc" INTEGER NOT NULL DEFAULT 0,
    "groupDg" INTEGER NOT NULL DEFAULT 0,
    "qualifiedR32" BOOLEAN NOT NULL DEFAULT false,
    "reachedR32" BOOLEAN NOT NULL DEFAULT false,
    "reachedR16" BOOLEAN NOT NULL DEFAULT false,
    "reachedQf" BOOLEAN NOT NULL DEFAULT false,
    "reachedSf" BOOLEAN NOT NULL DEFAULT false,
    "reachedFinal" BOOLEAN NOT NULL DEFAULT false,
    "champion" BOOLEAN NOT NULL DEFAULT false,
    "runnerUp" BOOLEAN NOT NULL DEFAULT false,
    "thirdPlace" BOOLEAN NOT NULL DEFAULT false,
    "reachedRound" TEXT NOT NULL DEFAULT 'GRUPOS',
    "roundValue" INTEGER NOT NULL DEFAULT 1,
    "tournamentGf" INTEGER NOT NULL DEFAULT 0,
    "tournamentGc" INTEGER NOT NULL DEFAULT 0,
    "tournamentDg" INTEGER NOT NULL DEFAULT 0,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "tbl_tournament_team_performance_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "tbl_tournament_group_standings_grupo_teamId_key" ON "tbl_tournament_group_standings"("grupo", "teamId");
CREATE INDEX "tbl_tournament_group_standings_grupo_pos_idx" ON "tbl_tournament_group_standings"("grupo", "pos");
CREATE UNIQUE INDEX "tbl_tournament_third_places_grupo_key" ON "tbl_tournament_third_places"("grupo");
CREATE INDEX "tbl_tournament_third_places_rank3rd_idx" ON "tbl_tournament_third_places"("rank3rd");
CREATE UNIQUE INDEX "tbl_third_place_combo_mapping_option_key" ON "tbl_third_place_combo_mapping"("option");
CREATE UNIQUE INDEX "tbl_third_place_combo_mapping_qualifiedKey_key" ON "tbl_third_place_combo_mapping"("qualifiedKey");
CREATE UNIQUE INDEX "tbl_tournament_slots_slot_key" ON "tbl_tournament_slots"("slot");
CREATE INDEX "tbl_tournament_slots_slotType_idx" ON "tbl_tournament_slots"("slotType");
CREATE UNIQUE INDEX "tbl_tournament_team_performance_teamId_key" ON "tbl_tournament_team_performance"("teamId");
