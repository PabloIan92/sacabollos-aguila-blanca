# Fase 4: Reparación y Stock Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Entregar la ficha de trabajo del taller, el cierre documentado de la reparación y un stock simple compartido sin duplicar la máquina de estados de Supabase.

**Architecture:** Supabase/PostgreSQL continúa como fuente de verdad. Una migración `0005` amplía el trigger de transiciones, agrega daños normalizados y stock con RLS; React consume esas reglas mediante APIs pequeñas. `react-konva` se usa solo para el croquis táctil y `FotoUploader` se reutiliza para las fotos finales y la orden firmada en papel.

**Tech Stack:** React 19.2.8, TypeScript 6, Vite 8, Vitest/Testing Library, Supabase 2.112.3, PostgreSQL/RLS, Konva/react-konva.

## Global Constraints

- No incorporar XState, Camunda ni otro backend.
- No guardar firmas biométricas: la firma se acredita con `orden-firmada.webp`.
- No reutilizar campos de presupuesto para datos de reparación.
- Toda transición y permiso crítico debe validarse también en PostgreSQL, no solo en React.
- Taller y dueño administran reparación; todo usuario autenticado ve y actualiza stock.
- Mantener intactas las transiciones de Seguro y Particular ya cubiertas por `0004`.
- Usar TDD: cada comportamiento nuevo debe observarse fallar antes de escribir producción.

---

### Task 1: Persistencia y máquina de estados de reparación

**Files:**
- Create: `supabase/migrations/0005_reparacion_y_stock.sql`
- Modify: `src/features/casos/migration.test.ts`

**Interfaces:**
- Produces table `public.reparacion_danos(id, caso_id, zona, x, y, descripcion, reparado, origen_inspeccion, created_at, updated_at)`.
- Produces case columns `repuesto_pendiente`, `reparacion_iniciada_at`, `reparacion_lista_at`, `firmado_at`.
- Produces table `public.stock_items(id, nombre, cantidad, unidad, observaciones, updated_at, updated_by)`.
- Produces RPC `public.iniciar_reparacion(p_caso_id uuid)`.

- [ ] **Step 1: Write failing migration contract tests**

Add assertions that read `0005_reparacion_y_stock.sql` and require the two tables, RLS, `iniciar_reparacion`, `casos_update_taller_reparacion`, storage INSERT/UPDATE policies, final-photo helper functions and the exact transitions:

```ts
expect(sql).toContain("old.estado = 'ingresado' and new.estado = 'en reparación'")
expect(sql).toContain("old.estado = 'en reparación' and new.estado = 'esperando repuesto'")
expect(sql).toContain("old.estado = 'esperando repuesto' and new.estado = 'en reparación'")
expect(sql).toContain("old.estado = 'en reparación' and new.estado = 'listo para firma'")
expect(sql).toContain("old.estado = 'listo para firma' and new.estado = 'firmado'")
```

- [ ] **Step 2: Verify RED**

Run: `npm test -- src/features/casos/migration.test.ts`
Expected: FAIL because migration `0005` does not exist.

- [ ] **Step 3: Implement migration**

Use checks `x between 0 and 1`, `y between 0 and 1`, non-empty `zona`, `cantidad >= 0`, and cascade damage rows with their case. `iniciar_reparacion` must copy every `casos.danos_zonas` value exactly once, assign deterministic normalized coordinates, set `reparacion_iniciada_at`, and transition atomically to `en reparación`.

Replace `validar_transicion_caso()` preserving all `0004` branches and adding these guards:

```sql
ingresado -> en reparación       -- taller/dueno; reparacion_iniciada_at required
en reparación -> esperando repuesto -- taller/dueno; trim(repuesto_pendiente) <> ''
esperando repuesto -> en reparación -- taller/dueno; clears repuesto_pendiente
en reparación -> listo para firma   -- taller/dueno; every damage repaired + 4 final photos
listo para firma -> firmado          -- taller/dueno; orden-firmada.webp exists
```

Allow Taller to update only repair-stage case rows. Permit Taller/Dueño CRUD on damage rows whose case is active. Permit every authenticated user CRUD on `stock_items`. Extend storage allow-lists with `final-frente.webp`, `final-atras.webp`, `final-lateral-izquierdo.webp`, `final-lateral-derecho.webp`, and `orden-firmada.webp`, while leaving inspection/ingress behavior unchanged.

- [ ] **Step 4: Verify GREEN**

Run: `npm test -- src/features/casos/migration.test.ts`
Expected: all migration contract tests PASS.

- [ ] **Step 5: Commit**

Run: `git add supabase/migrations/0005_reparacion_y_stock.sql src/features/casos/migration.test.ts && git commit -m "feat(db): add repair and stock workflow"`

---

### Task 2: Domain types and Supabase APIs

**Files:**
- Modify: `src/features/casos/types.ts`
- Modify: `src/features/casos/api.ts`
- Modify: `src/features/casos/api.test.ts`
- Create: `src/features/stock/types.ts`
- Create: `src/features/stock/api.ts`
- Create: `src/features/stock/api.test.ts`

**Interfaces:**
- Produces `ReparacionDano`, `CreateReparacionDanoInput`, `FINAL_PHOTO_ANGLES`, `SIGNED_ORDER_ANGLES`.
- Produces `startRepair`, `listRepairDamages`, `createRepairDamage`, `updateRepairDamage`, `deleteRepairDamage`, `waitForPart`, `resumeRepair`, `markReadyForSignature`, `markSigned`.
- Produces `StockItem`, `listStockItems`, `createStockItem`, `updateStockItem`, `deleteStockItem`.

- [ ] **Step 1: Write failing API tests**

Use the existing fluent Supabase mock style. Assert exact payloads, including:

```ts
expect(rpc).toHaveBeenCalledWith('iniciar_reparacion', { p_caso_id: 'case-1' })
expect(update).toHaveBeenCalledWith({ estado: 'esperando repuesto', repuesto_pendiente: 'capot' })
expect(update).toHaveBeenCalledWith({ estado: 'en reparación', repuesto_pendiente: null })
expect(update).toHaveBeenCalledWith({ estado: 'listo para firma', reparacion_lista_at: expect.any(String) })
expect(update).toHaveBeenCalledWith({ estado: 'firmado', firmado_at: expect.any(String) })
```

- [ ] **Step 2: Verify RED**

Run: `npm test -- src/features/casos/api.test.ts src/features/stock/api.test.ts`
Expected: FAIL on missing exports/modules.

- [ ] **Step 3: Implement minimal typed APIs**

Return `.select().single()` data for mutations and throw every Supabase error. Do not encode state rules in the client beyond selecting the intended transition. Stock mutation inputs must never accept `updated_by`; the database derives it from `auth.uid()`.

- [ ] **Step 4: Verify GREEN**

Run: `npm test -- src/features/casos/api.test.ts src/features/stock/api.test.ts`
Expected: both files PASS.

- [ ] **Step 5: Commit**

Run: `git add src/features/casos src/features/stock && git commit -m "feat: add repair and stock APIs"`

---

### Task 3: Croquis y ficha de trabajo del Taller

**Files:**
- Modify: `package.json`
- Modify: `package-lock.json`
- Create: `src/features/casos/components/VehicleDamageMap.tsx`
- Create: `src/features/casos/components/VehicleDamageMap.test.tsx`
- Create: `src/features/casos/FichaTrabajoPage.tsx`
- Create: `src/features/casos/FichaTrabajoPage.test.tsx`
- Modify: `src/features/casos/components/CasosList.tsx`
- Modify: `src/features/casos/components/CasosList.test.tsx`
- Modify: `src/features/taller/TallerHome.tsx`
- Modify: `src/app/AppRouter.tsx`
- Modify: `src/app/routes.test.ts`

**Interfaces:**
- `VehicleDamageMap({ damages, onAdd, onToggleRepaired, onDelete, readonly })` stores normalized coordinates independent of viewport size.
- Route `/casos/:id/ficha-trabajo` is allowed to `taller` and `dueno`.
- `CasosList` accepts optional `caseHref(caso)`; default remains `/casos/:id`.

- [ ] **Step 1: Write failing component and route tests**

Mock `react-konva` with semantic test elements. Verify a pointer on the car calls `onAdd` with values between 0 and 1, repaired markers change appearance, the page displays patente/original damages, starts an `ingresado` case, adds/edits/repairs damage, validates a non-empty part name, and transitions waiting/resume. Verify Taller links to `/casos/:id/ficha-trabajo`.

- [ ] **Step 2: Verify RED**

Run: `npm test -- src/features/casos/components/VehicleDamageMap.test.tsx src/features/casos/FichaTrabajoPage.test.tsx src/features/casos/components/CasosList.test.tsx src/app/routes.test.ts`
Expected: FAIL because components, prop and route are missing.

- [ ] **Step 3: Install canvas dependencies**

Run: `npm install konva@10.5.0 react-konva@19.2.7`

- [ ] **Step 4: Implement minimal UI**

Render the vehicle as simple Konva shapes with large touch targets. Keep the zone list under the drawing so a damage can be corrected without precise tapping. Show the part field only in `en reparación`; show “Reanudar reparación” in `esperando repuesto`. All destructive marker deletion buttons need accessible names.

- [ ] **Step 5: Verify GREEN**

Run: `npm test -- src/features/casos/components/VehicleDamageMap.test.tsx src/features/casos/FichaTrabajoPage.test.tsx src/features/casos/components/CasosList.test.tsx src/app/routes.test.ts`
Expected: all selected tests PASS.

- [ ] **Step 6: Commit**

Run: `git add package.json package-lock.json src && git commit -m "feat: add workshop repair sheet"`

---

### Task 4: Cierre fotográfico y orden firmada

**Files:**
- Create: `src/features/casos/CierreReparacionPage.tsx`
- Create: `src/features/casos/CierreReparacionPage.test.tsx`
- Modify: `src/app/AppRouter.tsx`
- Modify: `src/features/casos/FichaTrabajoPage.tsx`
- Modify: `src/features/casos/FichaTrabajoPage.test.tsx`

**Interfaces:**
- Route `/casos/:id/cierre-reparacion` for `taller` and `dueno`.
- Four final-photo angles gate `listo para firma`; one signed-order angle gates `firmado`.

- [ ] **Step 1: Write failing flow tests**

Mock `FotoUploader` only at the storage boundary. Assert that four final photos are required before “Listo para firma”, then `orden-firmada` is required before “Marcar firmado”. Assert existing photos initialize counts and errors remain visible with retry-safe controls.

- [ ] **Step 2: Verify RED**

Run: `npm test -- src/features/casos/CierreReparacionPage.test.tsx src/features/casos/FichaTrabajoPage.test.tsx`
Expected: FAIL because the page and navigation do not exist.

- [ ] **Step 3: Implement by reusing FotoUploader**

Use `FINAL_PHOTO_ANGLES` and `SIGNED_ORDER_ANGLES` without creating another uploader. Display the current state and never send photo URLs in case columns; PostgreSQL verifies storage object existence.

- [ ] **Step 4: Verify GREEN**

Run: `npm test -- src/features/casos/CierreReparacionPage.test.tsx src/features/casos/FichaTrabajoPage.test.tsx src/features/casos/components/FotoUploader.test.tsx`
Expected: all selected tests PASS.

- [ ] **Step 5: Commit**

Run: `git add src && git commit -m "feat: add documented repair closure"`

---

### Task 5: Stock compartido y documentación

**Files:**
- Create: `src/features/stock/StockPage.tsx`
- Create: `src/features/stock/StockPage.test.tsx`
- Modify: `src/app/AppRouter.tsx`
- Modify: `src/app/routes.ts`
- Modify: `src/app/routes.test.ts`
- Modify: `README.md`
- Modify: `.planning/STATE.md`

**Interfaces:**
- Route `/stock` for `dueno`, `recepcion`, and `taller`.
- Navigation item “Stock” visible to all authenticated roles.

- [ ] **Step 1: Write failing stock UI/navigation tests**

Verify loading/error/retry/empty states; create an item; edit quantity/unit/observations; reject negative quantity before API; delete only after confirmation; and show Stock in navigation for all three roles.

- [ ] **Step 2: Verify RED**

Run: `npm test -- src/features/stock/StockPage.test.tsx src/app/routes.test.ts`
Expected: FAIL because page and route are missing.

- [ ] **Step 3: Implement minimal stock table/form**

Use existing `Ficha`, `TextField`, `PrimaryButton`, visual tokens and tablet breakpoint. Keep one form for add and inline editing; do not add purchasing, suppliers, reservations or automatic consumption.

- [ ] **Step 4: Update durable documentation**

Document migration `0005`, routes, exact repair state guards, photo naming, RLS roles, OpenCode DeepSeek/Nemotron audit outcome, local verification commands, deployment status and remaining physical-tablet/productive-E2E checks. Never record tokens or credentials.

- [ ] **Step 5: Full verification**

Run in this order:

```text
npm test
npm run typecheck
npm run lint
npm run build
git diff --check
```

Expected: exit code 0 for every command; lint may only retain explicitly documented pre-existing Fast Refresh warnings.

- [ ] **Step 6: Commit**

Run: `git add src README.md .planning/STATE.md && git commit -m "feat: add shared workshop stock"`

