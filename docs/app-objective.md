# Objetivo funcional completo

La app PORRA MUNDIAL 2026 MALOG debe ser una web pública que sustituya el Power BI y permita actualizar resultados online.

## Páginas públicas

- Home
- Clasificación
- Evolución
- Apuestas
- Departamentos
- Simulador
- Participantes
- Estadísticas
- Reglas

## Admin

- Carga de Excel
- Entrada de resultados
- Recalculo
- Logs
- Rollback
- Reglas

## Producción

El Excel puede ser fuente de entrada, pero la producción debe funcionar con PostgreSQL + Prisma + motor TypeScript.
