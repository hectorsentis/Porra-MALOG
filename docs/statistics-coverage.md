# Statistics coverage

## Cubierto

- Ranking general publico desde `GeneralRanking`.
- KPIs de home: lider, puntos, distancia al segundo, participantes, puntos repartidos, partidos computados, ultima actualizacion.
- Clasificacion con deltas publicos.
- Evolucion basada en `ParticipantScoreSnapshot`.
- Estadisticas por puntos: partidos, grupos, eliminatorias, bonus, total y porcentajes.
- Aciertos: exactos, signos, diferencias, grupos.
- Departamentos: media, total, dispersion, min, max y MVP.
- Apuestas bonus: campeon, subcampeon, maximo goleador, mercados de goles y rareza por participante.
- Volatilidad: delta de posicion, delta de puntos, movimiento medio, dispersion de posiciones y puntos.
- Bote manual: total, primer premio, segundo premio, tercer premio y consolacion.
- Visor publico de partidos: fase, grupo, jornada, fecha, equipos, estado, resultado oficial, puntos repartidos, exactos, distribucion 1-X-2 y resultado mas apostado.

## Filtros

- Filtros publicos principales por desplegable.
- Opciones cargadas desde base.
- Chips activos con limpieza.
- Persistencia mediante query params.
- `/partidos` añade fase, grupo, jornada, equipo, estado y fecha.

## Privacidad estadistica

- No se muestran Email, Nombre completo, PAY, Pagado ni informacion de pago.
- El bote publico no deriva datos de participantes pagados.
- Las consultas publicas usan selects/DTOs de salida publica.

## Pendiente para paridad total Excel

- Premios/salseo avanzados completos: Nostradamus, Gafe, Amarrategui, Patriota, Rey de cruces, Killer eliminatorias y equivalentes aun necesitan una capa de reglas dedicada para no inferirlos de forma fragil.
- Mercados bonus de total de goles: media, moda, minimo, maximo y dispersion pueden ampliarse sobre `BetBonus` cuando se cierre el diccionario exacto de columnas finales.
- Ranking diario por rango/departamento depende de que haya resultados oficiales publicados y snapshots diarios sucesivos.
- Comparativas especiales España vs Marruecos requieren normalizacion final de nombres/equipos.

La implementacion actual conserva lo existente, suma el visor de partidos y deja la estructura de historico real preparada para crecer sin redeploy al publicar resultados oficiales.
