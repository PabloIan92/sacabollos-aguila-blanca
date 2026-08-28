---
phase: 260827-six-add-missing-navigation-link-to-casos-id-
plan: 01
subsystem: frontend-navigation
tags: [navigation, recepcion, caso-detail, bugfix]
dependency-graph:
  requires: []
  provides: ["navigation entry point from CasoDetailPage to /casos/{id}/ficha-ingreso for turno coordinado"]
  affects: ["src/features/casos/CasoDetailPage.tsx", "src/features/casos/CasoDetailPage.test.tsx"]
tech-stack:
  added: ["useNavigate hook from react-router in CasoDetailPage"]
  patterns: ["client-side route navigation via useNavigate(), same pattern used in CasoNuevoPage.tsx"]
key-files:
  created: []
  modified: ["src/features/casos/CasoDetailPage.tsx", "src/features/casos/CasoDetailPage.test.tsx"]
decisions: []
metrics:
  duration: "~15 min"
  completed: "2026-08-27"
---

# Quick Task 260827-six: Add missing navigation link to Ficha de Ingreso from CasoDetailPage Summary

Root cause: `CasoDetailPage.tsx` had conditional branches for `estado === 'enviado a la aseguradora'` (button to mark orden recibida) and `estado === 'aprobado'` (turno form), but **no branch at all for `estado === 'turno coordinado'`**. The destination route `/casos/:id/ficha-ingreso` already existed in `AppRouter.tsx` under `RequireRole roles={['recepcion']}` and `FichaIngresoPage.tsx` was fully implemented — it only required `caso.estado === 'turno coordinado'` to render its form. But nothing in the app ever linked to it, so recepción could only reach it by typing the URL manually.

## What Was Built

**Task 1: Add turno coordinado navigation branch** (2 files, 1 commit)
- `src/features/casos/CasoDetailPage.tsx`:
  - Added `useNavigate` import from `react-router` (was already using `useParams`)
  - Called `const navigate = useNavigate()` alongside existing `useParams` destructuring
  - Added new conditional block after the `aprobado` branch:
    ```tsx
    {caso.estado === 'turno coordinado' && (
      <PrimaryButton onClick={() => navigate(`/casos/${caseId}/ficha-ingreso`)}>
        Registrar ingreso al taller
      </PrimaryButton>
    )}
    ```
- `src/features/casos/CasoDetailPage.test.tsx`:
  - Added placeholder route `/casos/:id/ficha-ingreso` to test's `renderPage()` Routes
  - Added new test case: "en 'turno coordinado' muestra el botón de registrar ingreso y navega a ficha de ingreso"
  - Test asserts: button renders with name "Registrar ingreso al taller", neither "Marcar orden de trabajo recibida" nor `Turno` input render, click navigates to ficha-ingreso placeholder

**Task 2: Full verification pass**
- `npm run build` ✓
- `npm run test` ✓ (77 tests, 16 files, including the 4 CasoDetailPage tests)
- `npm run typecheck` ✓

## Deviations from Plan

None — plan executed exactly as written. The existing test "en cualquier otro estado no muestra ningún control de transición" (using `estado: 'ingresado'`) kept passing unmodified, implicitly proving the new branch does not leak into other estados.

## Verification

```
npm test -- --run src/features/casos/CasoDetailPage.test.tsx
→ Test Files  1 passed (1)
→ Tests  4 passed (4)

npm run build
→ ✓ built in 3.17s

npm run test
→ Test Files  16 passed (16)
→ Tests  77 passed (77)

npm run typecheck
→ (no output = success)
```

The new test asserts both the button's conditional render for `turno coordinado` and successful navigation to `/casos/:id/ficha-ingreso` on click.

## Commits

- `3c33d49` — feat(260827-six): add navigation link to ficha de ingreso from caso detail

## Self-Check: PASSED

- FOUND: `src/features/casos/CasoDetailPage.tsx` contains the new `turno coordinado` branch calling `navigate(\`/casos/${caseId}/ficha-ingreso\`)`
- FOUND: `src/features/casos/CasoDetailPage.test.tsx` has the new test case covering the branch
- FOUND: commit 3c33d49 in `git log --oneline --all`
- All automated verification commands exit 0