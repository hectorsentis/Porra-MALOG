CREATE TABLE "tbl_tournament_bonus_results" (
    "id" TEXT NOT NULL DEFAULT 'default',
    "maximoGoleador" TEXT,
    "updatedBy" TEXT,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "tbl_tournament_bonus_results_pkey" PRIMARY KEY ("id")
);
