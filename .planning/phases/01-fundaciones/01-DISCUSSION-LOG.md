# Phase 1: Fundaciones - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-08-20
**Phase:** 1-Fundaciones
**Areas discussed:** Auth y creación de usuarios, Pantalla de inicio por rol, Navegación responsive, Stack técnico Supabase

---

## Auth y creación de usuarios

| Option | Description | Selected |
|--------|-------------|----------|
| Vos los das de alta a mano | Los creás directo en el panel de Supabase Auth | |
| Pantalla de invitación | Se construye una pantalla para invitar usuarios por email desde la app | ✓ |

| Option | Description | Selected |
|--------|-------------|----------|
| Email + contraseña | Estándar de Supabase Auth | ✓ |
| PIN numérico corto | Más rápido para tablet, requiere lógica custom | |

| Option | Description | Selected |
|--------|-------------|----------|
| Solo dueño | Único rol con acceso a invitar/gestionar usuarios | |
| Dueño y recepción | Ambos pueden invitar, solo dueño asigna rol dueño | ✓ |

**User's choice:** Pantalla de invitación, login email+contraseña, pueden invitar dueño y recepción (solo dueño asigna rol dueño).
**Notes:** —

---

## Pantalla de inicio por rol

| Option | Description | Selected |
|--------|-------------|----------|
| Tablero de casos | Listado con semáforo + acceso a facturación | ✓ (Dueño) |
| Dashboard con métricas | Pantalla propia de números antes del listado | |

| Option | Description | Selected |
|--------|-------------|----------|
| Turnos del día | Agenda de hoy + acceso rápido a crear caso | ✓ (Recepción) |
| Tablero de casos | Mismo listado general que taller | |

| Option | Description | Selected |
|--------|-------------|----------|
| Tablero de casos activos | Casos en reparación/esperando repuesto | ✓ (Taller) |
| Lista de fichas pendientes | Vista centrada en fichas de trabajo faltantes | |

**User's choice:** Dueño → tablero de casos; Recepción → turnos del día; Taller → tablero de casos activos.
**Notes:** —

---

## Navegación responsive

| Option | Description | Selected |
|--------|-------------|----------|
| Sidebar que colapsa a barra inferior | Sidebar en PC, barra inferior táctil en tablet | ✓ |
| Mismo sidebar colapsable en ambos | Solo se achica a íconos, sin cambiar a barra inferior | |

| Option | Description | Selected |
|--------|-------------|----------|
| Tablet grande (10-12") | Tipo iPad estándar | ✓ |
| Tablet chica (7-8") | Diseño más compacto tipo móvil | |

**User's choice:** Sidebar en PC / barra inferior en tablet, diseñado para tablet 10-12".
**Notes:** —

---

## Stack técnico Supabase

| Option | Description | Selected |
|--------|-------------|----------|
| React + Vite | SPA liviana, conecta directo a Supabase client-side | ✓ |
| Next.js | Más estructura, útil si se necesita lógica server-side propia | |

| Option | Description | Selected |
|--------|-------------|----------|
| Tabla profiles en Supabase | Tabla propia vinculada al usuario, permite RLS por rol | ✓ |
| Metadata de Supabase Auth | Rol en user_metadata, sin tabla extra | |

| Option | Description | Selected |
|--------|-------------|----------|
| Vercel | Deploy automático desde GitHub, gratis, separado de Lemmon | ✓ |
| Netlify | Alternativa equivalente | |

**User's choice:** React + Vite, tabla `profiles` para roles, hosting en Vercel.
**Notes:** —

---

## Claude's Discretion

- Estructura exacta de la tabla `profiles`, librería de routing, librería de UI base

## Deferred Ideas

Ninguna — la discusión se mantuvo dentro del alcance de la fase.
