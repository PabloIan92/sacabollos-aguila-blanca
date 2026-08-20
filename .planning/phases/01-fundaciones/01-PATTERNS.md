# Phase 1: Fundaciones - Pattern Map

**Mapped:** 2026-08-20
**Files analyzed:** 20 (new)
**Analogs found:** 0 code analogs / 20 — **greenfield repo, no existing app code**

## Repo state (important context for the planner)

This is a brand-new project. The only pre-existing files are:
- `docs/index.html` — static, hand-rolled HTML/CSS mock demo (no JS framework, no components, no build step). Useful **only as a visual/UX reference** (palette, typography, layout language, breakpoint value) — it is not a code pattern to copy logic from.
- `docs/proyecto.html` — roadmap page, irrelevant to implementation.
- `docs/flujos-originales/*` — business-domain reference images/transcript, not code.
- `.claude/CLAUDE.md`, `README.md` — project meta docs.
- `assets/logo-aguila-blanca.jpg`, `docs/assets/logo-aguila-blanca.jpg` — logo asset, reusable as-is (copy file, no pattern needed).

There is **no** React, Supabase, Vite, router, or test code anywhere in the repo yet. Every file below has **no codebase analog** — the planner must build these from the Standard Stack / Architecture Patterns / Code Examples in `01-RESEARCH.md`, which are the primary source of truth for this phase (not this document). This PATTERNS.md exists mainly to (a) confirm there is nothing to copy from, (b) pin down the one legitimate visual-reference reuse (palette/typography/breakpoint from `docs/index.html`), and (c) give the planner a single consistent file classification table so plans don't duplicate/skip files.

## File Classification

| New File | Role | Data Flow | Closest Analog | Match Quality |
|----------|------|-----------|-----------------|----------------|
| `package.json`, `vite.config.ts`, `tsconfig*.json` | config | — | none | no analog (greenfield) |
| `vercel.json` | config | — | none | no analog — use RESEARCH.md Code Examples verbatim |
| `supabase/migrations/0001_profiles.sql` | migration | CRUD (schema) | none | no analog — use RESEARCH.md Pattern 1 + Pattern 2 SQL verbatim |
| `supabase/functions/invite-user/index.ts` | service (Edge Function) | request-response | none | no analog — use RESEARCH.md "Invite-user Edge Function" skeleton, must add server-side role re-validation per Pitfall 2 |
| `src/lib/supabaseClient.ts` | config/utility | — | none | no analog — single `createClient()` per official supabase-js docs, `VITE_`-prefixed env vars only |
| `src/auth/AuthProvider.tsx` | provider | event-driven (auth state) | none | no analog — use RESEARCH.md "AuthProvider" code example verbatim as starting point |
| `src/auth/useAuth.ts` | hook | — | none | no analog — trivial `useContext` wrapper, see AuthProvider example |
| `src/auth/RequireRole.tsx` | component (route guard) | request-response (redirect) | none | no analog — build from Architecture Diagram: unauth → `/login`; wrong role → own role home |
| `src/features/login/LoginPage.tsx` | component | request-response | `docs/index.html` (visual only — login screen markup/palette) | visual-reference only, no code pattern |
| `src/features/invite/InviteUserPage.tsx` | component | request-response (calls Edge Function) | none | no analog — form posts to `invite-user` function; UI must restrict "dueño" option per D-02 (advisory only, Edge Function is the real gate — Pitfall 2) |
| `src/app/routes.ts` | config (nav-items array) | — | none | no analog — use RESEARCH.md Pattern 3 `navItems` array verbatim as starting shape |
| `src/app/AppRouter.tsx` | route | request-response | none | no analog — `createBrowserRouter` tree per RESEARCH.md Recommended Project Structure |
| `src/layout/AppShell.tsx` | component | — | none | no analog — CSS-breakpoint-driven Sidebar/BottomTabBar switch, single `navItems` source (Pattern 3) |
| `src/layout/Sidebar.tsx` | component | — | `docs/index.html` topbar (visual only) | visual-reference only — demo has no sidebar; palette/spacing/type only |
| `src/layout/BottomTabBar.tsx` | component | — | none | no analog anywhere (demo has no bottom-tab concept at all) |
| `src/features/dueno/DuenoHome.tsx` | component | request-response | `docs/index.html` dashboard/case-list markup (visual only) | visual-reference only |
| `src/features/recepcion/RecepcionHome.tsx` | component | request-response | none | no analog (agenda/turnos view doesn't exist in demo) |
| `src/features/taller/TallerHome.tsx` | component | request-response | `docs/index.html` dashboard/case-list markup (visual only) | visual-reference only |
| `src/styles/theme.css` | config (Tailwind `@theme`) | — | `docs/index.html` `:root` CSS variables | **direct value reuse** — copy palette variables verbatim, remap to Tailwind v4 `@theme` tokens |
| `src/test/setup.ts`, `src/auth/RequireRole.test.tsx`, `src/app/routes.test.ts`, `src/layout/AppShell.test.tsx` | test | — | none | no analog — no test infra exists yet; Vitest config is greenfield (see RESEARCH.md Wave 0 Gaps) |

## Pattern Assignments

### `src/styles/theme.css` (config, Tailwind v4 `@theme`)

**Analog:** `docs/index.html` lines 11-22 (`:root` block) — this is the one genuine, direct-copy asset in the whole phase.

**Palette to copy verbatim** (`docs/index.html:11-22`):
```css
:root {
  --graphite: #1b1d21;
  --steel-100: #eef1f3;
  --steel-300: #d3d9de;
  --navy: #123a6b;
  --blue: #1c4f8c;
  --red: #c0272d;
  --brass: #b3792f;
  --green: #3f7d4f;
  --white: #ffffff;
  --shadow: 0 16px 36px rgba(27, 29, 33, 0.12);
}
```
Remap each into a Tailwind v4 `@theme` block (e.g. `--color-navy: #123a6b;`) so utility classes like `bg-navy` become available — do not hand-roll a parallel CSS-variable system alongside Tailwind tokens.

**Typography to copy** (`docs/index.html:9`):
```html
<link href="https://fonts.googleapis.com/css2?family=IBM+Plex+Mono:wght@500;600;700&family=IBM+Plex+Sans:wght@400;500;600;700&family=Oswald:wght@600;700&display=swap" rel="stylesheet">
```
Font roles observed in the demo: `Oswald` for brand/headings (`docs/index.html:86` `.brand-title`), `IBM Plex Sans` as body font (`docs/index.html:31`), `IBM Plex Mono` for chips/labels/mono accents (`docs/index.html:96-98`, `.role-chip` at `:112`).

**Breakpoint value to reuse** (`docs/index.html:643`):
```css
@media (max-width: 820px) { ... }
```
This confirms RESEARCH.md's Assumption A3 (820px) — the demo's breakpoint only reflows grids to single-column at this width; it does **not** implement a sidebar↔bottom-tab switch (the demo only has a sticky top `.topbar`, no side nav at all). The Sidebar/BottomTabBar component pair itself has no precedent in this repo and must be built fresh from RESEARCH.md Pattern 3.

**Anti-patterns already avoided in the demo, keep avoiding:**
- No pill-shaped badges, no gradients — confirmed by scanning the CSS: state indicators use bordered/mono chips (`.role-chip`, `.ghost-button` selectors at `docs/index.html:118-120`), not rounded pill components.

---

### Everything else — no analog, build from RESEARCH.md

For every other file in the classification table, RESEARCH.md is the sole source of pattern truth:
- SQL: use **Pattern 1** (`profiles` table + trigger, RESEARCH.md lines ~218-249) and **Pattern 2** (RLS/column-grant/`current_user_role()` helper, lines ~258-298) verbatim as the starting migration.
- Edge Function: use the **Invite-user Edge Function skeleton** (RESEARCH.md lines ~382-441), but the planner must add the Pitfall 2 re-validation explicitly — the skeleton as printed does check caller role, keep that logic, don't strip it during implementation.
- `AuthProvider`/`useAuth`: use the **AuthProvider (React Context)** code example (RESEARCH.md lines ~444-480) verbatim as a starting point; verify hook signature against the installed `@supabase/supabase-js` version per the file's own `[ASSUMED]` marker.
- Nav/layout: use **Pattern 3** `navItems` array + CSS-only Sidebar/BottomTabBar switch (RESEARCH.md lines ~307-333).
- `vercel.json`: use the exact snippet in RESEARCH.md (lines ~483-487).

## Shared Patterns

### Role-gating is UI-only convenience, never the security boundary
**Source:** RESEARCH.md "Anti-Patterns to Avoid" + Pitfall 2
**Apply to:** `RequireRole.tsx`, `InviteUserPage.tsx`, `Sidebar.tsx`/`BottomTabBar.tsx` nav filtering, `DuenoHome`/`RecepcionHome`/`TallerHome`
All of these may hide/redirect based on `profile.role` for UX, but the actual enforcement for `profiles.role` writes lives in the Postgres grant (Pattern 2) and, for the invite flow, in the Edge Function's own re-check — never trust a client-side role check as sufficient.

### Single source of nav items
**Source:** RESEARCH.md Pattern 3 (`src/app/routes.ts`)
**Apply to:** `Sidebar.tsx`, `BottomTabBar.tsx`, `AppShell.tsx`
Both nav renderings must read from the same `navItems` array/filter — do not hand-write two parallel lists that can drift.

### `VITE_`-prefix discipline for env vars
**Source:** RESEARCH.md Security Domain, "Service-role key committed to a VITE_-prefixed env var" threat row
**Apply to:** `src/lib/supabaseClient.ts`, `vercel.json`/Vercel project env config, `supabase/functions/invite-user/index.ts`
Only `VITE_SUPABASE_URL` / `VITE_SUPABASE_ANON_KEY` are `VITE_`-prefixed (browser-exposed); `SUPABASE_SERVICE_ROLE_KEY` must only ever exist as a Supabase Edge Function secret, never as a Vercel/browser env var.

## No Analog Found

All 20 files above have no codebase analog (greenfield repo). This is expected and not a gap in the search — confirmed by directory listing (`find . -not -path "./.git/*" -not -path "./.planning/*" -type f`) showing only static HTML/docs/assets, zero `.ts`/`.tsx`/`.jsx` application files anywhere in the repo. The planner should treat RESEARCH.md's Architecture Patterns and Code Examples sections as the primary implementation reference for every file, and treat `docs/index.html` strictly as the visual/palette/breakpoint reference called out above — not as a code pattern.

## Metadata

**Analog search scope:** entire repo (`C:/Users/54934/Desktop/saca bollos`, excluding `.git/` and `.planning/`)
**Files scanned:** 15 (full repo file listing) + targeted read of `docs/index.html` (lines 1-120, 628-658)
**Pattern extraction date:** 2026-08-20
