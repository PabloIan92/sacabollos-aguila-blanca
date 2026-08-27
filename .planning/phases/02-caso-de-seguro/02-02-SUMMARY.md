---
phase: 02-caso-de-seguro
plan: 02
subsystem: casos
tags: [react, react-router, supabase-storage, forms]

requires: [02-01-caso-de-seguro]
provides:
  - Alta de caso de canal Seguro (CasoNuevoPage) con las 6 aseguradoras fijas de D-18 y productor/asesor de D-19
  - Listado real de casos de recepcion (CasosListPage) en /casos, reemplazando el item deshabilitado desde la Fase 1
  - Ficha de inspeccion pre-ingreso (FichaInspeccionPage) con 10 zonas danadas (DamageCheckboxes) y 4 fotos obligatorias (FotoUploader)
  - Boton "Marcar como enviado a la aseguradora" (D-15) que avanza el estado sin disparar ningun envio de mail
affects: [02-03-caso-de-seguro, 02-04-caso-de-seguro]

tech-stack:
  added: []
  patterns: ["preview local con URL.createObjectURL en vez de pedir una URL firmada extra", "gate de guardado por conteo de fotos subidas, no por validacion de formulario"]

key-files:
  created: [src/features/casos/CasoNuevoPage.tsx, src/features/casos/CasoNuevoPage.test.tsx, src/features/casos/CasosListPage.tsx, src/features/casos/CasosListPage.test.tsx, src/features/casos/FichaInspeccionPage.tsx, src/features/casos/FichaInspeccionPage.test.tsx, src/features/casos/components/DamageCheckboxes.tsx, src/features/casos/components/FotoUploader.tsx]
  modified: [src/app/routes.ts, src/app/routes.test.ts, src/app/AppRouter.tsx, src/app/roleHome.test.tsx, src/features/recepcion/RecepcionHome.tsx, src/features/casos/api.ts, src/features/casos/api.test.ts]

key-decisions:
  - "createCaso() en api.ts (plan 02-01) excluia 'created_by' de su tipo de entrada; se corrigio para exigirlo, porque la politica de insert de casos requiere auth.uid() = created_by explicito en el payload -- sin el fix, CasoNuevoPage no podia compilar ni persistir el creador del caso"
  - "El bloque de numero de siniestro/denuncia para copiar a mano se muestra siempre (no solo tras guardar la ficha), como contexto fijo junto al boton de marcar enviado"
  - "FotoUploader/DamageCheckboxes no tienen archivos de test propios -- toda su superficie de comportamiento se cubre desde FichaInspeccionPage.test.tsx, tal como lo pedia el plan"

patterns-established:
  - "El canal 'seguro' queda fijo en el formulario de alta; no se renderiza un selector de canal hasta que Particular exista en la Fase 3 (mismo criterio que los items de menu no disponibles de la Fase 1)"

requirements-completed: [CASOS-01, FICHAS-01, FICHAS-04]

duration: single session (2026-08-26)
completed: 2026-08-26
---

# Phase 2: Caso de Seguro — Plan 02 Summary

**Alta de caso de Seguro + listado real de recepcion + Ficha de inspeccion pre-ingreso con 4 fotos obligatorias y marcado manual de "enviado a la aseguradora"**

## Performance

- **Duration:** sesion unica (2026-08-26)
- **Completed:** 2026-08-26
- **Tasks:** 2 de 2
- **Files modified:** 8 creados, 7 modificados

## Accomplishments
- `CasoNuevoPage`: formulario de alta con `<select>` de exactamente las 6 aseguradoras de D-18, sin texto libre; canal fijo `'seguro'`; navega a la ficha de inspeccion tras crear el caso.
- `CasosListPage`: listado real en `/casos` (antes `available:false`), con `EmptyState` para lista vacia y cada fila navegando a detalle o a la ficha de inspeccion segun el estado del caso.
- Boton "Nuevo caso" de `RecepcionHome` deshabilitado desde la Fase 1, ahora navega de verdad a `/casos/nuevo`.
- `FichaInspeccionPage`: `DamageCheckboxes` (10 zonas exactas de `ZONAS_DANO`) + `FotoUploader` (4 dropzones de `ANGULOS_FOTO`, preview local, sube via `useCasoFotos`). "Guardar ficha de inspeccion" bloqueado hasta subir las 4 fotos; "Marcar como enviado a la aseguradora" bloqueado hasta guardar, avanza el caso a `'enviado a la aseguradora'` sin ningun envio de mail real.
- 43 -> 47 tests totales del repo, todos en verde, corridos 3 veces seguidas sin flakiness.

## Task Commits

1. **Alta de caso + listado de casos de recepcion** - `c23c6e3` (feat)
2. **Ficha de inspeccion pre-ingreso + fotos obligatorias** - `aba99bd` (feat)

## Files Created/Modified
- `src/features/casos/CasoNuevoPage.tsx` + `.test.tsx` - formulario de alta de caso de Seguro
- `src/features/casos/CasosListPage.tsx` + `.test.tsx` - listado real de casos
- `src/features/casos/FichaInspeccionPage.tsx` + `.test.tsx` - ficha de inspeccion pre-ingreso
- `src/features/casos/components/DamageCheckboxes.tsx` - checklist de 10 zonas
- `src/features/casos/components/FotoUploader.tsx` - 4 dropzones con preview y upload
- `src/app/routes.ts` (+`.test.ts`) - item Casos de recepcion pasa a `available:true`
- `src/app/AppRouter.tsx` - rutas `/casos`, `/casos/nuevo`, `/casos/:id/ficha-inspeccion` bajo `RequireRole roles={['recepcion']}`
- `src/app/roleHome.test.tsx` - actualizado para el boton "Nuevo caso" ya habilitado (requiere `MemoryRouter` porque `RecepcionHome` ahora usa `useNavigate`)
- `src/features/recepcion/RecepcionHome.tsx` - boton "Nuevo caso" cableado
- `src/features/casos/api.ts` (+`.test.ts`) - fix de tipo en `createCaso` (ver deviations)

## Decisions Made
Ver `key-decisions` en el frontmatter.

## Deviations from Plan

**1. [Blocking] `createCaso()` no aceptaba `created_by` en su tipo de entrada**
- **Found during:** implementacion de la task 1, al tipar el llamado desde `CasoNuevoPage`
- **Issue:** el plan 02-01 (sesion anterior) implemento `createCaso(datos: Omit<Caso, 'id'|'estado'|'created_at'|'updated_at'|'estado_changed_at'|'created_by'>)`, excluyendo `created_by` del tipo de entrada. Pero la politica RLS `casos_insert_recepcion` exige `auth.uid() = created_by` en el mismo insert -- sin poder pasar `created_by`, el insert real fallaria contra la base en vivo (y el codigo ni siquiera compilaba con el valor que el plan 02-02 pedia enviar)
- **Fix:** se quito `'created_by'` del `Omit` en `api.ts`, y se actualizo el unico test existente de `createCaso` para pasar `created_by` explicito
- **Verification:** `npx tsc -b` (el `tsc --noEmit` suelto en la raiz no compila nada util por el `tsconfig.json` raiz con `files: []` -- la verificacion real es `npm run build`, que si usa `tsc -b`) y `npm run test`
- **Committed in:** `c23c6e3`

**Total deviations:** 1, bloqueante, necesaria para que la task 1 compilara y funcionara contra RLS real.
**Impact on plan:** ninguno es scope creep -- es una correccion de un contrato roto de la task anterior, indispensable para que esta task funcionara.

## Issues Encountered
- `npx tsc --noEmit` corrido desde la raiz del repo no reporta errores reales porque el `tsconfig.json` raiz solo tiene `references` y `files: []` -- sin `-b` no sigue las referencias. La verificacion de tipos real de este proyecto es `npm run build` (que corre `tsc -b && vite build`) o `npm run typecheck` si se corre desde el mismo directorio con el mismo comportamiento; en esta sesion el chequeo confiable fue siempre `npm run build`.
- Un test de `FichaInspeccionPage.test.tsx` fue flaky una vez al correr la suite completa (pasaba aislado, fallaba por una carrera entre el efecto que propaga `fotosSubidas` al padre y el click sobre "Guardar"): se corrigio esperando explicitamente a que el boton se habilite (`waitFor` sobre `not.toBeDisabled()`) antes de hacer click, en vez de inferirlo de la aparicion del preview. Verificado estable en 3 corridas seguidas de la suite completa tras el fix.

## User Setup Required
**Verificacion humana pendiente (parte de la definicion de "hecho" del plan, no ejecutable desde este entorno):** el plan pide probar de punta a punta en la app real (no solo con tests) que con menos de 4 fotos "Guardar ficha de inspeccion" esta deshabilitado, que subir las 4 fotos lo habilita, que guardar habilita "Marcar como enviado", y que marcarlo actualiza el estado visible en `/casos`. Esto requiere un usuario `recepcion` real contra el Supabase de produccion y no se ejecuto en esta sesion.

## Next Phase Readiness
- El plan 02-03 (turno + ficha de ingreso) puede reusar `FotoUploader` con el prefijo `ingreso-` y `DamageCheckboxes` sin cambios.
- El plan 02-04 (semaforo) puede apoyarse en `CasosListPage` como base del listado, agregandole el semaforo visual sobre la columna de estado.
- **Pendiente real antes de considerar 02-02 totalmente cerrado:** la verificacion humana descripta arriba.

---
*Phase: 02-caso-de-seguro*
*Completed: 2026-08-26*
