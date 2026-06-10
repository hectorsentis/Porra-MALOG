# Statistics coverage

Actualizado: 2026-06-10
Fuente revisada: `docs/stats.txt`.

## Cubierto en la app

### Clasificacion general

- `Points_Matches`, `Points_Groups`, `Points_Eliminatorias`, `Points_Bonus`, `Points_Total`.
- `Exact_Scores`, `Correct_Diff`, `Correct_Signs`, `Correct_Group_Qualified`, `Correct_Group_Positions`, `Correct_Cruces`.
- `Pos`, `Delta_Pos`, `Delta_Points`.
- Tabla publica con filtros por alias, departamento, rango, fase, jornada, grupo y equipo donde aplica.
- Nueva pestana de clasificacion diaria calculada desde `ScoringMatch` y `Match.fecha`.
- Nueva pestana de clasificacion semanal calculada como ventana movil de 7 dias, terminando en la fecha seleccionada.

### Evolucion

- `/evolucion` calcula por dia real de partido oficial, no por importacion.
- Agrega puntos, exactos, signos, diferencias, cruces y jugador del dia.
- Se basa en `ScoringMatch` + `Match.fecha` con `Match.status = OFFICIAL`.

### Predicciones y partidos

- `/partidos` muestra calendario, estado, resultado oficial, puntos repartidos, exactos, distribucion 1-X-2 y resultado mas apostado.
- `/partidos/[matchId]` muestra detalle publico de predicciones sin datos privados.
- Los cruces R32 no se muestran publicamente hasta que el cruce tenga equipos resueltos.

### Apuestas bonus inicial

- Campeon mas apostado.
- Subcampeon mas apostado.
- Semifinalistas mas apostados.
- Maximo goleador.
- Equipo revelacion.
- Equipo decepcion.
- Seleccion mas/menos goleadora y mas/menos goleada en helper publico.
- Total de goles apostado: media, minimo, maximo, moda y dispersion.
- Hype score y desconfianza por seleccion/equipo.

### Apuestas de fase de grupos

- Tendencia 1-X-2.
- Resultado mas apostado y top resultados.
- Media de goles local/visitante.
- Jugadores resultadistas.
- Jugadores amarrategui.
- Equipos mas confiados.
- Equipos mas despreciados.
- Goles a favor/en contra apostados disponibles en helper publico.

### Clasificacion de grupos apostada

- Equipos mas apostados como 1o, 2o, 3o y 4o.
- Posicion media apostada por equipo.
- Confianza relativa por equipo.
- Comparativa España/Marruecos disponible cuando los IDs/nombres coinciden con la normalizacion.

### Rankings temporales

- Ranking diario individual por puntos de partidos oficiales del dia.
- Ranking semanal individual por puntos de partidos oficiales en ventana de 7 dias.
- Evolucion diaria por jornada real de partidos.

### Bote

- Total, primer premio, segundo premio, tercer premio y consolacion configurables manualmente.
- No deriva ni muestra datos de pago en publico.

### Reglas

- `/reglas` muestra todas las puntuaciones actuales de `defaultRules`: partidos, clasificacion de grupos, bonus y multiplicador de España.

### Simulador

- `/simulador` permite seleccionar partido pendiente, introducir marcador y clasificado opcional.
- Calcula ranking proyectado en memoria con `scoreMatch` + `simulateRanking`.
- No persiste resultados ni toca ranking oficial.

## Filtros por contexto

- Clasificacion general: filtros generales publicos.
- Clasificacion diaria/semanal: fecha de partido oficial y filtros de identidad conservados.
- Evolucion: filtros generales y de partido para agregacion diaria.
- Apuestas bonus: filtros de participante.
- Apuestas fase de grupos: grupo, jornada y equipo.
- Clasificacion de grupos: grupo y equipo.
- Partidos: fase, grupo, jornada, equipo, estado y fecha.

## Privacidad

- No se muestran Email, Nombre completo, PAY, Pagado ni informacion de pago.
- Las importaciones Excel quedan bajo `/admin/import`; no hay pagina publica de importaciones.
- Las vistas publicas usan selects/DTOs publicos.

## Pendiente o dependiente de datos oficiales

- `Correct_Qualified 1/8`, `Correct_Qualified 1/4`, `Correct_Qualified 1/2`, `Correct_Qualified Final` y `Correct Champion` necesitan que el motor cierre esos hitos oficiales del torneo.
- Premios de salseo completos: FLORERO, GAFE, PATRIOTA, PATRIOTA_ANTI_MAR, REGULAR, REY_CRUCES, KILLER_ELIMINATORIAS y BONUSMAN requieren reglas de adjudicacion especificas para no inferirse de forma fragil.
- Ranking colectivo diario/semanal por departamento y rango aun no tiene pagina propia; la base diaria ya existe para construirlo con el mismo rango de fechas.
- Comparativa España vs Marruecos depende de normalizacion final de IDs/nombres en todos los mercados.
- Frases aleatorias de salseo no estan activas como tabla editable; se recomienda implementarlas como seed/tabla antes de publicar comunicaciones automaticas.
