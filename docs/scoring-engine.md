# Scoring engine

El motor TypeScript vive en `lib/game` y puede recalcular ranking tras introducir resultados online.

## Modulos

- `rules.ts`
- `types.ts`
- `scoreMatch.ts`
- `scoreGroups.ts`
- `scoreBonus.ts`
- `ranking.ts`
- `simulator.ts`
- `potentialPoints.ts`
- `snapshots.ts`
- `recalculateAll.ts`

## Validacion

- Resultado exacto.
- Signo correcto.
- Diferencia de goles.
- Solo resultados `OFFICIAL` mueven la clasificacion; borradores y simulados no recalculan puntos.
- Clasificado correcto.
- Cruce exacto.
- Posiciones de grupo.
- Bonus.
- Ranking, desempates y `Delta_Pos`.
- Simulador sin persistencia.

La comparacion de paridad contra `tbl_clasificacion_general` queda pendiente hasta aplicar migraciones e importar el Excel en PostgreSQL.
