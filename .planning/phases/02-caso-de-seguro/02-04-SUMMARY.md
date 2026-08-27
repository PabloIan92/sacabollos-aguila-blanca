---
phase: 02-caso-de-seguro
plan: 04
subsystem: casos
tags: [react, supabase-realtime, design-system]

requires: [02-03-caso-de-seguro]
provides:
  - SemaforoBadge fiel a STAGES/stateMapping de docs/tablero.html (9 etapas, 6 kind, 13 estados)
  - CasosList compartida por Dueno/Taller/Recepcion con alerta de dias trabado (>=5 dias)
  - useCasoRealtime (un canal Supabase Realtime por sesion) que actualiza el semaforo sin recargar
affects: []

tech-stack:
  added: []
  patterns: ["mapa STATE_MAPPING exportado para que el test itere los 13 estados sin adivinar valores", "actualizacion incremental por id en el array local de casos en vez de refetch completo en cada evento Realtime"]

key-files:
  created: [src/features/casos/components/SemaforoBadge.tsx, src/features/casos/components/SemaforoBadge.test.tsx, src/features/casos/components/CasosList.tsx, src/features/casos/components/CasosList.test.tsx, src/features/casos/hooks/useCasoRealtime.ts]
  modified: [src/features/dueno/DuenoHome.tsx, src/features/taller/TallerHome.tsx, src/features/casos/CasosListPage.tsx, src/features/casos/CasosListPage.test.tsx, src/app/roleHome.test.tsx]

key-decisions:
  - "idx 9 ('cobrado') e idx -1 ('cancelado') del stateMapping original nunca indexan STAGES -- son sentinelas con label fijo ('Cobrado'/'Cancelado'), evitando el .label de undefined que el plan advertia explicitamente"
  - "CasosList mantiene la logica de destino por estado (borrador -> ficha-inspeccion, resto -> detalle) que ya existia en CasosListPage.tsx del plan 02-02 -- el <action> de este plan no la mencionaba, pero omitirla habria sido una regresion real de una fila-click ya probada"
  - "STATE_MAPPING se exporta desde SemaforoBadge.tsx (no queda 100% interno) para que el test pueda iterar los 13 estados contra valores exactos en vez de inferirlos solo del render"

patterns-established:
  - "Las 3 home (Dueno/Taller/Recepcion) comparten un unico componente de lista (CasosList) y un unico hook de Realtime (useCasoRealtime) -- ninguna vuelve a definir su propia fila de caso"

requirements-completed: [CASOS-02, CASOS-04]

duration: single session (2026-08-26/27)
completed: 2026-08-27
---

# Phase 2: Caso de Seguro — Plan 04 Summary

**Semáforo visual de 9 etapas fiel a la demo aprobada + lista de casos compartida con Realtime, cerrando el flujo de punta a punta de la Fase 2**

## Performance

- **Duration:** sesión única (2026-08-26/27)
- **Completed:** 2026-08-27
- **Tasks:** 2 de 2
- **Files modified:** 5 creados, 5 modificados

## Accomplishments
- `SemaforoBadge`: reproduce exactamente `STAGES`/`stateMapping` de `docs/tablero.html:1163-1190` para los 13 estados, con los sentinelas `idx:9`/`idx:-1` tratados como casos especiales (nunca indexan `STAGES`). Color por `kind` vía la Status Stamp Palette de `theme.css`.
- `CasosList`: lista presentacional compartida con `SemaforoBadge` + alerta de días trabado (`estado_changed_at`, umbral 5 días), reutilizada tal cual por las 3 home.
- `useCasoRealtime`: canal único `casos-semaforo` por sesión, actualiza el array local por id sin refetch completo, cleanup determinista.
- `DuenoHome`, `TallerHome` y `CasosListPage` (recepción) reemplazan su `EmptyState`/tabla ad-hoc por `CasosList` + `useCasoRealtime`. `TallerHome` filtra `cobrado`/`cancelado` en el cliente como defensa en profundidad.
- 76 tests en verde, suite completa corrida 3 veces seguidas sin flakiness.

## Task Commits

1. **SemaforoBadge y CasosList compartida** - `3720557` (feat)
2. **Realtime + Dueño/Taller/Recepción comparten CasosList** - `2db1ef2` (feat)

## Files Created/Modified
- `src/features/casos/components/SemaforoBadge.tsx` + `.test.tsx` - semáforo de 9 etapas
- `src/features/casos/components/CasosList.tsx` + `.test.tsx` - lista compartida
- `src/features/casos/hooks/useCasoRealtime.ts` - suscripción Realtime única
- `src/features/dueno/DuenoHome.tsx`, `src/features/taller/TallerHome.tsx` - datos reales + Realtime
- `src/features/casos/CasosListPage.tsx` (+`.test.tsx`) - migrada a `CasosList`
- `src/app/roleHome.test.tsx` - mockea `useCasoRealtime`, espera async la carga de las 3 home

## Decisions Made
Ver `key-decisions` en el frontmatter.

## Deviations from Plan

**1. [No bloqueante] `CasosList` sin lógica de destino por estado en el `<action>` del plan**
- **Found during:** implementación de la task 2, al migrar `CasosListPage.tsx` de recepción a `CasosList`
- **Issue:** el `<action>` de la task 1 no menciona ningún `Link`/navegación para `CasosList`, pero `CasosListPage.tsx` (plan 02-02) ya tenía la regla "un caso en `'borrador'` navega a la ficha de inspección, el resto al detalle", probada en `CasosListPage.test.tsx`. Implementar `CasosList` con un link fijo a `/casos/{id}` (como quedó en la task 1) habría sido una regresión silenciosa de esa regla al migrar recepción a la task 2
- **Fix:** se agregó la misma lógica de destino dentro de `CasosList.tsx` antes de conectarla en `CasosListPage.tsx`
- **Verification:** `CasosListPage.test.tsx` sigue verificando ambos casos (borrador → ficha, resto → detalle)
- **Committed in:** `2db1ef2`

**2. [Inconsistencia del plan, no bloqueante] `<behavior>` de la task 1 menciona un prop `rolActual` en `CasosList` que el `<action>` nunca usa**
- **Issue:** la frase "`CasosList` recibe `casos: Caso[]` y `rolActual`" del bloque `<behavior>` no tiene contraparte en `<action>`, en `key_links`, ni en `artifacts` — ningún caso de uso pide una columna o comportamiento distinto por rol
- **Fix:** se siguió el `<action>` (autoritativo) sin agregar un prop sin uso real
- **Committed in:** `3720557`

**Total deviations:** 1 fix real (necesario, no bloqueante) + 1 inconsistencia de spec documentada sin impacto en el código.

## Issues Encountered
Ninguno nuevo más allá de lo ya conocido: `npm run build` (`tsc -b`) sigue siendo la verificación de tipos real, no `npx tsc --noEmit` suelto.

## User Setup Required
**Verificación humana pendiente (no ejecutable desde este entorno):** con al menos un caso real y 2 pestañas con roles distintos, confirmar que el semáforo se actualiza solo entre dispositivos sin recargar, que taller no ve `cobrado`/`cancelado`, y que un caso con 5+ días en la misma etapa se ve marcado como trabado. Requiere usuarios reales contra el Supabase de producción.

## Next Phase Readiness
- La Fase 2 (Caso de Seguro) queda funcionalmente completa de punta a punta: alta → inspección → envío → aprobación → turno → ingreso → semáforo visible por los 3 roles con actualización en tiempo real.
- **Pendiente real antes de dar la Fase 2 por cerrada:** las verificaciones humanas documentadas en `02-02`, `02-03` y este summary (ninguna ejecutada desde este entorno).

---
*Phase: 02-caso-de-seguro*
*Completed: 2026-08-27*
