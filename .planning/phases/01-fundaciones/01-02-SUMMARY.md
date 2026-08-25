---
phase: 01-fundaciones
plan: 02
subsystem: ui
tags: [react-router, tailwind, responsive, rbac]

requires:
  - phase: 01-fundaciones/01-01
    provides: AuthProvider, useAuth, Profile type
provides:
  - navItems array unico + navItemsForRole, guardia de ruta por rol (RequireRole), shell responsive (Sidebar/BottomTabBar/Topbar), FullScreenError
affects: [01-03-fundaciones, 02-caso-de-seguro]

tech-stack:
  added: []
  patterns: ["breakpoint unico de 820px via matchMedia, no CSS-only", "un solo array de nav items compartido por Sidebar y BottomTabBar"]

key-files:
  created: [src/app/routes.ts, src/auth/RequireRole.tsx, src/auth/RedirectIfAuthenticated.tsx, src/app/AppRouter.tsx, src/layout/AppShell.tsx, src/layout/Topbar.tsx, src/layout/Sidebar.tsx, src/layout/BottomTabBar.tsx, src/ui/FullScreenError.tsx]
  modified: [src/App.tsx, src/auth/AuthProvider.tsx]

key-decisions:
  - "El filtrado de menu por rol es comodidad de interfaz, no control de acceso — el limite real son las politicas RLS y el GRANT de columna del plan 01-01"
  - "Mientras loading es true, AppShell no monta ni Sidebar ni BottomTabBar para que nunca se vea el menu del rol equivocado"
  - "profileError distinguido de loading en AuthProvider — sesion sin fila de profiles muestra FullScreenError con Reintentar/Cerrar sesion, no un shell roto"

patterns-established:
  - "navItemsForRole(role) es la unica fuente de items — Sidebar y BottomTabBar nunca definen su propia lista"
  - "Items con available:false se renderizan deshabilitados con 'Disponible en la proxima entrega', nunca como link a ruta inexistente"

requirements-completed: [AUTH-01, DISPOSITIVO-01]

duration: ~90min
completed: 2026-08-25
---

# Phase 1: Fundaciones — Plan 02 Summary

**Shell responsive con guardia de rol: sidebar de 220px en PC, barra inferior de 56px en tablet, switch en 820px via matchMedia**

## Performance

- **Duration:** ~90 min (incluye el fix del bug de redirect encontrado en verificacion)
- **Completed:** 2026-08-25
- **Tasks:** 3 de 3 (routing+guardia, shell responsive, camino de error de perfil)
- **Files modified:** 9 nuevos, 2 modificados

## Accomplishments
- `navItemsForRole` unico, filtra Casos/Facturacion/Invitar por rol con banderas de disponibilidad
- `RequireRole` guarda toda la ruta protegida (sin sesion -> /login, rol equivocado -> home propia)
- Shell responsive verificado con capturas reales en 1280px (sidebar) y 700px (barra inferior)
- `FullScreenError` + `AuthProvider.profileError`/`retryProfile` para el caso de perfil no cargado
- **Bug real encontrado y arreglado**: `/login` nunca redirigia a `/` tras login exitoso

## Task Commits

1. **routes.ts + RequireRole + AppRouter** - `54ebf0f` (feat)
2. **AppShell + Topbar + Sidebar + BottomTabBar** - `54ebf0f` (feat)
3. **FullScreenError + profileError en AuthProvider** - `54ebf0f` (feat)
4. **Fix: RedirectIfAuthenticated** - `54ebf0f` (fix, mismo commit)

_Nota: las 4 tasks quedaron en un solo commit (`54ebf0f`) porque se implementaron y verificaron juntas en la misma sesion, no task por task con commits atomicos separados como pide el flujo estandar de GSD._

## Files Created/Modified
- `src/app/routes.ts` - navItems + navItemsForRole
- `src/auth/RequireRole.tsx` - guardia de ruta por rol
- `src/auth/RedirectIfAuthenticated.tsx` - guardia inversa para /login (no estaba en el plan original, se agrego para el bug)
- `src/layout/AppShell.tsx` - layout con switch de breakpoint via matchMedia
- `src/layout/Topbar.tsx` - marca + chip de rol + cerrar sesion con confirmacion
- `src/layout/Sidebar.tsx` / `BottomTabBar.tsx` - navegacion por rol
- `src/ui/FullScreenError.tsx` - pantalla de error a pagina completa

## Decisions Made
Ver `key-decisions` en el frontmatter.

## Deviations from Plan

**1. [Blocking] `/login` no redirigia tras login exitoso — no estaba previsto en el plan original**
- **Found during:** verificacion con Chrome DevTools contra el build de produccion
- **Issue:** ninguna ruta redirigia de `/login` a `/` cuando ya habia sesion; el usuario se autenticaba pero se quedaba viendo el formulario
- **Fix:** `src/auth/RedirectIfAuthenticated.tsx`, con 3 tests
- **Verification:** login real en produccion + recarga de pagina, confirmado con navegador automatizado
- **Committed in:** `54ebf0f`

---

**Total deviations:** 1 auto-fixed (blocking, encontrado por verificacion real, no por los tests unitarios)
**Impact on plan:** necesario — sin esto el login no servia para nada en la practica.

## Issues Encountered
- El logo referenciado por Topbar (`/assets/logo-aguila-blanca.jpg`) vivia en `assets/` (raiz del repo) y no en `public/assets/` — Vite no lo servia. Se copio a `public/assets/`.

## User Setup Required
Ninguno.

## Next Phase Readiness
- El shell y la guardia de rol estan listos para que 01-03 monte las 3 home reales, y para que 02-caso-de-seguro agregue rutas nuevas dentro del mismo arbol protegido.

---
*Phase: 01-fundaciones*
*Completed: 2026-08-25*
