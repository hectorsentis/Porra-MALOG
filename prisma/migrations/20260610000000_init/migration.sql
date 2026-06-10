-- CreateEnum
CREATE TYPE "ImportRunStatus" AS ENUM ('PENDING', 'DRY_RUN', 'SUCCESS', 'FAILED', 'ROLLED_BACK');

-- CreateEnum
CREATE TYPE "MatchStatus" AS ENUM ('PENDING', 'OFFICIAL', 'SIMULATED');

-- CreateTable
CREATE TABLE "tbl_participantes" (
    "Participant_ID" TEXT NOT NULL,
    "Timestamp" TIMESTAMP(3),
    "Email" TEXT,
    "Nombre" TEXT,
    "Alias" TEXT NOT NULL,
    "Departamento" TEXT,
    "Rango" TEXT,
    "Estado" TEXT,
    "Pagado" TEXT,
    "Source" TEXT,
    "PAY" TEXT,
    "ENVIADO PLANTILLA" TEXT,
    "Resultado recibido" TEXT,
    "slug" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "tbl_participantes_pkey" PRIMARY KEY ("Participant_ID")
);

-- CreateTable
CREATE TABLE "tbl_teams" (
    "Team_ID" TEXT NOT NULL,
    "Pais" TEXT,
    "Seleccion" TEXT NOT NULL,
    "Grupo" TEXT,
    "Orden_Grupo" INTEGER,
    "Confederacion" TEXT,
    "TieBreaker_Rank" INTEGER,
    "FIFA_Rank" INTEGER,
    "Comentarios" TEXT,
    "Flag" TEXT,

    CONSTRAINT "tbl_teams_pkey" PRIMARY KEY ("Team_ID")
);

-- CreateTable
CREATE TABLE "tbl_matches" (
    "Match_ID" TEXT NOT NULL,
    "Match_No" INTEGER,
    "Fecha" TIMESTAMP(3),
    "Hora" TEXT,
    "Jornada_ID" TEXT,
    "Fase" TEXT,
    "Grupo" TEXT,
    "Home_Slot" TEXT,
    "Away_Slot" TEXT,
    "Home_Team_ID_Manual" TEXT,
    "Away_Team_ID_Manual" TEXT,
    "Home_Team_ID" TEXT,
    "Away_Team_ID" TEXT,
    "Home_Team" TEXT,
    "Away_Team" TEXT,
    "Home_Goals" INTEGER,
    "Away_Goals" INTEGER,
    "Home_Pens" INTEGER,
    "Away_Pens" INTEGER,
    "Finished" BOOLEAN NOT NULL DEFAULT false,
    "Result_Text" TEXT,
    "Signo_Real" TEXT,
    "Goal_Diff" INTEGER,
    "Winner_Team_ID" TEXT,
    "Qualified_Team_ID" TEXT,
    "Override_Qualified_Team_ID" TEXT,
    "Needs_Pens" BOOLEAN NOT NULL DEFAULT false,
    "Status_Check" TEXT,
    "Deadline_Apuestas" TIMESTAMP(3),
    "Notas" TEXT,
    "status" "MatchStatus" NOT NULL DEFAULT 'PENDING',
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "tbl_matches_pkey" PRIMARY KEY ("Match_ID")
);

-- CreateTable
CREATE TABLE "tbl_bets_matches" (
    "id" TEXT NOT NULL,
    "Source.Name" TEXT,
    "Email" TEXT,
    "Match_ID" TEXT NOT NULL,
    "Pred_Home_Team_ID" TEXT,
    "Pred_Away_Team_ID" TEXT,
    "Pred_Home_Goals" INTEGER,
    "Pred_Away_Goals" INTEGER,
    "Pred_Qualified_Team_ID" TEXT,
    "Bet.ID" TEXT,
    "Participant_ID" TEXT NOT NULL,
    "FASE" TEXT,
    "Pred_Sign" TEXT,
    "Pred_Goal_Diff" INTEGER,

    CONSTRAINT "tbl_bets_matches_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tbl_bets_group_positions" (
    "id" TEXT NOT NULL,
    "Source.Name" TEXT,
    "Email" TEXT,
    "Grupo" TEXT NOT NULL,
    "Pred_Pos" INTEGER NOT NULL,
    "Pred_Team_ID" TEXT,
    "Group_Bet_ID" TEXT,
    "Participant_ID" TEXT NOT NULL,
    "Valid" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "tbl_bets_group_positions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tbl_bets_bonus" (
    "id" TEXT NOT NULL,
    "Participant_ID" TEXT NOT NULL,
    "Alias" TEXT,
    "Email" TEXT,
    "Timestamp" TIMESTAMP(3),
    "Campeon" TEXT,
    "Subcampeon" TEXT,
    "Semifinalista_1" TEXT,
    "Semifinalista_2" TEXT,
    "Semifinalista_3" TEXT,
    "Semifinalista_4" TEXT,
    "Maximo_Goleador" TEXT,
    "Seleccion_Mas_Goleadora" TEXT,
    "Seleccion_Mas_Goleada" TEXT,
    "Seleccion_Menos_Goleadora" TEXT,
    "Seleccion_Menos_Goleada" TEXT,
    "Equipo_Revelacion" TEXT,
    "Equipo_Decepcion" TEXT,
    "Total_Goles_Torneo" INTEGER,
    "Valid" BOOLEAN NOT NULL DEFAULT true,
    "Source" TEXT,

    CONSTRAINT "tbl_bets_bonus_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tbl_scoring_matches" (
    "id" TEXT NOT NULL,
    "Bet.ID" TEXT,
    "Participant_ID" TEXT NOT NULL,
    "Match_ID" TEXT NOT NULL,
    "FASE" TEXT,
    "Exact_OK" BOOLEAN NOT NULL DEFAULT false,
    "Diff_OK" BOOLEAN NOT NULL DEFAULT false,
    "Sign_OK" BOOLEAN NOT NULL DEFAULT false,
    "Qualified_OK" BOOLEAN NOT NULL DEFAULT false,
    "Cruce_Exacto_OK" BOOLEAN NOT NULL DEFAULT false,
    "Spain_Match" BOOLEAN NOT NULL DEFAULT false,
    "Multiplier" INTEGER NOT NULL DEFAULT 1,
    "Points_Result" INTEGER NOT NULL DEFAULT 0,
    "Points_Qualified" INTEGER NOT NULL DEFAULT 0,
    "Points_Cruce_Exacto" INTEGER NOT NULL DEFAULT 0,
    "Points_Total" INTEGER NOT NULL DEFAULT 0,
    "Date" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "tbl_scoring_matches_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tbl_scoring_groups" (
    "id" TEXT NOT NULL,
    "Group_Bet_ID" TEXT,
    "Email" TEXT,
    "Participant_ID" TEXT NOT NULL,
    "Valid" BOOLEAN NOT NULL DEFAULT true,
    "Grupo" TEXT NOT NULL,
    "Pred_Pos" INTEGER NOT NULL,
    "Pred_Team_ID" TEXT,
    "Real_Pos" INTEGER,
    "Real_Status" TEXT,
    "Qualified_OK" BOOLEAN NOT NULL DEFAULT false,
    "Exact_Position_OK" BOOLEAN NOT NULL DEFAULT false,
    "Points_Qualified" INTEGER NOT NULL DEFAULT 0,
    "Points_Position" INTEGER NOT NULL DEFAULT 0,
    "Points_Total" INTEGER NOT NULL DEFAULT 0,
    "Date" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "tbl_scoring_groups_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tbl_scoring_bonus" (
    "id" TEXT NOT NULL,
    "Participant_ID" TEXT NOT NULL,
    "Alias" TEXT,
    "Email" TEXT,
    "Timestamp" TIMESTAMP(3),
    "Campeon_OK" BOOLEAN NOT NULL DEFAULT false,
    "Subcampeon_OK" BOOLEAN NOT NULL DEFAULT false,
    "Semifinalistas_OK" INTEGER NOT NULL DEFAULT 0,
    "Maximo_Goleador_OK" BOOLEAN NOT NULL DEFAULT false,
    "Seleccion_Mas_Goleadora_OK" BOOLEAN NOT NULL DEFAULT false,
    "Seleccion_Mas_Goleada_OK" BOOLEAN NOT NULL DEFAULT false,
    "Seleccion_Menos_Goleadora_OK" BOOLEAN NOT NULL DEFAULT false,
    "Seleccion_Menos_Goleada_OK" BOOLEAN NOT NULL DEFAULT false,
    "Equipo_Revelacion_OK" BOOLEAN NOT NULL DEFAULT false,
    "Equipo_Decepcion_OK" BOOLEAN NOT NULL DEFAULT false,
    "Total_Goles_Torneo_OK" BOOLEAN NOT NULL DEFAULT false,
    "Points_Total" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "tbl_scoring_bonus_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tbl_clasificacion_general" (
    "id" TEXT NOT NULL,
    "Pos" INTEGER NOT NULL,
    "Participant_ID" TEXT NOT NULL,
    "Alias" TEXT NOT NULL,
    "Departamento" TEXT,
    "Rango" TEXT,
    "Points_Matches" INTEGER NOT NULL DEFAULT 0,
    "Points_Groups" INTEGER NOT NULL DEFAULT 0,
    "Points_Eliminatorias" INTEGER NOT NULL DEFAULT 0,
    "Points_Bonus" INTEGER NOT NULL DEFAULT 0,
    "Points_Total" INTEGER NOT NULL DEFAULT 0,
    "Exact_Scores" INTEGER NOT NULL DEFAULT 0,
    "Correct_Diff" INTEGER NOT NULL DEFAULT 0,
    "Correct_Signs" INTEGER NOT NULL DEFAULT 0,
    "Correct_Group_Qualified" INTEGER NOT NULL DEFAULT 0,
    "Correct_Group_Positions" INTEGER NOT NULL DEFAULT 0,
    "Correct_Cruces" INTEGER NOT NULL DEFAULT 0,
    "Points_Total_Fecha" INTEGER NOT NULL DEFAULT 0,
    "Pos_Fecha" INTEGER,
    "Delta_Pos" INTEGER NOT NULL DEFAULT 0,
    "Delta_Points" INTEGER NOT NULL DEFAULT 0,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "tbl_clasificacion_general_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "GameRule" (
    "id" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "value" INTEGER NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "description" TEXT,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "GameRule_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RankingSnapshot" (
    "id" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "isPublished" BOOLEAN NOT NULL DEFAULT true,
    "source" TEXT NOT NULL,

    CONSTRAINT "RankingSnapshot_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RankingSnapshotRow" (
    "id" TEXT NOT NULL,
    "snapshotId" TEXT NOT NULL,
    "participantId" TEXT NOT NULL,
    "alias" TEXT NOT NULL,
    "departamento" TEXT,
    "rango" TEXT,
    "pos" INTEGER NOT NULL,
    "deltaPos" INTEGER NOT NULL,
    "deltaPoints" INTEGER NOT NULL,
    "pointsMatches" INTEGER NOT NULL,
    "pointsGroups" INTEGER NOT NULL,
    "pointsEliminatorias" INTEGER NOT NULL,
    "pointsBonus" INTEGER NOT NULL,
    "pointsTotal" INTEGER NOT NULL,

    CONSTRAINT "RankingSnapshotRow_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ImportRun" (
    "id" TEXT NOT NULL,
    "filename" TEXT NOT NULL,
    "status" "ImportRunStatus" NOT NULL DEFAULT 'PENDING',
    "dryRun" BOOLEAN NOT NULL DEFAULT false,
    "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "finishedAt" TIMESTAMP(3),
    "rowsRead" INTEGER NOT NULL DEFAULT 0,
    "rowsImported" INTEGER NOT NULL DEFAULT 0,
    "warnings" JSONB NOT NULL DEFAULT '[]',
    "errors" JSONB NOT NULL DEFAULT '[]',
    "rollbackToken" TEXT,

    CONSTRAINT "ImportRun_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AdminLog" (
    "id" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AdminLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RecalculationRun" (
    "id" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "finishedAt" TIMESTAMP(3),
    "affectedParticipants" INTEGER NOT NULL DEFAULT 0,
    "message" TEXT,

    CONSTRAINT "RecalculationRun_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SimulationRun" (
    "id" TEXT NOT NULL,
    "label" TEXT,
    "payload" JSONB NOT NULL,
    "result" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SimulationRun_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "tbl_participantes_Alias_key" ON "tbl_participantes"("Alias");

-- CreateIndex
CREATE UNIQUE INDEX "tbl_participantes_slug_key" ON "tbl_participantes"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "tbl_bets_matches_Bet.ID_key" ON "tbl_bets_matches"("Bet.ID");

-- CreateIndex
CREATE INDEX "tbl_bets_matches_Participant_ID_idx" ON "tbl_bets_matches"("Participant_ID");

-- CreateIndex
CREATE INDEX "tbl_bets_matches_Match_ID_idx" ON "tbl_bets_matches"("Match_ID");

-- CreateIndex
CREATE UNIQUE INDEX "tbl_bets_group_positions_Group_Bet_ID_key" ON "tbl_bets_group_positions"("Group_Bet_ID");

-- CreateIndex
CREATE INDEX "tbl_bets_group_positions_Participant_ID_idx" ON "tbl_bets_group_positions"("Participant_ID");

-- CreateIndex
CREATE UNIQUE INDEX "tbl_bets_bonus_Participant_ID_key" ON "tbl_bets_bonus"("Participant_ID");

-- CreateIndex
CREATE INDEX "tbl_scoring_matches_Participant_ID_idx" ON "tbl_scoring_matches"("Participant_ID");

-- CreateIndex
CREATE INDEX "tbl_scoring_matches_Match_ID_idx" ON "tbl_scoring_matches"("Match_ID");

-- CreateIndex
CREATE INDEX "tbl_scoring_groups_Participant_ID_idx" ON "tbl_scoring_groups"("Participant_ID");

-- CreateIndex
CREATE UNIQUE INDEX "tbl_scoring_bonus_Participant_ID_key" ON "tbl_scoring_bonus"("Participant_ID");

-- CreateIndex
CREATE UNIQUE INDEX "tbl_clasificacion_general_Participant_ID_key" ON "tbl_clasificacion_general"("Participant_ID");

-- CreateIndex
CREATE INDEX "tbl_clasificacion_general_Pos_idx" ON "tbl_clasificacion_general"("Pos");

-- CreateIndex
CREATE UNIQUE INDEX "GameRule_key_key" ON "GameRule"("key");

-- CreateIndex
CREATE INDEX "RankingSnapshotRow_snapshotId_pos_idx" ON "RankingSnapshotRow"("snapshotId", "pos");

-- AddForeignKey
ALTER TABLE "tbl_bets_matches" ADD CONSTRAINT "tbl_bets_matches_Participant_ID_fkey" FOREIGN KEY ("Participant_ID") REFERENCES "tbl_participantes"("Participant_ID") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tbl_bets_matches" ADD CONSTRAINT "tbl_bets_matches_Match_ID_fkey" FOREIGN KEY ("Match_ID") REFERENCES "tbl_matches"("Match_ID") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tbl_bets_group_positions" ADD CONSTRAINT "tbl_bets_group_positions_Participant_ID_fkey" FOREIGN KEY ("Participant_ID") REFERENCES "tbl_participantes"("Participant_ID") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tbl_bets_bonus" ADD CONSTRAINT "tbl_bets_bonus_Participant_ID_fkey" FOREIGN KEY ("Participant_ID") REFERENCES "tbl_participantes"("Participant_ID") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tbl_scoring_matches" ADD CONSTRAINT "tbl_scoring_matches_Match_ID_fkey" FOREIGN KEY ("Match_ID") REFERENCES "tbl_matches"("Match_ID") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tbl_scoring_matches" ADD CONSTRAINT "tbl_scoring_matches_Participant_ID_fkey" FOREIGN KEY ("Participant_ID") REFERENCES "tbl_participantes"("Participant_ID") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tbl_clasificacion_general" ADD CONSTRAINT "tbl_clasificacion_general_Participant_ID_fkey" FOREIGN KEY ("Participant_ID") REFERENCES "tbl_participantes"("Participant_ID") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RankingSnapshotRow" ADD CONSTRAINT "RankingSnapshotRow_snapshotId_fkey" FOREIGN KEY ("snapshotId") REFERENCES "RankingSnapshot"("id") ON DELETE CASCADE ON UPDATE CASCADE;
