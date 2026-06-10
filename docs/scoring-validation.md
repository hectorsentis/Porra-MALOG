# Scoring validation

## Fuente

- Excel oficial importado: `data/input/Porra_mundial2026.xlsx`.
- Base de datos: PostgreSQL via Prisma.
- Motor TypeScript: `lib/game`.

## Reglas activas

- Los resultados `PENDING`, `DRAFT`, `SIMULATED` o `VOID` no puntuan ranking publico.
- Solo partidos `OFFICIAL` con goles completos entran en `ScoringMatch`.
- El simulador proyecta escenarios sin persistir datos oficiales.
- El recalculo reconstruye `GeneralRanking` y genera snapshots.

## Tests ejecutados

`npm run test` pasa con 19 tests:

- Resultado exacto.
- Signo correcto.
- Diferencia correcta.
- Clasificado correcto.
- Cruce exacto.
- Grupos.
- Bonus.
- Ordenacion y delta.
- Simulador sin persistencia.
- Draft no afecta ranking.
- Official afecta ranking.
- Estadisticas 1-X-2 del visor publico de partidos.

## Discrepancias contra Excel

No se detectan errores de importacion. El Excel actual se importa con 0 errores y warnings de calidad de datos documentados en `docs/final-release-check.md`.

La comparacion automatica de ranking recalculado contra `tbl_clasificacion_general` necesita resultados oficiales activos. En la base validada hay 0 resultados oficiales activos tras la importacion final, por lo que no hay escenario real de scoring online contra el que comparar todavia.

## Siguiente validacion recomendada

1. Publicar desde `/admin/resultados` un resultado oficial de prueba real.
2. Confirmar que se crea `MatchResultEvent` y `RecalculationRun`.
3. Comparar `GeneralRanking` contra una exportacion Excel equivalente si existe.
4. Mantener el resultado si es oficial real o usar rollback si fue una prueba.
