# Criterios de desempate - Porra Mundial 2026

## Orden oficial de desempate

Cuando dos o mas participantes empatan en puntos totales, se aplican los
siguientes criterios en orden hasta romper el empate:

| Nivel | Criterio | Direccion |
|-------|----------|-----------|
| 1 | Puntos totales | Mayor primero |
| 2 | Puntos obtenidos por bonus | Mayor primero |
| 3 | Acierto del campeon | Acertado primero |
| 4 | Acierto del subcampeon + semifinalistas | Mayor primero |
| 5 | Puntos obtenidos en eliminatorias | Mayor primero |
| 6 | Numero de resultados exactos en fase de grupos | Mayor primero |
| 7 | Numero de diferencias de goles correctas | Mayor primero |
| 8 | Numero de signos correctos (1/X/2) | Mayor primero |
| 9 | Orden alfabetico por alias (locale es) | A-Z |

## Comportamiento segun la fase del torneo

Durante la **fase de grupos**, los criterios 2-5 (bonus, campeon, subcampeon,
eliminatorias) son 0 para todos los participantes, ya que esos resultados no se
conocen aun. El orden efectivo durante grupos es:

1. Puntos totales
2. Resultados exactos
3. Diferencias de goles correctas
4. Signos correctos
5. Alfabetico

A medida que avanza el torneo, los criterios superiores empiezan a diferenciar.

## Detalle de cada criterio

- **Puntos bonus**: Incluye campeon (15pts), subcampeon (10pts),
  semifinalistas (5pts c/u), maximo goleador (8pts), selecciones estadisticas
  (5pts c/u), total goles torneo (5pts).
- **Acierto campeon**: Boolean - si el participante acerto el campeon.
- **Subcampeon + semifinalistas**: Suma de aciertos: subcampeon (0 o 1) +
  semifinalistas acertados (0-4).
- **Puntos eliminatorias**: Puntos por acertar equipo clasificado en cada ronda
  de eliminatorias (R32: 5pts, R16: 7pts, QF: 9pts, SF: 12pts, Final: 15pts)
  mas cruces exactos.
- **Resultados exactos**: Numero de partidos de fase de grupos donde el
  participante acerto el marcador exacto.
- **Diferencias de goles correctas**: Numero de partidos donde el participante
  acerto la diferencia de goles (sin acertar el exacto).
- **Signos correctos**: Numero de partidos donde el participante acerto el
  signo (1/X/2) sin acertar ni la diferencia ni el exacto.

## Snapshots de jornada

El sistema crea automaticamente un snapshot de la clasificacion al inicio de
cada nueva jornada/fase. Cuando se procesa el primer resultado oficial de la
jornada N+1, el motor guarda el estado de la clasificacion al final de la
jornada N como "Inicio de fase JN+1".

## Puntuacion clasificacion de grupos

- **Equipo clasificado (3pts)**: Solo se otorga si el jugador predijo que el
  equipo clasificaria. Poner un equipo en posicion 1 o 2 implica "clasifica".
  Posicion 3 solo cuenta si el equipo acaba 3o y clasifica como mejor tercero.
  Posicion 4 nunca otorga puntos de "clasifica".
- **Posicion exacta (2pts)**: Se otorga si la posicion pronosticada coincide
  con la posicion real, independientemente de si el equipo clasifico.
- **Mejores terceros**: Los puntos de "clasifica" para terceros solo se
  otorgan cuando TODOS los grupos han terminado y se conoce la clasificacion
  final de mejores terceros.

## Implementacion

- Logica de ordenacion: `lib/game/ranking.ts` (`calculateRanking`)
- Scoring de grupos: `lib/game/scoreGroups.ts` (`scoreGroupBet`)
- Tipos: `lib/game/types.ts` (`RankingInput`)
- Calculo y paso de datos: `lib/game/recalculateAll.ts`
