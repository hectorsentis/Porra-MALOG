# Data model

El schema Prisma usa nombres legibles y preserva la semantica Power BI con `@@map`.

## Tablas Power BI preservadas

- `tbl_participantes`
- `tbl_teams`
- `tbl_matches`
- `tbl_bets_matches`
- `tbl_bets_group_positions`
- `tbl_bets_bonus`
- `tbl_scoring_matches`
- `tbl_scoring_groups`
- `tbl_scoring_bonus`
- `tbl_clasificacion_general`

## Modelos operativos adicionales

- `ImportRun`
- `GameRule`
- `RankingSnapshot`
- `RankingSnapshotRow`
- `ParticipantScoreSnapshot`
- `MatchResult`
- `MatchResultEvent`
- `SimulationRun`
- `RecalculationRun`
- `AdminLog`
- `BoteConfig`

## Privacidad

Campos privados presentes en PostgreSQL pero nunca expuestos en DTOs publicos:

- Email.
- Nombre completo.
- PAY.
- Pagado.
- Estado interno.
- Datos de pago.

Los DTOs publicos se construyen en `lib/public/mappers.ts` y solo devuelven alias, departamento, rango, posicion, deltas y puntos.

## Produccion

PostgreSQL es fuente operativa. El Excel queda como import inicial y respaldo, no como motor online.
