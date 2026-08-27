---
phase: 02-caso-de-seguro
plan: 03
subsystem: casos
tags: [react, react-router, supabase-storage, forms]

requires: [02-02-caso-de-seguro]
provides:
  - CasoDetailPage con transicion 'enviado a la aseguradora' -> 'aprobado' -> 'turno coordinado'
  - RecepcionHome ("Turnos de hoy") con agenda real filtrada por turno_fecha del dia
  - FichaIngresoPage (Ficha 2) con sus propias 4 fotos (prefijo ingreso-) y transicion a 'ingresado'
affects: [02-04-caso-de-seguro]

tech-stack:
  added: []
  patterns: ["type predicate en el filter de RecepcionHome para narrowear turno_fecha a string sin cast manual", "FotoUploader reusado tal cual, solo cambiando el array de angulos con prefijo"]

key-files:
  created: [src/features/casos/CasoDetailPage.tsx, src/features/casos/CasoDetailPage.test.tsx, src/features/casos/FichaIngresoPage.tsx, src/features/casos/FichaIngresoPage.test.tsx, src/features/recepcion/RecepcionHome.test.tsx]
  modified: [src/app/AppRouter.tsx, src/app/roleHome.test.tsx, src/features/recepcion/RecepcionHome.tsx]

key-decisions:
  - "CasoDetailPage no renderiza ningun control de transicion fuera de 'enviado a la aseguradora' y 'aprobado' -- los estados posteriores a 'ingresado' no tienen accion en esta fase (Fases 4/5), evitando el anti-patron de un boton sin destino"
  - "RecepcionHome filtra por fecha de calendario (anio/mes/dia local), no por igualdad de timestamp, para que un turno a cualquier hora de hoy aparezca en la agenda"
  - "FichaIngresoPage reusa FotoUploader sin modificarlo, pasandole angulos con prefijo ingreso- -- buildFotoPath ya sabe formar casos/{id}/ingreso-{angulo}.webp porque recibe el angulo completo"

patterns-established:
  - "Las paginas de detalle que dependen del estado actual del caso (CasoDetailPage, FichaIngresoPage) devuelven early sin exponer ningun formulario cuando el estado no habilita esa accion, en vez de deshabilitar controles sueltos"

requirements-completed: [CASOS-05, FICHAS-02, FICHAS-04]

duration: single session (2026-08-26)
completed: 2026-08-26
---

# Phase 2: Caso de Seguro — Plan 03 Summary

**Turno coordinado desde el detalle del caso, agenda real de "Turnos de hoy", y Ficha de ingreso al taller con sus propias 4 fotos**

## Performance

- **Duration:** sesion unica (2026-08-26)
- **Completed:** 2026-08-26
- **Tasks:** 2 de 2
- **Files modified:** 5 creados, 3 modificados

## Accomplishments
- `CasoDetailPage`: en `'enviado a la aseguradora'` muestra "Marcar orden de trabajo recibida" (-> `'aprobado'`); en `'aprobado'` muestra el input de turno + "Confirmar turno" (-> `'turno coordinado'`, seteando `turno_fecha`). Ningun otro estado muestra controles.
- `RecepcionHome`: reemplaza el `EmptyState` fijo de la Fase 1 por la agenda real (`listCasos()` filtrado por `turno_fecha` de hoy, ordenado por hora), con fallback al mismo `EmptyState` si no hay turnos.
- `FichaIngresoPage`: formulario de Ficha 2 solo visible para casos en `'turno coordinado'` (aviso simple en cualquier otro estado); reusa `FotoUploader` con los 4 angulos `ingreso-*`, sin pisar las fotos de la Ficha de inspeccion; "Registrar ingreso" bloqueado hasta 4 fotos + numero de orden; confirma con `updateCasoEstado(id, 'ingresado', { orden_ingreso_numero, ingresado_at })`.
- 54 -> 58 tests totales, todos en verde, suite completa corrida 3 veces seguidas sin flakiness.

## Task Commits

1. **Detalle de caso (aprobado/turno) + agenda real de turnos** - `e7fb6de` (feat)
2. **Ficha de ingreso al taller con 4 fotos propias** - `3aaf200` (feat)

## Files Created/Modified
- `src/features/casos/CasoDetailPage.tsx` + `.test.tsx` - detalle con transiciones de estado
- `src/features/recepcion/RecepcionHome.tsx` + `.test.tsx` (nuevo) - agenda real de turnos
- `src/features/casos/FichaIngresoPage.tsx` + `.test.tsx` - Ficha de ingreso
- `src/app/AppRouter.tsx` - rutas `/casos/:id` y `/casos/:id/ficha-ingreso`
- `src/app/roleHome.test.tsx` - mockea `listCasos` (antes `RecepcionHome` no llamaba a la API)

## Decisions Made
Ver `key-decisions` en el frontmatter.

## Deviations from Plan
Ninguna deviation bloqueante esta vez -- no se repitio el patron de `created_by` de 02-02. Se ajusto `roleHome.test.tsx` como consecuencia directa y esperada del cambio de comportamiento de `RecepcionHome` (ya no es un `EmptyState` estatico), no un bloqueante del plan.

## Issues Encountered
Ninguno nuevo. Se aplico la misma leccion de la sesion anterior: la verificacion de tipos confiable es `npm run build` (`tsc -b`), no `npx tsc --noEmit` suelto desde la raiz.

## User Setup Required
**Verificacion humana pendiente (no ejecutable desde este entorno):** el plan pide, con un caso real en `'turno coordinado'`, confirmar en la app real que "Registrar ingreso" se habilita solo con las 4 fotos + numero de orden, que el estado pasa a `'ingresado'` en `/casos`, y que las fotos de la Ficha de inspeccion original quedan intactas (no pisadas por las de ingreso). Requiere un usuario `recepcion` real contra el Supabase de produccion.

## Next Phase Readiness
- El plan 02-04 (semaforo de estado + Realtime en las 3 home) puede apoyarse en `CasosListPage` y en las 3 home (`DuenoHome`, `RecepcionHome`, `TallerHome`) para agregar el semaforo visual y la suscripcion en tiempo real.
- **Pendiente real:** la verificacion humana descripta arriba.

---
*Phase: 02-caso-de-seguro*
*Completed: 2026-08-26*
