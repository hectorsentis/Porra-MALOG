# Engine validation

Fecha: 2026-06-10.

## Checks ejecutados

- `npm run test`
- `npm run import:excel:dry-run`
- `npm run import:excel`
- `npm run lint`
- `npm run build`

## Tests pasados

Vitest: 14 tests OK.

Cobertura funcional:

- Resultado exacto.
- Signo correcto.
- Diferencia de goles correcta.
- Resultado incorrecto.
- Clasificado correcto.
- Cruce exacto KO.
- Clasificado de grupo.
- Posicion exacta de grupo.
- Campeon, subcampeon y semifinalistas.
- Maximo goleador y mercados de equipos.
- Total de goles con tolerancia.
- Ordenacion de ranking.
- Desempates deterministas.
- `Delta_Pos` y `Delta_Points`.
- Simulador sin mutar datos oficiales.
- Resultados en borrador o simulados no mueven la clasificacion.

## Paridad Excel

Paridad de importacion OK: `tbl_clasificacion_general` se importa a PostgreSQL con 47 filas y la web publica lee esa clasificacion.

Paridad completa de motor calculado pendiente: el motor TypeScript ya tiene tests unitarios, pero todavia no reproduce todas las formulas Excel de grupos, eliminatorias y bonus contra `tbl_clasificacion_general`.

## Discrepancias conocidas

- `tbl_participantes` contiene filas con `Participant_ID` pero sin alias. El importador las completa desde `tbl_clasificacion_general` y lo reporta como warning.
- `Alias` no es clave unica real en el Excel. El modelo usa `Participant_ID` como clave y desambigua `slug` publico.

## Estado

El motor puro es seguro para seguir desarrollando. No declarar paridad productiva completa hasta que:

1. Se migren todas las formulas Excel restantes de grupos, eliminatorias y bonus.
2. Se ejecute un comparador de ranking calculado contra `tbl_clasificacion_general`.
3. Toda discrepancia quede explicada o corregida.
