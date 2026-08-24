# Sacabollos Aguila Blanca

Sistema de gestión para taller de sacabollos — Aguila Blanca.

![Phase](https://img.shields.io/badge/Phase-1%20Fundaciones-blue)
![Status](https://img.shields.io/badge/Status-Tasks%201--3%20%E2%9C%85%20%7C%20Task%204%20%E2%8F%B3-yellow)

## Estado actual: Fase 1 - Fundaciones (parcial — Tasks 1-3 ✅ en código, Task 4 ⏳ bloqueada)

**Completado (Tasks 1-2):**
- Gate de legitimidad de 6 paquetes npm auditados "too-new" ✅
- Scaffold Vite+React+TS+Tailwind v4 + UI primitives (`Ficha`, `TextField`, `PrimaryButton`) + tests ✅
- `npm run build` ✓, `npm run test` ✓, `npm run typecheck` ✓

**Escrito, falta pushear (Task 3):**
- `supabase/migrations/0001_profiles.sql` y `supabase/seed/0001-promote-first-dueno.sql` ya están en el repo, siguiendo al pie de la letra el spec de `.planning/phases/01-fundaciones/01-01-PLAN.md` (tabla `profiles` + RLS habilitada en la misma migración + trigger `on_auth_user_created` + helper `current_user_role()` en `plpgsql` + GRANT de columna acotado a `full_name`, sin GRANT de escritura sobre `role`).
- **Falta correr `npx supabase link` + `npx supabase db push` contra el proyecto Supabase real** — esto requiere `SUPABASE_ACCESS_TOKEN`, `SUPABASE_DB_PASSWORD` y `SUPABASE_PROJECT_REF`, que no están disponibles en este entorno. Ver sección "Próximos pasos" para los comandos exactos.

**Bloqueado (Task 4) — requiere configuración externa:**
- **Task 4**: Login real deployado en Vercel + verificación humana tablet/PC — necesita `VERCEL_TOKEN` + importar repo + crear usuario dueño + correr el seed de promoción

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

### ✅ Supabase Project — YA CREADO (2026-08-23)
| Dato | Valor |
|------|-------|
| **Project Ref** | `tnwrewghcowayuudvxey` |
| **Project URL** | `https://tnwrewghcowayuudvxey.supabase.co` |
| **API URL (REST)** | `https://tnwrewghcowayuudvxey.supabase.co/rest/v1/` |
| **Región** | `us-east-2` (Ohio) — *nota: ideal migrar a `sa-east-1` (São Paulo) para latencia* |
| **Dashboard** | https://supabase.com/dashboard/project/tnwrewghcowayuudvxey |

> ✅ La migración `profiles` **ya está escrita y en el repo** (`supabase/migrations/0001_profiles.sql`). Lo único que falta es correr el `link` + `db push` contra el proyecto Supabase real, porque eso requiere tokens que no están disponibles en este entorno.

### Task 3: Pushear la migración `profiles` a Supabase vivo
**Variables que necesitás** (crealas en `.env` local; no se commitean):

| Variable | Dónde sacarla en Supabase Dashboard |
|----------|--------------------------------------|
| `VITE_SUPABASE_URL` | Settings → API → Project URL (`https://tnwrewghcowayuudvxey.supabase.co`) |
| `VITE_SUPABASE_ANON_KEY` | Settings → API → anon public (publishable key) |
| `SUPABASE_DB_PASSWORD` | Settings → Database → Database password |
| `SUPABASE_ACCESS_TOKEN` | Settings → Access Tokens → Generate new token (o usa `sbp_...` que ya tenés) |
| `SUPABASE_PROJECT_REF` | `tnwrewghcowayuudvxey` (Settings → General → Reference ID) |

**Comandos para correr (con las variables de arriba en el entorno):**
```bash
# 1. Clonar repo (o usar el que ya tenés local)
git clone https://github.com/PabloIan92/sacabollos-aguila-blanca.git
cd sacabollos-aguila-blanca

# 2. Instalar deps
npm ci

# 3. Link + push de la migración ya presente en supabase/migrations/0001_profiles.sql
npx supabase link --project-ref tnwrewghcowayuudvxey
npx supabase db push

# 4. Verificar
npx supabase migration list --linked
# Debe mostrar 0001_profiles aplicada en remoto

# 5. Confirmar que RLS bloquea al rol anónimo (debe devolver exactamente [])
curl -s "$VITE_SUPABASE_URL/rest/v1/profiles?select=id" -H "apikey: $VITE_SUPABASE_ANON_KEY"
```

**Qué crea la migración (`supabase/migrations/0001_profiles.sql`):**
- Tabla `public.profiles` (`id` FK a `auth.users`, `full_name`, `role` ∈ {dueno,recepcion,taller}, `created_at`)
- RLS habilitada en la misma migración: `profiles_select_own`, `profiles_update_own`, `profiles_select_all_for_admins` (dueño y recepción ven todos los perfiles)
- Trigger `on_auth_user_created` → auto-crea perfil al alta en `auth.users`, con rol `taller` (el de menor privilegio) si la metadata no trae un rol válido — nunca asigna `dueno` sin autorización explícita
- Backfill idempotente para usuarios de Auth creados antes de esta migración
- Helper `public.current_user_role()` en `plpgsql` (no `sql`, para que el planificador no lo inlinee y rompa el `security definer`) — evita recursión de RLS
- GRANT: `select` completo + `update` acotado **solo a la columna `full_name`** para `authenticated` — el rol nunca es escribible vía PostgREST

Además ya está `supabase/seed/0001-promote-first-dueno.sql`, para correr una sola vez en el SQL Editor después del push (reemplazando el email placeholder por el del dueño real).

### Task 4: Deploy Vercel + Login real
Requiere:
1. `VERCEL_TOKEN` (crear en https://vercel.com/account/tokens)
2. Importar repo en Vercel (Framework: Vite, Build: `npm run build`, Output: `dist`)
3. Configurar 2 env vars en Vercel (Production):
   - `VITE_SUPABASE_URL` = `https://tnwrewghcowayuudvxey.supabase.co`
   - `VITE_SUPABASE_ANON_KEY` = (anon public de Settings → API)
4. En Supabase Dashboard → Authentication → Users → **Add user** (email del dueño, password, "Auto Confirm User" activado)
5. Después del push de Task 3, correr `supabase/seed/0001-promote-first-dueno.sql` en el SQL Editor reemplazando el email placeholder (promueve ese usuario a `dueno`)

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
├── index.html           # Demo visual aprobada (fichas individuales por rol)
├── tablero.html         # Prototipo Planilla de Control (vista tabular tipo Excel con semáforo y stock)
└── proyecto.html        # Resumen del proyecto y roadmap visible en la demo

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

## Demos visuales (GitHub Pages)

Publicadas en GitHub Pages como referencia visual aprobada:
- **`docs/index.html`** (Fichas de taller): login con selector de roles, vista de fichas con sellos y detalle interactivo.
- **`docs/tablero.html`** (Planilla de Control): vista tabular compacta tipo Excel con semáforo de 9 etapas por caso (CASOS-04) y solapa de control de stock simple (STOCK-01). Muestra cómo el proceso se actualiza automáticamente sin perder la aprobación por rol.

La app real (`src/`) reutiliza exactamente esos tokens vía `src/styles/theme.css`.

---

## Changelog — Sesión 2026-08-24 (Migración `profiles` escrita, falta push)

**Objetivo:** revisar el repo desde otra máquina y avanzar todo lo que no requiere credenciales de Supabase/Vercel.

### Cambios realizados
| Archivo | Acción | Detalle |
|---------|--------|---------|
| `supabase/migrations/0001_profiles.sql` | **Nuevo** | Tabla `profiles` + RLS habilitada en la misma migración + trigger `on_auth_user_created` (rol `taller` por defecto si la metadata no trae uno válido) + backfill idempotente + helper `current_user_role()` en `plpgsql` + 3 políticas + GRANT acotado a la columna `full_name`. Sigue el spec de `01-01-PLAN.md` Task 3 punto por punto; pasa los greps de verificación automatizada del propio plan. |
| `supabase/seed/0001-promote-first-dueno.sql` | **Nuevo** | UPDATE de una sola fila para promover el primer usuario a `dueno`, con placeholder de email a reemplazar. |
| `README.md` | **Actualizado** | Estado de Task 3 pasa de "bloqueada" a "escrita, falta pushear"; instrucciones corregidas para reflejar el rol por defecto real (`taller`, no `recepcion`) y quitada la mención a un trigger `updated_at` que la migración no implementa (no estaba en el spec de `01-01-PLAN.md`). |

**Lo que sigue bloqueado — necesita que Pablo lo corra con sus credenciales:**
- `npx supabase link --project-ref tnwrewghcowayuudvxey && npx supabase db push` (requiere `SUPABASE_ACCESS_TOKEN` y `SUPABASE_DB_PASSWORD` suyos).
- Todo Task 4 (Vercel + usuario dueño + seed de promoción).

---

## Changelog — Sesión 2026-08-23 (Prototipo Planilla de Control)

**Objetivo:** El cliente no sabía lo que quería, mandó video de un Excel de control de stock. Se propuso y construyó un prototipo de "Planilla de Control" tipo Excel de **solo lectura** que refleja el estado real del proceso (cada celda se pinta sola cuando el responsable completa su ficha), sin romper el control por roles.

### Cambios realizados
| Archivo | Acción | Detalle |
|---------|--------|---------|
| `docs/tablero.html` | **Nuevo** | Prototipo autocontenido (~650 líneas). Tabla densa 12 casos × 9 etapas (semáforo CASOS-04), KPIs, solapa Stock (STOCK-01), drawer con bosquejo + timeline 9 etapas + facturación. Estética idéntica a demo aprobada (paleta, fuentes, breakpoint 820px, estilo "ficha de taller"). |
| `docs/index.html` | **Modificado** | Agregados 2 accesos prominentes: botón en topbar (brass, activo) + banner en login con llamada a la acción. |
| `README.md` | **Actualizado** | Sección "Demos visuales" con link a tablero.html; estructura `docs/` actualizada; esta sección de changelog. |
| `.claude/CLAUDE.md` | **Actualizado** | Convención añadida: "Actualizar README y reflejar en demo GitHub Pages (docs/) tras cada cambio". |

### Qué muestra la Planilla (tablero.html)
- **12 casos mock** cubriendo todas las etapas reales: `borrador` → `enviado a la aseguradora` → `aprobado` → `turno coordinado` → `ingresado` → `esperando repuesto` (con nombre del repuesto) → `en reparación` → `listo para firma` → `firmado` → `facturado` → `cobrado` / `reclamo a la compañía` / `cancelado`.
- **Semáforo visual** por celda: ✓ verde = completado · ● azul = en proceso activo · ◐ brass = espera externa · REP brass = falta repuesto · ✖ rojo = reclamo · — gris = pendiente.
- **Columna "Días"**: roja bold si ≥5 días trabados en la misma etapa (casos OT-1028, OT-1033, OT-1034 destacados).
- **KPIs arriba**: Autos en taller, Esperando repuesto, Casos trabados (≥5d), Reclamos a Cías., Facturado sin cobrar (solo dueño).
- **Solapa Stock**: 8 ítems (consumibles, herramientas, repuestos) con estados OK/Bajo/Faltante.
- **Click en fila** → panel lateral con bosquejo SVG daños, timeline 9 etapas coloreado por responsable (Recepción/Taller/Dueño), facturación con diferencial.
- **Filtros**: Todos / Seguro / Particular / "Solo trabados (≥5d)".
- **Concepto vendido al cliente**: *"Es tu Excel, pero se llena solo"* — nadie edita la planilla a mano; cada celda cambia de color cuando el responsable aprueba su parte en su pantalla.

### Estado actual tras esta sesión
- **Fase 1 (Fundaciones)**: Tasks 1-2 ✅ (scaffold, UI primitives, tema visual, tests). Tasks 3-4 ⏳ bloqueadas (requieren Supabase + Vercel propios).
- **Demo Fichas**: https://pabloian92.github.io/sacabollos-aguila-blanca/
- **Demo Planilla (nueva)**: https://pabloian92.github.io/sacabollos-aguila-blanca/tablero.html
- **Commits**: `f94bff3` — "feat: add Planilla de Control (tablero.html) demo with semáforo + stock"

### Próximos pasos inmediatos (para continuar desde otra PC)

1. **Clonar y arrancar local**
   ```bash
   git clone https://github.com/PabloIan92/sacabollos-aguila-blanca.git
   cd sacabollos-aguila-blanca
   npm ci
   npm run dev
   ```

2. **Validar planilla con el dueño** (ya desplegada en GitHub Pages):
   - Compartir `tablero.html` → el dueño ve todo en una pantalla tipo Excel.
   - Si aprueba estética → **se implementa de verdad en la app React** (Fase 2, plan 02-04 "Semáforo de estado visual en el listado de casos").

3. **Desbloquear Task 3-4 (Fase 1)**:
   - La migración (`supabase/migrations/0001_profiles.sql`) y el seed ya están escritos en el repo — falta solo pushearlos: `npx supabase link --project-ref tnwrewghcowayuudvxey && npx supabase db push` (con `SUPABASE_ACCESS_TOKEN` y `SUPABASE_DB_PASSWORD` en el entorno).
   - Crear `VERCEL_TOKEN` → importar repo en Vercel (Framework: Vite) → 2 env vars en producción.
   - En Supabase: crear primer usuario dueño + correr `supabase/seed/0001-promote-first-dueno.sql`.

4. **Fase 2 (Caso de Seguro)** — cuando login real esté vivo:
   - Modelo de datos y máquina de estados del caso (02-01).
   - Ficha de inspección pre-ingreso con fotos + bosquejo (02-02).
   - Turno + ficha de ingreso (02-03).
   - **Semáforo de estado real conectado a BD** (02-04) — reutilizando el diseño validado en `tablero.html`.

---

## Enlaces

- **Repo:** https://github.com/PabloIan92/sacabollos-aguila-blanca
- **Demo Fichas (GitHub Pages):** https://pabloian92.github.io/sacabollos-aguila-blanca/
- **Demo Planilla / Tablero (GitHub Pages):** https://pabloian92.github.io/sacabollos-aguila-blanca/tablero.html
- **Producción (Vercel):** *pendiente deploy Task 4*
- **Supabase:** *pendiente creación proyecto propio*