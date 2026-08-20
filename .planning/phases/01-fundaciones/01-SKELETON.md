# Walking Skeleton — Sistema de Gestión Sacabollos Aguila Blanca

**Phase:** 1 (Fundaciones)
**Generated:** 2026-08-20
**Status:** contract — later phases build on these decisions, they do not re-litigate them

## Capability Proven End-to-End

> Un usuario real que existe en `public.profiles` entra con su email y contraseña en la URL de producción de Vercel y ve su propio nombre y su propio rol, leídos en vivo de Postgres a través de RLS.

Ese round-trip toca todas las capas que el proyecto va a usar durante las 6 fases: navegador → SPA React → `@supabase/supabase-js` → Supabase Auth (JWT) → PostgREST → Postgres con RLS → de vuelta a la pantalla. Si ese camino funciona, cada rebanada vertical posterior (casos, fichas, facturación) es una expansión, no una apuesta arquitectónica.

## Architectural Decisions

| Decision | Choice | Rationale |
|---|---|---|
| Framework | React 19.2.8 + Vite 8.2.2, SPA sin SSR | D-12. App interna detrás de login: no hay caso de uso de SEO/SSR. Vite da HMR rápido y un bundle estático que Vercel sirve sin runtime propio |
| Lenguaje | TypeScript (template `react-ts`) | Las fichas de las fases 2-4 tienen decenas de campos obligatorios; el tipado es la red de seguridad más barata |
| Routing | `react-router` 8.3.0 (paquete consolidado, data mode) | Los 3 subárboles por rol se expresan como rutas anidadas con un guard en el layout, no con un `if` en cada hoja |
| Data layer | Supabase gestionado (Postgres) accedido directo desde el cliente con la anon key | D-11 / D-12. Sin backend propio que mantener; RLS es el límite de seguridad real |
| Auth | Supabase Auth, email + contraseña (D-03) | Sin PIN ni mecanismo custom. Nunca se hashea una contraseña a mano |
| Fuente de verdad del rol | Tabla `public.profiles` (columna `role`), no `user_metadata` (D-04/D-05) | Consultable y joineable desde políticas RLS de otras tablas — es la base del "solo el dueño ve facturado vs. cobrado" de la Fase 5 |
| Escritura privilegiada | Una única Edge Function `invite-user` como único portador de la service-role key | No existe forma segura de poner esa clave en un bundle de navegador. La función vive dentro del mismo proyecto Supabase, así que la infra sigue 100% separada de Lemmon |
| Estilos | Tailwind v4 (`@tailwindcss/vite`) con `@theme` que importa la paleta de `docs/index.html` | La paleta y las 3 tipografías ya están aprobadas por el dueño; Tailwind v4 las expresa como tokens CSS nativos sin `tailwind.config.js` |
| Breakpoint responsive | 820px, un solo breakpoint, switch por CSS | D-09/D-10. Mismo valor que ya usa `docs/index.html:643`, así demo y app real no se contradicen |
| Deployment target | Vercel, auto-deploy desde GitHub (`PabloIan92/sacabollos-aguila-blanca`) | D-13. Separado de la infra de Lemmon. `docs/` sigue publicándose como demo en GitHub Pages sin interferir |
| Test runner | Vitest 4.1.11 + @testing-library/react + jsdom | Lógica pura (guard de rol, filtrado de nav, breakpoint) testeable sin Supabase en vivo |
| Directory layout | `src/{app,auth,layout,features,lib,ui,styles}` + `supabase/{migrations,functions,seed}` | Feature-folders por rol; `src/ui` para primitivas visuales compartidas |

## Stack Touched in Phase 1

- [ ] Project scaffold — Vite + React 19 + TS + Tailwind v4 + Vitest (plan 01-01, task 2)
- [ ] Routing — `/login`, `/` (index por rol), `/invitar` (plans 01-01 → 01-04)
- [ ] Database — escritura real (`INSERT` en `profiles` vía trigger al crear el usuario) **y** lectura real (`select` del propio perfil bajo RLS) (plans 01-01, 01-04)
- [ ] UI — formulario de login real conectado a Supabase Auth, más el formulario de invitación que llama a la Edge Function (plans 01-01, 01-04)
- [ ] Deployment — build de producción corriendo en la URL de Vercel, verificada con `curl` y con un login real desde una tablet (plan 01-01, task 4)

## Out of Scope (Deferred to Later Slices)

Explícito para que fases futuras no reabran la minimalidad de la Fase 1:

- Cualquier dato de negocio: casos, fichas, turnos, repuestos, facturación (Fases 2-5). Las 3 home por rol de esta fase muestran su estado vacío definitivo, nada más.
- Layout de lista "poblada" y reglas de singular/plural para las home por rol — depende de datos reales, es Fase 2+ por diseño (ver `01-UI-SPEC.md` §UI Considerations, filas `populated` y `zero-one-many`).
- Recuperación de contraseña / "olvidé mi contraseña" — no está en el alcance de CONTEXT.md, no se agrega.
- Invitación por email con magic link (`inviteUserByEmail`) — se eligió contraseña temporal comunicada en persona (RESEARCH.md A5). No se configura SMTP.
- Obligar cambio de contraseña temporal en el primer login — RESEARCH.md Open Question 1, descartado para un equipo de 3 personas que se conocen.
- MFA, políticas de expiración de sesión custom, baja/desactivación de usuarios.
- Componente `Stamp` (sello de estado rotado): sus colores se fijan como tokens en `theme.css` en esta fase, pero el componente se construye en la Fase 2, donde aparece su primer estado real que estampar (`01-UI-SPEC.md` declara la Status Stamp Palette como "informational for this phase").
- PWA / service worker / uso offline, compresión de imágenes en el cliente, Supabase Storage — todo eso entra con las fotos de las fichas (Fase 2+).
- TanStack Query, React Hook Form, Zod, Fabric.js: el `.claude/CLAUDE.md` del proyecto los lista para el stack general, pero ninguno tiene consumidor en esta fase. Se incorporan cuando llegue el formulario/canvas que los justifique.

## Subsequent Slice Plan

Cada fase agrega una rebanada vertical sobre este esqueleto sin alterar sus decisiones arquitectónicas:

- **Phase 2 — Caso de Seguro:** primera tabla de negocio (`casos`) con RLS que consulta el rol a través de `public.current_user_role()`; primer upload a Storage; primer canvas de bosquejo.
- **Phase 3 — Caso Particular:** reutiliza la máquina de estados y la coordinación de turno de la Fase 2.
- **Phase 4 — Reparación y Stock:** ficha de trabajo + estado "esperando repuesto" reflejado en el semáforo.
- **Phase 5 — Facturación y Cobros:** el caso de uso que justifica `profiles` como tabla (D-05): política RLS a nivel columna/tabla que oculta facturado/cobrado a recepción y taller, escrita sobre `current_user_role()`.
- **Phase 6 — CRM:** vistas de cliente/aseguradora/productor con historial, leyendo los casos que ya generaron las fases anteriores.
