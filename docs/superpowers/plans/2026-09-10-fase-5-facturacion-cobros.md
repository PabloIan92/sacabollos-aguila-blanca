# Plan de Implementación: Fase 5 — Facturación y Cobros

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Implementar el módulo completo de Facturación y Cobranza para Sacabollos Águila Blanca, permitiendo al dueño registrar montos facturados, cobrados y ver el diferencial con estricto blindaje RLS en base de datos (`AUTH-02`), gestionar las transiciones de estado (`firmado -> facturado -> cobrado`) y habilitar el reclamo a la aseguradora (`FACTURACION-02`).

**Architecture:** Se implementa una tabla separada `caso_facturacion` protegida por RLS exclusivo para `dueno` con relación 1-a-1 a `casos`. La máquina de estados PostgreSQL en `validar_transicion_caso()` valida los requerimientos de datos antes de permitir las transiciones. En el cliente React, se crea la pantalla `/facturacion` para visión gerencial y `/casos/:id/facturacion` para edición, complementada con acciones en `CasoDetailPage` y enlaces en la barra de navegación protegidos por rol.

**Tech Stack:** TypeScript, React 19, Supabase (PostgreSQL RLS, triggers), Vitest, Tailwind CSS, Lucide React.

## Global Constraints

- **Seguridad RLS (AUTH-02):** La tabla `caso_facturacion` solo es accesible por el rol `dueno`. Los roles `recepcion` y `taller` tienen 0 políticas permisivas.
- **Canal de Reclamo (FACTURACION-02):** La transición a `reclamo a la compañía` solo está permitida si `canal = 'seguro'` y requiere registrar `motivo_reclamo`.
- **Transición a Facturado:** Requiere rol `dueno`, `monto_facturado > 0` y `numero_factura` no vacío.
- **Transición a Cobrado:** Requiere rol `dueno`, `monto_cobrado > 0` y `fecha_cobro is not null`.
- **Diferencial:** Calculado en cliente/vista como `monto_facturado - monto_cobrado`.
- **Cero placeholders:** Todo código debe ser completo y sin comentarios `TODO`/`TBD`.

---

### Task 1: Migración 0006 — Persistencia, RLS y Máquina de Estados de Facturación

**Files:**
- Create: `supabase/migrations/0006_facturacion_y_cobros.sql`
- Test: `src/features/casos/migration.test.ts`

**Interfaces:**
- Consumes: `public.casos`, `public.current_user_role()`, `validar_transicion_caso()` de migraciones `0001` a `0005`.
- Produces: Tabla `public.caso_facturacion`, columnas `facturado_at`, `cobrado_at`, `motivo_reclamo` en `casos`, policies RLS y guards de transición en `validar_transicion_caso()`.

- [ ] **Step 1: Escribir los tests de migración en `src/features/casos/migration.test.ts`**

Agregar suite para `migración 0006 de facturación y cobros`:
```typescript
import billingMigration from '../../../supabase/migrations/0006_facturacion_y_cobros.sql?raw'

describe('migración 0006 de facturación y cobros', () => {
  function billingSql() {
    return billingMigration.replace(/\r\n/g, '\n')
  }

  it('crea la tabla caso_facturacion con RLS exclusivo para dueño', () => {
    const sql = billingSql()

    expect(sql).toContain('create table public.caso_facturacion')
    expect(sql).toContain('caso_id uuid primary key references public.casos(id) on delete cascade')
    expect(sql).toContain('monto_facturado numeric(14, 2) not null check (monto_facturado >= 0)')
    expect(sql).toContain('monto_cobrado numeric(14, 2) not null default 0 check (monto_cobrado >= 0)')
    expect(sql).toContain("check (trim(numero_factura) <> '')")
    expect(sql).toContain('alter table public.caso_facturacion enable row level security')
    expect(sql).toContain("create policy caso_facturacion_dueno_all")
    expect(sql).toContain("public.current_user_role() = 'dueno'")
    expect(sql).not.toContain("create policy caso_facturacion_recepcion")
    expect(sql).not.toContain("create policy caso_facturacion_taller")
  })

  it('agrega columnas de facturacion y reclamo a casos', () => {
    const sql = billingSql()

    expect(sql).toContain('alter table public.casos add column facturado_at timestamptz;')
    expect(sql).toContain('alter table public.casos add column cobrado_at timestamptz;')
    expect(sql).toContain('alter table public.casos add column motivo_reclamo text;')
  })

  it('valida las transiciones firmado -> facturado -> cobrado y reclamo a compañía', () => {
    const sql = billingSql()

    expect(sql).toContain("old.estado = 'firmado' and new.estado = 'facturado'")
    expect(sql).toContain("old.estado = 'facturado' and new.estado = 'cobrado'")
    expect(sql).toContain("old.estado = 'facturado' and new.estado = 'reclamo a la compañía'")
    expect(sql).toContain("old.estado = 'reclamo a la compañía' and new.estado = 'cobrado'")
    expect(sql).toContain("old.estado = 'reclamo a la compañía' and new.estado = 'facturado'")
    expect(sql).toContain("Solo dueño puede facturar o cobrar")
    expect(sql).toContain("Reclamo a la compañía solo permitido en casos de seguro")
  })
})
```

- [ ] **Step 2: Ejecutar test para verificar que falla**

Run: `npx vitest run src/features/casos/migration.test.ts`
Expected: FAIL porque `0006_facturacion_y_cobros.sql` aún no existe.

- [ ] **Step 3: Crear `supabase/migrations/0006_facturacion_y_cobros.sql`**

```sql
-- Migración 0006: Facturación, Cobros y Reclamo a Aseguradora

-- 1. Columnas de trazabilidad en casos
alter table public.casos add column facturado_at timestamptz;
alter table public.casos add column cobrado_at timestamptz;
alter table public.casos add column motivo_reclamo text;

-- 2. Tabla caso_facturacion
create table public.caso_facturacion (
  caso_id uuid primary key references public.casos(id) on delete cascade,
  monto_facturado numeric(14, 2) not null check (monto_facturado >= 0),
  monto_cobrado numeric(14, 2) not null default 0 check (monto_cobrado >= 0),
  numero_factura text not null check (trim(numero_factura) <> ''),
  fecha_factura date not null default current_date,
  fecha_cobro date,
  metodo_pago text check (
    metodo_pago in ('transferencia', 'efectivo', 'cheque', 'tarjeta_debito', 'tarjeta_credito', 'otro')
  ),
  notas_cobranza text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.caso_facturacion enable row level security;

create policy caso_facturacion_dueno_all
  on public.caso_facturacion
  for all
  to authenticated
  using (public.current_user_role() = 'dueno')
  with check (public.current_user_role() = 'dueno');

-- 3. Máquina de estados: ampliar validar_transicion_caso
create or replace function public.validar_transicion_caso()
returns trigger
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  actor_role text;
  rol_autorizado boolean := false;
  transicion_valida boolean := false;
  f_facturado numeric;
  f_cobrado numeric;
  f_numero text;
  f_fecha_cobro date;
begin
  if new.estado is not distinct from old.estado then
    return new;
  end if;

  actor_role := public.current_user_role();

  -- Grafo de transiciones válidas
  if (old.estado = 'borrador' and new.estado in ('enviado a la aseguradora', 'cancelado')) or
     (old.estado = 'enviado a la aseguradora' and new.estado in ('aprobado', 'cancelado')) or
     (old.estado = 'aprobado' and new.estado in ('turno coordinado', 'cancelado')) or
     (old.estado = 'turno coordinado' and new.estado in ('ingresado', 'cancelado')) or
     (old.estado = 'ingresado' and new.estado in ('en reparación', 'cancelado')) or
     (old.estado = 'en reparación' and new.estado in ('esperando repuesto', 'listo para firma', 'cancelado')) or
     (old.estado = 'esperando repuesto' and new.estado in ('en reparación', 'cancelado')) or
     (old.estado = 'listo para firma' and new.estado in ('firmado', 'cancelado')) or
     (old.estado = 'firmado' and new.estado in ('facturado', 'cancelado')) or
     (old.estado = 'facturado' and new.estado in ('cobrado', 'reclamo a la compañía', 'cancelado')) or
     (old.estado = 'reclamo a la compañía' and new.estado in ('cobrado', 'facturado', 'cancelado')) then
    transicion_valida := true;
  end if;

  if not transicion_valida then
    raise exception 'Transición no permitida: % -> %', old.estado, new.estado using errcode = '23514';
  end if;

  -- Reglas de roles y datos por estado
  if old.estado = 'firmado' and new.estado = 'facturado' then
    if actor_role <> 'dueno' then
      raise exception 'Solo dueño puede facturar o cobrar' using errcode = '42501';
    end if;
    select monto_facturado, numero_factura into f_facturado, f_numero
    from public.caso_facturacion where caso_id = old.id;
    if not found or f_facturado is null or f_facturado <= 0 or trim(coalesce(f_numero, '')) = '' then
      raise exception 'Al facturar requiere registro en caso_facturacion con monto_facturado > 0 y numero_factura' using errcode = '23514';
    end if;
    new.facturado_at := coalesce(new.facturado_at, now());
  elsif old.estado in ('facturado', 'reclamo a la compañía') and new.estado = 'cobrado' then
    if actor_role <> 'dueno' then
      raise exception 'Solo dueño puede facturar o cobrar' using errcode = '42501';
    end if;
    select monto_cobrado, fecha_cobro into f_cobrado, f_fecha_cobro
    from public.caso_facturacion where caso_id = old.id;
    if not found or f_cobrado is null or f_cobrado <= 0 or f_fecha_cobro is null then
      raise exception 'Al cobrar requiere monto_cobrado > 0 y fecha_cobro' using errcode = '23514';
    end if;
    new.cobrado_at := coalesce(new.cobrado_at, now());
  elsif old.estado = 'facturado' and new.estado = 'reclamo a la compañía' then
    if actor_role not in ('dueno', 'recepcion') then
      raise exception 'Solo dueño o recepción pueden iniciar reclamo' using errcode = '42501';
    end if;
    if old.canal <> 'seguro' then
      raise exception 'Reclamo a la compañía solo permitido en casos de seguro' using errcode = '23514';
    end if;
    if new.motivo_reclamo is null or trim(new.motivo_reclamo) = '' then
      raise exception 'Al reclamar a la compañía requiere motivo_reclamo' using errcode = '23514';
    end if;
  elsif old.estado = 'reclamo a la compañía' and new.estado = 'facturado' then
    if actor_role not in ('dueno', 'recepcion') then
      raise exception 'Solo dueño o recepción pueden revertir reclamo' using errcode = '42501';
    end if;
  end if;

  -- Transiciones previas (Fases 1 a 4)
  if old.estado in ('ingresado', 'en reparación', 'esperando repuesto', 'listo para firma') and new.estado not in ('facturado', 'cobrado', 'reclamo a la compañía') then
    rol_autorizado := actor_role in ('dueno', 'taller');
  elsif old.estado in ('firmado', 'facturado', 'reclamo a la compañía') then
    rol_autorizado := true; -- Validado individualmente arriba
  else
    rol_autorizado := actor_role in ('dueno', 'recepcion');
  end if;

  if rol_autorizado is not true then
    raise exception 'El rol % no puede realizar la transición % -> %', coalesce(actor_role, 'sin rol'), old.estado, new.estado using errcode = '42501';
  end if;

  return new;
end;
$$;
```

- [ ] **Step 4: Ejecutar los tests de migración**

Run: `npx vitest run src/features/casos/migration.test.ts`
Expected: PASS (24 tests passed).

- [ ] **Step 5: Commit**

```bash
git add supabase/migrations/0006_facturacion_y_cobros.sql src/features/casos/migration.test.ts
git commit -m "feat(db): add billing and claim schema with RLS and guards"
```

---

### Task 2: Tipos y APIs de Dominio de Facturación

**Files:**
- Create: `src/features/facturacion/types.ts`
- Create: `src/features/facturacion/api.ts`
- Test: `src/features/facturacion/api.test.ts`

**Interfaces:**
- Consumes: `supabase` client (`src/lib/supabase.ts`), tipos de `casos`.
- Produces: `getFacturacion`, `saveFacturacion`, `marcarComoFacturado`, `marcarComoCobrado`, `iniciarReclamoAseguradora`, `getResumenFacturacion`.

- [ ] **Step 1: Escribir los tests de API en `src/features/facturacion/api.test.ts`**

```typescript
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { getFacturacion, saveFacturacion, marcarComoFacturado, marcarComoCobrado, iniciarReclamoAseguradora, getResumenFacturacion } from './api'
import { supabase } from '../../lib/supabase'

vi.mock('../../lib/supabase', () => ({
  supabase: {
    from: vi.fn(),
  },
}))

describe('facturacion api', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('obtiene los datos de facturación de un caso', async () => {
    const mockSelect = vi.fn().mockReturnValue({
      eq: vi.fn().mockReturnValue({
        maybeSingle: vi.fn().mockResolvedValue({
          data: { caso_id: 'c-1', monto_facturado: 150000, monto_cobrado: 0, numero_factura: 'F-001' },
          error: null,
        }),
      }),
    })
    vi.mocked(supabase.from).mockReturnValue({ select: mockSelect } as any)

    const result = await getFacturacion('c-1')
    expect(result?.monto_facturado).toBe(150000)
    expect(result?.numero_factura).toBe('F-001')
  })

  it('guarda o actualiza los datos de facturación', async () => {
    const mockUpsert = vi.fn().mockReturnValue({
      select: vi.fn().mockReturnValue({
        single: vi.fn().mockResolvedValue({
          data: { caso_id: 'c-1', monto_facturado: 200000, monto_cobrado: 100000, numero_factura: 'B-100' },
          error: null,
        }),
      }),
    })
    vi.mocked(supabase.from).mockReturnValue({ upsert: mockUpsert } as any)

    const saved = await saveFacturacion('c-1', {
      monto_facturado: 200000,
      monto_cobrado: 100000,
      numero_factura: 'B-100',
      fecha_factura: '2026-09-10',
      metodo_pago: 'transferencia',
    })

    expect(saved.monto_facturado).toBe(200000)
    expect(saved.monto_cobrado).toBe(100000)
  })

  it('inicia reclamo a aseguradora actualizando estado y motivo', async () => {
    const mockUpdate = vi.fn().mockReturnValue({
      eq: vi.fn().mockReturnValue({
        select: vi.fn().mockReturnValue({
          single: vi.fn().mockResolvedValue({
            data: { id: 'c-1', estado: 'reclamo a la compañía', motivo_reclamo: 'Pago demorado 45 días' },
            error: null,
          }),
        }),
      }),
    })
    vi.mocked(supabase.from).mockReturnValue({ update: mockUpdate } as any)

    const caso = await iniciarReclamoAseguradora('c-1', 'Pago demorado 45 días')
    expect(caso.estado).toBe('reclamo a la compañía')
    expect(caso.motivo_reclamo).toBe('Pago demorado 45 días')
  })
})
```

- [ ] **Step 2: Ejecutar test para verificar que falla**

Run: `npx vitest run src/features/facturacion/api.test.ts`
Expected: FAIL (módulo no existe).

- [ ] **Step 3: Crear `src/features/facturacion/types.ts` y `src/features/facturacion/api.ts`**

`src/features/facturacion/types.ts`:
```typescript
export type MetodoPago =
  | 'transferencia'
  | 'efectivo'
  | 'cheque'
  | 'tarjeta_debito'
  | 'tarjeta_credito'
  | 'otro'

export interface CasoFacturacion {
  caso_id: string
  monto_facturado: number
  monto_cobrado: number
  numero_factura: string
  fecha_factura: string
  fecha_cobro: string | null
  metodo_pago: MetodoPago | null
  notas_cobranza: string | null
  created_at: string
  updated_at: string
}

export interface SaveFacturacionPayload {
  monto_facturado: number
  monto_cobrado?: number
  numero_factura: string
  fecha_factura?: string
  fecha_cobro?: string | null
  metodo_pago?: MetodoPago | null
  notas_cobranza?: string | null
}

export interface ResumenFacturacionItem {
  caso_id: string
  patente: string
  vehiculo: string
  cliente_nombre: string
  canal: 'seguro' | 'particular'
  aseguradora: string | null
  estado: string
  monto_facturado: number
  monto_cobrado: number
  diferencial: number
  numero_factura: string
  fecha_factura: string
  fecha_cobro: string | null
}
```

`src/features/facturacion/api.ts`:
Implementar las funciones de persistencia y transiciones de estado hacia Supabase con validación de tipos y sanitización de números.

- [ ] **Step 4: Ejecutar test para verificar que pasa**

Run: `npx vitest run src/features/facturacion/api.test.ts`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/features/facturacion/types.ts src/features/facturacion/api.ts src/features/facturacion/api.test.ts
git commit -m "feat(facturacion): add billing types and supabase api"
```

---

### Task 3: Pantalla Principal `/facturacion` y Navegación

**Files:**
- Create: `src/features/facturacion/FacturacionPage.tsx`
- Test: `src/features/facturacion/FacturacionPage.test.tsx`
- Modify: `src/app/routes.ts`, `src/app/AppRouter.tsx`, `src/components/Sidebar.tsx`, `src/components/BottomTabBar.tsx`

**Interfaces:**
- Consumes: `getResumenFacturacion()` de `src/features/facturacion/api.ts`, `useAuth()`.
- Produces: Ruta `/facturacion` protegida para rol `dueno`, tarjetas métricas (KPIs), tabla con cálculo de diferencial y badges de semáforo.

- [ ] **Step 1: Escribir los tests de `FacturacionPage.test.tsx`**

Verificar:
1. Renderiza los 4 indicadores KPI (Total Facturado, Total Cobrado, Pendiente, En Reclamo).
2. Renderiza la tabla de casos con sus montos y cálculo del diferencial.
3. Filtra casos por estado y búsqueda por patente.
4. Redirige o incluye link a `/casos/:id/facturacion`.

- [ ] **Step 2: Ejecutar test para verificar que falla**

Run: `npx vitest run src/features/facturacion/FacturacionPage.test.tsx`
Expected: FAIL.

- [ ] **Step 3: Implementar `FacturacionPage.tsx` y actualizar rutas y navegación**

- Crear `FacturacionPage.tsx` con componentes accesibles, búsqueda, filtrado y cálculo de totales.
- Agregar ruta `/facturacion` en `src/app/routes.ts` y en `src/app/AppRouter.tsx` con `RequireRole role="dueno"`.
- Agregar ítem de navegación "Facturación" en `Sidebar.tsx` y `BottomTabBar.tsx` condicionado a `userRole === 'dueno'`.

- [ ] **Step 4: Ejecutar test para verificar que pasa**

Run: `npx vitest run src/features/facturacion/FacturacionPage.test.tsx`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/features/facturacion/FacturacionPage.tsx src/features/facturacion/FacturacionPage.test.tsx src/app/routes.ts src/app/AppRouter.tsx src/components/Sidebar.tsx src/components/BottomTabBar.tsx
git commit -m "feat(facturacion): add main billing page and navigation"
```

---

### Task 4: Ficha de Facturación `/casos/:id/facturacion` y Botón de Reclamo

**Files:**
- Create: `src/features/facturacion/FichaFacturacionPage.tsx`
- Test: `src/features/facturacion/FichaFacturacionPage.test.tsx`
- Modify: `src/features/casos/CasoDetailPage.tsx`, `src/features/casos/CasoDetailPage.test.tsx`

**Interfaces:**
- Consumes: `getFacturacion`, `saveFacturacion`, `marcarComoFacturado`, `marcarComoCobrado`, `iniciarReclamoAseguradora`.
- Produces: Formulario interactivo de facturación y cobro con cálculo de diferencial en tiempo real; botón en `CasoDetailPage` adaptado a rol `dueno` y `recepcion`.

- [ ] **Step 1: Escribir tests para `FichaFacturacionPage.test.tsx` y `CasoDetailPage.test.tsx`**

1. Verificar cálculo de diferencial en tiempo real (`monto_facturado - monto_cobrado`).
2. Verificar botón «Guardar y Marcar como Facturado» cuando estado es `firmado`.
3. Verificar botón «Confirmar Cobro» cuando estado es `facturado` o `reclamo a la compañía`.
4. Verificar botón «Iniciar Reclamo a Aseguradora» en `CasoDetailPage` para rol `recepcion` en casos de seguro facturados.
5. Verificar que rol `taller` no ve ningún elemento financiero.

- [ ] **Step 2: Ejecutar tests para verificar que fallan**

Run: `npx vitest run src/features/facturacion/FichaFacturacionPage.test.tsx`
Expected: FAIL.

- [ ] **Step 3: Implementar `FichaFacturacionPage.tsx` e integración en `CasoDetailPage.tsx`**

- Construir `FichaFacturacionPage` con validación de montos positivos, campos de factura y cobro, y botones de cambio de estado.
- Añadir a `CasoDetailPage` el botón condicional «Gestión de Facturación» para dueño, y el modal de reclamo para recepción.

- [ ] **Step 4: Ejecutar tests para verificar que pasan**

Run: `npx vitest run src/features/facturacion/FichaFacturacionPage.test.tsx src/features/casos/CasoDetailPage.test.tsx`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/features/facturacion/FichaFacturacionPage.tsx src/features/facturacion/FichaFacturacionPage.test.tsx src/features/casos/CasoDetailPage.tsx src/features/casos/CasoDetailPage.test.tsx
git commit -m "feat(facturacion): add billing detail form and claim action"
```

---

### Task 5: Verificación Integral, Migración Supabase y Despliegue

**Files:**
- Modify: `README.md`, `.planning/STATE.md`
- DB: Aplicar `0006_facturacion_y_cobros.sql` a Supabase remoto.

- [ ] **Step 1: Ejecutar suite de pruebas completa**

Run: `npm test`
Expected: Todos los tests pasan (esperado > 210 tests).

- [ ] **Step 2: Ejecutar verificación de tipos y linter**

Run: `npx tsc -b && npx oxlint`
Expected: 0 errores.

- [ ] **Step 3: Ejecutar build de producción**

Run: `npm run build`
Expected: Build exitoso en `< 6s`.

- [ ] **Step 4: Aplicar migración en Supabase remoto**

Run: `npx supabase db push --dry-run` seguido de `npx supabase db push --yes`
Expected: Migración 0006 aplicada.

- [ ] **Step 5: Documentar y Commitear**

```bash
git add README.md .planning/STATE.md
git commit -m "docs: complete Phase 5 billing and collection implementation"
git push origin main
```
