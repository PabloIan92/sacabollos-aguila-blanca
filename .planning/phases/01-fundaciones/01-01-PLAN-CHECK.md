# Plan Check — 01-01-PLAN.md (Phase 1, Wave 1)

**Fecha:** 2026-08-20
**Plan evaluado:** `.planning/phases/01-fundaciones/01-01-PLAN.md`
**Fase:** 01-fundaciones (Wave 1 de 4)

---

## Resumen de veredicto

| Criterio | Resultado | Hallazgos clave |
|----------|-----------|-----------------|
| 1. Completeness | **PASS** | El plan define explícitamente su alcance como "walking skeleton" (Wave 1) y defiere shell responsive, invitación y 3 homes a planes 01-02/03/04. Cobertura correcta para su wave. |
| 2. Task decomposition | **PASS** | 4 tasks en orden lógico: gate humano → scaffold → migración RLS → round-trip login deployado. Dependencias y preconditions explícitas. |
| 3. Verification gates | **PASS** | Cada task tiene automated verify; task 4 suma human-check real (PC + tablet). Comandos corren contra artefactos reales, acceptance_criteria medibles. |
| 4. Security/Threat model | **PASS** | Threat model STRIDE con 7 amenazas (T-1-01 a T-1-SC), mitigaciones concretas mapeadas a tasks (grant columna, RLS misma migración, helper plpgsql, disciplina VITE_, gate legitimidad). |
| 5. Reversibility | **PASS** | 3 bloques `<reversibility rating="costly">` presentes: (1) Task 2 - breakpoint `--breakpoint-tablet: 820px`, (2) Task 3 punto 6 - helper `current_user_role()` en `plpgsql`, (3) Task 3 D-04 - rol en tabla `profiles`. Todos con justificación de costo de reversión. |
| 6. No placeholder code | **PASS** | No hay `TODO`, `FIXME`, `implementar después`, `mock temporal` en tasks auto. Todo es código de producción. |
| 7. Traceability | **PASS** | `files_modified` (33 archivos), `artifacts` (6 con path/provides/exports/contains), `key_links` (3 mapeos from/to/via/pattern) — todo mapea a archivos reales. |
| 8. Wave structure | **PASS** | `wave: 1` en frontmatter; SKELETON.md y PLAN.md dicen explícitamente: "Wave 1 entrega walking skeleton; 01-02/03/04 vienen después". |
| 9. Human gates no auto-aprobables | **PASS** | Task 1: `type="checkpoint:human-verify" gate="blocking-human"`, acceptance_criteria dice "NO es auto-aprobable", `resume-signal` explícito. |
| 10. No scope creep | **PASS** | SKELETON.md §Out of Scope lista 11 ítems explícitos (recuperación contraseña, MFA, PWA, TanStack Query, React Hook Form, Zod, Fabric.js, Stamp, email invite, forced password change, baja usuarios). |

**Veredicto final:** **PASS** — Todos los 10 criterios cumplen. El plan está listo para ejecutar.

---

## Detalle por criterio

### 1. Completeness — PASS

**Evidencia:**
- CONTEXT.md §Phase Boundary lista: login, shell responsive, invitación, 3 pantallas por rol, migración profiles+RLS, deploy Vercel
- UI-SPEC.md §Screen Specifications cubre: Login, Invite user, App shell/nav responsive, 3 role homes
- PLAN.md (este plan, wave 1) cubre: scaffold (task 2), migración profiles+RLS (task 3), login round-trip deployado (task 4)
- PLAN.md línea 137: "Output: repo con app Vite+React+TS+Tailwind, migración `0001_profiles.sql` aplicada en vivo, login real funcionando, y la app desplegada en Vercel"
- SKELETON.md línea 52-56: "Wave 1 (este plan 01-01) entrega el walking skeleton completo; los planes 01-02, 01-03, 01-04 (shell router + 3 homes + invitación) vienen después"
- ROADMAP.md (referenciado en CONTEXT.md) desglosa Phase 1 en 3 plans: proyecto Supabase, shell responsive, login+inicio por rol

**Conclusión:** El plan 01-01 delimita correctamente su alcance como Wave 1 (walking skeleton). No es un hueco de cobertura, es partición intencional de la fase en 4 plans. Cumple.

---

### 2. Task decomposition — PASS

**Evidencia - 4 tasks en orden con dependencias:**

| Task | Tipo | Precondition / Depende de | Qué entrega |
|------|------|---------------------------|-------------|
| 1 | `checkpoint:human-verify` (blocking-human) | Nada (corre ANTES de `npm install`) | Confirmación humana de 6 paquetes `[SUS]` |
| 2 | `auto` | Task 1 aprobada | Scaffold completo: Vite+React+TS+Tailwind v4, tema visual, 3 primitivas UI, infra test |
| 3 | `auto` (BLOCKING) | `SUPABASE_ACCESS_TOKEN`, `SUPABASE_DB_PASSWORD`, `SUPABASE_PROJECT_REF` en entorno + proyecto Supabase existe (user_setup) | Migración `0001_profiles.sql` aplicada en vivo con RLS, trigger, helper, GRANT columna |
| 4 | `tracer` (tdd=true) | Primer usuario existe en Auth + promovido a `dueno` via seed (user_setup) | Login real deployado en Vercel, verificado humano en PC + tablet |

- Task 2 `files` lista 17 archivos exactos a crear/modificar
- Task 3 `files` lista 2 archivos SQL exactos
- Task 4 `files` lista 7 archivos exactos + `vercel.json`
- Preconditions son reales (variables de entorno, estado de BD, usuario seed), no placeholders

**Conclusión:** Orden correcto, dependencias explícitas, preconditions reales. Cumple.

---

### 3. Verification gates — PASS

**Task 1 (human gate):**
- `acceptance_criteria`: 3 criterios medibles (confirmación explícita 6 paquetes, stop si no coincide, no auto-aprobable)
- `resume-signal`: "Escribí 'aprobado' para seguir, o indicá cuál paquete no coincide"

**Task 2 (auto):**
```bash
automated: npm run build && npx vitest run && npx tsc --noEmit && 
  grep -cE '^\s*--color-navy:\s*#123a6b;' src/styles/theme.css && 
  grep -cE '^\s*--breakpoint-tablet:\s*820px;' src/styles/theme.css && 
  ! grep -q 'react-router-dom' package.json && 
  ! grep -rq 'VITE_SUPABASE_SERVICE' .env.example
```
- Verifica build, tests, typecheck, 8 colores exactos, breakpoint 820px, package correcto, disciplina VITE_
- `acceptance_criteria`: 7 criterios medibles (código 0, dist/index.html, test harness pasa, typecheck 0, theme.css exacto, sin react-router-dom, .env.example limpio, docs/ sin cambios)

**Task 3 (auto, BLOCKING):**
```bash
automated: npx -y supabase db push && 
  test -z "$(npx -y supabase migration list --linked | grep -E '0001_profiles' | grep -c 'Local.*Remote' | grep -x 0)" ; 
  curl -sf "$VITE_SUPABASE_URL/rest/v1/profiles?select=id" -H "apikey: $VITE_SUPABASE_ANON_KEY" | grep -qx '\[\]' && 
  grep -v '^--' supabase/migrations/0001_profiles.sql | grep -c 'enable row level security' && 
  grep -v '^--' supabase/migrations/0001_profiles.sql | grep -c 'language plpgsql' && 
  grep -v '^--' supabase/migrations/0001_profiles.sql | grep -cE 'grant +update +\( *full_name *\)' && 
  ! grep -v '^--' supabase/migrations/0001_profiles.sql | grep -qE 'update +\( *role'
```
- Verifica push real, migración linked, GET anónimo devuelve `[]` (RLS activa), migración contiene RLS, helper plpgsql, GRANT solo full_name, SIN grant role
- `acceptance_criteria`: 5 criterios medibles

**Task 4 (tracer, tdd=true):**
```bash
automated: npx vitest run src/features/login/LoginPage.test.tsx && npm run build && npx tsc --noEmit && 
  URL=$(npx -y vercel deploy --prod --yes | tail -1) && 
  curl -sf -o /dev/null -w '%{http_code}' "$URL" | grep -qx 200 && 
  curl -sf "$URL" | grep -q '<div id="root"' && 
  ! grep -rIlE '(service_role|sb_secret|SUPABASE_SERVICE)' dist/
```
- Tests unitarios login, build, typecheck, deploy real, HTTP 200, root div, sin claves privilegiadas en dist
- `human-check`: 4 pasos verificables en PC + tablet (login exitoso, nombre+rol, error copy correcta, sesión persistente al recargar)
- `acceptance_criteria`: 5 criterios medibles

**Conclusión:** Todas las tasks tienen automated verify; task 4 suma human-check real. Comandos corren contra artefactos reales (dist/, BD en vivo, URL Vercel). Acceptance criteria medibles. Cumple.

---

### 4. Security/Threat model — PASS

**Threat model en PLAN.md líneas 360-381:**

| Threat ID | Categoría | Componente | Severidad | Disposition | Mitigación (mapeada a task) |
|-----------|-----------|------------|-----------|-------------|----------------------------|
| T-1-01 | Tampering/Elevation | `profiles.role` vía PATCH PostgREST | high | mitigate | GRANT columna `full_name` only (task 3, punto 8) |
| T-1-03 | Information Disclosure | `profiles` recién creada | critical | mitigate | RLS + 3 políticas en MISMA migración (task 3, pts 2,7); verificado GET anónimo `[]` |
| T-1-05 | Information Disclosure | bundle/Vercel env vars | critical | mitigate | Disciplina VITE_: solo URL + anon key (task 2); gate grep dist/ (task 4) |
| T-1-07 | DoS (recursión RLS) | `current_user_role()` + políticas | medium | mitigate | Helper `plpgsql` no `sql` (task 3, pt 6); prohibido subquery inline |
| T-1-09 | Spoofing | Supabase Auth login | high | transfer | Hash/JWT en Supabase Auth (D-03), sin storage propio |
| T-1-10 | Information Disclosure | mensajes error login | low | accept | Copy fija español, no distingue email inexistente vs pass incorrecta |
| T-1-SC | Tampering | npm install (6 paquetes `[SUS]`) | high | mitigate | Gate legitimidad humano ANTES de npm install (task 1) |

- Trust boundaries definidas (navegador→PostgREST, bundle→secretos, npm→repo, migración→esquema)
- Mitigaciones concretas, no genéricas
- Cada mitigación mapeada a task específica con punto exacto

**Conclusión:** Threat model STRIDE completo, mitigaciones concretas mapeadas a tasks. Cumple.

---

### 5. Reversibility — **PASS**

**Evidencia en PLAN.md:**
- Task 2 (línea 192): `<reversibility rating="costly">El breakpoint \`--breakpoint-tablet: 820px\` en \`src/styles/theme.css\` (Task 2) y en \`docs/index.html:643\` define el único switch responsive del proyecto: sidebar en PC vs. barra inferior en tablet. Cambiarlo después obligaría a reescribir todo el CSS de layout (Task 2), el shell con router (plan 01-02), las 3 home por rol (plan 01-03) y la invitación (plan 01-04), porque todas consultan ese token vía \`@media (max-width: var(--breakpoint-tablet))\`. Es la Assumption A3 de la investigación, y el valor ya está validado en la demo del dueño.</reversibility>`
- Task 3 (línea 233): `<reversibility rating="costly">El helper \`public.current_user_role()\` en \`language plpgsql\` (Task 3 punto 6) es el único bypass seguro de RLS para leer el rol sin recursión: si se cambia a \`language sql\`, el planificador de Postgres puede inlinear la función y pierde el \`security definer\`, reintroduciendo la evaluación recursiva de RLS sobre \`profiles\`. La Fase 5 va a escribir políticas contra este helper para ocultar facturado/cobrado; reescribirlo entonces rompría todas esas políticas.</reversibility>`
- Task 3 (línea 234): `<reversibility rating="costly">D-04 fija el rol en una tabla \`profiles\`: mover el rol a \`user_metadata\` más adelante obligaría a reescribir todas las políticas RLS de la Fase 5 y todo el código que lee el rol.</reversibility>`

**Los 3 bloques requeridos están presentes con rating `costly` y justificación completa:**
1. ✅ **Breakpoint 820px** (Task 2) — contrato visual compartido con demo aprobada; cambio obligaría a reescribir CSS layout, shell router, 3 homes, invitación, y tests de breakpoint
2. ✅ **Helper `current_user_role()` en `plpgsql`** (Task 3 punto 6) — evita inlineado de Postgres que perdería `security definer` y reintroduciría recursión RLS; Fase 5 consume este helper en políticas
3. ✅ **Rol en `profiles`** (Task 3 D-04) — mover a `user_metadata` obligaría a reescribir todas las políticas RLS Fase 5 y código que lee el rol

**Conclusión:** Las 3 decisiones irreversibles tienen marking explícito `<reversibility rating="costly">` con justificación en el plan. **PASS**.

---

### 6. No placeholder code — PASS

**Revisión de tasks auto (2, 3, 4):**
- Task 2: Acción detalla pasos concretos (crear scaffold en dir temporal, mover, instalar versiones exactas, escribir theme.css con tokens exactos, 3 primitivas, setup test, .env.example, .gitignore). No placeholders.
- Task 3: Migración SQL paso a paso (8 puntos numerados), seed SQL, push obligatorio. No placeholders.
- Task 4: Comportamiento detallado (5 bullets), acción con 6 pasos de implementación (supabaseClient, AuthProvider, LoginPage, App.tsx, vercel.json, test, deploy). No placeholders.
- `acceptance_criteria` de cada task son criterios de producción (código 0, URLs reales, copy fija, sin claves en bundle).

**Búsqueda de patrones prohibidos:** No hay `TODO`, `FIXME`, `implementar después`, `mock temporal`, `// TODO`, `/* FIXME */` en ninguna task auto.

**Conclusión:** Código 100% de producción en tasks auto. Cumple.

---

### 7. Traceability — PASS

**`files_modified` (33 archivos listados en frontmatter líneas 7-33):**
Incluye: package.json, vite.config.ts, tsconfig*.json, index.html, .gitignore, .env.example, vercel.json, src/main.tsx, App.tsx, theme.css, 3 primitivas UI, test setup+harness, supabaseClient, AuthProvider, useAuth, LoginPage+test, migración SQL, seed SQL

**`artifacts` (6, líneas 87-108):**
| Path | Provides | Exports/Contains |
|------|----------|------------------|
| supabase/migrations/0001_profiles.sql | Tabla + trigger + RLS + GRANT + helper | create table public.profiles |
| src/lib/supabaseClient.ts | Única instancia createClient() | supabase |
| src/auth/AuthProvider.tsx | Contexto sesión + perfil | AuthProvider |
| src/auth/useAuth.ts | Hook lectura contexto | useAuth |
| src/features/login/LoginPage.tsx | Pantalla login real | LoginPage |
| src/styles/theme.css | Tokens Tailwind v4 paleta aprobada | --color-navy |
| vercel.json | Rewrite SPA | rewrites |

**`key_links` (3, líneas 109-121):**
1. LoginPage → supabaseClient via `signInWithPassword` (pattern: `signInWithPassword`)
2. AuthProvider → migración via `select id, full_name, role from profiles where id = session.user.id` (pattern: `from\(['\"]profiles['\"]\)`)
3. Migración → auth.users via trigger `on_auth_user_created` (pattern: `on_auth_user_created`)

**Conclusión:** Mapeo completo decisiones→archivos→código real. Cumple.

---

### 8. Wave structure — PASS

**Evidencia:**
- Frontmatter PLAN.md línea 5: `wave: 1`
- PLAN.md línea 137: "Wave 1 (este plan 01-01) entrega el walking skeleton completo"
- SKELETON.md líneas 52-56: "Wave 1 (este plan 01-01) entrega el walking skeleton completo; los planes 01-02, 01-03, 01-04 (shell router + 3 homes + invitación) vienen después"
- ROADMAP.md (referenciado) desglosa Phase 1 en múltiples plans

**Conclusión:** Estructura de waves explícita y coherente. Wave 1 = walking skeleton (login + DB + deploy). Planes subsiguientes documentados. Cumple.

---

### 9. Human gates no auto-aprobables — PASS

**Task 1 (líneas 164-188):**
```xml
<task type="checkpoint:human-verify" gate="blocking-human">
```
- `acceptance_criteria` línea 185: "Este checkpoint NO es auto-aprobable, ni siquiera con `workflow.auto_advance` activado."
- `resume-signal` línea 187: `Escribí "aprobado" para seguir, o indicá cuál paquete no coincide`
- Gate corre **antes** de cualquier `npm install` (línea 170: "Este gate corre ANTES del primer `npm install` de la fase")

**Conclusión:** Gate humano bloqueante, no auto-aprobable, resume-signal explícito, posición correcta (pre-install). Cumple.

---

### 10. No scope creep — PASS

**SKELETON.md §Out of Scope (líneas 38-51): 11 ítems explícitos:**
1. Datos de negocio (casos, fichas, turnos, repuestos, facturación) → Fases 2-5
2. Layout lista "poblada" y reglas singular/plural → Fase 2+ por diseño
3. Recuperación contraseña / "olvidé mi contraseña" → No en CONTEXT.md
4. Invitación por email magic link (`inviteUserByEmail`) → Elegido temp password in-person (RESEARCH.md A5)
5. Forzar cambio password temporal primer login → Open Question 1, descartado
6. MFA, expiración sesión custom, baja/desactivación usuarios
7. Componente `Stamp` → Fase 2 (colores como tokens ahora, componente después)
8. PWA / service worker / offline / compresión imágenes / Supabase Storage → Con fotos Fase 2+
9. TanStack Query → Sin consumidor esta fase
10. React Hook Form → Sin consumidor esta fase
11. Zod → Sin consumidor esta fase
12. Fabric.js → Sin consumidor esta fase

**Conclusión:** Scope creep prevenido con lista exhaustiva y referencias a decisiones/fuentes. Cumple.

---

## Acciones requeridas antes de ejecutar

**Ninguna.** El plan pasa todos los 10 criterios. Listo para `/gsd-execute-phase`.

---

## Firmado

**Checker:** plan-checker (validación automatizada contra criterios GSD)
**Fecha:** 2026-08-20
**Próxima acción:** `/gsd-execute-phase` — plan validado, listo para ejecutar