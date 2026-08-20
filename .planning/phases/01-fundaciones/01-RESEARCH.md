# Phase 1: Fundaciones - Research

**Researched:** 2026-08-20
**Domain:** Supabase Auth + RLS role model, React + Vite SPA, responsive nav shell, Vercel deploy
**Confidence:** MEDIUM (core patterns cross-checked against official docs; some UI/layout guidance is general best-practice, not project-specific)

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions

**Auth y creación de usuarios**
- D-01: Los usuarios se crean vía una pantalla de invitación dentro de la app (no alta manual en el panel de Supabase) — Reversibility: reversible
- D-02: Pueden invitar usuarios tanto Dueño como Recepción. Solo Dueño puede asignar el rol "Dueño" a alguien
- D-03: Login con email + contraseña estándar (Supabase Auth), sin PIN ni mecanismo custom

**Roles y permisos**
- D-04: El rol se guarda en una tabla `profiles` propia en Supabase (vinculada al usuario de Auth por `id`), no en `user_metadata` — Reversibility: costly
- D-05: Esta tabla `profiles` es la base para Row Level Security en fases futuras (ej. ocultar facturado/cobrado a recepción y taller en Fase 5)

**Pantalla de inicio por rol**
- D-06: Dueño → tablero de casos (mismo listado con semáforo de estado que ven los demás roles), con acceso adicional a facturación desde ahí
- D-07: Recepción → agenda de turnos del día, con acceso rápido para crear un caso nuevo
- D-08: Taller → tablero de casos activos (en reparación / esperando repuesto), filtrado a lo que le toca al taller

**Navegación responsive**
- D-09: En PC/notebook: sidebar lateral fijo. En tablet: el mismo menú se convierte en barra de navegación inferior (patrón app móvil), pensado para uso táctil con el pulgar
- D-10: Tablet de referencia: tamaño grande (10-12", tipo iPad estándar) — no hace falta optimizar para tablets chicas de 7-8"

**Stack técnico**
- D-11: Supabase nuevo (proyecto separado de Lemmon Internet) para Auth + base de datos
- D-12: Frontend: React + Vite, SPA que se conecta directo a Supabase client-side
- D-13: Hosting del frontend: Vercel, deploy automático desde GitHub

### Claude's Discretion
Estructura exacta de la tabla `profiles` (columnas además de `role`), nombres de rutas/componentes, librería de routing (React Router u otra) y de UI base (Tailwind, etc.) — dentro de lo que ya fija el brief de diseño existente.

### Deferred Ideas (OUT OF SCOPE)
Ninguna — la discusión se mantuvo dentro del alcance de la fase (auth, roles, navegación, stack).
</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| AUTH-01 | Usuario inicia sesión y ve solo las secciones que corresponden a su rol (dueño, recepción o taller) | Supabase Auth email+password pattern, `profiles` table + trigger, RLS-backed role read, React Router role-guard pattern (see Architecture Patterns, Code Examples) |
| DISPOSITIVO-01 | El sistema se usa cómodamente tanto desde tablet (carga de fichas y fotos en el taller) como desde PC/notebook (oficina/recepción) | Responsive sidebar↔bottom-tab breakpoint pattern (see Architecture Patterns, Pattern 3) |
</phase_requirements>

## Summary

This phase is a textbook Supabase-Auth-as-BaaS problem with one deliberately constrained twist: the app must let two roles (Dueño, Recepción) create new users from inside the app itself, which requires the Supabase Admin API — an API that must never run with its privileged key in browser code. The standard, well-documented answer is a single Supabase Edge Function that sits between the SPA and the Admin API: it verifies the caller's identity and role using the anon key, then — and only then — uses the service-role key (stored purely as a server-side Edge Function secret) to create the new user. This keeps the "no separate backend server" constraint intact (the Edge Function lives *inside* the same new Supabase project, so infra stays 100% separated from Lemmon) while never exposing the privileged key.

The `profiles` table (role source of truth per D-04/D-05) is created via the standard `on auth.users insert → trigger → insert into profiles` pattern, with the role passed once through `user_metadata` at creation time and read from `profiles` forever after. The one pitfall that will matter a lot in Phase 5 (hiding facturado/cobrado by role) is RLS self-recursion: any policy on another table that looks up the caller's role in `profiles` must use a `SECURITY DEFINER` `plpgsql` function, not an inline subquery, or Postgres's RLS evaluation can recurse or the SECURITY DEFINER bypass can silently disappear via query-plan inlining. Establishing that pattern correctly now avoids a rewrite in Phase 5.

On the frontend: React 19 + Vite + `react-router` (the v8 package — `react-router-dom` is a legacy compatibility mirror, not the current recommendation for new projects) is the standard, lightweight stack. No state-management or data-fetching library is needed yet — a single `AuthProvider` React Context wrapping `supabase.auth.onAuthStateChange` plus a `profiles` row fetch is sufficient for phase 1's scope (login + role-gated shell). The sidebar↔bottom-tab responsive switch should be driven by one shared nav-items array and a single CSS breakpoint, matching the breakpoint (~820px) already used in `docs/index.html`, so the real app and the demo agree on where the layout flips.

**Primary recommendation:** React 19 + Vite + `react-router` v8 (declarative/data mode, no SSR) + Tailwind v4, talking directly to Supabase (Auth + Postgres/RLS), with exactly one Supabase Edge Function (`invite-user`) as the sole place the service-role key is used; deploy to Vercel with `VITE_`-prefixed env vars and an explicit `vercel.json` SPA rewrite.

## Architectural Responsibility Map

| Capability | Primary Tier | Secondary Tier | Rationale |
|------------|-------------|----------------|-----------|
| Login / session (AUTH-01) | API/Backend (Supabase Auth) | Browser/Client (session persistence, redirect-on-expiry) | Supabase Auth issues and validates the JWT; the SPA only holds/refreshes it |
| Role-based menu visibility (AUTH-01) | Browser/Client (conditional render by role) | Database/Storage (RLS is the real enforcement boundary) | UI hiding is UX only — the actual security boundary is RLS on data, not the menu |
| User invitation + role assignment (D-01/D-02) | API/Backend (Edge Function + service-role client) | Browser/Client (invite form UI) | Service-role key can only ever run server-side; Edge Function is the only tier that can hold it |
| `profiles` storage + RLS (D-04/D-05) | Database/Storage (Postgres + RLS policies) | — | Source of truth for role; must be enforceable independent of any client code |
| Responsive layout switch (DISPOSITIVO-01) | Browser/Client (CSS breakpoint + shared nav-items list) | — | Pure presentation concern, no backend involvement |
| Static asset hosting / deploy (D-13) | CDN/Static (Vercel) | — | Vite build output is a static bundle; Vercel serves + auto-deploys it from GitHub |

## Standard Stack

### Core

| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| react / react-dom | 19.2.8 [VERIFIED: npm registry, 2026-08-20] | UI runtime | Current stable major, required floor for react-router v8 |
| vite | 8.2.2 [VERIFIED: npm registry, 2026-08-20] | Build tool / dev server | De facto standard for new React SPAs, fast HMR |
| @supabase/supabase-js | 2.112.3 [VERIFIED: supabase.com/docs/reference/javascript/installing — `npm install @supabase/supabase-js`] | Supabase client (Auth + Postgres + Edge Functions invocation) | Official client, the only supported way to talk to Supabase from a browser |
| react-router | 8.3.0 [VERIFIED: reactrouter.com/upgrading/v7 — "React Router v8 removes the react-router-dom re-export package... new projects should install react-router"] | Client-side routing + role-gated route trees | Official recommendation for new projects since the v7→v8 package consolidation; `react-router-dom` is now a legacy mirror pinned at v7.18.2, not the forward path |
| tailwindcss + @tailwindcss/vite | 4.3.3 / (same package) [VERIFIED: tailwindcss.com/docs/installation/using-vite — `npm install tailwindcss @tailwindcss/vite`] | Utility CSS to encode the existing palette/typography system | v4's Vite plugin needs zero PostCSS config; existing palette (`docs/index.html`) can be mapped to Tailwind `@theme` CSS variables directly |

### Supporting

| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| vitest | 4.1.11 [VERIFIED: npm registry, 2026-08-20] | Unit/component test runner | For AuthProvider logic, role-guard component, and role→nav-items mapping (pure logic, no live Supabase needed) |
| @testing-library/react | 16.3.2 [VERIFIED: npm registry, 2026-08-20] | Component testing | Rendering the shell/nav with a mocked auth context per role |
| jsdom | 30.0.1 [VERIFIED: npm registry, 2026-08-20] | DOM environment for vitest | Required by vitest for component tests outside a real browser |

### Alternatives Considered

| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| Edge Function for invite | A tiny separate Node/Express server holding the service-role key | Would violate the project's "infra 100% separada" spirit less directly (it's still Sacabollos-only infra) but adds a second thing to host/deploy/monitor for a 3-user app — Edge Function is strictly less operational surface |
| `react-router` data mode | Plain declarative `<Routes>`/`<Route>` (no loaders) | Data mode composes more naturally with nested layouts (Sidebar/BottomTab wrapping role subtrees) and centralizes redirect logic; declarative mode is marginally simpler but pushes guard logic into every leaf route — data mode recommended given 3 distinct role home screens |
| Tailwind | Plain CSS / CSS Modules (as the existing `docs/index.html` demo already uses) | The demo's hand-rolled CSS is fine as a static mock but doesn't scale to a componentized app with 3 role-conditional layouts without a utility layer or a large custom stylesheet; Tailwind v4's `@theme` can import the existing CSS custom properties almost verbatim, so this is low-cost |
| `admin.createUser` (password, no email) | `admin.inviteUserByEmail` (magic-link email) | Email invite requires configuring SMTP/email deliverability (Supabase's built-in email service is rate-limited and meant for testing only) for zero benefit on a 3-person, in-person team; `createUser` avoids that entirely — see Pattern 2 below |

**Installation:**
```bash
npm create vite@latest . -- --template react
npm install @supabase/supabase-js react-router
npm install -D tailwindcss @tailwindcss/vite
npm install -D vitest @testing-library/react @testing-library/jest-dom jsdom
```

**Version verification:** All versions above confirmed via `npm view <pkg> version` against the live npm registry on 2026-08-20, cross-checked against official docs pages for the packages where the exact name mattered (Supabase JS client, react-router vs react-router-dom, Tailwind v4 Vite packages).

## Package Legitimacy Audit

| Package | Registry | Age (latest version) | Downloads/wk | Source Repo | Verdict | Disposition |
|---------|----------|----------------------|--------------|--------------|---------|-------------|
| react | npm | published 2026-07-21 | 143.9M | github.com/react/react | OK | Approved |
| react-dom | npm | published 2026-07-21 | 135.7M | github.com/react/react | OK | Approved |
| vite | npm | published 2026-08-20 (same day as this research) | 143.1M | github.com/vitejs/vite | SUS ("too-new") | Flagged — see note below |
| @supabase/supabase-js | npm | published 2026-08-11 | 21.1M | github.com/supabase/supabase-js | SUS ("too-new") | Flagged — see note below |
| react-router | npm | published 2026-07-22 | 43.6M | github.com/remix-run/react-router | SUS ("too-new") | Flagged — see note below |
| tailwindcss | npm | published 2026-07-16 | 106.0M | github.com/tailwindlabs/tailwindcss | OK | Approved |
| @tailwindcss/vite | npm | published 2026-07-16 | 39.0M | github.com/tailwindlabs/tailwindcss | OK | Approved |
| vitest | npm | published 2026-08-18 | 77.7M | github.com/vitest-dev/vitest | SUS ("too-new") | Flagged — see note below |
| @testing-library/react | npm | published 2026-01-19 | 45.9M | github.com/testing-library/react-testing-library | OK | Approved |
| @testing-library/jest-dom | npm | published 2026-08-09 | 51.7M | github.com/testing-library/jest-dom | SUS ("too-new") | Flagged — see note below |
| jsdom | npm | published 2026-07-29 | 79.2M | github.com/jsdom/jsdom | SUS ("too-new") | Flagged — see note below |

**Packages removed due to [SLOP] verdict:** none.

**Packages flagged as suspicious [SUS]:** `vite`, `@supabase/supabase-js`, `react-router`, `vitest`, `@testing-library/jest-dom`, `jsdom` — all flagged solely for the "too-new" heuristic (their *latest published version* is recent), not for any other risk signal. Every one of them has an official GitHub-org repo (vitejs, supabase, remix-run, vitest-dev, testing-library, jsdom) and tens of millions of weekly downloads — this is the expected shape for mainstream JS tooling that ships frequent releases, and reads as a heuristic false-positive rather than a real legitimacy concern. **The planner must still add one `checkpoint:human-verify` task before `npm install` covering this whole group**, so a human confirms these are the intended, official packages (not typosquats) before install — per protocol this cannot be skipped even though the evidence strongly favors "legitimate."

## Architecture Patterns

### System Architecture Diagram

```
┌─────────────────────────────┐
│   Browser (tablet or PC)    │
│  React SPA (Vite build)     │
│                              │
│  AuthProvider ── holds JWT   │
│      │                       │
│      ├─ role from profiles   │
│      │                       │
│  RequireRole(route) ─────────┼──> redirects to /login if no session
│      │                       │       or to own home if wrong role
│      ▼                       │
│  Sidebar (>=820px) /         │
│  BottomTabBar (<820px)  ─────┼──> same nav-items[], CSS-driven
│      │                       │
│      ▼                       │
│  Role home screen             │
│  (Dueño / Recepción / Taller) │
└──────────────┬───────────────┘
               │ HTTPS (anon key + user JWT)
               ▼
┌─────────────────────────────────────────┐
│           Supabase project (new)         │
│                                           │
│  Auth ── validates login, issues JWT     │
│    │                                     │
│    ▼ (on user insert)                    │
│  trigger on_auth_user_created            │
│    │ (SECURITY DEFINER, bypasses RLS)    │
│    ▼                                     │
│  profiles table ── role, full_name       │
│    ▲   RLS: select own row;              │
│    │   select-all for dueño/recepción;   │
│    │   role column: UPDATE not granted   │
│    │   to `authenticated` (see Pattern 2)│
│    │                                     │
│  Edge Function: invite-user  ────────────┼──> called by SPA (forwards caller JWT)
│    1. verify caller JWT (anon client)    │
│    2. read caller role from profiles     │
│    3. reject if not owner/reception,     │
│       or if role="dueno" & caller≠dueño  │
│    4. admin.createUser() (service-role   │
│       client — key lives only as an      │
│       Edge Function secret)              │
└─────────────────────────────────────────┘
```

### Recommended Project Structure
```
src/
├── app/
│   ├── AppRouter.tsx          # createBrowserRouter tree, role subtrees
│   └── routes.ts              # nav-items[] shared by Sidebar + BottomTabBar
├── auth/
│   ├── AuthProvider.tsx        # session + profile context, onAuthStateChange
│   ├── RequireRole.tsx         # route guard wrapper component
│   └── useAuth.ts
├── layout/
│   ├── AppShell.tsx            # picks Sidebar vs BottomTabBar via CSS/breakpoint hook
│   ├── Sidebar.tsx
│   └── BottomTabBar.tsx
├── features/
│   ├── login/LoginPage.tsx
│   ├── invite/InviteUserPage.tsx
│   ├── dueno/DuenoHome.tsx      # D-06
│   ├── recepcion/RecepcionHome.tsx  # D-07
│   └── taller/TallerHome.tsx    # D-08
├── lib/
│   └── supabaseClient.ts       # single createClient() instance, VITE_ env vars
└── styles/
    └── theme.css                # @theme mapping existing palette to Tailwind tokens
supabase/
├── functions/
│   └── invite-user/index.ts    # the one place the service-role key is used
└── migrations/
    └── 0001_profiles.sql        # table + trigger + RLS + column-grant
```

### Pattern 1: `profiles` table + creation trigger

**What:** A `public.profiles` row is created automatically the instant a new `auth.users` row appears, reading `role`/`full_name` from the metadata payload passed at creation time.
**When to use:** Any Supabase app that needs role data queryable/joinable outside the JWT (required here per D-04).

```sql
-- Source: pattern cross-checked across Supabase docs + community writeups
-- [CITED: supabase.com/docs/guides/auth/managing-user-data]
create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text not null,
  role text not null check (role in ('dueno','recepcion','taller')),
  created_at timestamptz not null default now()
);

alter table public.profiles enable row level security;

create function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id, full_name, role)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'full_name', ''),
    coalesce(new.raw_user_meta_data->>'role', 'taller')
  );
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();
```

Note on the `role` values: using ASCII `dueno`/`recepcion`/`taller` (not `dueño`) as the stored/check-constrained value, with `Dueño` only ever appearing as a UI display label, avoids encoding edge cases in a `CHECK` constraint and in TypeScript string-literal unions. This is a naming recommendation, not a verified external fact — flag for confirmation during planning if the team prefers the literal Spanish value in the DB.

### Pattern 2: preventing self-role-escalation (relevant now, critical for Phase 5)

**What:** RLS alone cannot cleanly express "a user may update their own row, except the `role` column." Two complementary techniques close this:
**When to use:** Any table where "who can read/write" depends on a role value that lives in a row the same user is otherwise allowed to touch.

```sql
-- 1. Column-level grant: `authenticated` role can update profiles rows they
--    own, but is never granted UPDATE on the `role` column at all — so no
--    RLS policy can accidentally leave a hole for self-promotion.
grant select, update (full_name) on public.profiles to authenticated;
-- role column is updated only by the service-role client, i.e. only from
-- inside the invite-user Edge Function.

create policy "profiles_select_own"
  on public.profiles for select
  using (auth.uid() = id);

create policy "profiles_update_own"
  on public.profiles for update
  using (auth.uid() = id);

-- 2. SECURITY DEFINER helper for role lookups from OTHER tables' policies
--    (this is the piece Phase 5 will reuse to hide facturado/cobrado).
--    LANGUAGE plpgsql (not sql) so Postgres cannot inline it away and
--    silently drop the SECURITY DEFINER bypass, which would otherwise
--    reintroduce recursive RLS evaluation on `profiles`.
create function public.current_user_role()
returns text
language plpgsql
security definer stable
set search_path = public
as $$
declare
  result text;
begin
  select role into result from public.profiles where id = auth.uid();
  return result;
end;
$$;

-- 3. Any privileged select-all needed now (e.g. to list users on the
--    invite screen) uses the helper, not an inline self-join on profiles:
create policy "profiles_select_all_for_admins"
  on public.profiles for select
  using (public.current_user_role() in ('dueno', 'recepcion'));
```

[CITED: pattern synthesized from dev.to/kanta13jp1 "Supabase RLS SECURITY DEFINER: Preventing Infinite Recursion in Admin Policies" and github.com/orgs/supabase/discussions/1138 — cross-referenced community writeups, not an official Supabase docs page; treat the *mechanism* (SECURITY DEFINER + plpgsql to avoid inlining) as MEDIUM confidence, verify against current Postgres/Supabase version behavior before relying on it in Phase 5.]

### Pattern 3: responsive sidebar ↔ bottom tab bar

**What:** One nav-items array, one layout component, one CSS breakpoint — not two parallel component trees.
**When to use:** Exactly this phase's DISPOSITIVO-01 requirement.

```tsx
// src/app/routes.ts
export const navItems = [
  { to: "/", label: "Casos", icon: CasesIcon, roles: ["dueno", "recepcion", "taller"] },
  { to: "/turnos", label: "Turnos", icon: CalendarIcon, roles: ["recepcion"] },
  { to: "/facturacion", label: "Facturación", icon: BillingIcon, roles: ["dueno"] },
  { to: "/invitar", label: "Invitar", icon: UserPlusIcon, roles: ["dueno", "recepcion"] },
];

// src/layout/AppShell.tsx
// Single breakpoint (matches docs/index.html's existing 820px breakpoint,
// see docs/index.html line ~643 `@media (max-width: 820px)`), same
// navItems.filter(role) list feeds both Sidebar and BottomTabBar so they
// can never drift out of sync with each other.
```

```css
/* styles/theme.css — CSS-only switch, no JS layout branching needed */
.app-shell { display: grid; grid-template-columns: 220px 1fr; }
.bottom-tab-bar { display: none; }

@media (max-width: 820px) {
  .app-shell { grid-template-columns: 1fr; }
  .sidebar { display: none; }
  .bottom-tab-bar { display: flex; position: fixed; bottom: 0; inset-inline: 0; }
}
```

[CITED: general responsive-nav best practice, cross-checked across multiple community sources (every-layout.dev "The Sidebar", mark-story.com "Building a responsive sidebar application layout") — LOW/MEDIUM confidence, no single canonical official source since this is a generic CSS pattern, not a library API]

### Anti-Patterns to Avoid
- **Hiding by UI only:** Rendering nav items conditionally is UX, not security. Any table/column that must stay hidden from a role (starting with facturado/cobrado in Phase 5) must be enforced by RLS/column grants, never by "the component just doesn't render it."
- **Role in a plain UPDATE-able column with a naive "own row" policy:** Without the column-level `GRANT`, a user could `PATCH` their own profile's `role` field directly via the anon key + PostgREST, since `auth.uid() = id` alone doesn't exclude specific columns.
- **Inlined role subqueries in RLS policies:** `using (role = (select role from profiles where id = auth.uid()))` inside a policy on the *same* table `profiles` (or on another RLS-protected table referencing `profiles`) is exactly the shape that causes recursion — always route through the `SECURITY DEFINER plpgsql` helper.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Password hashing/storage | Custom bcrypt/argon2 + users table | Supabase Auth (`auth.users`) | Supabase Auth already handles hashing, password reset flows, JWT issuance/refresh — reimplementing any of it is pure risk for zero benefit at this scale |
| Session/token refresh | Custom localStorage token + manual refresh timer | `supabase-js`'s built-in session handling + `onAuthStateChange` | The client library already auto-refreshes the JWT before expiry; a hand-rolled version would need to reverse-engineer Supabase's token lifecycle |
| Privileged user creation from the browser | Any client-side call using a service-role key, even "just for now" | Edge Function (`invite-user`) as the sole holder of the service-role key | There is no safe way to ship a service-role key to a browser bundle — it is not a hardening problem, it's a hard boundary |
| Access control enforcement | Checking role only in React components before showing/hiding UI | RLS policies (+ column-level grants for `role`) | UI-only checks are trivially bypassed by calling the REST/Postgres API directly with the anon key |

**Key insight:** Everything in this phase that looks like "just a small custom thing" (a hashed-password table, a temporary-invite-key workaround, a role-check-in-JSX-only) already has a first-class Supabase primitive that's both less code and strictly safer. The only genuinely custom code this phase needs is: the trigger function, the RLS policies/grants, the one Edge Function, and the React shell/guard components.

## Common Pitfalls

### Pitfall 1: RLS left disabled (or forgotten) on a new table
**What goes wrong:** A table created without `enable row level security` is fully readable/writable by anyone holding the anon key — which is meant to be public by design.
**Why it happens:** Supabase tables don't have RLS on by default when created via the SQL editor or a migration that forgets the `alter table ... enable row level security` line; it's easy to skip when moving fast.
**How to avoid:** Make `enable row level security` + at least one explicit policy part of the same migration file that creates any new table, starting with `profiles` in this phase. [CITED: a 2025 public disclosure found 303 exposed Supabase endpoints across 170 production apps, "almost always" traced to RLS being left off — medium.com/@Gakusen, guardlayer.io/blog/supabase-rls-disabled — MEDIUM confidence, cross-referenced across multiple independent write-ups]
**Warning signs:** Any table where `select * from <table>` succeeds using only the anon key from an unauthenticated context.

### Pitfall 2: Trusting a client-supplied `role` value inside the invite Edge Function
**What goes wrong:** If the Edge Function blindly writes whatever `role` the request body contains, a Recepción user could request `role: "dueno"` and get it, since the function itself (not the UI dropdown) is the actual authorization boundary.
**Why it happens:** It's tempting to assume "the UI only shows role options the current user is allowed to grant" is sufficient — it is not, since the HTTP request to the function can be crafted directly.
**How to avoid:** The Edge Function must independently re-check: is the caller `dueno` or `recepcion`? If the requested `role` is `"dueno"`, is the caller specifically `dueno`? Reject with 403 otherwise, regardless of what the UI would have sent. [CITED: dev.to/princetomarappdev "Role-Based Route Permissions" + supabase.com/docs Edge Functions guidance — server-side re-validation is the recurring theme across every source found]
**Warning signs:** Any privileged endpoint whose only authorization check happens in the frontend.

### Pitfall 3: RLS recursion when Phase 5 adds role checks on other tables
**What goes wrong:** Once a `casos` table (Phase 5) has a policy that looks up the caller's role by querying `profiles` inline, and `profiles` itself has RLS, Postgres can either recurse or (if using an inlinable `SQL` function meant to bypass RLS) silently lose the `SECURITY DEFINER` bypass via query-plan inlining.
**Why it happens:** This is a genuinely non-obvious Postgres/RLS interaction — it looks like it should just work, and does work in simple manual testing, until the planner or query shape changes.
**How to avoid:** Establish the `current_user_role()` `SECURITY DEFINER plpgsql` helper now (Pattern 2) and mandate every future cross-table role check goes through it, never an inline subquery.
**Warning signs:** A policy check that silently returns zero rows for a user who should have access, or a `"infinite recursion detected in policy"` Postgres error.

### Pitfall 4: Shared tablet session across roles
**What goes wrong:** If the taller's tablet stays logged in as whichever employee last used it, and nobody explicitly logs out, the wrong role's permissions/UI persist across shift changes — not a security hole per se (RLS still enforces per-user access), but a UX/audit-trail problem (actions get attributed to the wrong user).
**Why it happens:** Nothing in Supabase Auth forces a logout; sessions persist in `localStorage` by default until the refresh token expires or someone clicks logout.
**How to avoid:** Make "Cerrar sesión" prominent in both the sidebar and bottom tab bar (the existing demo already has this in the topbar — keep it visible, don't bury it), and consider whether the taller tablet should default to a shorter session lifetime. This is a UX/process recommendation, not something to hard-code without confirming with the owner.
**Warning signs:** Support requests like "the wrong name shows up on this ficha" once later phases add case authorship.

## Code Examples

### Invite-user Edge Function (skeleton)
```ts
// supabase/functions/invite-user/index.ts
// [ASSUMED — illustrative skeleton synthesized from documented patterns
// (blog.mansueli.com "Allowing users to invite others with Supabase Edge
// Functions", supabase.com/docs/reference/javascript/auth-admin-createuser).
// Confirm exact @supabase/supabase-js v2.112.x admin.createUser() signature
// against the installed package's types before implementing.]
import { createClient } from 'jsr:@supabase/supabase-js@2'

Deno.serve(async (req) => {
  const authHeader = req.headers.get('Authorization') ?? ''
  const supabaseUrl = Deno.env.get('SUPABASE_URL')!
  const anonKey = Deno.env.get('SUPABASE_ANON_KEY')!
  const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!

  const callerClient = createClient(supabaseUrl, anonKey, {
    global: { headers: { Authorization: authHeader } },
  })

  const { data: { user }, error: authError } = await callerClient.auth.getUser()
  if (authError || !user) {
    return new Response('Unauthorized', { status: 401 })
  }

  const { data: callerProfile } = await callerClient
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  const inviterRoles = ['dueno', 'recepcion']
  if (!callerProfile || !inviterRoles.includes(callerProfile.role)) {
    return new Response('Forbidden', { status: 403 })
  }

  const { email, full_name, role } = await req.json()

  if (role === 'dueno' && callerProfile.role !== 'dueno') {
    return new Response('Solo el dueño puede asignar el rol dueño', { status: 403 })
  }

  const admin = createClient(supabaseUrl, serviceKey)
  const tempPassword = crypto.randomUUID().replace(/-/g, '').slice(0, 12)

  const { data, error } = await admin.auth.admin.createUser({
    email,
    password: tempPassword,
    email_confirm: true,
    user_metadata: { full_name, role },
  })

  if (error) {
    return new Response(error.message, { status: 400 })
  }

  return new Response(JSON.stringify({ user: data.user, tempPassword }), {
    headers: { 'Content-Type': 'application/json' },
  })
})
```

### AuthProvider (React Context)
```tsx
// src/auth/AuthProvider.tsx
// [ASSUMED — standard supabase-js onAuthStateChange usage pattern,
// synthesized from official docs' general auth-state guidance;
// verify exact hook signature against installed supabase-js version.]
import { createContext, useContext, useEffect, useState } from 'react'
import { supabase } from '../lib/supabaseClient'

type Profile = { id: string; full_name: string; role: 'dueno' | 'recepcion' | 'taller' }
type AuthState = { session: any; profile: Profile | null; loading: boolean }

const AuthContext = createContext<AuthState>({ session: null, profile: null, loading: true })

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<AuthState>({ session: null, profile: null, loading: true })

  useEffect(() => {
    const { data: sub } = supabase.auth.onAuthStateChange(async (_event, session) => {
      if (!session) {
        setState({ session: null, profile: null, loading: false })
        return
      }
      const { data: profile } = await supabase
        .from('profiles')
        .select('id, full_name, role')
        .eq('id', session.user.id)
        .single()
      setState({ session, profile: profile ?? null, loading: false })
    })
    return () => sub.subscription.unsubscribe()
  }, [])

  return <AuthContext.Provider value={state}>{children}</AuthContext.Provider>
}

export const useAuth = () => useContext(AuthContext)
```

### vercel.json (SPA rewrite)
```json
{
  "rewrites": [{ "source": "/(.*)", "destination": "/index.html" }]
}
```
[CITED: vercel.com/docs/frameworks/frontend/vite — Vercel's own Vite framework preset documents this rewrite need for deep-link/hard-refresh 404s on client-routed SPAs]

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|---------------|--------|
| `react-router-dom` as the package to install | `react-router` (DOM APIs from `react-router/dom` subpath) | v7→v8 consolidation, react-router-dom pinned at 7.18.2 as compat mirror | New project setup instructions found in older tutorials/blog posts installing `react-router-dom` are already stale for this project's stack |
| Storing role in `user_metadata` and reading it from the JWT everywhere | A dedicated `profiles` table, metadata used only as a one-time transfer at creation | This project's own locked decision (D-04), not an industry-wide shift | Every future phase's RLS policy reads `profiles`, never `auth.users.raw_user_meta_data`, directly |
| PostCSS config + `tailwind.config.js` for Tailwind | `@tailwindcss/vite` plugin + CSS-native `@theme` | Tailwind v4 (2026) | No `tailwind.config.js` needed; theme customization (the project's fixed palette) lives in CSS |

**Deprecated/outdated:**
- `react-router-dom`: still installable and functional at v7.18.2 for existing projects, but is a dead-end package for anything new — do not let a tutorial/example lead the plan to install it.

## Assumptions Log

| # | Claim | Section | Risk if Wrong |
|---|-------|---------|---------------|
| A1 | Exact `admin.createUser()` / Edge Function code skeleton (parameter names, response shape) | Code Examples | Low — it's illustrative; executor must confirm against the installed `@supabase/supabase-js` version's types before writing the real function, small correction cost |
| A2 | `role` stored as ASCII (`dueno`/`recepcion`/`taller`) rather than the literal Spanish word | Pattern 1 | Low-medium — purely a naming convention; if the team wants literal `dueño` in the DB, changing the `CHECK` constraint values before any data exists is trivial, costly only if done after Phase 5 policies are written against the ASCII values |
| A3 | ~820px breakpoint for sidebar↔bottom-tab switch, matching `docs/index.html`'s existing breakpoint | Pattern 3 | Low — easy to tune once tested on the actual reference tablet; picked to stay consistent with the already-approved demo |
| A4 | SECURITY DEFINER + `plpgsql` (not `sql`) is required to avoid RLS recursion via query-plan inlining | Pattern 2, Pitfall 3 | Medium — this is community-sourced (not an official Supabase docs page), should be spot-checked against current Postgres behavior when Phase 5 actually builds the `casos` RLS policies, since Postgres/Supabase version behavior can shift this detail |
| A5 | `admin.createUser` (password, no email) is preferable to `inviteUserByEmail` for this 3-person, in-person team | Alternatives Considered | Low — reversible product decision; if the owner later wants proper email invites (e.g. hiring remotely), swapping to `inviteUserByEmail` doesn't require any `profiles`/RLS rework |

## Open Questions

1. **Should the invite screen require the new user to change their temp password on first login?**
   - What we know: Supabase has no built-in "must change password" flag; it would need custom logic (e.g. a `must_change_password` boolean on `profiles`, checked by a route guard).
   - What's unclear: Whether this MVP needs that friction for a 3-person team who will likely be told the temp password verbally/in person.
   - Recommendation: Skip for Phase 1 (`Claude's Discretion` scope allows this); revisit if the team grows past "everyone knows everyone."

2. **What Node version will Vercel build with?**
   - What we know: `react-router` v8's framework-mode floor is Node ≥22.22; this project uses declarative/data mode (no SSR), so the floor may be lower in practice, but has not been independently confirmed for non-framework mode.
   - What's unclear: Exact minimum Node version Vercel needs configured in project settings to avoid a build-time surprise.
   - Recommendation: Set Node 22.x explicitly in Vercel project settings regardless (local dev machine already runs Node 24.15, well above any plausible floor) — cheap insurance, no downside.

## Environment Availability

| Dependency | Required By | Available | Version | Fallback |
|------------|------------|-----------|---------|----------|
| Node.js | Vite build, all tooling | ✓ | v24.15.0 | — |
| npm | Package install | ✓ | 11.12.1 | — |
| git | Version control, Vercel auto-deploy from GitHub | ✓ | 2.54.0 | — |
| Supabase CLI | Local migrations/Edge Function dev (optional) | ✗ | — | Use `npx supabase <cmd>` ad hoc, or manage schema/functions via the Supabase dashboard SQL editor and dashboard Edge Function deploy UI |
| Vercel CLI | Local preview deploys (optional) | ✗ | — | D-13 already specifies GitHub-integration auto-deploy, which needs no local CLI at all — CLI is only needed for manual `vercel` preview pushes, not required for this phase |

**Missing dependencies with no fallback:** none.

**Missing dependencies with fallback:**
- Supabase CLI — use `npx supabase` or the dashboard; not a blocker since this phase's schema is small (one table, one trigger, a handful of policies, one Edge Function)
- Vercel CLI — not needed given the GitHub-integration deploy path already decided (D-13)

## Validation Architecture

### Test Framework
| Property | Value |
|----------|-------|
| Framework | Vitest 4.1.11 + @testing-library/react 16.3.2 (none installed yet — greenfield repo) |
| Config file | none yet — see Wave 0 |
| Quick run command | `npx vitest run` |
| Full suite command | `npx vitest run --coverage` |

### Phase Requirements → Test Map
| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| AUTH-01 | `RequireRole` redirects an unauthenticated user to `/login` | unit | `npx vitest run src/auth/RequireRole.test.tsx` | ❌ Wave 0 |
| AUTH-01 | `RequireRole` redirects a wrong-role user to their own home instead of rendering the child route | unit | `npx vitest run src/auth/RequireRole.test.tsx` | ❌ Wave 0 |
| AUTH-01 | Nav items rendered match the current role's allowed subset (`navItems.filter`) | unit | `npx vitest run src/app/routes.test.ts` | ❌ Wave 0 |
| AUTH-01 | Real login against Supabase (email+password) succeeds and redirects to role home | manual-only | — (requires live Supabase project + seeded test users; not worth mocking the full Auth flow for a 3-plan phase) | ❌ Wave 0 — manual QA checklist instead |
| DISPOSITIVO-01 | `AppShell` renders `Sidebar` above the breakpoint and `BottomTabBar` below it | unit (jsdom + resize/matchMedia mock) | `npx vitest run src/layout/AppShell.test.tsx` | ❌ Wave 0 |

### Sampling Rate
- **Per task commit:** `npx vitest run`
- **Per wave merge:** `npx vitest run --coverage`
- **Phase gate:** Full suite green before `/gsd-verify-work`, plus the manual login/invite checklist below (real Supabase Auth flows are out of scope for automated unit tests at this phase's size)

### Wave 0 Gaps
- [ ] `vitest.config.ts` / Vite `test` block — framework install: `npm install -D vitest @testing-library/react @testing-library/jest-dom jsdom`
- [ ] `src/test/setup.ts` — jest-dom matchers, any matchMedia mock needed for the breakpoint tests
- [ ] `src/auth/RequireRole.test.tsx` — covers AUTH-01
- [ ] `src/app/routes.test.ts` — covers AUTH-01 (nav filtering)
- [ ] `src/layout/AppShell.test.tsx` — covers DISPOSITIVO-01
- [ ] Manual QA checklist doc (not automated): "login as each of the 3 roles, confirm each only sees their own menu; invite a user as recepción, confirm 'dueño' role option is unavailable/rejected; invite a user as dueño with role=dueño, confirm success"

## Security Domain

### Applicable ASVS Categories

| ASVS Category | Applies | Standard Control |
|----------------|---------|-------------------|
| V2 Authentication | yes | Supabase Auth email+password — no custom password storage/hashing (D-03) |
| V3 Session Management | yes | `supabase-js` JWT + auto-refresh session handling; explicit logout button always visible (Pitfall 4) |
| V4 Access Control | yes | `profiles`-backed RLS + column-level grants (Pattern 2); UI role-gating is UX only, never the enforcement boundary |
| V5 Input Validation | yes | Edge Function independently re-validates `role` server-side regardless of client input (Pitfall 2); email format validated before `admin.createUser` |
| V6 Cryptography | yes | Never hand-roll — Supabase Auth handles password hashing; service-role key stored only as an Edge Function secret / Vercel env var, never in a `VITE_`-prefixed variable |

### Known Threat Patterns for this stack

| Pattern | STRIDE | Standard Mitigation |
|---------|--------|----------------------|
| Client tampers with invite request to request `role: "dueno"` | Elevation of Privilege | Edge Function re-checks caller's actual role from `profiles` server-side (Pitfall 2) |
| RLS left disabled on a new table | Information Disclosure | `enable row level security` + policy in the same migration that creates any table (Pitfall 1) |
| Self-role-escalation via direct PostgREST `PATCH` on own profile row | Tampering / Elevation of Privilege | Column-level `GRANT UPDATE (full_name)` excluding `role` (Pattern 2) |
| Edge Function invoked directly (bypassing the SPA) with a stolen/forged token | Spoofing | Function verifies the JWT itself via `auth.getUser()`, does not trust the platform's `verify_jwt` setting alone |
| Service-role key committed to a `VITE_`-prefixed env var or client bundle by mistake | Information Disclosure | Naming convention discipline: only `VITE_SUPABASE_URL` / `VITE_SUPABASE_ANON_KEY` are `VITE_`-prefixed; service-role key exists only as a Supabase Edge Function secret |

## Sources

### Primary (HIGH/MEDIUM confidence — official docs read this session)
- supabase.com/docs/reference/javascript/installing — confirmed `@supabase/supabase-js` package name and install command
- reactrouter.com/upgrading/v7 — confirmed `react-router` (not `react-router-dom`) is the recommended package for new projects, v8 removes the re-export
- tailwindcss.com/docs/installation/using-vite — confirmed `tailwindcss` + `@tailwindcss/vite` packages and `vite.config` setup
- vercel.com/docs/frameworks/frontend/vite (via search snippet) — SPA rewrite need for Vercel-hosted Vite apps

### Secondary (MEDIUM confidence — WebSearch cross-referenced against official doc URLs in the same query)
- supabase.com/docs/guides/auth/managing-user-data — profiles-table + trigger pattern
- supabase.com/docs/guides/database/postgres/row-level-security — RLS fundamentals
- supabase.com/docs/reference/javascript/auth-admin-inviteuserbyemail — admin invite API shape
- github.com/orgs/supabase/discussions/1327 — createUser vs inviteUserByEmail, no built-in temp-password mechanism

### Tertiary (LOW confidence — community blogs only, marked for spot-check during implementation)
- dev.to/kanta13jp1 "Supabase RLS SECURITY DEFINER: Preventing Infinite Recursion in Admin Policies"
- github.com/orgs/supabase/discussions/1138 — RLS recursion using a users table for role checks
- blog.mansueli.com "Allowing users to invite others with Supabase Edge Functions"
- every-layout.dev/layouts/sidebar, mark-story.com "Building a responsive sidebar application layout" — generic responsive nav CSS pattern
- medium.com/@Gakusen, guardlayer.io/blog/supabase-rls-disabled — RLS-disabled incident data

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — package names/versions confirmed against live npm registry and official docs read this session
- Architecture (profiles/trigger/RLS): MEDIUM — core mechanism confirmed via official Supabase docs guidance found in search, but the specific SECURITY DEFINER/recursion nuance (Pattern 2, Pitfall 3) rests on community sources, not an official docs page read directly
- Responsive layout pattern: LOW-MEDIUM — this is generic CSS/UX best practice, not a library-specific fact; no single canonical source exists to verify against
- Pitfalls: MEDIUM — RLS-disabled and role-escalation pitfalls are well-documented and cross-referenced across multiple independent sources

**Research date:** 2026-08-20
**Valid until:** 2026-09-19 (30 days — stack is fast-moving (react-router v8, Tailwind v4, Supabase Edge Functions all shipped/changed recently), re-verify package versions if planning is delayed)
