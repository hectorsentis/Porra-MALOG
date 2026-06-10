# AGENTS.md

## Proyecto

Este repositorio contiene la aplicación web pública de la PORRA MUNDIAL 2026 MALOG.

Objetivo principal:
- Sustituir el dashboard de Power BI por una aplicación web interactiva publicada en Vercel.
- Usar el Excel oficial de la porra como fuente de verdad.
- Usar PostgreSQL + Prisma como capa de datos.
- Reproducir el modelo lógico del Power BI `Porra_BigData.pbix`.
- Reproducir visualmente el dashboard de referencia con estética Ejército del Aire y del Espacio.

## Stack esperado

- Next.js con App Router.
- TypeScript.
- Prisma ORM.
- PostgreSQL.
- Tailwind CSS.
- Recharts, Apache ECharts o librería equivalente.
- ExcelJS para leer Excel.
- Zod para validaciones.
- TanStack Table para tablas interactivas.

## Fuente de verdad

La fuente de verdad funcional es el Excel oficial:

- `Porra_mundial2026.xlsx`

La fuente de verdad del modelo lógico es el Power BI:

- `Porra_BigData.pbix`

No inventar un modelo desde cero. Usar como referencia estas tablas:

- `tbl_participantes`
- `tbl_bets_matches`
- `tbl_bets_group_positions`
- `tbl_bets_bonus`
- `tbl_scoring_matches`
- `tbl_scoring_groups`
- `tbl_scoring_bonus`
- `tbl_clasificacion_general`

## Reglas críticas

- No modificar el Excel oficial.
- No hardcodear datos en componentes.
- No sustituir PostgreSQL por JSON estático.
- No eliminar Prisma.
- No mostrar emails en la web pública.
- No mostrar nombres completos si no es imprescindible.
- No mostrar campos de pago, `PAY`, `Pagado`, IBAN, teléfonos ni información sensible.
- La web pública debe usar principalmente `Alias`, `Departamento`, `Rango` y puntuaciones.
- Proponer cambios estructurales antes de aplicarlos si afectan al modelo de datos.
- Explicar los cambios relevantes en la respuesta final de Codex.

## Comandos esperados

Usar estos comandos cuando existan:

```bash
npm install
npm run dev
npm run build
npm run lint
npx prisma generate
npx prisma migrate dev
npm run import:excel


## Producción

La versión de producción debe ir más allá del dashboard preliminar.

Requisitos nuevos:

- Todas las páginas públicas deben estar completas.
- La página /estadisticas debe tener pestañas reales con gráficas.
- Debe existir /bote.
- Deben existir filtros activos visibles en las páginas principales.
- Debe haber composición de puntos por jugador.
- El admin debe permitir introducir resultados de partidos desde la web.
- El admin debe permitir editar equipos de cada partido si el calendario importado no es suficiente.
- La app debe recalcular puntuaciones tras resultados oficiales.
- La base de datos debe guardar histórico de puntuaciones y posiciones.
- La evolución no debe simularse desde datos actuales: debe salir de snapshots históricos.
- El Excel puede contener resultados de prueba, pero producción debe funcionar con resultados vacíos.
- No mostrar frases internas o técnicas en la UI pública.
- No dejar placeholders visibles.

Histórico obligatorio:

- RankingSnapshot.
- RankingSnapshotRow.
- ParticipantScoreSnapshot.
- RecalculationRun.
- MatchResultEvent.

Cada recalculo oficial debe crear snapshot completo de todos los participantes.

Motor de juego:

Si el Excel contiene la lógica de scoring, migrarla a TypeScript.

El motor debe tener checks automáticos:

- puntuación por partido
- clasificación por grupos
- bonus
- ranking
- desempates
- delta de posición
- snapshots
- simulador

Cuando el Excel contenga resultados de prueba, usarlo como golden dataset para comparar el motor.
Si hay discrepancias, reportarlas en docs/scoring-validation.md y no ocultarlas.

Admin inicial:

- ADMIN_USERNAME
- ADMIN_PASSWORD

No usar credenciales reales en el repo.
Usar .env.local en local y variables de entorno en Vercel.
