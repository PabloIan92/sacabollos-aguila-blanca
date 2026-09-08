# Plan de implementación — Fase 3 Caso Particular

> Ejecutar con TDD: escribir la prueba que falla, confirmar RED, implementar lo mínimo, confirmar GREEN y recién entonces refactorizar.

**Objetivo:** entregar `CASOS-03` sin duplicar el circuito de Seguro y dejar protegida la máquina de estados para las fases siguientes.

## Tarea 1 — Contratos y migración

**Archivos:**

- Crear `supabase/migrations/0004_casos_particulares.sql`
- Modificar `src/features/casos/types.ts`
- Modificar `src/features/casos/api.ts`
- Modificar `src/features/casos/api.test.ts`
- Crear `src/features/casos/migration.test.ts`

**RED:** probar los dos canales, los nuevos campos y que la API expone operaciones específicas para guardar inspección, aceptar/rechazar y coordinar turno. Probar estáticamente que la migración contiene checks condicionales, validación de transiciones y no concede escritura a taller.

**GREEN:** agregar columnas/constraints compatibles con filas existentes, trigger de transición y funciones TypeScript acotadas. Mantener `updateCasoEstado` temporalmente solo donde todavía sea necesario y eliminarlo de los flujos cubiertos.

**Verificación:** `npm test -- src/features/casos/api.test.ts src/features/casos/migration.test.ts` y `npm run typecheck`.

## Tarea 2 — Alta unificada

**Archivos:**

- Modificar `src/features/casos/CasoNuevoPage.tsx`
- Modificar `src/features/casos/CasoNuevoPage.test.tsx`

**RED:** canal Seguro por defecto, cambio a Particular, campos condicionales, presupuesto positivo obligatorio, payload sin campos de seguro, mensaje y reintento ante error.

**GREEN:** implementar el selector de canal conservando la estética aprobada y construir payloads discriminados.

**Verificación:** `npm test -- src/features/casos/CasoNuevoPage.test.tsx`.

## Tarea 3 — Ficha común, persistencia y decisión

**Archivos:**

- Modificar `src/features/casos/components/FotoUploader.tsx`
- Crear `src/features/casos/components/FotoUploader.test.tsx`
- Modificar `src/features/casos/FichaInspeccionPage.tsx`
- Modificar `src/features/casos/FichaInspeccionPage.test.tsx`

**RED:** recuperar fotos existentes, contar solo URLs válidas, persistir `inspeccion_guardada_at`, conservar el flujo Seguro, aceptar Particular y exigir modalidad al rechazar. Cubrir errores sin spinner eterno.

**GREEN:** hidratar previews con `listFotos`; renderizar acciones por canal; persistir respuesta/contacto mediante API acotada.

**Verificación:** `npm test -- src/features/casos/components/FotoUploader.test.tsx src/features/casos/FichaInspeccionPage.test.tsx`.

## Tarea 4 — Detalle, listado y turno compartido

**Archivos:**

- Modificar `src/features/casos/CasoDetailPage.tsx`
- Modificar `src/features/casos/CasoDetailPage.test.tsx`
- Modificar `src/features/casos/components/CasosList.tsx`
- Modificar `src/features/casos/components/CasosList.test.tsx`
- Modificar `src/features/casos/FichaIngresoPage.tsx`
- Modificar `src/features/casos/FichaIngresoPage.test.tsx`

**RED:** detalle condicional por canal, columna Canal, particular aceptado coordinando turno con la misma acción, ingreso compartido y errores recuperables.

**GREEN:** adaptar copy/labels y reemplazar mutaciones genéricas por operaciones de dominio.

**Verificación:** tests focalizados de los cuatro componentes.

## Tarea 5 — Regresión, documentación y despliegue

**Archivos:**

- Modificar `.planning/ROADMAP.md`
- Modificar `.planning/REQUIREMENTS.md`
- Modificar `.planning/STATE.md`
- Modificar `README.md`

**Verificación local:**

- `npm test`
- `npm run typecheck`
- `npm run build`
- `npm run lint`
- `git diff --check`

**Producción:** aplicar primero la migración vinculada, confirmar que `0004` figura en remoto, desplegar frontend, ejecutar smoke no mutante y luego E2E sanitizado cuando exista una cuenta QA legítima. No usar las credenciales privilegiadas de scripts históricos.

**Cierre:** actualizar README y trazabilidad con resultados exactos, commit y push a `main`. Continuar con el diseño de Fase 4.

