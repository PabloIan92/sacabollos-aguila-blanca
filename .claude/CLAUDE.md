<!-- GSD:project-start source:PROJECT.md -->

## Project

**Sistema de Gestión — Sacabollos Aguila Blanca**

Web app propia para gestionar el taller de reparación de bollos (PDR - paintless dent repair) Aguila Blanca, reemplazando el proceso que hoy es 100% en papel. Cubre todo el circuito de un caso — desde el ingreso del auto (por seguro o particular) hasta el cobro — con fichas digitales, turnos, seguimiento de repuestos y facturación. Uso multiusuario: dueño, recepción y taller.

**Core Value:** Que ningún auto, ficha, presupuesto o pago se pierda o se demore por depender de papel: todo el circuito (ingreso → reparación → cobro) queda registrado y visible en un solo lugar para dueño, recepción y taller.

### Constraints

- **Infraestructura**: Debe ser 100% independiente de la infraestructura de Lemmon Internet (servidor, base de datos, dominio) — por decisión explícita del dueño, no por límite técnico
- **Dispositivos**: Debe funcionar bien tanto en tablet (uso en el taller) como en PC/notebook (oficina/recepción)
- **Datos sensibles**: El diferencial "facturado vs. cobrado" debe ser visible solo para el rol dueño

<!-- GSD:project-end -->

<!-- GSD:stack-start source:research/STACK.md -->

## Technology Stack

## Recommended Stack

### Core Technologies

| Technology | Version | Purpose | Why Recommended |
|------------|---------|---------|------------------|
| React + Vite | React 19, Vite 8 | Frontend SPA/PWA | Ecosistema grande, arranque rápido, buen soporte PWA para uso en tablet con conectividad intermitente. Versión actualizada por `01-RESEARCH.md` (2026-08-20, verificada contra npm) — reemplaza el estimado inicial de React 18/Vite 5 |
| TypeScript | 5.x | Tipado del frontend y de las Edge Functions | Comparte tipos generados de la base con `supabase gen types typescript`, reduce errores en formularios de fichas |
| Supabase | plataforma gestionada (Postgres 15+) | Backend as a service: base de datos, auth, storage, realtime, edge functions | Cubre en un solo servicio todo lo que pidió el dueño (DB nueva, separada de Lemmon) sin mantener servidor propio; incluye Row Level Security para los 3 roles |
| Tailwind CSS | v4 | Estilos | Rápido de aplicar de forma consistente en formularios largos (fichas) y responsive tablet/PC. Versión actualizada por `01-RESEARCH.md` — reemplaza el estimado inicial de Tailwind 3 |
| Vercel (o Netlify) | — | Hosting del frontend | Deploy directo desde GitHub, gratis para este volumen de tráfico, totalmente separado de la infraestructura de Lemmon |

### Supporting Libraries

| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| @supabase/supabase-js | 2.x | Cliente de Supabase (DB, auth, storage, realtime) | Todas las pantallas que leen/escriben datos |
| react-router | 8.x (paquete `react-router`, NO `react-router-dom`) | Ruteo y rutas protegidas por rol | Separar vistas de dueño/recepción/taller. `react-router-dom` es ahora un espejo legacy fijado en v7 — usar `react-router` directo para proyectos nuevos (confirmado en reactrouter.com/upgrading/v7, `01-RESEARCH.md`) |
| TanStack Query | 5.x | Cache y sincronización de datos con Supabase | Listado de casos, semáforo de estado, evita refetch manual |
| React Hook Form + Zod | RHF 7.x / Zod 3.x | Formularios de las 3 fichas + validación | Fichas tienen muchos campos obligatorios (ver PITFALLS.md); Zod valida también en Edge Functions |
| Fabric.js (o `react-konva`) | 5.x / 18.x | Canvas para el bosquejo del auto con marcado de daños | Pantalla de ficha de inspección y ficha de trabajo |
| react-pdf / Puppeteer (en Edge Function) | — | Generar PDF de orden de trabajo y factura | Al firmar la orden de trabajo y al facturar |
| Resend (o SendGrid) | — | Envío de mail a las aseguradoras con presupuesto/fotos | Paso "enviar a Cía de seguro por mail" del flujo |
| date-fns | 3.x | Manejo de fechas (turnos, fecha de denuncia) | En toda la agenda/turnos |

### Development Tools

| Tool | Purpose | Notes |
|------|---------|-------|
| Supabase CLI | Migraciones, tipos, entorno local | `supabase start` levanta DB+Auth+Storage+Realtime en Docker para desarrollar sin tocar producción |
| ESLint + Prettier | Lint y formato | Config estándar de React+TS |
| Vitest | Tests unitarios (lógica de estados, cálculo facturado/cobrado) | Priorizar tests de la máquina de estados del caso, no de UI |
| Playwright | Test end-to-end del flujo completo (ingreso→cobro) | Útil dado que hay 2 canales y varios roles a verificar |

## Installation

## Alternatives Considered

| Recommended | Alternative | When to Use Alternative |
|-------------|-------------|--------------------------|
| Supabase | Firebase | Si se prefiriera NoSQL o ya se tuviera cuenta de Google Cloud; se descarta porque el modelo de datos (casos, fichas, facturación) es muy relacional |
| Supabase | Backend propio (Node/Express + Postgres en un VPS nuevo) | Si a futuro se quisiera control total del servidor; hoy es más trabajo de mantenimiento del que este proyecto justifica |
| React + Vite | Next.js | Si se quisiera SSR/SEO público; no aplica, es una app interna detrás de login |
| Fabric.js | SVG a mano con eventos de puntero | Si se quisiera evitar una dependencia extra; Fabric.js ahorra tiempo de desarrollo del bosquejo interactivo |

## What NOT to Use

| Avoid | Why | Use Instead |
|-------|-----|--------------|
| Guardar fotos como base64 en la base de datos | Infla la base de datos y hace lentas las consultas | Supabase Storage con referencia (path) en una tabla `attachments` |
| Google Apps Script / Google Sheets como backend | Es el patrón que ya usa Lemmon Internet; el dueño pidió explícitamente infraestructura separada | Supabase, nueva y dedicada a este proyecto |
| Un solo usuario/login compartido para todo el taller | No permite diferenciar permisos (ej. ocultar el diferencial facturado/cobrado al taller) | Roles reales vía Supabase Auth + RLS |

## Stack Patterns by Variant

- Usar el service worker de Vite PWA (Workbox) para cachear la app shell y encolar mutaciones (fotos, fichas) hasta reconectar
- Comprimir fotos en el cliente (ej. `browser-image-compression`) antes de subir, para que la subida sea rápida incluso con mala señal
- Subir a Supabase Storage directamente desde el cliente con signed upload URLs, no a través de una Edge Function (evita cuellos de botella)

## Version Compatibility

| Package A | Compatible With | Notes |
|-----------|------------------|-------|
| @supabase/supabase-js 2.x | Supabase Postgres 15+ | Verificar versión de Postgres al crear el proyecto en Supabase |
| React 19 | react-router 8, TanStack Query 5 | Combinación estándar, sin conflictos conocidos (actualizado por `01-RESEARCH.md`) |
| Vite 8 | Node 22.x | Fijar Node 22.x explícitamente en Vercel (actualizado por `01-RESEARCH.md`) |

## Sources

- Conocimiento general de stacks estándar 2025-2026 para SaaS verticales chicos (React + Supabase)
- Documentación pública de Supabase (Auth, Storage, Realtime, Edge Functions)
- Investigación de dominio delegada a modelos NVIDIA NIM (deepseek-ai/deepseek-v4-flash-0731 y nvidia/llama-3.3-nemotron-super-49b-v1.5) — ver también ARCHITECTURE.md, generado en la misma sesión de investigación, con el que este documento es consistente

<!-- GSD:stack-end -->

<!-- GSD:conventions-start source:CONVENTIONS.md -->

## Conventions

- **Actualización de documentación y demo:** Cada vez que se actualice cualquier funcionalidad, pantalla o prototipo, actualizar inmediatamente el `README.md` y asegurarse de que los cambios queden reflejados en la demo publicada en GitHub Pages (`docs/`).
<!-- GSD:conventions-end -->

<!-- GSD:architecture-start source:ARCHITECTURE.md -->

## Architecture

Architecture not yet mapped. Follow existing patterns found in the codebase.
<!-- GSD:architecture-end -->

<!-- GSD:skills-start source:skills/ -->

## Project Skills

No project skills found. Add skills to any of: `.claude/skills/`, `.agents/skills/`, `.cursor/skills/`, `.github/skills/`, or `.codex/skills/` with a `SKILL.md` index file.
<!-- GSD:skills-end -->

<!-- GSD:workflow-start source:GSD defaults -->

## GSD Workflow Enforcement

Before using Edit, Write, or other file-changing tools, start work through a GSD command so planning artifacts and execution context stay in sync.

Use these entry points:

- `/gsd-quick` for small fixes, doc updates, and ad-hoc tasks
- `/gsd-debug` for investigation and bug fixing
- `/gsd-execute-phase` for planned phase work

Do not make direct repo edits outside a GSD workflow unless the user explicitly asks to bypass it.
<!-- GSD:workflow-end -->

<!-- GSD:profile-start -->

## Developer Profile

> Profile not yet configured. Run `/gsd-profile-user` to generate your developer profile.
> This section is managed by `generate-claude-profile` -- do not edit manually.
<!-- GSD:profile-end -->
