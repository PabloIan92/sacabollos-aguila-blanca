# Restauración del frontend Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Restaurar la interfaz operativa aprobada de Aguila Blanca y documentar el arreglo en GitHub sin alterar los flujos del negocio.

**Architecture:** Se usa `afdb1e0` como referencia visual y contractual porque es el commit inmediatamente anterior a los dos rediseños causantes de la regresión. La restauración se aplica como un commit nuevo y selectivo sobre los archivos que esos rediseños modificaron; el historial no se reescribe.

**Tech Stack:** React 19, TypeScript 6, Vite 8, Tailwind CSS 4, Vitest, React Testing Library.

## Global Constraints

- No modificar Supabase, migraciones, RLS, rutas ni máquina de estados.
- Mantener la paleta y tipografías de taller aprobadas en `afdb1e0`.
- No agregar dependencias.
- Documentar causa, alcance y verificación en `README.md`.

---

### Task 1: Prueba de regresión visual y contractual

**Files:**
- Modify: `src/features/login/LoginPage.test.tsx`
- Modify: `src/layout/AppShell.test.tsx`

**Interfaces:**
- Consumes: comportamiento público de `PrimaryButton` y `Topbar` en `afdb1e0`.
- Produces: pruebas que exigen la etiqueta `Ingresando…` y el cierre de sesión visible en el topbar.

- [ ] **Step 1: Restaurar primero las dos pruebas desde la referencia aprobada**

```powershell
git restore --source=afdb1e0 -- src/features/login/LoginPage.test.tsx src/layout/AppShell.test.tsx
```

- [ ] **Step 2: Ejecutar las pruebas y confirmar RED**

```powershell
$env:VITE_SUPABASE_URL='https://example.supabase.co'
$env:VITE_SUPABASE_ANON_KEY='test-anon-key'
npx vitest run src/features/login/LoginPage.test.tsx src/layout/AppShell.test.tsx --config vitest.config.ts
```

Expected: falla porque el frontend actual muestra spinner y oculta `Cerrar sesión` detrás de un menú.

### Task 2: Restaurar componentes, shell y consumidores

**Files:**
- Modify: `src/styles/theme.css`
- Modify: `src/ui/EmptyState.tsx`
- Modify: `src/ui/Ficha.tsx`
- Modify: `src/ui/PrimaryButton.tsx`
- Modify: `src/ui/TextField.tsx`
- Modify: `src/layout/AppShell.tsx`
- Modify: `src/layout/BottomTabBar.tsx`
- Modify: `src/layout/Sidebar.tsx`
- Modify: `src/layout/Topbar.tsx`
- Modify: `src/features/casos/CasoNuevoPage.tsx`
- Modify: `src/features/casos/CasosListPage.tsx`
- Modify: `src/features/casos/FichaIngresoPage.tsx`
- Modify: `src/features/dueno/DuenoHome.tsx`
- Modify: `src/features/login/LoginPage.tsx`
- Modify: `src/features/recepcion/RecepcionHome.tsx`
- Modify: `src/features/taller/TallerHome.tsx`

**Interfaces:**
- Consumes: contratos de componentes y estilos presentes en `afdb1e0`.
- Produces: el frontend de taller aprobado, compatible con los tests y flujos existentes.

- [ ] **Step 1: Restaurar los archivos de aplicación alterados por los rediseños**

```powershell
git restore --source=afdb1e0 -- src/styles/theme.css src/ui/EmptyState.tsx src/ui/Ficha.tsx src/ui/PrimaryButton.tsx src/ui/TextField.tsx src/layout/AppShell.tsx src/layout/BottomTabBar.tsx src/layout/Sidebar.tsx src/layout/Topbar.tsx src/features/casos/CasoNuevoPage.tsx src/features/casos/CasosListPage.tsx src/features/casos/FichaIngresoPage.tsx src/features/dueno/DuenoHome.tsx src/features/login/LoginPage.tsx src/features/recepcion/RecepcionHome.tsx src/features/taller/TallerHome.tsx
```

- [ ] **Step 2: Ejecutar las pruebas focalizadas y confirmar GREEN**

```powershell
npx vitest run src/features/login/LoginPage.test.tsx src/layout/AppShell.test.tsx --config vitest.config.ts
```

Expected: 2 archivos de prueba aprobados, 0 fallos.

- [ ] **Step 3: Confirmar que no quedan contratos Material 3 huérfanos**

```powershell
rg -n "variant=.(filled|tonal|text).|surface-container|on-primary|elevation-[1-5]|spinner" src
```

Expected: sin coincidencias pertenecientes al rediseño retirado.

### Task 3: Documentar y verificar la restauración

**Files:**
- Modify: `README.md`

**Interfaces:**
- Consumes: resultados reales de pruebas, build, typecheck y lint.
- Produces: changelog auditable con causa raíz, archivos restaurados y evidencia.

- [ ] **Step 1: Agregar al README una entrada fechada con causa y alcance**

Documentar que `8ac99fe` y `4583d2a` reemplazaron la identidad aprobada, que `afdb1e0` se tomó como referencia y que no hubo cambios de backend.

- [ ] **Step 2: Ejecutar verificación completa**

```powershell
npm run typecheck
npm run build
npm test
npm run lint
git diff --check
```

Expected: comandos con exit code 0; si lint tiene deuda previa, documentar exactamente su salida sin afirmar que pasó.

- [ ] **Step 3: Actualizar el README con los resultados reales y crear el commit**

```powershell
git add README.md src
git commit -m "fix(ui): restore approved workshop frontend"
```

### Task 4: Publicar en GitHub

**Files:**
- No local file changes.

**Interfaces:**
- Consumes: commits verificados en la rama local.
- Produces: rama `main` actualizada en `origin`.

- [ ] **Step 1: Revisar estado e historial**

```powershell
git status --short --branch
git log --oneline -3
```

- [ ] **Step 2: Subir los commits**

```powershell
git push origin main
```

- [ ] **Step 3: Confirmar que GitHub apunta al commit publicado**

```powershell
gh repo view PabloIan92/sacabollos-aguila-blanca --json defaultBranchRef
```
