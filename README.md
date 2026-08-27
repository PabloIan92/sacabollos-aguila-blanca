# Sacabollos Aguila Blanca

Sistema de gestión para taller de sacabollos — Aguila Blanca.

![Phase](https://img.shields.io/badge/Phase-1%20Fundaciones-blue)
![Status](https://img.shields.io/badge/Status-Fase%201%20completa-brightgreen)

## Estado actual: Fase 1 - Fundaciones — COMPLETA

**Completado (Tasks 1-2):**
- Gate de legitimidad de 6 paquetes npm auditados "too-new" ✅
- Scaffold Vite+React+TS+Tailwind v4 + UI primitives (`Ficha`, `TextField`, `PrimaryButton`) + tests ✅
- `npm run build` ✓, `npm run test` ✓, `npm run typecheck` ✓

**Completado (Task 3) — migración `profiles` pusheada a Supabase vivo:**
- `supabase/migrations/0001_profiles.sql` aplicada en remoto (`supabase migration list --linked` confirma `0001_profiles`).
- RLS verificada en vivo: un GET anónimo a `/rest/v1/profiles` devuelve `[]`.

**Completado (Task 4) — login real cableado, deployado, y verificado de punta a punta:**
- `src/lib/supabaseClient.ts`, `src/auth/AuthProvider.tsx`/`useAuth.ts`, `src/features/login/LoginPage.tsx` (el `App.tsx` original era un demo estático sin ninguna conexión real a Supabase — se implementó de cero en esta sesión, con 5 tests nuevos cubriendo el contrato de comportamiento).
- Producción: **https://sacabollos-aguila-blanca.vercel.app** (responde 200, sirve la SPA, sin claves privilegiadas en el bundle).
- Usuario dueño creado y promovido: `sacabollosaguilablanca@hotmail.com`, rol `dueno`.
- **Verificado con navegador real (Chrome DevTools automation)**, no solo curl: formulario renderiza, contraseña incorrecta muestra la copy fija de error y conserva el email, login válido muestra "Aguila Blanca" / "DUEÑO" / "Cerrar sesión", la sesión persiste al recargar, y la consola del navegador no tira ningún error.

**Completado (planes 01-02 y 01-03) — shell real + home por rol:**
Estos dos planes estaban escritos en `.planning/` pero nunca implementados: después de loguearse, la app no hacía nada más que mostrar nombre+rol. Implementado en esta sesión:
- `src/app/routes.ts` (`navItemsForRole`), `src/auth/RequireRole.tsx` (guardia de ruta por rol), `src/layout/{AppShell,Topbar,Sidebar,BottomTabBar}.tsx` (shell responsive: sidebar de 220px en PC, barra inferior de 56px en tablet, switch en 820px), `src/ui/FullScreenError.tsx` (perfil sin fila → error claro, no shell roto), `src/app/roleHome.ts` + `src/features/{dueno,recepcion,taller}/*Home.tsx` (cada rol aterriza en su propia pantalla con estado vacío).
- **Bug real encontrado y arreglado probando el build de producción con Chrome DevTools** (no solo con tests mockeados): `/login` nunca redirigía a `/` tras un login exitoso — el usuario se autenticaba correctamente pero se quedaba viendo el formulario. Se agregó `src/auth/RedirectIfAuthenticated.tsx`.
- Verificado con navegador real en producción: login → shell completo, sidebar en 1280px / barra inferior en 700px (capturas), "Cerrar sesión" con confirmación nombrando al usuario, logout vuelve a `/login`, sesión persiste al recargar, cero errores de consola.

**Único pendiente real, no bloqueante:** repetir la prueba de layout en una tablet física de 10-12" para el chequeo táctil/visual en hardware real (lo automatizado ya cubre el comportamiento funcional y el breakpoint responsive en el navegador).

> Ver sección "Próximos pasos" abajo para el detalle completo de esta sesión.

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

## Próximos pasos

### Infraestructura — YA CONFIGURADA (2026-08-24/25)
| Dato | Valor |
|------|-------|
| **Supabase Project Ref** | `tnwrewghcowayuudvxey` |
| **Supabase Project URL** | `https://tnwrewghcowayuudvxey.supabase.co` |
| **Supabase Dashboard** | https://supabase.com/dashboard/project/tnwrewghcowayuudvxey |
| **Vercel Team** | `aguila-blanca` (cuenta separada de la de Pablo, para poder transferirla al dueño más adelante) |
| **Producción** | https://sacabollos-aguila-blanca.vercel.app |

✅ Migración `profiles` pusheada y aplicada en remoto (`supabase migration list --linked` confirma `0001_profiles`), RLS verificada en vivo (GET anónimo devuelve `[]`).
✅ Deploy de producción en Vercel, con las 2 env vars públicas configuradas.
✅ Usuario dueño creado en Supabase Auth y promovido a rol `dueno` con el seed (credenciales entregadas por el dueño del taller, no documentadas acá por seguridad).
✅ Round-trip de login verificado con la API real (login → JWT → lectura de `profiles` vía RLS).

### Único pendiente: verificación humana
El plan exige confirmar a mano, no solo con curl, que:
1. Entrando a https://sacabollos-aguila-blanca.vercel.app desde PC y desde tablet (10-12") con las credenciales del dueño, se ve el nombre completo y la etiqueta "Dueño".
2. Una contraseña incorrecta muestra «No pudimos iniciar sesión» y el email tipeado no se borra.
3. Recargar la página logueado mantiene la sesión (no vuelve al login, no da 404).

Con eso confirmado, la Fase 1 (Fundaciones) queda cerrada del todo y se puede arrancar la Fase 2.

### Referencia: qué crea la migración (`supabase/migrations/0001_profiles.sql`)
- Tabla `public.profiles` (`id` FK a `auth.users`, `full_name`, `role` ∈ {dueno,recepcion,taller}, `created_at`)
- RLS habilitada en la misma migración: `profiles_select_own`, `profiles_update_own`, `profiles_select_all_for_admins` (dueño y recepción ven todos los perfiles)
- Trigger `on_auth_user_created` → auto-crea perfil al alta en `auth.users`, con rol `taller` (el de menor privilegio) si la metadata no trae un rol válido — nunca asigna `dueno` sin autorización explícita
- Backfill idempotente para usuarios de Auth creados antes de esta migración
- Helper `public.current_user_role()` en `plpgsql` (no `sql`, para que el planificador no lo inlinee y rompa el `security definer`) — evita recursión de RLS
- GRANT: `select` completo + `update` acotado **solo a la columna `full_name`** para `authenticated` — el rol nunca es escribible vía PostgREST

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

## Pendiente: llevar a la app real (Fase 2, plan `02-04`)

El dueño pidió 3 mejoras sobre la Planilla de Control que por ahora **solo existen en el prototipo estático `docs/tablero.html`** (datos mock en JS, sin backend). Cuando se ejecute el plan `02-04` ("Semáforo de estado visual en el listado de casos", que ya lee `casos` real vía `src/features/casos/api.ts`), hay que portar esta lógica contra datos reales:

1. **Alerta de "una semana sin avance"** — no solo el aviso temprano de "trabado" a los ≥5 días que ya estaba planeado, sino un segundo umbral en ≥7 días (`estado_changed_at`, columna ya agregada en `0002_casos.sql` para esto) que:
   - Suma un KPI separado ("Sin avance ≥7 días") además del de "trabados ≥5 días".
   - Resalta el **nombre del cliente y la patente** en rojo con un badge de alerta, tanto en la fila de la tabla como en el detalle del caso.
   - Prototipo de referencia: `docs/tablero.html`, función `stuckLevel()` y el caso mock `KPU775` (a propósito puesto en la etapa inicial "borrador" con 8 días, como ejemplo visual).
2. **Color por etapa (gradiente rojo → verde)** — las 9 columnas del semáforo pasan de un color fijo por "tipo" (verde/azul/brass/rojo) a un color propio por columna, interpolado de rojo (etapa 1) a verde (etapa 9). Prototipo de referencia: array `STAGE_COLORS` (9 pares `{border, bg}` en HSL) y `getStageCellHtml()` en `docs/tablero.html`. Los estados de excepción (bloqueado/reclamo = rojo fijo, cancelado = gris, esperando repuesto = brass con "REP") quedan como override, no entran en el gradiente.
3. **Buscador por patente y cliente** — input con normalización de acentos (`normalizeText()` en el prototipo) que filtra el listado en tiempo real, combinado con los filtros de canal y "solo trabados" ya existentes.

Commits donde se prototipó cada pieza (todos sobre `docs/tablero.html`): `116b222` (alerta 7 días + gradiente), `26e8c69` (caso de ejemplo), `aedad37` (buscador).

---

## Changelog — Sesión 2026-08-26 (Fase 2, plan 02-03 completo)

**Objetivo:** ejecutar el plan `02-03` completo (turno coordinado + Ficha de ingreso al taller).

### Qué se hizo
- `CasoDetailPage`: "Marcar orden de trabajo recibida" (`'enviado a la aseguradora'` → `'aprobado'`) y confirmación de turno (`'aprobado'` → `'turno coordinado'`, guarda `turno_fecha`). Ningún otro estado muestra controles.
- `RecepcionHome`: la agenda "Turnos de hoy" ahora es real (filtra `listCasos()` por `turno_fecha` de hoy, ordenado por hora), reemplazando el `EmptyState` fijo de la Fase 1.
- `FichaIngresoPage` (Ficha 2): solo accesible con sentido para casos en `'turno coordinado'`; reusa `FotoUploader` con los 4 ángulos `ingreso-*` sin pisar las fotos de la Ficha de inspección; "Registrar ingreso" bloqueado hasta 4 fotos + número de orden; confirma y pasa el caso a `'ingresado'`.
- `npm run build` y `npm run test` (58 tests, 3 corridas seguidas) en verde. Ver `.planning/phases/02-caso-de-seguro/02-03-SUMMARY.md`.

### Qué falta
- Verificación humana de punta a punta en la app real (turno → ingreso → 4 fotos propias sin pisar las de inspección), no ejecutable desde este entorno.
- El plan `02-04` (semáforo de estado + Realtime en las 3 home) sigue pendiente.

---

## Changelog — Sesión 2026-08-26 (Fase 2, plan 02-02 completo)

**Objetivo:** ejecutar el plan `02-02` completo (alta de caso de Seguro + Ficha de inspección pre-ingreso).

### Qué se hizo
- `CasoNuevoPage` (formulario de alta con las 6 aseguradoras fijas de D-18) + `CasosListPage` (listado real en `/casos`, reemplaza el item de menú deshabilitado desde la Fase 1). Botón "Nuevo caso" de `RecepcionHome` cableado.
- `FichaInspeccionPage` con `DamageCheckboxes` (10 zonas de D-17) y `FotoUploader` (4 fotos obligatorias, D-16): "Guardar ficha de inspección" bloqueado hasta subir las 4, "Marcar como enviado a la aseguradora" (D-15) bloqueado hasta guardar, sin disparar ningún mail.
- Fix de tipo en `createCaso()` (`api.ts`, plan 02-01): no aceptaba `created_by`, pero la política RLS de insert lo exige explícito en el payload.
- `npm run build`, `npm run test` (47 tests, corridos 3 veces para descartar flakiness) en verde. Ver `.planning/phases/02-caso-de-seguro/02-02-SUMMARY.md`.

### Qué falta
- Verificación humana de punta a punta en la app real (crear caso → 4 fotos → guardar → marcar enviado → ver estado en `/casos`), no ejecutable desde este entorno.
- Los planes `02-03` (turno + ficha de ingreso) y `02-04` (semáforo + Realtime) siguen pendientes.

---

## Changelog — Sesión 2026-08-26 (Fase 2, plan 02-01 completo)

**Objetivo:** cerrar la Task 3 pendiente del plan `02-01` (compresión de imágenes + hook de fotos de casos), con lo que las 3 tasks del plan quedan completas.

### Qué se hizo
- `src/lib/imageCompression.ts` — `compressToWebP()` (compresión nativa a WebP vía `createImageBitmap` + `OffscreenCanvas`, sin dependencias externas, máx. 1920px / calidad 0.8) y `buildFotoPath()` (formador único del path `casos/{caseId}/{angulo}.webp`, reusado también por el plan 02-03 con el prefijo `ingreso-`).
- `src/features/casos/hooks/useCasoFotos.ts` — hook `useCasoFotos()` con `uploadFoto()` (comprime y sube al bucket privado `casos-fotos`) y `listFotos()` (URLs firmadas por ángulo, 1 hora de expiración; omite del mapa los ángulos sin foto subida en vez de tirar error).
- `npm run build`, `npm run test` (35 tests) y `npm run typecheck` en verde.
- Ver `.planning/phases/02-caso-de-seguro/02-01-SUMMARY.md` para el detalle completo del plan (tasks 1-3).

### Qué falta
Los planes `02-02` (alta de caso + ficha de inspección), `02-03` (turno + ficha de ingreso) y `02-04` (semáforo + Realtime en las 3 home) siguen pendientes de ejecutar — son secuenciales y ya están escritos en `.planning/`.

---

## Changelog — Sesión 2026-08-25 (Fase 1 cerrada de punta a punta)

**Objetivo:** terminar Tasks 3 y 4 con las credenciales que fue proveyendo el dueño del proyecto durante la sesión.

### Qué se hizo
- `npx supabase link` + `npx supabase db push` corridos contra el proyecto real (`tnwrewghcowayuudvxey`) — migración `0001_profiles` aplicada en remoto.
- Verificado con curl que RLS bloquea el acceso anónimo (`GET /rest/v1/profiles` → `[]`).
- Vercel: se creó una cuenta separada (equipo `aguila-blanca`, login vía Bitbucket con el email del taller) para poder transferirle la propiedad del proyecto al dueño más adelante sin migrar nada.
- Se detectaron y limpiaron 4 proyectos duplicados en Vercel (quedó solo `sacabollos-aguila-blanca`), producto de varios intentos de import mientras se resolvía el alta de la cuenta.
- Env vars de producción cargadas (`VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`) y deploy de producción corrido: **https://sacabollos-aguila-blanca.vercel.app**
- Primer usuario dueño creado vía Supabase Auth Admin API y promovido a rol `dueno` con el mismo criterio del seed `0001-promote-first-dueno.sql`.
- Login real verificado de punta a punta contra la API (no solo build/typecheck): login devuelve JWT, el JWT lee su propia fila de `profiles` vía RLS.

- **Se descubrió que el login nunca se había implementado en código**: el `App.tsx` que quedó del plan 01-01 era un demo estático (título + 2 inputs + botón sin `onClick`), sin `src/lib/supabaseClient.ts`, `src/auth/` ni `src/features/login/`. El README anterior decía que Task 4 solo estaba "bloqueada por config externa", pero el código en sí nunca se escribió. Se implementó completo en esta sesión: `supabaseClient.ts`, `AuthProvider`/`useAuth`, `LoginPage` real con `signInWithPassword`, 5 tests nuevos, y se redeployó.
- Verificado con Chrome DevTools (navegador real automatizado, no solo curl): formulario renderiza, contraseña incorrecta muestra la copy exacta de error y conserva el email, login válido muestra nombre+rol+botón de cerrar sesión, la sesión persiste al recargar, y no hay errores de consola.

### Qué falta
Solo repetir la prueba a mano en una tablet física de 10-12" para el chequeo de layout responsive en hardware real — el comportamiento funcional ya quedó verificado con el navegador automatizado. Con eso, Fase 1 queda formalmente cerrada del todo.

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
- **Producción (Vercel):** https://sacabollos-aguila-blanca.vercel.app
- **Supabase Dashboard:** https://supabase.com/dashboard/project/tnwrewghcowayuudvxey