---
phase: 01-fundaciones
plan: 03
subsystem: ui
tags: [react, empty-state]

requires:
  - phase: 01-fundaciones/01-02
    provides: AppShell, RequireRole, navItemsForRole
provides:
  - EmptyState reusable, RoleHome (dispatcher por rol), DuenoHome/RecepcionHome/TallerHome con estados vacios definitivos
affects: [02-caso-de-seguro]

tech-stack:
  added: []
  patterns: ["EmptyState recibe icono/titulo/cuerpo por props, compartido por las 3 home"]

key-files:
  created: [src/ui/EmptyState.tsx, src/app/roleHome.ts, src/features/dueno/DuenoHome.tsx, src/features/recepcion/RecepcionHome.tsx, src/features/taller/TallerHome.tsx]
  modified: [src/app/AppRouter.tsx]

key-decisions:
  - "roleHome.ts es .ts (no .tsx) y usa React.createElement en vez de JSX, siguiendo la extension que pedia el plan original"
  - "El CTA 'Nuevo caso' de recepcion queda presente pero deshabilitado con 'Disponible en la proxima entrega' — nunca ausente ni cableado a una ruta inexistente"
  - "Rol no reconocido (defensivo, aunque el CHECK de la base ya lo impide) cae en el mismo FullScreenError que el plan 01-02 definio para perfil sin cargar"

patterns-established:
  - "Las 3 home comparten la ruta / y RoleHome es el unico punto de despacho por rol"

requirements-completed: [AUTH-01, DISPOSITIVO-01]

duration: ~40min
completed: 2026-08-25
---

# Phase 1: Fundaciones — Plan 03 Summary

**Home por rol (Casos activos / Turnos de hoy / Casos activos) con estados vacios definitivos, verificado con Chrome DevTools en produccion**

## Performance

- **Duration:** ~40 min (parte del mismo bloque de trabajo que 01-02)
- **Completed:** 2026-08-25
- **Tasks:** 2 de 2 (home del dueño con EmptyState+roleHome, home de recepcion y taller)
- **Files modified:** 5 nuevos, 1 modificado

## Accomplishments
- `EmptyState` reusable con icono/titulo/cuerpo por props
- `RoleHome` despacha por `profile.role` a `DuenoHome`/`RecepcionHome`/`TallerHome`, sin adivinar para roles invalidos
- Copy exacta de los 3 estados vacios: "Todavia no hay casos cargados", "No hay turnos para hoy", "No hay casos en el taller todavia"
- CTA "Nuevo caso" de recepcion presente y deshabilitado, no navegable
- Verificado con navegador real: el dueño aterriza en "CASOS ACTIVOS" con su estado vacio tras loguearse

## Task Commits

1. **EmptyState + roleHome + DuenoHome** - `54ebf0f` (feat)
2. **RecepcionHome + TallerHome** - `54ebf0f` (feat)

_Nota: mismo commit que 01-02 — se implementaron shell+homes juntos en la misma sesion de trabajo._

## Files Created/Modified
- `src/ui/EmptyState.tsx` - borde punteado steel-300, icono+titulo+cuerpo centrados
- `src/app/roleHome.ts` - dispatcher por rol
- `src/features/dueno/DuenoHome.tsx`, `recepcion/RecepcionHome.tsx`, `taller/TallerHome.tsx`

## Decisions Made
Ver `key-decisions` en el frontmatter.

## Deviations from Plan
None - plan ejecutado como estaba escrito.

## Issues Encountered
None.

## User Setup Required
Ninguno.

## Next Phase Readiness
- Las 3 home quedan listas para que 02-caso-de-seguro (02-04, semaforo de estado) reemplace el `EmptyState` de cada una por el listado real de casos, reutilizando el diseño ya validado por el dueño en `docs/tablero.html`.
- **No verificado a mano en tablet fisica** (solo con navegador automatizado en distintos anchos) — pendiente no bloqueante.

---
*Phase: 01-fundaciones*
*Completed: 2026-08-25*
