---
phase: 260827-six-add-missing-navigation-link-to-casos-id-
plan: 01
type: execute
wave: 1
depends_on: []
files_modified: [src/features/casos/CasoDetailPage.tsx, src/features/casos/CasoDetailPage.test.tsx]
autonomous: true
requirements: [QUICK-FIX]
must_haves:
  truths:
    - "When a caso is in estado 'turno coordinado', CasoDetailPage renders a visible button/link to navigate to the Ficha de Ingreso screen"
    - "Clicking that control navigates to /casos/{id}/ficha-ingreso (the existing recepcion-only route already wired in AppRouter.tsx)"
    - "The 'enviado a la aseguradora' and 'aprobado' branches keep behaving exactly as before (no regression)"
    - "No control for 'turno coordinado' is shown for any other estado"
  artifacts:
    - path: "src/features/casos/CasoDetailPage.tsx"
      provides: "New estado === 'turno coordinado' branch using useNavigate to reach ficha-ingreso"
      contains: "turno coordinado"
    - path: "src/features/casos/CasoDetailPage.test.tsx"
      provides: "Test case covering the new branch and its navigation"
      contains: "ficha-ingreso"
  key_links:
    - from: "src/features/casos/CasoDetailPage.tsx"
      to: "/casos/{id}/ficha-ingreso"
      via: "useNavigate() call from react-router, triggered by PrimaryButton onClick"
      pattern: "navigate\\(`/casos/\\$\\{caseId\\}/ficha-ingreso`\\)"
---

<objective>
Add the missing navigation entry point from `CasoDetailPage` to `/casos/:id/ficha-ingreso` for casos in `estado === 'turno coordinado'`.

Root cause (already diagnosed and verified live in production, do not re-diagnose): `CasoDetailPage.tsx` has a branch for `estado === 'enviado a la aseguradora'` (orden recibida button) and a branch for `estado === 'aprobado'` (turno form), but no branch at all for `estado === 'turno coordinado'`. The destination route `/casos/:id/ficha-ingreso` exists in `AppRouter.tsx` under the `recepcion`-only `RequireRole`, and `FichaIngresoPage.tsx` is fully implemented and only requires `caso.estado === 'turno coordinado'` to render its form — but nothing in the app ever links to it, so recepción can only reach it by typing the URL manually.

Purpose: Give recepción a working click path from the caso detail view to the ficha de ingreso screen once a turno is confirmed, so the 4 arrival photos can actually be uploaded through the UI.

Output: `CasoDetailPage.tsx` renders a `PrimaryButton` that navigates to `/casos/${caseId}/ficha-ingreso` when `caso.estado === 'turno coordinado'`, plus a new test case in `CasoDetailPage.test.tsx` covering it.
</objective>

<execution_context>
@$HOME/.claude/get-shit-done/workflows/execute-plan.md
@$HOME/.claude/get-shit-done/templates/summary.md
</execution_context>

<context>
@.planning/STATE.md
@src/features/casos/CasoDetailPage.tsx
@src/features/casos/CasoDetailPage.test.tsx

<interfaces>
Current CasoDetailPage.tsx (relevant excerpt — the two existing estado branches to mirror, and imports already present):

```tsx
import { useEffect, useState } from 'react'
import { useParams } from 'react-router'
import { Ficha } from '../../ui/Ficha'
import { PrimaryButton } from '../../ui/PrimaryButton'
import { getCaso, updateCasoEstado } from './api'
import type { Caso } from './types'

// ... caseId derived from useParams id ...

{caso.estado === 'enviado a la aseguradora' && (
  <PrimaryButton onClick={handleOrdenRecibida} disabled={actualizando}>
    Marcar orden de trabajo recibida
  </PrimaryButton>
)}

{caso.estado === 'aprobado' && (
  <Ficha>
    {/* turno_fecha input + Confirmar turno button */}
  </Ficha>
)}
```

`useNavigate` is not currently imported in `CasoDetailPage.tsx` (only `useParams` is). It IS already used elsewhere in this exact codebase for the identical pattern (button click -> navigate to a caso sub-route), in `src/features/casos/CasoNuevoPage.tsx`:

```tsx
import { useNavigate } from 'react-router'
// ...
const navigate = useNavigate()
// ...
navigate(`/casos/${caso.id}/ficha-inspeccion`)
```

Route already registered in `src/app/AppRouter.tsx` (do not modify this file — route exists, only the link to it is missing):
`{ path: '/casos/:id/ficha-ingreso', element: <FichaIngresoPage /> }` nested under `<RequireRole roles={['recepcion']} />`.

`FichaIngresoPage.tsx` only requires `caso.estado === 'turno coordinado'` to render its form (otherwise shows "Este caso todavía no tiene un turno coordinado."), so no additional precondition needs to be checked before linking to it.

Existing test file structure (CasoDetailPage.test.tsx) — follow this exact pattern for the new test: a `caso()` factory with `estado` overrides, `renderPage()` using `MemoryRouter` + `Routes` + `Route path="/casos/:id"`, and `describe('CasoDetailPage', ...)` with one `it(...)` per estado branch. The third existing test ("en cualquier otro estado no muestra ningún control de transición") uses `estado: 'ingresado'` and asserts neither of the two existing controls render — this test does NOT need to change, since it does not touch `turno coordinado`.
</interfaces>
</context>

<tasks>

<task type="auto" tdd="true">
  <name>Task 1: Add turno coordinado navigation branch to CasoDetailPage</name>
  <files>src/features/casos/CasoDetailPage.tsx, src/features/casos/CasoDetailPage.test.tsx</files>
  <behavior>
    - Test 1: When `getCaso` resolves a caso with `estado: 'turno coordinado'`, `CasoDetailPage` renders a button (e.g. `screen.getByRole('button', { name: 'Registrar ingreso al taller' })`) and does NOT render the "Marcar orden de trabajo recibida" button or the `Turno` input.
    - Test 2: Clicking that button navigates to `/casos/{id}/ficha-ingreso` — verify via a sibling `<Route path="/casos/:id/ficha-ingreso" element={<div>FICHA INGRESO PLACEHOLDER</div>} />` added to the test's `renderPage()` `Routes`, then asserting `await screen.findByText('FICHA INGRESO PLACEHOLDER')` appears after the click (same pattern already used in `FichaIngresoPage.test.tsx` for its own post-navigation assertion).
    - Existing Test 3 ("en cualquier otro estado...", `estado: 'ingresado'`) must keep passing unmodified — it implicitly proves the new branch does not leak into other estados.
  </behavior>
  <action>
In `CasoDetailPage.tsx`: add `useNavigate` to the existing `import { useParams } from 'react-router'` line (making it `import { useNavigate, useParams } from 'react-router'`), call `const navigate = useNavigate()` alongside the existing `useParams` destructuring, and add a new conditional block immediately after the `caso.estado === 'aprobado'` block:

`{caso.estado === 'turno coordinado' && (<PrimaryButton onClick={() => navigate(`/casos/${caseId}/ficha-ingreso`)}>Registrar ingreso al taller</PrimaryButton>)}`

Use the exact same `PrimaryButton` component already imported, and reference `caseId` (already derived earlier in the component from `id`) — do not introduce a second navigation hook or duplicate the `caseId` derivation. Do not touch `AppRouter.tsx`, `FichaIngresoPage.tsx`, or any other estado branch in this file.

In `CasoDetailPage.test.tsx`: add a new `it(...)` inside the existing `describe('CasoDetailPage', ...)` block implementing Test 1 + Test 2 from `<behavior>` above. Update `renderPage()`'s `<Routes>` to include the extra placeholder route for `/casos/:id/ficha-ingreso` (additive only — existing `<Route path="/casos/:id" element={<CasoDetailPage />} />` and all 3 existing tests must be unaffected by this addition).
  </action>
  <verify>
    <automated>npm test -- --run src/features/casos/CasoDetailPage.test.tsx</automated>
  </verify>
  <done>All 4 tests in CasoDetailPage.test.tsx pass (3 pre-existing + 1 new), the new test asserts both the button's presence for `turno coordinado` and successful navigation to `/casos/:id/ficha-ingreso` on click, and `CasoDetailPage.tsx` contains the new branch calling `navigate(`/casos/${caseId}/ficha-ingreso`)`.</done>
</task>

<task type="auto">
  <name>Task 2: Full verification pass</name>
  <files>src/features/casos/CasoDetailPage.tsx, src/features/casos/CasoDetailPage.test.tsx</files>
  <action>
Run the project's full build, test, and typecheck scripts to confirm the change introduces no regressions anywhere else in the codebase (not just the one test file touched in Task 1). Do not modify any files in this task unless one of these commands surfaces an error directly caused by Task 1's change — if so, fix only that error and re-run.
  </action>
  <verify>
    <automated>npm run build && npm run test && npm run typecheck</automated>
  </verify>
  <done>`npm run build`, `npm run test`, and `npm run typecheck` all exit 0 with the new branch and test case in place.</done>
</task>

</tasks>

<threat_model>
## Trust Boundaries

| Boundary | Description |
|----------|-------------|
| recepcion-authenticated client -> client-side route navigation | Purely client-side `useNavigate()` call; the actual authorization boundary is enforced server-side by Supabase RLS on the `casos` table/storage and by `RequireRole roles={['recepcion']}` already wrapping this route in `AppRouter.tsx` |

## STRIDE Threat Register

| Threat ID | Category | Component | Disposition | Mitigation Plan |
|-----------|----------|-----------|-------------|-----------------|
| T-quick-01 | Elevation of Privilege | New navigation button in CasoDetailPage | accept | The target route `/casos/:id/ficha-ingreso` is already gated by `RequireRole roles={['recepcion']}` in `AppRouter.tsx` (unmodified by this plan) and `FichaIngresoPage` itself refuses to render its form unless `caso.estado === 'turno coordinado'`; adding a link to an already-guarded, already-implemented route introduces no new access path |
| T-quick-02 | Tampering | `caseId` used in navigate() template string | accept | `caseId` is derived from `useParams<{ id: string }>()`, the same value already used unmodified by the two pre-existing sibling branches (`handleOrdenRecibida`, `handleConfirmarTurno`) in this file to call `updateCasoEstado(caseId, ...)` — no new untrusted input path is introduced |
</threat_model>

<verification>
Run `npm test -- --run src/features/casos/CasoDetailPage.test.tsx` to confirm the 4 CasoDetailPage tests pass in isolation, then run `npm run build && npm run test && npm run typecheck` (Task 2) to confirm the whole project is still green.

Out of scope, explicitly not touched by this plan (per user constraints): the `CasosList.tsx` patente-link role-permission bug, the missing `listFotos()` call on mount in `FichaInspeccionPage`/`FichaIngresoPage`, and Fase 3 work.
</verification>

<success_criteria>
- `CasoDetailPage.tsx` renders a working navigation control to `/casos/:id/ficha-ingreso` when `caso.estado === 'turno coordinado'`, and only then
- The three pre-existing estado branches (`enviado a la aseguradora`, `aprobado`, and the "no control" default case) behave exactly as before
- `CasoDetailPage.test.tsx` has a passing test proving both the button's conditional render and its navigation effect
- `npm run build`, `npm run test`, and `npm run typecheck` all pass
</success_criteria>

<output>
Create `.planning/quick/260827-six-add-missing-navigation-link-to-casos-id-/260827-six-SUMMARY.md` when done
</output>
