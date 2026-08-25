---
phase: 01-fundaciones
plan: 01
subsystem: auth
tags: [supabase, postgres, rls, react, vite, tailwind, vercel]

requires: []
provides:
  - Vite+React+TS+Tailwind v4 scaffold with brand tokens and UI primitives (Ficha, TextField, PrimaryButton)
  - public.profiles table + RLS + on_auth_user_created trigger + current_user_role() helper, pushed to live Supabase
  - Real login (src/lib/supabaseClient.ts, src/auth/AuthProvider.tsx, src/features/login/LoginPage.tsx) deployed to Vercel production
affects: [01-02-fundaciones, 01-03-fundaciones, 02-caso-de-seguro]

tech-stack:
  added: [react@19.2.8, vite@8.2.2, "@supabase/supabase-js@2.112.3", react-router@8.3.0, tailwindcss@4.3.3, vitest@4.1.11, lucide-react]
  patterns: ["single supabaseClient instance", "role in public.profiles not user_metadata", "current_user_role() in plpgsql to avoid RLS recursion"]

key-files:
  created: [src/lib/supabaseClient.ts, src/auth/AuthProvider.tsx, src/auth/useAuth.ts, src/features/login/LoginPage.tsx, supabase/migrations/0001_profiles.sql, supabase/seed/0001-promote-first-dueno.sql, src/ui/Ficha.tsx, src/ui/TextField.tsx, src/ui/PrimaryButton.tsx, src/styles/theme.css]
  modified: []

key-decisions:
  - "Rol vive en public.profiles (FK a auth.users), no en user_metadata — consultable desde RLS de otras tablas"
  - "current_user_role() en plpgsql (no sql) para que el planificador no la inlinee y rompa el security definer"
  - "GRANT de escritura a authenticated acotado solo a la columna full_name — el rol nunca es escribible via PostgREST"
  - "Cuenta Vercel separada de la personal de Pablo (Team 'aguila-blanca', login via Bitbucket con el email del taller) para poder transferirle la propiedad al dueño mas adelante"

patterns-established:
  - "Toda pantalla de error muestra copy fija en español, nunca el mensaje crudo de Supabase/Postgres"
  - "El breakpoint --breakpoint-tablet: 820px es el unico switch responsive del proyecto"

requirements-completed: [AUTH-01]

duration: multi-session (2026-08-20 scaffold, 2026-08-24/25 infra+login real)
completed: 2026-08-25
---

# Phase 1: Fundaciones — Plan 01 Summary

**Login real con Supabase Auth + profiles/RLS, desplegado en produccion Vercel — round-trip verificado con Chrome DevTools, no solo con tests**

## Performance

- **Duration:** repartido en varias sesiones (scaffold 2026-08-20, infra+login 2026-08-24/25)
- **Completed:** 2026-08-25
- **Tasks:** 4 de 4 (gate de paquetes, scaffold, migracion, login real+deploy)
- **Files modified:** ~15

## Accomplishments
- Gate de legitimidad de 6 paquetes npm "too-new" aprobado por el humano
- Scaffold Vite+React+TS+Tailwind v4 con paleta/tipografias de la demo aprobada
- Migracion `0001_profiles.sql` (tabla + RLS + trigger + helper + GRANT de columna) pusheada y verificada en Supabase vivo (GET anonimo devuelve `[]`)
- Login real (`signInWithPassword`) implementado desde cero — el `App.tsx` que quedo de una sesion anterior era un demo estatico sin ningun `onClick` ni import de Supabase
- Deploy de produccion en Vercel (cuenta separada `aguila-blanca`), usuario dueño creado y promovido
- Verificado con Chrome DevTools real (no solo curl/tests): formulario, error de credenciales, login exitoso, persistencia de sesion

## Task Commits

1. **Scaffold Vite+React+Tailwind** - `c41214e` (feat)
2. **Migracion profiles+RLS** - `4c2440e` (feat)
3. **Login real + fix redirect** - `ca44008` (feat), `ca44008`-adjacent fix in 01-02 commit for RedirectIfAuthenticated

## Files Created/Modified
- `src/lib/supabaseClient.ts` - unica instancia de createClient()
- `src/auth/AuthProvider.tsx` - contexto de sesion/perfil, suscripto a onAuthStateChange
- `src/features/login/LoginPage.tsx` - login real con validacion, estados de carga y error
- `supabase/migrations/0001_profiles.sql` - tabla profiles + RLS + trigger + helper + GRANT
- `supabase/seed/0001-promote-first-dueno.sql` - promocion del primer usuario a dueno

## Decisions Made
Ver `key-decisions` en el frontmatter.

## Deviations from Plan

**1. [Blocking] El login real nunca se habia implementado en codigo**
- **Found during:** verificacion en produccion pedida por el usuario ("no funciona el boton de login")
- **Issue:** una sesion anterior solo hizo el scaffold visual (Task 2); Task 4 (login real) quedo documentada como "bloqueada por config externa" en el README pero el codigo nunca se escribio
- **Fix:** se implemento `supabaseClient.ts`, `AuthProvider`, `useAuth`, `LoginPage` completos, con 5 tests nuevos
- **Verification:** Chrome DevTools contra produccion real
- **Committed in:** `ca44008`

**2. [Blocking] `/login` no redirigia tras un login exitoso**
- **Found during:** prueba con Chrome DevTools del shell completo (plan 01-02)
- **Issue:** al implementar el router, `/login` quedo como ruta standalone sin guardia inversa — el usuario se autenticaba pero se quedaba viendo el formulario
- **Fix:** `src/auth/RedirectIfAuthenticated.tsx`
- **Committed in:** `54ebf0f`

---

**Total deviations:** 2 auto-fixed (ambos bloqueantes, encontrados por verificacion real en navegador)
**Impact on plan:** ninguno es scope creep — ambos eran huecos de funcionalidad que el plan original ya pedia cerrar.

## Issues Encountered
- 29 tests unitarios en verde no atraparon el bug del redirect porque mockeaban `useAuth` y nunca ejercitaban el router real — encontrado recien probando el build de produccion con Chrome DevTools.

## User Setup Required
Ninguno pendiente para este plan — Supabase y Vercel ya estan configurados y verificados en vivo. Credenciales en archivo local fuera del repo (ver memoria `reference_aguila_blanca_credenciales`).

## Next Phase Readiness
- Login real end-to-end listo para que 02-caso-de-seguro construya sobre `useAuth()`/`profile.role`.
- **Pendiente real:** el plan 01-04 (alta de usuarios desde la app via Edge Function `invite-user`) nunca se ejecuto — el unico usuario que existe (`dueno`) se creo a mano via Admin API. No bloquea la Fase 2.

---
*Phase: 01-fundaciones*
*Completed: 2026-08-25*
