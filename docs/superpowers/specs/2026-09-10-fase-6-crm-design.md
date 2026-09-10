# Especificación de Diseño — Fase 6: CRM y Directorio Comercial (Aguila Blanca)

**Fecha:** 2026-09-10  
**Fase:** Fase 6 — CRM (Clientes, Aseguradoras y Productores) + Gestión de Equipo (`/invitar`)  
**Estado:** Propuesta  
**Autor:** Antigravity  

---

## 1. Contexto y Objetivos de Negocio

El taller de sacabollos Águila Blanca atiende dos perfiles de derivación comercial:
1. **Canal Particular:** Clientes individuales que traen sus autos para desabollado artesanal (PDR). Requiere seguimiento de contacto rápido por WhatsApp/teléfono, historial de vehículos atendidos y fidelización.
2. **Canal Seguro:** Derivaciones originadas por Compañías de Seguro (San Cristóbal, Federación Patronal, Mercantil Andina, Triunfo, Sancor, Cooperativa, etc.) o por Productores/Asesores de seguros aliados. Requiere control de contactos para envío de presupuestos/facturas y métricas de siniestros derivados.

### Objetivos Principales:
- **CRM-01 (Directorio de Clientes):** Consolidar la cartera de clientes con teléfono, email, notas, historial de vehículos (patentes) y casos vinculados.
- **CRM-02 (Directorio de Aseguradoras):** Gestionar las compañías aliadas con sus canales de contacto para siniestros y liquidaciones, cantidad de siniestros en curso y casos en reclamo.
- **CRM-03 (Directorio de Productores):** Registrar a los productores y asesores de seguro con su teléfono, aseguradora con la que operan y volumen de casos derivados.
- **CRM-04 (Acciones Rápidas de Comunicación):** Acceso directo a llamadas telefónicas y enlace con formato internacional a WhatsApp (`https://wa.me/549...`).
- **TEAM-01 (Gestión de Equipo / Invitar):** Habilitar la ruta `/invitar` para roles `dueno` y `recepcion` con listado de colaboradores, alta de nuevos perfiles y generación de invitaciones de acceso.

---

## 2. Arquitectura de Datos y Migración (`0007_crm_y_directorio.sql`)

### 2.1 Tablas Maestras

```sql
-- 1. Clientes
create table public.clientes (
  id uuid primary key default gen_random_uuid(),
  nombre text not null check (trim(nombre) <> ''),
  telefono text,
  email text,
  notas text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- 2. Aseguradoras
create table public.aseguradoras (
  id uuid primary key default gen_random_uuid(),
  nombre text not null unique check (trim(nombre) <> ''),
  email_siniestros text,
  telefono_contacto text,
  contacto_nombre text,
  notas text,
  activa boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- 3. Productores
create table public.productores (
  id uuid primary key default gen_random_uuid(),
  nombre text not null check (trim(nombre) <> ''),
  telefono text,
  email text,
  aseguradora text,
  notas text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
```

### 2.2 Políticas RLS (Seguridad por Rol)

- **`clientes`**:
  - `dueno` y `recepcion`: `select`, `insert`, `update`, `delete`.
  - `taller`: `select` únicamente (para consultar teléfono o contacto si el auto está en taller).
- **`aseguradoras`**:
  - `dueno` y `recepcion`: `select`, `insert`, `update`, `delete`.
  - `taller`: `select` únicamente.
- **`productores`**:
  - `dueno` y `recepcion`: `select`, `insert`, `update`, `delete`.
  - `taller`: no requiere acceso (política denegada).

### 2.3 Semillas y Backfill Inicial
- Pre-carga en `aseguradoras` de las compañías históricas documentadas en el taller: San Cristóbal, Federación Patronal, Mercantil Andina, Triunfo, Sancor, Cooperativa de Seguros, La Segunda.
- Backfill automático de clientes existentes a partir de `public.casos` mediante query de inserción `on conflict do nothing`.

---

## 3. Interfaces de Usuario

### 3.1 Pantalla Principal `/crm`
- **Tabs de Navegación:**
  1. **Clientes** (conteo total, buscador rápido, tarjetas con teléfono, WhatsApp directo y lista de casos asociados).
  2. **Aseguradoras** (tarjetas de compañías, contactos, casos activos y botón de alta/edición).
  3. **Productores** (directorio de asesores y casos derivados).
- Modal para creación y edición rápida de cada entidad con validación de formularios.

### 3.2 Pantalla `/invitar` (Gestión de Equipo)
- Listado de usuarios activos del sistema (`profiles`).
- Formulario para invitar colaborador: Email, Nombre completo, Rol (`recepcion` o `taller`).
- Integración con Supabase Auth Invite / creación administrada de perfiles.

---

## 4. Navegación en el Sistema

- Modificación en `src/app/routes.ts`:
  - Agregar ítem `/crm` con ícono `Users` para `dueno` y `recepcion`.
  - Habilitar `/invitar` con `available: true` para `dueno` y `recepcion`.
- Rutas registradas en `src/app/AppRouter.tsx` bajo `<RequireRole roles={['dueno', 'recepcion']} />`.

---

## 5. Estrategia de Testing (TDD)
1. Tests de migración SQL (`migration.test.ts`): constraints, RLS para los 3 roles y triggers `set_updated_at()`.
2. Tests unitarios de API (`crm/api.test.ts`, `equipo/api.test.ts`).
3. Tests de componentes UI (`CRMPage.test.tsx`, `InvitarPage.test.tsx`).
4. Tests de navegación y permisos en `routes.test.ts` y `AppRouter.tsx`.
