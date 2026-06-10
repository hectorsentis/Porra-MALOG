# Excel analysis

Archivo analizado: `data/input/Porra_mundial2026.xlsx`.

## Hojas detectadas

- `00_HOME`
- `01_CONFIG`
- `02_PARTICIPANTES`
- `03_TEAMS`
- `04_MATCHES`
- `04.1_GROUP STANDINGS`
- `04.2_KNOCKOUT_SLOTS`
- `04.3_TEAM_PERFORMANCE`
- `05_RESULTS`
- `06_BETS_MATCHES`
- `06_BETS_GROUP_POSITION`
- `06_BETS_BONUS`
- `08_SCORING_MATCHES`
- `08_SCORING_GROUPS`
- `08_SCORING_BONUS`
- `09_CLASIFICACION_GENERAL`
- `10_PODIO`
- `11_PREDICCIONES_DIA`
- `12_RANKINS TEMPORALES`
- `13_STATS`
- `14_FIXTURE`
- `15_DASHBOAD_EMAIL`
- `19_CONTROL_CALIDAD`

## Tablas principales

- `tbl_participantes`: participantes y campos privados.
- `tbl_teams`: selecciones.
- `tbl_matches`: calendario y resultados.
- `tbl_bets_matches`: apuestas por partido.
- `tbl_bets_group_positions`: apuestas de posiciones de grupo.
- `tbl_bets_bonus`: apuestas bonus.
- `tbl_scoring_matches`: scoring calculado por Excel.
- `tbl_scoring_groups`: scoring de grupos calculado por Excel.
- `tbl_scoring_bonus`: scoring bonus calculado por Excel.
- `tbl_clasificacion_general`: ranking de referencia.

## Dry-run verificado

`npm run import:excel:dry-run` detecto:

- Participantes: 47.
- Equipos: 48.
- Partidos: 104.
- Apuestas partidos: 3328.
- Apuestas grupos: 1536.
- Apuestas bonus: 47.
- Clasificacion: 47.

Warnings actuales:

- Filas 38 a 47 de `tbl_participantes` no tienen alias en esa tabla; se completan desde `tbl_clasificacion_general`.

La salida de preview no incluye email, nombre, PAY, pagado ni campos de pago.

## Importacion real

`npm run import:excel` completado contra PostgreSQL.

Conteos en base:

- Participantes: 47.
- Equipos: 48.
- Partidos: 104.
- Apuestas partidos: 3328.
- Apuestas grupos: 1536.
- Apuestas bonus: 47.
- Clasificacion: 47.

## PBIX

`data/input/Porra_BigData.pbix` es un ZIP valido e incluye `Report/Layout`, `DataModel` y recursos estaticos, incluido un logo del Ejercito del Aire.
