# Especificación de Diseño: Fase 5 — Facturación y Cobros

- **Fecha:** 2026-09-10
- **Proyecto:** Sacabollos Águila Blanca
- **Fase:** 5 de 6 (Facturación y Cobranza)
- **Requisitos vinculados:** `FACTURACION-01`, `FACTURACION-02`, `AUTH-02`, `CASOS-02`
- **Estado:** Validado por el usuario

---

## 1. Contexto y Objetivos

### 1.1 Problema de Negocio
El taller realiza trabajos tanto para aseguradoras como para clientes particulares. Actualmente la reparación concluye en el estado `firmado` (con 4 fotos finales y la orden de trabajo física firmada en storage).
El dueño necesita registrar formalmente el número de factura, el monto facturado y el total efectivamente cobrado, calculando el diferencial (saldo pendiente o retenciones).
Por estricta política del negocio (`AUTH-02`), **el diferencial y los montos facturados/cobrados deben ser visibles únicamente para el dueño**. Ni recepción ni taller pueden tener acceso a los montos ni al diferencial en ninguna pantalla ni a través de consultas directas a la base de datos.
Adicionalmente, en casos de seguro donde la compañía se demora o rechaza un pago (`FACTURACION-02`), tanto el dueño como la recepción deben poder marcar el caso en estado `reclamo a la compañía` registrando el motivo.

### 1.2 Criterios de Éxito
1. El dueño puede ver y gestionar el monto facturado, el total cobrado y el diferencial calculado por cada caso.
2. La seguridad está blindada a nivel PostgreSQL RLS: los roles `recepcion` y `taller` tienen denegado cualquier acceso de lectura o escritura a los importes financieros.
3. El dueño puede avanzar los casos desde `firmado -> facturado` y desde `facturado -> cobrado` validando los datos requeridos.
4. Para casos del canal `seguro`, tanto el dueño como la recepción pueden cambiar el estado a `reclamo a la compañía` ingresando el motivo del reclamo.
5. Se provee una pantalla gerencial `/facturacion` (solo dueño) con métricas consolidadas (Total Facturado, Total Cobrado, Pendiente, En Reclamo) y una pantalla de detalle `/casos/:id/facturacion`.
6. La suite completa de tests de la aplicación se mantiene en verde con 0 errores de compilación, linter y build.

---

## 2. Modelo de Datos y Seguridad (Migración 0006)

### 2.1 Tabla `public.caso_facturacion`
Se crea una tabla independiente con relación 1-a-1 hacia `public.casos`:

```sql
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
  motivo_reclamo text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
```

### 2.2 Blindaje RLS (Garantía AUTH-02)
Para garantizar de forma inquebrantable que ningún rol ajeno a `dueno` pueda acceder a los montos o al diferencial:

```sql
alter table public.caso_facturacion enable row level security;

create policy caso_facturacion_dueno_all
  on public.caso_facturacion
  for all
  to authenticated
  using (public.current_user_role() = 'dueno')
  with check (public.current_user_role() = 'dueno');
```
*Nota:* Los roles `recepcion` y `taller` no poseen ninguna directiva de `SELECT`, `INSERT`, `UPDATE` ni `DELETE` sobre `caso_facturacion`. Cualquier intento de consulta REST a través del cliente de Supabase devolverá un conjunto de datos vacío o un error de autorización `42501`.

### 2.3 Ampliación de la Máquina de Estados (`validar_transicion_caso()`)
Se incorporan las siguientes validaciones en el trigger `before update on public.casos`:

1. **`firmado -> facturado`**:
   - Rol permitido: Exclusivamente `dueno`.
   - Guard: Debe existir un registro en `public.caso_facturacion` donde `monto_facturado > 0` y `trim(numero_factura) <> ''`.
2. **`facturado -> cobrado`**:
   - Rol permitido: Exclusivamente `dueno`.
   - Guard: Debe existir un registro en `public.caso_facturacion` con `monto_cobrado > 0` y `fecha_cobro is not null`.
3. **`facturado -> reclamo a la compañía`**:
   - Roles permitidos: `dueno` o `recepcion`.
   - Guard: El canal del caso debe ser `seguro` (`old.canal = 'seguro'`). No se permite reclamo a la compañía en casos particulares. Debe especificarse `motivo_reclamo` en la actualización.
4. **`reclamo a la compañía -> cobrado`**:
   - Rol permitido: Exclusivamente `dueno`.
   - Guard: Debe existir cobro registrado (`monto_cobrado > 0` y `fecha_cobro is not null`).
5. **`reclamo a la compañía -> facturado`**:
   - Roles permitidos: `dueno` o `recepcion` (permite destrabar o revertir el estado si la compañía procesó el pago pendiente).

### 2.4 Columnas agregadas a `casos`
Para registrar la trazabilidad histórica de fechas sin exponer montos:
- `facturado_at timestamptz`: Fecha y hora en que se emitió/registró la factura.
- `cobrado_at timestamptz`: Fecha y hora en que se cobró el caso.
- `motivo_reclamo text`: Motivo textual del reclamo (accesible para dueño y recepción).

---

## 3. Capa de Dominio y APIs TypeScript

Ubicación: `src/features/facturacion/`

### 3.1 Tipos de Dominio (`types.ts`)
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
  motivo_reclamo: string | null
  created_at: string
  updated_at: string
}

export interface FacturacionResumenItem {
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

### 3.2 Funciones de API (`api.ts`)
1. `getFacturacion(casoId: string): Promise<CasoFacturacion | null>`
2. `upsertFacturacion(casoId: string, payload: UpsertFacturacionPayload): Promise<CasoFacturacion>`
3. `transicionarAFacturado(casoId: string, payload: FacturaPayload): Promise<Caso>`
4. `transicionarACobrado(casoId: string, payload: CobroPayload): Promise<Caso>`
5. `iniciarReclamoAseguradora(casoId: string, motivo: string): Promise<Caso>`
6. `resolverReclamo(casoId: string): Promise<Caso>`
7. `getResumenFacturacion(): Promise<FacturacionResumenItem[]>`

---

## 4. Frontend y Experiencia de Usuario

### 4.1 Pantalla Principal `/facturacion` (`FacturacionPage.tsx`)
- Acceso: Restringido a rol `dueno` mediante `RequireRole`.
- **Panel de KPIs:**
  - Total Facturado ($ acumulado).
  - Total Cobrado ($ acumulado).
  - Saldo Pendiente de Cobro ($ diferencial).
  - Casos en Reclamo (contador de alertas).
- **Listado interactivo:**
  - Filtro por estado: `Todos`, `Firmados (listos para facturar)`, `Facturados`, `En Reclamo`, `Cobrados`.
  - Filtro por canal: `Todos`, `Seguro`, `Particular`.
  - Búsqueda por patente, cliente o número de factura.
  - Columnas: Caso / Patente, Cliente / Aseguradora, Estado con Semáforo, N° Factura, Facturado, Cobrado, Diferencial, Acciones.
  - Botón directo hacia la ficha de facturación del caso.

### 4.2 Ficha de Facturación `/casos/:id/facturacion` (`FichaFacturacionPage.tsx`)
- Acceso: Restringido a rol `dueno`.
- Datos del caso: Resumen del vehículo, aseguradora, estado actual.
- **Formulario estructurado:**
  - Datos de facturación: N° Factura, Fecha de Factura, Importe Facturado.
  - Datos de cobro: Importe Cobrado, Fecha de Cobro, Medio de Pago, Observaciones.
  - Tarjeta de cálculo en vivo:
    - Diferencial = `monto_facturado - monto_cobrado`.
    - Alerta visual verde si saldo es 0, naranja si hay saldo pendiente, roja si está en reclamo.
- **Botones de transición de estado:**
  - Si el caso está en `firmado`: Botón destacado «Guardar y Marcar como Facturado».
  - Si el caso está en `facturado` o `reclamo a la compañía`: Botón destacado «Guardar y Confirmar Cobro».
  - Si el caso es de canal `seguro` y está en `facturado`: Botón secundario «Iniciar Reclamo a Aseguradora».

### 4.3 Integración en `CasoDetailPage.tsx`
- Si `userRole === 'dueno'`: Se agrega botón destacado «Gestión de Facturación» que redirige a `/casos/:id/facturacion`.
- Si `userRole === 'recepcion'` y el caso es `seguro` con estado `facturado`:
  - Se muestra botón «Reclamar a Aseguradora».
  - Al presionarlo, abre un modal solicitando el motivo del reclamo y ejecuta `iniciarReclamoAseguradora`.
- Si `userRole === 'taller'`: No se renderiza ningún botón, monto ni información de facturación.

### 4.4 Navegación (`Sidebar.tsx` y `BottomTabBar.tsx`)
- Se agrega el ítem de navegación «Facturación» con ícono de recibo/dólar, visible únicamente si `userRole === 'dueno'`.

---

## 5. Plan de Verificación y Testing

### 5.1 Pruebas Unitarias y de Integración
1. **Migración `0006_facturacion_y_cobros.sql` (`migration.test.ts`):**
   - Validar definición de tabla `caso_facturacion`, checks de no negatividad y RLS.
   - Validar guards en `validar_transicion_caso()` para `firmado -> facturado`, `facturado -> cobrado` y `facturado -> reclamo a la compañía`.
   - Validar exclusión estricta de roles no autorizados.
2. **APIs de facturación (`src/features/facturacion/api.test.ts`):**
   - Cobertura de funciones de obtención, guardado y transiciones.
   - Comprobación de payload seguro y manejo de errores.
3. **Páginas y Componentes:**
   - `FacturacionPage.test.tsx`: Render de KPIs, cálculo de diferenciales, filtrado y links.
   - `FichaFacturacionPage.test.tsx`: Validación de campos requeridos, cálculo dinámico de saldos, botones de acción.
   - `CasoDetailPage.test.tsx`: Visibilidad condicional por rol (dueño ve gestión, recepción ve botón de reclamo en seguros, taller no ve nada).
   - `AppRouter.test.tsx`: Acceso a `/facturacion` denegado para roles `recepcion` y `taller`.

### 5.2 Compuertas de Calidad
- 100% de la suite de tests aprobada (`npm test`).
- 0 errores de TypeScript (`tsc -b`).
- 0 errores de linter (`oxlint`).
- Build de producción limpio (`npm run build`).
