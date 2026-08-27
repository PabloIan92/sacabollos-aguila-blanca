---
phase: 02-caso-de-seguro
plan: 01
subsystem: casos
tags: [supabase, postgres, rls, storage, react, typescript]

requires: [01-fundaciones]
provides:
  - public.casos (13 estados exactos, RLS, trigger estado_changed_at) + bucket privado casos-fotos con RLS de storage.objects + publicacion realtime, pusheado a Supabase vivo
  - src/features/casos/types.ts (Caso, CasoEstado, ESTADOS_CASO, ZonaDano, ZONAS_DANO, AnguloFoto) como unica fuente de los 13 estados
  - src/features/casos/api.ts (listCasos, getCaso, createCaso, updateCasoEstado)
  - src/lib/imageCompression.ts (compressToWebP, buildFotoPath) + src/features/casos/hooks/useCasoFotos.ts (uploadFoto, listFotos)
affects: [02-02-caso-de-seguro, 02-03-caso-de-seguro, 02-04-caso-de-seguro]

tech-stack:
  added: []
  patterns: ["current_user_role() en toda politica nueva, nunca join directo a profiles", "compresion nativa WebP via createImageBitmap+OffscreenCanvas sin dependencias", "buildFotoPath como unico formador del path casos/{caseId}/{angulo}.webp"]

key-files:
  created: [supabase/migrations/0002_casos.sql, src/features/casos/types.ts, src/features/casos/api.ts, src/features/casos/api.test.ts, src/lib/imageCompression.ts, src/features/casos/hooks/useCasoFotos.ts]
  modified: []

key-decisions:
  - "Los 13 estados de casos.estado quedan fijados una sola vez en la migracion y espejados en ESTADOS_CASO — ningun otro archivo los reescribe a mano"
  - "listFotos omite del mapa los angulos sin archivo subido en vez de lanzar error, para que el llamador use Object.keys(mapa).length como chequeo de '4 fotos minimo' (02-02)"
  - "compressToWebP no tiene test unitario (depende de APIs de navegador que jsdom no implementa) — se verifica con tsc+build y queda cubierta por la verificacion humana del plan 02-02"

patterns-established:
  - "Ninguna politica de RLS nueva (casos ni storage.objects) referencia profiles directamente"
  - "El bucket de fotos es siempre privado; el acceso de lectura es unicamente via createSignedUrls con expiracion de 1 hora"

requirements-completed: [CASOS-02]

duration: multi-session (2026-08-25 tasks 1-2, 2026-08-26 task 3)
completed: 2026-08-26
---

# Phase 2: Caso de Seguro — Plan 01 Summary

**Modelo de datos de `casos` (13 estados, RLS, bucket de fotos con RLS, realtime) + contratos de tipos/API + helpers de compresion y upload de fotos**

## Performance

- **Duration:** repartido en 2 sesiones (tasks 1-2 el 2026-08-25, task 3 el 2026-08-26)
- **Completed:** 2026-08-26
- **Tasks:** 3 de 3
- **Files modified:** 6 creados

## Accomplishments
- Migracion `0002_casos.sql` aplicada en vivo: tabla `casos` con los 13 estados exactos, RLS (5 politicas, todas via `current_user_role()`), trigger `set_updated_at` que distingue `updated_at` de `estado_changed_at`, bucket privado `casos-fotos` (10MB, solo `image/webp`) con su propia RLS, y publicacion realtime
- `types.ts`/`api.ts` como unica fuente de los 13 estados y las 10 zonas de dano, con 6 tests en verde (deep-equal de `ESTADOS_CASO`/`ZONAS_DANO`, llamadas correctas a `supabase.from('casos')`)
- `imageCompression.ts` (compresion nativa a WebP, sin dependencias externas) y `useCasoFotos` (upload comprimido + URLs firmadas por angulo), listos para que el plan 02-02 suba las 4 fotos de la Ficha de inspeccion

## Task Commits

1. **Migracion `0002_casos.sql` + RLS + bucket + realtime** - `846a56c` (feat)
2. **Tipos y capa de API de casos** - `a01024b` (feat)
3. **Compresion de imagenes + hook de fotos** - `c31eb22` (feat)

## Files Created/Modified
- `supabase/migrations/0002_casos.sql` - tabla `casos` + RLS + trigger + bucket `casos-fotos` + RLS de storage + realtime
- `src/features/casos/types.ts` - `Caso`, `CasoEstado`, `ESTADOS_CASO`, `ZonaDano`, `ZONAS_DANO`, `AnguloFoto`
- `src/features/casos/api.ts` + `api.test.ts` - `listCasos`, `getCaso`, `createCaso`, `updateCasoEstado`
- `src/lib/imageCompression.ts` - `compressToWebP`, `buildFotoPath`
- `src/features/casos/hooks/useCasoFotos.ts` - `uploadFoto`, `listFotos`

## Decisions Made
Ver `key-decisions` en el frontmatter.

## Deviations from Plan
Ninguna. Task 3 se implemento tal como lo especifica `02-01-PLAN.md`, sin agregar alcance.

## Issues Encountered
- Checkout fresco en otra maquina sin `node_modules` ni `.env` local: se corrio `npm ci` y se creo un `.env` local con valores placeholder (gitignorado, no committeado) solo para poder correr `npm run test` completo — no afecta la logica de la Task 3, que no depende de credenciales reales de Supabase (usa el cliente mockeado en tests).

## User Setup Required
Ninguno para esta task. Las credenciales reales de Supabase/Vercel siguen en el archivo local fuera del repo (ver memoria `reference_aguila_blanca_credenciales`).

## Next Phase Readiness
- El plan 02-02 (alta de caso + ficha de inspeccion) puede consumir `createCaso`, `useCasoFotos().uploadFoto` y `listFotos` sin volver a explorar el esquema.
- El plan 02-03 reusa `buildFotoPath` con el prefijo `ingreso-` para la Ficha de ingreso.
- Los planes 02-02, 02-03 y 02-04 siguen pendientes de ejecutar (son secuenciales).

---
*Phase: 02-caso-de-seguro*
*Completed: 2026-08-26*
