# Final release check - PORRA MUNDIAL 2026 MALOG

Fecha de cierre: 2026-06-10
Directorio validado: `C:\Users\eageshec.EAGES150\Desktop\Porra_Mundial2026\PorraMalog-online`
Excel usado: `data/input/Porra_mundial2026.xlsx`

## Comandos ejecutados

| Comando | Resultado |
| --- | --- |
| `node scripts\prisma-env-runner.cjs generate` | OK. Prisma Client generado. |
| `node scripts\prisma-env-runner.cjs migrate dev --name bote_manual_exact` | OK. Migracion `20260610152901_bote_manual_exact` creada y aplicada. |
| `node scripts\prisma-env-runner.cjs migrate dev` | OK. Schema sincronizado, sin migraciones pendientes. |
| `node scripts\prisma-env-runner.cjs migrate deploy` | OK. 5 migraciones encontradas, ninguna pendiente. |
| `npm run import:excel:dry-run` | OK. Excel oficial parseado sin errores. |
| `npm run import:excel` | OK. Importacion real completada. |
| `npx --no-install tsc --noEmit --incremental false` | OK. TypeScript estricto limpio. |
| `npm run test` | OK. 19 tests pasan. |
| `npm run lint` | OK. 0 warnings. |
| `npm run build` | OK. Next.js compila y lista rutas dinamicas para Vercel. |

## Datos importados

- Participantes: 47.
- Equipos: 48.
- Partidos: 104.
- Apuestas de partido: 4056.
- Apuestas de grupo: 1872.
- Apuestas bonus: 47.
- Filas de clasificacion general: 47.

Warnings conocidos del Excel:

- Varias filas de `tbl_participantes` llegan sin Alias y usan el alias de clasificacion cuando existe.
- Hay alias duplicados; el slug publico se desambigua.
- Dos apuestas de partido llegan incompletas para `P029` (`M015`, `M054`).

## Estado de base tras import

- `Participant`: 47.
- `Match`: 104.
- `GeneralRanking`: 47.
- `RankingSnapshot`: 6.
- `RankingSnapshotRow`: 94.
- `ParticipantScoreSnapshot`: 94.
- Resultados oficiales activos: 0.
- Partidos oficiales finalizados: 0.

El historico diario queda preparado. En esta carga concreta no hay resultados oficiales activos, por lo que los snapshots de evolucion creceran cuando `/admin/resultados` publique resultados `official`.

## Páginas verificadas por build

- Publicas: `/`, `/clasificacion`, `/evolucion`, `/apuestas`, `/departamentos`, `/simulador`, `/participantes`, `/participantes/[slug]`, `/estadisticas`, `/reglas`, `/bote`, `/partidos`, `/partidos/[matchId]`.
- Admin: `/admin`, `/admin/import`, `/admin/resultados`, `/admin/partidos`, `/admin/reglas`, `/admin/logs`, `/admin/rollback`, `/admin/bote`.

## Flujo admin/resultados

Implementado:

- Guardado de resultado como `DRAFT`.
- Publicacion como `OFFICIAL`.
- Solo `OFFICIAL` llama a `recalculateAll`.
- `MatchResult` guarda historico por partido con `isActive`.
- `MatchResultEvent` registra eventos.
- `RecalculationRun`, `RankingSnapshot`, `RankingSnapshotRow` y `ParticipantScoreSnapshot` se crean durante recalculo.
- Rollback despublica el ultimo snapshot y, si venia de un partido, desactiva el resultado oficial activo de ese `Match_ID`.

Verificado por tests:

- Draft no mueve clasificacion.
- Simulado no mueve clasificacion.
- Official completo si mueve clasificacion.

## Scoring verificado

Tests unitarios cubren:

- Resultado exacto.
- Signo correcto.
- Diferencia de goles.
- Resultado incorrecto sin puntos.
- Clasificado correcto.
- Cruce exacto KO.
- Multiplicador de España.
- Puntuacion de grupos.
- Bonus.
- Ordenacion de ranking y desempate basico.
- Delta_Pos y Delta_Points.
- Simulador sin mutar datos oficiales.
- Distribucion publica 1-X-2 del visor de partidos.

## Privacidad

- Las paginas publicas usan DTOs/selects publicos.
- No se expone Email, Nombre completo, PAY, Pagado ni metodo de pago en vistas publicas.
- `/bote` y estadisticas de bote ya no calculan ni muestran participantes incluidos por pago.
- Admin conserva informacion operativa bajo sesion protegida por variables de entorno.

## Vercel

- `npm run build` pasa con `prisma generate && next build`.
- `node scripts\prisma-env-runner.cjs migrate deploy` pasa sin pendientes.
- Para Vercel deben existir `DATABASE_URL`, `DIRECT_URL`, `ADMIN_USERNAME`, `ADMIN_PASSWORD`, `ADMIN_SESSION_SECRET`, `NEXT_PUBLIC_APP_NAME`, `NEXT_PUBLIC_SITE_URL`, `REVALIDATE_SECRET`.

## Riesgos reales pendientes

- La comparacion automatica ranking calculado vs tabla calculada del Excel queda pendiente de una fixture con resultados oficiales representativos. La carga actual no trae resultados oficiales activos.
- El motor autonomo recalcula scoring de partidos y ranking; grupos/bonus conservan datos importados o dependen de resultados finales cuando se complete la fuente oficial de esos mercados.
- No se hizo una prueba manual en navegador del formulario admin con credenciales reales dentro de esta sesion; build, acciones server y tests quedan validados.
