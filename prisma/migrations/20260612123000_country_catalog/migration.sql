CREATE TABLE IF NOT EXISTS "tbl_countries" (
  "Country_Code" TEXT NOT NULL,
  "Pais_ES" TEXT NOT NULL,
  "Flag_Emoji" TEXT NOT NULL,
  "FIFA_Name" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "tbl_countries_pkey" PRIMARY KEY ("Country_Code")
);

INSERT INTO "tbl_countries" ("Country_Code", "Pais_ES", "Flag_Emoji", "FIFA_Name") VALUES
  ('MEX', 'México', '🇲🇽', 'Mexico'),
  ('RSA', 'Sudáfrica', '🇿🇦', 'South Africa'),
  ('KOR', 'Corea del Sur', '🇰🇷', 'South Korea'),
  ('CZE', 'República Checa', '🇨🇿', 'Czech Republic'),
  ('CAN', 'Canadá', '🇨🇦', 'Canada'),
  ('BIH', 'Bosnia y Herzegovina', '🇧🇦', 'Bosnia and Herzegovina'),
  ('QAT', 'Qatar', '🇶🇦', 'Qatar'),
  ('SUI', 'Suiza', '🇨🇭', 'Switzerland'),
  ('BRA', 'Brasil', '🇧🇷', 'Brazil'),
  ('MAR', 'Marruecos', '🇲🇦', 'Morocco'),
  ('HAI', 'Haití', '🇭🇹', 'Haiti'),
  ('SCO', 'Escocia', '🏴', 'Scotland'),
  ('USA', 'Estados Unidos', '🇺🇸', 'United States'),
  ('PAR', 'Paraguay', '🇵🇾', 'Paraguay'),
  ('AUS', 'Australia', '🇦🇺', 'Australia'),
  ('TUR', 'Turquía', '🇹🇷', 'Turkey'),
  ('GER', 'Alemania', '🇩🇪', 'Germany'),
  ('CUW', 'Curazao', '🇨🇼', 'Curaçao'),
  ('CIV', 'Costa de Marfil', '🇨🇮', 'Ivory Coast'),
  ('ECU', 'Ecuador', '🇪🇨', 'Ecuador'),
  ('NED', 'Países Bajos', '🇳🇱', 'Netherlands'),
  ('JPN', 'Japón', '🇯🇵', 'Japan'),
  ('SWE', 'Suecia', '🇸🇪', 'Sweden'),
  ('TUN', 'Túnez', '🇹🇳', 'Tunisia'),
  ('BEL', 'Bélgica', '🇧🇪', 'Belgium'),
  ('EGY', 'Egipto', '🇪🇬', 'Egypt'),
  ('IRN', 'Irán', '🇮🇷', 'Iran'),
  ('NZL', 'Nueva Zelanda', '🇳🇿', 'New Zealand'),
  ('ESP', 'España', '🇪🇸', 'Spain'),
  ('CPV', 'Cabo Verde', '🇨🇻', 'Cape Verde'),
  ('KSA', 'Arabia Saudí', '🇸🇦', 'Saudi Arabia'),
  ('URU', 'Uruguay', '🇺🇾', 'Uruguay'),
  ('FRA', 'Francia', '🇫🇷', 'France'),
  ('SEN', 'Senegal', '🇸🇳', 'Senegal'),
  ('IRQ', 'Irak', '🇮🇶', 'Iraq'),
  ('NOR', 'Noruega', '🇳🇴', 'Norway'),
  ('ARG', 'Argentina', '🇦🇷', 'Argentina'),
  ('ALG', 'Argelia', '🇩🇿', 'Algeria'),
  ('AUT', 'Austria', '🇦🇹', 'Austria'),
  ('JOR', 'Jordania', '🇯🇴', 'Jordan'),
  ('POR', 'Portugal', '🇵🇹', 'Portugal'),
  ('COD', 'RD Congo', '🇨🇩', 'DR Congo'),
  ('UZB', 'Uzbekistán', '🇺🇿', 'Uzbekistan'),
  ('COL', 'Colombia', '🇨🇴', 'Colombia'),
  ('ENG', 'Inglaterra', '🏴', 'England'),
  ('CRO', 'Croacia', '🇭🇷', 'Croatia'),
  ('GHA', 'Ghana', '🇬🇭', 'Ghana'),
  ('PAN', 'Panamá', '🇵🇦', 'Panama')
ON CONFLICT ("Country_Code") DO UPDATE SET
  "Pais_ES" = EXCLUDED."Pais_ES",
  "Flag_Emoji" = EXCLUDED."Flag_Emoji",
  "FIFA_Name" = EXCLUDED."FIFA_Name",
  "updatedAt" = CURRENT_TIMESTAMP;

INSERT INTO "tbl_countries" ("Country_Code", "Pais_ES", "Flag_Emoji", "FIFA_Name")
SELECT t."Team_ID", COALESCE(NULLIF(t."Seleccion", ''), t."Team_ID"), COALESCE(NULLIF(t."Flag", ''), '🏳️'), t."Seleccion"
FROM "tbl_teams" t
WHERE NOT EXISTS (SELECT 1 FROM "tbl_countries" c WHERE c."Country_Code" = t."Team_ID");

UPDATE "tbl_teams" t
SET "Pais" = c."Pais_ES",
    "Seleccion" = c."Pais_ES",
    "Flag" = c."Flag_Emoji"
FROM "tbl_countries" c
WHERE t."Team_ID" = c."Country_Code";

UPDATE "tbl_matches" m
SET "Home_Team" = c."Pais_ES"
FROM "tbl_countries" c
WHERE m."Home_Team_ID" = c."Country_Code";

UPDATE "tbl_matches" m
SET "Away_Team" = c."Pais_ES"
FROM "tbl_countries" c
WHERE m."Away_Team_ID" = c."Country_Code";

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'tbl_teams_Team_ID_fkey'
  ) THEN
    ALTER TABLE "tbl_teams"
    ADD CONSTRAINT "tbl_teams_Team_ID_fkey"
    FOREIGN KEY ("Team_ID") REFERENCES "tbl_countries"("Country_Code")
    ON DELETE RESTRICT ON UPDATE CASCADE;
  END IF;
END $$;

INSERT INTO "tbl_countries" ("Country_Code", "Pais_ES", "Flag_Emoji", "FIFA_Name")
SELECT DISTINCT code, code, '🏳️', code
FROM (
  SELECT "Home_Team_ID" AS code FROM "tbl_matches"
  UNION SELECT "Away_Team_ID" AS code FROM "tbl_matches"
  UNION SELECT "Winner_Team_ID" AS code FROM "tbl_matches"
  UNION SELECT "Qualified_Team_ID" AS code FROM "tbl_matches"
  UNION SELECT "Override_Qualified_Team_ID" AS code FROM "tbl_matches"
  UNION SELECT "Pred_Home_Team_ID" AS code FROM "tbl_bets_matches"
  UNION SELECT "Pred_Away_Team_ID" AS code FROM "tbl_bets_matches"
  UNION SELECT "Pred_Qualified_Team_ID" AS code FROM "tbl_bets_matches"
  UNION SELECT "Pred_Team_ID" AS code FROM "tbl_bets_group_positions"
  UNION SELECT "Pred_Team_ID" AS code FROM "tbl_scoring_groups"
) s
WHERE code IS NOT NULL
  AND code <> ''
  AND NOT EXISTS (SELECT 1 FROM "tbl_countries" c WHERE c."Country_Code" = s.code);

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'tbl_matches_Home_Team_ID_country_fkey') THEN
    ALTER TABLE "tbl_matches" ADD CONSTRAINT "tbl_matches_Home_Team_ID_country_fkey" FOREIGN KEY ("Home_Team_ID") REFERENCES "tbl_countries"("Country_Code") ON DELETE SET NULL ON UPDATE CASCADE;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'tbl_matches_Away_Team_ID_country_fkey') THEN
    ALTER TABLE "tbl_matches" ADD CONSTRAINT "tbl_matches_Away_Team_ID_country_fkey" FOREIGN KEY ("Away_Team_ID") REFERENCES "tbl_countries"("Country_Code") ON DELETE SET NULL ON UPDATE CASCADE;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'tbl_matches_Winner_Team_ID_country_fkey') THEN
    ALTER TABLE "tbl_matches" ADD CONSTRAINT "tbl_matches_Winner_Team_ID_country_fkey" FOREIGN KEY ("Winner_Team_ID") REFERENCES "tbl_countries"("Country_Code") ON DELETE SET NULL ON UPDATE CASCADE;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'tbl_matches_Qualified_Team_ID_country_fkey') THEN
    ALTER TABLE "tbl_matches" ADD CONSTRAINT "tbl_matches_Qualified_Team_ID_country_fkey" FOREIGN KEY ("Qualified_Team_ID") REFERENCES "tbl_countries"("Country_Code") ON DELETE SET NULL ON UPDATE CASCADE;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'tbl_matches_Override_Qualified_country_fkey') THEN
    ALTER TABLE "tbl_matches" ADD CONSTRAINT "tbl_matches_Override_Qualified_country_fkey" FOREIGN KEY ("Override_Qualified_Team_ID") REFERENCES "tbl_countries"("Country_Code") ON DELETE SET NULL ON UPDATE CASCADE;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'tbl_bets_matches_Pred_Home_country_fkey') THEN
    ALTER TABLE "tbl_bets_matches" ADD CONSTRAINT "tbl_bets_matches_Pred_Home_country_fkey" FOREIGN KEY ("Pred_Home_Team_ID") REFERENCES "tbl_countries"("Country_Code") ON DELETE SET NULL ON UPDATE CASCADE;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'tbl_bets_matches_Pred_Away_country_fkey') THEN
    ALTER TABLE "tbl_bets_matches" ADD CONSTRAINT "tbl_bets_matches_Pred_Away_country_fkey" FOREIGN KEY ("Pred_Away_Team_ID") REFERENCES "tbl_countries"("Country_Code") ON DELETE SET NULL ON UPDATE CASCADE;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'tbl_bets_matches_Pred_Qualified_country_fkey') THEN
    ALTER TABLE "tbl_bets_matches" ADD CONSTRAINT "tbl_bets_matches_Pred_Qualified_country_fkey" FOREIGN KEY ("Pred_Qualified_Team_ID") REFERENCES "tbl_countries"("Country_Code") ON DELETE SET NULL ON UPDATE CASCADE;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'tbl_bets_group_positions_Pred_country_fkey') THEN
    ALTER TABLE "tbl_bets_group_positions" ADD CONSTRAINT "tbl_bets_group_positions_Pred_country_fkey" FOREIGN KEY ("Pred_Team_ID") REFERENCES "tbl_countries"("Country_Code") ON DELETE SET NULL ON UPDATE CASCADE;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'tbl_scoring_groups_Pred_country_fkey') THEN
    ALTER TABLE "tbl_scoring_groups" ADD CONSTRAINT "tbl_scoring_groups_Pred_country_fkey" FOREIGN KEY ("Pred_Team_ID") REFERENCES "tbl_countries"("Country_Code") ON DELETE SET NULL ON UPDATE CASCADE;
  END IF;
END $$;
