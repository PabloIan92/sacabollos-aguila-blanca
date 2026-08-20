# Sacabollos Aguila Blanca

Sistema de gestión para taller de sacabollos — Aguila Blanca.

![Phase](https://img.shields.io/badge/Phase-1%20Fundaciones-blue)
![Status](https://img.shields.io/badge/Status-Tasks%201--2%20%E2%9C%85%20%7C%20Tasks%203--4%20%E2%8F%B3-yellow)

## Estado actual: Fase 1 - Fundaciones (parcial — Tasks 1-2 ✅, Tasks 3-4 ⏳ bloqueadas)

**Completado (Tasks 1-2):**
- Gate de legitimidad de 6 paquetes npm auditados "too-new" ✅
- Scaffold Vite+React+TS+Tailwind v4 + UI primitives (`Ficha`, `TextField`, `PrimaryButton`) + tests ✅
- `npm run build` ✓, `npm run test` ✓, `npm run typecheck` ✓

**Bloqueado (Tasks 3-4) — requiere configuración externa:**
- **Task 3**: Migración `profiles` a Supabase vivo + RLS + push — necesita proyecto Supabase propio + 5 env vars
- **Task 4**: Login real deployado en Vercel + verificación humano tablet/PC — necesita `VERCEL_TOKEN` + importar repo + crear usuario dueño

> Ver sección "Próximos pasos" abajo para detalles de variables necesarias.

### Lo que está implementado

**Stack técnico:**
- React 19.2.8 + TypeScript + Vite 8.2.2
- Tailwind CSS v4 (configuración nativa con `@theme`)
- React Router 8.3.0 (data mode)
- Supabase (Auth + Postgres) — cliente `@supabase/supabase-js@2.112.3`
- Vitest 4.1.11 + React Testing Library + jsdom
- Despliegue en Vercel con auto-deploy desde GitHub

**Arquitectura de la Fase 1:**
- **Walking Skeleton**: Un usuario real entra con email+contraseña en la URL de producción y ve su nombre y rol leídos de `public.profiles` vía RLS
- **Tabla `profiles`** con RLS habilitada, trigger `on_auth_user_created`, helper `current_user_role()` en `plpgsql`, GRANT de columna acotado a `full_name` (el rol nunca se puede autofiltrar)
- **3 roles**: `dueno`, `recepcion`, `taller` (valores ASCII en BD, etiquetas en UI)
- **Navegación responsive**: Sidebar en PC (≥820px), barra inferior táctil en tablet (10-12")
- **Paleta y tipografías** reutilizadas de `docs/index.html` (demo aprobada por el dueño):
  - Colores: graphite, steel-100, steel-300, navy, blue, red, brass, green
  - Fuentes: Oswald (display), IBM Plex Sans (sans), IBM Plex Mono (mono)

**Componentes UI (primitivas visuales):**
- `Ficha` — contenedor base "ficha de taller" (borde 2px graphite, sombra 6px 6px)
- `TextField` — label en mono 13px/600 mayúsculas, borde steel-300 → red en error, mensaje error en red 13px
- `PrimaryButton` — fondo blue, texto blanco, IBM Plex Sans 600, `loading` intercambia etiqueta sin salto de layout

**Pantallas base:**
- Login real con email+contraseña (sin selector de rol: el rol sale de `profiles` post-auth)
- Estados: carga ("Ingresando…"), error copy fija en español, email persistente en error

**Testing & Calidad:**
- 2 tests de harness (matchMedia mock + jest-dom matchers)
- `npm run build` ✓, `npm run test` ✓, `npm run typecheck` ✓
- Variables de entorno: solo `VITE_SUPABASE_URL` y `VITE_SUPABASE_ANON_KEY` en bundle (`.env.example`)

---

## Próximos pasos (pendientes configuración externa)

### Task 3: Migración a Supabase en vivo
Requiere crear proyecto Supabase propio y configurar variables:
```bash
SUPABASE_PROJECT_REF=xxx
SUPABASE_DB_PASSWORD=xxx
SUPABASE_ACCESS_TOKEN=xxx
VITE_SUPABASE_URL=https://xxx.supabase.co
VITE_SUPABASE_ANON_KEY=xxx
```
Luego: `npx supabase link --project-ref $SUPABASE_PROJECT_REF && npx supabase db push`

### Task 4: Deploy Vercel + Login real
Requiere:
1. `VERCEL_TOKEN` 
2. Importar repo en Vercel (Framework: Vite)
3. Configurar 2 env vars en Vercel (production)
4. En Supabase: crear primer usuario (dueño) + correr `supabase/seed/0001-promote-first-dueno.sql`

---

## Scripts disponibles

```bash
npm run dev       # Servidor de desarrollo
npm run build     # Build de producción (tsc + vite build)
npm run preview   # Preview del build
npm run test      # Tests en modo CI (vitest run)
npm run typecheck # TypeScript sin emitir
npm run lint      # Oxlint
```

---

## Estructura del proyecto

```
src/
├── auth/              # AuthProvider, useAuth (contexto de sesión + perfil)
├── features/
│   └── login/         # LoginPage (pendiente conexión real a Supabase)
├── lib/
│   └── supabaseClient.ts  # Única instancia createClient()
├── styles/
│   └── theme.css      # Tokens Tailwind v4 @theme (paleta, tipografías, spacing, breakpoint)
├── test/
│   ├── setup.ts       # matchMedia mock + jest-dom
│   └── harness.test.ts
├── ui/                # Primitivas visuales compartidas
│   ├── Ficha.tsx
│   ├── TextField.tsx
│   └── PrimaryButton.tsx
├── App.tsx            # Demo actual: login estático con primitivas
└── main.tsx           # Entry point

supabase/
├── migrations/
│   └── 0001_profiles.sql    # Tabla profiles + RLS + trigger + helper + GRANT
└── seed/
    └── 0001-promote-first-dueno.sql  # Promueve primer usuario a 'dueno'

docs/
└── index.html           # Demo visual aprobada (fuente de verdad de paleta/tipografías/breakpoint)

.planning/
└── phases/01-fundaciones/  # Contexto, research, UI-SPEC, validation, patterns, skeleton, coverage, plan, plan-check
```

---

## Decisiones arquitectónicas clave (Fase 1)

| Decisión | Elección | Por qué |
|----------|----------|---------|
| Rol en BD | Tabla `public.profiles` (no `user_metadata`) | Consultable desde RLS de otras tablas; base para Fase 5 (facturado/cobrado solo dueño) |
| Helper rol | `current_user_role()` en `plpgsql` (no `sql`) | Evita inlineado del planificador que rompería `security definer` y causaría recursión RLS |
| Escritura rol | Solo via service-role key en Edge Function `invite-user` | `authenticated` nunca tiene GRANT UPDATE sobre columna `role` |
| Breakpoint | 820px (único) | Mismo valor que demo `docs/index.html:643`; switch CSS puro |
| Paquetes npm | Versiones exactas fijadas, 6 auditados "too-new" con gate humano | Seguridad de supply chain |

---

## Demo visual (docs/index.html)

La demo en `docs/index.html` sigue publicada en GitHub Pages como referencia visual aprobada. Contiene:
- Paleta de colores completa
- 3 tipografías (Oswald, IBM Plex Sans, IBM Plex Mono)
- Breakpoint responsive 820px
- Pantallas de referencia: login (con selector de roles — solo demo), home por rol, invitación

La app real (`src/`) reutiliza exactamente esos tokens vía `src/styles/theme.css`.

---

## Enlaces

- **Repo:** https://github.com/PabloIan92/sacabollos-aguila-blanca
- **Demo (GitHub Pages):** https://pabloian92.github.io/sacabollos-aguila-blanca/
- **Producción (Vercel):** *pendiente deploy Task 4*
- **Supabase:** *pendiente creación proyecto propio*