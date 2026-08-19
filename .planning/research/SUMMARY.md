# Project Research Summary

**Project:** Sistema de Gestión — Sacabollos Aguila Blanca
**Domain:** Vertical SaaS chico para gestión de taller de reparación de bollos (PDR), con dos canales (seguro/particular), fichas digitales, CRM, facturación y roles
**Researched:** 2026-08-19
**Confidence:** HIGH

## Executive Summary

Este es un SaaS vertical de escala chica: un solo taller, decenas de casos activos por mes, 3 roles de usuario. El patrón estándar para este tipo de proyecto en 2025-2026 es un frontend React + Vite (PWA para tolerar mala conexión en el taller) sobre Supabase como backend gestionado (Postgres + Auth + Storage + Realtime + Edge Functions), con roles resueltos vía Row Level Security en la base de datos, no solo en la interfaz.

El corazón del sistema es modelar cada caso como una máquina de estados (el "semáforo de estado" que pidió el dueño), con dos canales de entrada (seguro y particular) que comparten la mayoría del flujo mientras el auto está en el taller pero difieren antes de eso. El riesgo principal no es técnico sino de completitud de datos: fichas incompletas, repuestos sin seguimiento, y visibilidad indebida del diferencial facturado/cobrado son los errores más probables si no se ponen validaciones y permisos desde el diseño inicial, no como agregado posterior.

Infraestructura y base de datos deben quedar completamente separadas de Lemmon Internet, por pedido explícito del dueño — Supabase con un proyecto nuevo y dedicado resuelve esto sin necesidad de mantener un servidor propio.

## Key Findings

### Recommended Stack

React 18 + Vite + TypeScript como frontend (PWA con Workbox para tolerar conectividad intermitente en el taller), Supabase como backend completo (Postgres 15+, Auth, Storage, Realtime, Edge Functions en Deno), Tailwind CSS para estilos, y Vercel/Netlify para hosting del frontend. Librerías clave: React Hook Form + Zod para las 3 fichas, Fabric.js para el bosquejo del auto con marcado de daños, Resend/SendGrid para el mail a aseguradoras, TanStack Query para sincronizar el semáforo de estado. Ver `STACK.md`.

**Core technologies:**
- Supabase (Postgres + Auth + Storage + Realtime): backend completo, separado de Lemmon, con RLS para los 3 roles
- React + Vite + TypeScript: frontend PWA, funciona bien en tablet y PC
- Fabric.js: canvas interactivo para el bosquejo del auto con daños

### Expected Features

**Must have (table stakes):** gestión de casos por canal (seguro/particular), 3 fichas digitales con fotos y bosquejo, semáforo de estado, CRM básico, stock simple, roles y permisos, uso multi-dispositivo.

**Should have (competitive):** doble registro de facturación (facturado vs. cobrado), plantillas de mail por aseguradora, historial de casos por cliente/aseguradora.

**Defer (v2+):** bot de atención por WhatsApp (requiere servidor propio nuevo, fuera de alcance por decisión del dueño), app móvil nativa, integración con proveedores de repuestos.

Ver `FEATURES.md` para el detalle completo y la matriz de priorización.

### Architecture Approach

Frontend React (PWA) hablando directo con Supabase vía su SDK, con Edge Functions en Deno para lo que necesita lógica de servidor (mandar mail a la aseguradora, generar PDF de orden de trabajo/factura). El caso se modela como máquina de estados con transiciones válidas explícitas; las fotos y PDFs viven en Supabase Storage referenciados desde una tabla `adjuntos`, no embebidos en la base. Los permisos por rol se resuelven con RLS de Postgres, no solo ocultando campos en la UI. Ver `ARCHITECTURE.md` para el diagrama completo, la estructura de carpetas sugerida y el detalle de la máquina de estados.

**Major components:**
1. Frontend (React + Vite) — UI por rol, fichas, semáforo, CRM, facturación
2. Supabase (Auth + DB + Storage + Realtime) — persistencia, permisos, archivos
3. Edge Functions (Deno) — mail a aseguradoras, generación de PDF, jobs programados

### Critical Pitfalls

1. **Fichas incompletas** — mitigar con campos obligatorios y validación en tiempo real desde el primer desarrollo de las fichas
2. **Diferencial facturado/cobrado visible a roles no autorizados** — restringir con RLS en la base de datos, nunca solo en el frontend
3. **Repuestos sin seguimiento** — vincular el sub-estado "esperando repuesto" al semáforo, no llevarlo aparte en papel/memoria
4. **Confusión entre canales seguro/particular** — la máquina de estados debe tener transiciones y pantallas explícitamente distintas por canal

Ver `PITFALLS.md` para el resto (UX en tablet, seguridad, deuda técnica a evitar).

## Implications for Roadmap

Estructura de fases sugerida, de la más fundacional a la más periférica:

### Fase 1: Fundaciones (auth, roles, esquema base)
**Rationale:** todo lo demás depende de tener roles y permisos reales desde el día uno (ver Pitfall 4 y Anti-Pattern 2 de ARCHITECTURE.md)
**Delivers:** proyecto Supabase nuevo, login con 3 roles, esquema de base inicial (casos, adjuntos, aseguradoras)
**Avoids:** tener que retrofitear permisos después de construir pantallas

### Fase 2: Casos y fichas — rama Seguro
**Rationale:** es el flujo más largo y con más pasos (denuncia → presupuesto → OT → taller → cobro); conviene resolverlo primero porque el flujo Particular es un subconjunto
**Delivers:** alta de caso, ficha de inspección pre-ingreso con fotos y bosquejo, envío de presupuesto a la aseguradora, registro de la orden de trabajo
**Uses:** máquina de estados y bosquejo interactivo (Fabric.js) de ARCHITECTURE.md/STACK.md

### Fase 3: Casos y fichas — rama Particular + turnos
**Rationale:** reutiliza la base de la Fase 2, agrega la coordinación de turno con el cliente
**Delivers:** presupuesto directo a particular, turno, ficha de ingreso al taller (Ficha 2)

### Fase 4: Reparación, repuestos y semáforo de estado
**Rationale:** requiere que existan casos ya ingresados (Fases 2-3) para tener algo que reparar
**Delivers:** ficha de trabajo (Ficha 3), sub-estado "esperando repuesto", semáforo de estado visual completo
**Implements:** máquina de estados completa de ARCHITECTURE.md

### Fase 5: Facturación y cobros
**Rationale:** depende de que un caso llegue a "firmado" (Fase 4) antes de poder facturarse
**Delivers:** registro de monto facturado vs. total cobrado (visible solo para dueño), reclamo a la compañía si no paga
**Addresses:** Pitfall 4 (RLS para el diferencial)

### Fase 6: CRM básico
**Rationale:** se enriquece con el historial que ya generaron los casos de las fases anteriores
**Delivers:** clientes particulares, aseguradoras (con las 6 ya identificadas) y productores, historial de casos por cliente/aseguradora

### Phase Ordering Rationale

- Seguro antes que Particular porque tiene más pasos y define la máquina de estados completa; Particular reutiliza esa base
- Facturación va después de Reparación porque un caso no puede facturarse sin haber llegado a "firmado"
- CRM va al final porque depende de tener casos cargados para mostrar historial — no bloquea nada previo

### Research Flags

Phases likely needing deeper research/discusión durante el planning:
- **Fase 2:** el bosquejo interactivo del auto (Fabric.js) es la pieza de UI más nueva/específica — conviene una discusión de UI antes de plan-phase
- **Fase 5:** confirmar con el dueño el detalle exacto de qué significa "reclamo a la compañía" en la práctica (solo un estado, o también un recordatorio automático)

Phases with standard patterns (pueden saltear research-phase):
- **Fase 1:** setup de Supabase Auth + RLS es un patrón muy documentado
- **Fase 6:** CRUD de CRM es un patrón estándar

## Confidence Assessment

| Area | Confidence | Notes |
|------|------------|-------|
| Stack | HIGH | Combinación React+Supabase es el patrón estándar 2025-2026 para este tamaño de proyecto |
| Features | HIGH | Deriva directamente de los flujos a mano del dueño, con poco margen de interpretación |
| Architecture | HIGH | Patrón de máquina de estados + RLS es sólido y bien documentado en el ecosistema Supabase |
| Pitfalls | MEDIUM | Generales del dominio "gestión de taller"; las particularidades del mercado de seguros argentino tienen menos fuentes verificables |

**Overall confidence:** HIGH

### Gaps to Address

- Detalle exacto de las plantillas de mail por aseguradora (formato que cada compañía espera) — validar con el dueño durante el planning de la Fase 2, no bloquea el arranque
- Definición fina de qué datos exactos lleva cada una de las 3 fichas — el dueño ya dio una base sólida en las fotos, pero puede afinarse en `/gsd-discuss-phase` de la Fase 1-2

## Sources

### Primary (HIGH confidence)
- Documentación pública de Supabase (Auth, Database, Storage, Realtime, Edge Functions)
- Flujos a mano transcriptos del dueño (`docs/flujos-originales/TRANSCRIPCION.md`)

### Secondary (MEDIUM confidence)
- Investigación de dominio delegada a modelos NVIDIA NIM: deepseek-ai/deepseek-v4-flash-0731, nvidia/nemotron-3-ultra-550b-a55b, meta/llama-3.1-70b-instruct, nvidia/llama-3.3-nemotron-super-49b-v1.5 (ver STACK.md, ARCHITECTURE.md, FEATURES.md, PITFALLS.md)

### Tertiary (LOW confidence)
- Comparación con sistemas genéricos de "body shop management" — mencionados de memoria general por los modelos, sin verificación directa de sus features actuales

---
*Research completed: 2026-08-19*
*Ready for roadmap: yes*
