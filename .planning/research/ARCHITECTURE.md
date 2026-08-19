# Architecture Research

**Domain:** Vertical SaaS / Workshop Management System (PDR - Paintless Dent Repair)
**Researched:** 2026-08-19
**Confidence:** HIGH

## Standard Architecture

### System Overview

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                            CLIENT LAYER                                      │
│  ┌──────────────────┐         ┌──────────────────┐                          │
│  │  Tablet (Taller) │         │  PC/Notebook     │                          │
│  │  - React PWA     │         │  - React PWA     │                          │
│  │  - Camera API    │         │  - Full UI       │                          │
│  │  - Touch optimized│        │  - Keyboard/mouse│                          │
│  └────────┬─────────┘         └────────┬─────────┘                          │
│           │                            │                                     │
│           ▼                            ▼                                     │
│  ┌──────────────────────────────────────────────────────────────────────┐   │
│  │                    SUPABASE CLIENT (JS/TS SDK)                        │   │
│  │  - Auth (JWT en localStorage)                                        │   │
│  │  - Database (PostgreSQL via PostgREST)                               │   │
│  │  - Storage (photos, PDFs)                                            │   │
│  │  - Realtime (semáforo updates)                                       │   │
│  └────────────────────────────────────┬─────────────────────────────────┘   │
└───────────────────────────────────────│─────────────────────────────────────┘
                                        │ HTTPS / WSS
                                        ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                          SUPABASE PLATFORM (Managed)                         │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐        │
│  │   Auth      │  │  Database   │  │  Storage    │  │  Realtime   │        │
│  │  (GoTrue)   │  │ (PostgreSQL │  │  (S3 API)   │  │  (Elixir)   │        │
│  │             │  │  15+)       │  │             │  │             │        │
│  │ - Email/    │  │ - RLS       │  │ - Buckets:  │  │ - Broadcast │        │
│  │   Password  │  │ - Policies  │  │   fotos/    │  │ - Changes   │        │
│  │             │  │ - Triggers  │  │   pdfs/     │  │             │        │
│  └─────────────┘  └─────────────┘  └─────────────┘  └─────────────┘        │
│         │               │               │               │                    │
│         ▼               ▼               ▼               ▼                    │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │                    EDGE FUNCTIONS (Deno/TypeScript)                 │   │
│  │  - Enviar mail a aseguradora (Resend/SendGrid)                      │   │
│  │  - Generar PDF orden de trabajo / factura                          │   │
│  │  - Jobs programados: recordatorios, reclamos de cobro               │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────────────────┘
```

### Component Responsibilities

| Component | Responsibility | Typical Implementation |
|-----------|-----------------|--------------------------|
| Frontend (React + Vite + TypeScript) | UI responsive tablet/desktop, formularios con canvas para bosquejo del auto, cámara, cache offline-first | React 18, Vite 5, Tailwind CSS, React Hook Form + Zod, Fabric.js, PWA (Workbox) |
| Supabase Auth | Autenticación, sesiones, roles vía JWT claims | GoTrue, email/password, custom claim `role: 'dueno' \| 'recepcion' \| 'taller'` |
| Supabase Database (PostgreSQL 15+) | Persistencia transaccional, RLS por rol, triggers de auditoría | Tablas normalizadas, ENUMs de estado, JSONB para datos flexibles de fichas |
| Supabase Storage | Fotos de daños, firmas, PDFs generados | Buckets privados con signed URLs, políticas RLS por caso/usuario |
| Supabase Realtime | Semáforo de estado en vivo, aviso de "nuevo turno" | Canales por `caso_id`, `postgres_changes` para UI reactiva |
| Edge Functions (Deno) | Lógica server-side: mails, PDFs, jobs programados | Deno runtime, secrets management, invocación HTTP o `pg_cron` |
| Proveedor de email (Resend/SendGrid) | Envío de presupuesto/orden de trabajo a la aseguradora | API REST, plantillas por aseguradora |

## Recommended Project Structure

```
aguila-blanca-pdr/
├── supabase/
│   ├── config.toml
│   ├── migrations/
│   │   ├── 0001_initial_schema.sql
│   │   ├── 0002_rls_policies.sql
│   │   └── 0003_storage_buckets.sql
│   ├── seed.sql                   # aseguradoras precargadas, usuarios demo
│   └── functions/
│       ├── send-mail/             # envío a aseguradora
│       ├── generate-pdf/          # PDF de orden de trabajo / factura
│       └── _shared/
├── src/
│   ├── app/                       # shell, providers, routing por rol
│   ├── features/
│   │   ├── auth/
│   │   ├── cases/                 # casos, listado, semáforo de estado
│   │   ├── inspection/            # fichas de inspección (pre-ingreso, ingreso)
│   │   │   └── components/VehicleSketch.tsx   # canvas bosquejo + daños
│   │   ├── repair/                 # ficha de trabajo + repuestos
│   │   ├── crm/                    # clientes, aseguradoras, productores
│   │   ├── billing/                 # facturación (solo rol dueño)
│   │   └── stock/                   # listado de materiales
│   └── shared/                     # UI base, hooks, tipos, constantes (aseguradoras, colores semáforo)
├── .env.example
└── package.json
```

### Structure Rationale

- **Feature-based (`src/features/`)**: cada dominio del flujo (casos, fichas, reparación, CRM, facturación, stock) encapsula sus propios componentes/hooks/queries — evita mezclar la lógica de "seguro" con la de "particular"
- **`supabase/` versionado junto al frontend**: migraciones y políticas RLS quedan en el mismo repo, así el esquema de roles/permisos evoluciona junto con la UI que depende de él
- **`billing/` aislado**: al ser la única feature con datos sensibles (diferencial facturado/cobrado), separarla facilita aplicar RLS y revisar permisos sin tocar el resto

## Architectural Patterns

### 1. El caso como máquina de estados (semáforo de estado)

El "semáforo" no es un campo suelto — es una máquina de estados con transiciones válidas y efectos (mails, tareas):

```typescript
type CaseChannel = 'seguro' | 'particular';
type CaseStatus =
  | 'borrador'              // presupuesto en curso
  | 'enviado_aseguradora'   // esperando respuesta de la Cía / del cliente
  | 'aprobado'              // OT recibida / cliente aceptó presupuesto
  | 'turno_coordinado'
  | 'ingresado_taller'
  | 'esperando_repuesto'    // sub-estado dentro de reparación
  | 'en_reparacion'
  | 'listo_para_firma'
  | 'firmado'
  | 'facturado'
  | 'cobrado'
  | 'reclamo_aseguradora'
  | 'cerrado'
  | 'cancelado';

const transicionesValidas: Record<CaseStatus, CaseStatus[]> = {
  borrador: ['enviado_aseguradora', 'cancelado'],
  enviado_aseguradora: ['aprobado', 'cancelado'],
  aprobado: ['turno_coordinado', 'cancelado'],
  turno_coordinado: ['ingresado_taller', 'cancelado'],
  ingresado_taller: ['esperando_repuesto', 'en_reparacion', 'cancelado'],
  esperando_repuesto: ['en_reparacion', 'cancelado'],
  en_reparacion: ['listo_para_firma', 'esperando_repuesto'],
  listo_para_firma: ['firmado', 'en_reparacion'],
  firmado: ['facturado'],
  facturado: ['cobrado', 'reclamo_aseguradora'],
  reclamo_aseguradora: ['cobrado', 'cerrado'],
  cobrado: ['cerrado'],
  cerrado: [],
  cancelado: [],
};
```

**Por qué:** evita estados inválidos (ej. facturar sin orden firmada) y centraliza la regla de negocio en un solo lugar, independiente de la UI.

### 2. Fotos y adjuntos fuera de la base de datos

Las fotos y PDFs no se guardan en la base — van a Supabase Storage, con metadata en una tabla `adjuntos`:

```sql
create table adjuntos (
  id uuid primary key default gen_random_uuid(),
  caso_id uuid not null references casos(id) on delete cascade,
  bucket text not null,
  path text not null,
  tipo text not null,   -- 'foto_dano' | 'foto_reparacion' | 'bosquejo' | 'firma' | 'pdf_ot' | 'pdf_factura'
  metadata jsonb default '{}',
  created_at timestamptz default now()
);
```

**Por qué:** mantiene la base liviana y permite aplicar políticas de acceso (RLS) por caso sin duplicar reglas de permisos dentro del blob binario.

### 3. Permisos por rol (RBAC) vía RLS de Postgres

Los 3 roles (dueño, recepción, taller) se resuelven con una función de Postgres que lee el rol del JWT y políticas RLS por tabla — no con lógica de permisos repetida en el frontend:

```sql
create policy "solo dueno ve facturacion"
  on facturas for select
  using (auth.jwt() ->> 'role' = 'dueno');
```

**Por qué:** el diferencial facturado/cobrado (dato sensible, ver PITFALLS.md) queda protegido a nivel de base de datos, no solo ocultado en la interfaz — así ningún cambio futuro en el frontend puede filtrarlo por error.

## Data Flow

**Flujo típico de un caso de seguro, de ingreso a cobro:**

```
Recepción crea caso (canal=seguro)
   → carga ficha de inspección pre-ingreso (fotos + bosquejo) → tabla `casos` + `adjuntos`
   → estado: enviado_aseguradora → Edge Function dispara mail a la Cía
   → Cía responde con orden de trabajo (carga manual del dato) → estado: aprobado
   → recepción coordina turno → estado: turno_coordinado
   → auto ingresa → ficha de ingreso (Ficha 2) → estado: ingresado_taller
   → taller repara; si falta repuesto → estado: esperando_repuesto (sub-estado visible en el semáforo)
   → reparación termina → ficha de trabajo (Ficha 3) → firma con fotos → estado: firmado
   → se genera factura (Edge Function PDF) → estado: facturado
   → recepción/dueño registra cobro real → estado: cobrado o reclamo_aseguradora si no paga
```

Cada cambio de estado queda auditado (quién, cuándo) para poder reconstruir el historial de un caso ante un reclamo.

## Scaling Considerations

Este es un solo taller con, según lo relevado, decenas de casos activos por mes — no se diseña para escala masiva.

| Escala | Ajuste de arquitectura |
|--------|--------------------------|
| Uso actual (un taller, decenas de casos/mes) | Supabase en su plan gratuito o inicial alcanza sobradamente; sin necesidad de cache adicional |
| Si se sumaran más sucursales a futuro | Agregar un campo `sucursal_id` y políticas RLS por sucursal — no requiere cambiar de stack |
| Si el volumen de fotos creciera mucho | Revisar plan de Storage de Supabase (por GB) y comprimir fotos en el cliente antes de subir |

### Scaling Priorities

1. **Primer cuello de botella esperable:** tamaño/cantidad de fotos por caso, no la base de datos relacional — mitigarlo comprimiendo en el cliente
2. **Segundo:** ninguno relevante a esta escala; no vale la pena optimizar antes de tener el sistema en uso real

## Anti-Patterns

### Anti-Pattern 1: Mezclar la infraestructura con la de Lemmon Internet

**Qué hacen mal:** reutilizar el VPS/base de datos de otro sistema "porque ya está pago y andando"
**Por qué está mal:** el dueño pidió explícitamente separar los dos negocios; mezclar datos de un ISP con los de un taller de bollos genera riesgo operativo y de permisos cruzados
**Hacer en cambio:** proyecto de Supabase y repo propios, dedicados solo a Sacabollos Águila Blanca

### Anti-Pattern 2: Ocultar el diferencial de facturación solo en el frontend

**Qué hacen mal:** no mostrar el campo "cobrado real" en la pantalla de recepción/taller, pero dejarlo accesible por API
**Por qué está mal:** cualquiera con las herramientas de desarrollador del navegador podría ver el dato sensible
**Hacer en cambio:** aplicar la restricción con RLS en la base de datos (ver Patrón 3), no solo en la UI

## Integration Points

### External Services

| Service | Integration Pattern | Notes |
|---------|------------------------|-------|
| Aseguradoras (mail) | Edge Function que arma y envía el mail con presupuesto + fotos adjuntas | Cada aseguradora puede tener su propia plantilla/destinatario; guardar esto en una tabla `aseguradoras`, no hardcodeado |
| Supabase Storage | Subida directa desde el cliente con signed URL | Evita pasar fotos pesadas por una Edge Function intermedia |

### Internal Boundaries

| Boundary | Communication | Notes |
|----------|-----------------|-------|
| `cases` ↔ `billing` | Lectura directa vía RLS | `billing` solo es visible para el rol dueño, aunque viva en el mismo caso |
| `inspection`/`repair` ↔ `cases` | El estado del caso se actualiza al completar cada ficha | Debe pasar siempre por la máquina de estados, nunca escribir el status a mano desde la UI |

## Sources

- Investigación de dominio delegada a modelo NVIDIA NIM (nvidia/nemotron-3-ultra-550b-a55b)
- Documentación pública de Supabase (Database, Auth, Storage, Realtime, Edge Functions)
- Patrones estándar de arquitectura para SaaS verticales chicos con roles y flujo de estados

---
*Architecture research for: gestión de taller PDR con casos de seguro y particulares*
*Researched: 2026-08-19*
