# Sacabollos Aguila Blanca

Sistema de gestión para taller de sacabollos — Aguila Blanca.

![Phase](https://img.shields.io/badge/Phase-6%20CRM%20y%20Gesti%C3%B3n%20de%20Equipo-blue)
![Status](https://img.shields.io/badge/Status-Roadmap%20100%25%20Completo%20en%20Producci%C3%B3n-brightgreen)
![Build](https://img.shields.io/badge/Build-passing-brightgreen)
![Tests](https://img.shields.io/badge/Tests-262%20passed-brightgreen)

## Estado actual: Fase 6 - CRM y Gestión de Equipo — **100% completada en producción** (2026-09-10)

El roadmap completo del sistema (Fases 1 a 6) se encuentra 100% implementado y verificado en producción. Se subsanaron las observaciones de auditoría de atomicidad e inmutabilidad:
1. **Atomicidad obligatoria sin fallback no atómico**: `marcarComoFacturado` y `marcarComoCobrado` en `src/features/facturacion/api.ts` invocan exclusivamente las RPCs transaccionales `facturar_caso_atomic` y `cobrar_caso_atomic` y fallan explícitamente ante cualquier error sin degradar a operaciones parciales desarticuladas.
2. **Actualización de factura y cobro existente (Migración `0009`)**: `facturar_caso_atomic` admite casos en `firmado` y `facturado` permitiendo rectificar montos o números de factura existentes sin violar precondiciones de estado.
3. **Refuerzo de inmutabilidad (Migración `0010`)**: `validar_transicion_caso` aplica las guardas estrictas de identidad y mutaciones sin transición fuera de borrador a toda sesión con rol `authenticated`, eliminando cualquier bypass espurio.
4. **Pruebas reales en PostgreSQL / Supabase (`supabase/tests/db_audit_tests.sql`)**: Suite ejecutada con éxito contra la base de datos remota (`tnwrewghcowayuudvxey`) validando permisos por rol (`42501`), rollback atómico ante datos inválidos (`23514`), actualización de factura existente, cobro atómico, e inmutabilidad de identidad (`23514`) con limpieza posterior idempotente. Todas las migraciones (`0001` a `0010`) están aplicadas en Supabase remoto, 262 tests en 30 suites pasan en verde, `tsc -b` limpio, linter sin errores y build de producción en 3.04s.

### 👥 Resumen de Implementación de Fase 6 (CRM y Equipo)

- **Task 1: Base de datos, RLS estricto y semillas (`39ba0d7`, `d712099`)**:
  - Migración `0008_crm_y_equipo.sql` con las tablas:
    - `public.clientes`: `id`, `nombre`, `telefono`, `email`, `direccion`, `notas`, timestamps.
    - `public.aseguradoras`: `id`, `nombre` (único), `email_siniestros`, `telefono_contacto`, `contacto_nombre`, `notas`, `activa`, timestamps.
    - `public.productores`: `id`, `nombre`, `telefono`, `email`, `aseguradora`, `notas`, timestamps.
  - **Seguridad RLS**:
    - Roles `dueno` y `recepcion`: control total CRUD en `clientes`, `aseguradoras` y `productores`.
    - Rol `taller`: acceso `SELECT` en `clientes` y `aseguradoras` (para asistencia en taller); denegación total de acceso a `productores` (información comercial/comisiones protegida).
  - Triggers de actualización automáticos con `public.set_row_updated_at()`.
  - Semillas iniciales de 8 aseguradoras históricas del taller con `on conflict do nothing`.
  - Tests de migración en `src/features/casos/migration.test.ts` (34 tests pasando).

- **Task 2: Capa API tipada de CRM (`6a4a1be`)**:
  - `src/features/crm/types.ts`: interfaces `Cliente`, `Aseguradora`, `Productor`, `CreateClientePayload`, `CreateAseguradoraPayload`, `CreateProductorPayload`, `CRMTab`.
  - `src/features/crm/api.ts`: funciones CRUD tipadas conectadas a Supabase con agregación de métricas sobre `casos` (vehículos/patentes asociadas, conteo de casos activos, siniestros derivados y casos en reclamo).
  - Sanitización de teléfonos para formato internacional de WhatsApp (`549...`).
  - Tests unitarios en `src/features/crm/api.test.ts` (10 tests pasando).

- **Task 3: Pantalla Principal de CRM (`0d0853f`)**:
  - `src/features/crm/CRMPage.tsx` con navegación por pestañas:
    - **Pestaña Clientes**: buscador en vivo, conteo total, tarjetas con datos de contacto, enlaces directos a llamada y WhatsApp (`https://wa.me/549...`), lista de patentes y vehículos atendidos.
    - **Pestaña Aseguradoras**: directorio de compañías, contactos de siniestros, métricas de casos activos y en reclamo.
    - **Pestaña Productores**: registro de asesores aliados, teléfono directo y aseguradora asociada.
    - Modales interactivos de creación y edición rápida para cada entidad con validación en tiempo real.
  - Tests en `src/features/crm/CRMPage.test.tsx` (7 tests pasando).

- **Task 4: Gestión de Equipo e Invitaciones y Rutas (`d636744`)**:
  - `src/features/equipo/InvitarPage.tsx`: formulario de invitación de colaboradores con validación de nombre, email y rol (`recepción` o `taller`), junto con visualización del equipo activo (`profiles`).
  - `src/features/equipo/api.ts` y tests en `InvitarPage.test.tsx` y `api.test.ts`.
  - Rutas `/crm` y `/invitar` habilitadas para `dueno` y `recepcion` en `src/app/routes.ts` y `src/app/AppRouter.tsx`.
  - Tests de navegación y permisos en `src/app/routes.test.ts` y `src/layout/AppShell.test.tsx`.

### ✅ Resolución y Cierre de Auditoría Fase 5 (Migración `0007`)

1. **Trigger `caso_facturacion_updated_at` corregido**:
   - Se creó la función genérica `public.set_row_updated_at()` para tablas auxiliares sin columna `estado`.
   - Se reemplazó el trigger previo en `public.caso_facturacion`, eliminando la incompatibilidad de `NEW.estado`.

2. **Restablecimiento de guardas de inmutabilidad de `0005`**:
   - Se reconstruyó `public.validar_transicion_caso()` preservando la inmutabilidad de identidad (`patente`, `marca`, `modelo`, `color`, `cliente_nombre`, `cliente_telefono`, `aseguradora`, `numero_siniestro`, `denuncia`, `productor_nombre`, `productor_telefono`, `presupuesto_monto`, `created_at`, `created_by`).
   - Las actualizaciones sin cambio de estado quedan estrictamente restringidas a `danos_zonas` e `inspeccion_guardada_at` exclusivamente en estado `borrador`.

3. **Corrección de autorización para Recepción al resolver reclamos**:
   - Se evaluó por transición exacta: la transición `reclamo a la compañía -> facturado` ahora autoriza explícitamente a `dueno` y `recepcion`.

4. **Operaciones transaccionales atómicas obligatorias (sin fallback no atómico)**:
   - Se crearon las funciones PostgreSQL `public.facturar_caso_atomic()` y `public.cobrar_caso_atomic()`, con bloqueo de fila `for update`, validación de precondiciones, upsert de `caso_facturacion` y actualización de `casos` en una única transacción atómica con permisos para usuarios autenticados.
   - `src/features/facturacion/api.ts` invoca exclusiva y obligatoriamente las RPCs atómicas, eliminando cualquier degradación a operaciones no atómicas desarticuladas y propagando errores explícitamente.
   - **Migración `0009_actualizacion_factura_y_cobro_existente.sql`**: amplió `facturar_caso_atomic` y `cobrar_caso_atomic` para admitir la actualización rectificatoria de facturas y cobros de casos existentes sin violar precondiciones de estado.
   - **Migración `0010_reforzar_inmutabilidad_trigger.sql`**: aseguró que toda sesión autenticada aplique sin bypass las guardas de inmutabilidad y mutaciones sin transición fuera de borrador.
   - **Pruebas reales en PostgreSQL / Supabase (`supabase/tests/db_audit_tests.sql`)**: suite ejecutada con éxito contra Supabase remoto (`tnwrewghcowayuudvxey`) validando permisos por rol (`42501`), rollback (`23514`), actualización de factura existente, cobro atómico e inmutabilidad estricta (`23514`).

5. **Ampliación de cobertura de pruebas**:
   - Se añadieron tests en `src/features/casos/migration.test.ts` validando la estructura de las migraciones `0007`, `0008`, `0009` y `0010`.
   - Se añadieron tests unitarios para las RPCs atómicas en `src/features/facturacion/api.test.ts` validando la propagación de errores sin fallback.
   - Se añadieron tests de denegación de rutas para `/facturacion` y `/casos/:id/facturacion` para roles `recepcion` y `taller` en `src/app/routes.test.ts`.

6. **Detalles numéricos y consistencia de KPIs**:
   - `formatMoneda` ahora muestra 2 decimales para importes no enteros (ej. `$ 150,50` o `$ 0,40`).
   - Los campos de entrada en `FichaFacturacionPage.tsx` utilizan `step="0.01"` para permitir el ingreso de centavos.
   - KPI "Pendiente de cobro": suma de saldos pendientes por cobrar (monto facturado - monto cobrado con saldo a favor del taller).

- **Task 1: Persistencia, seguridad RLS exclusiva y guards de estado (`7dc95f6`)**:
  - Migración `0006_facturacion_y_cobros.sql` con la tabla `public.caso_facturacion` (`caso_id`, `monto_facturado`, `monto_cobrado`, `numero_factura`, `fecha_factura`, `fecha_cobro`, `metodo_pago`, `notas_cobranza`).
  - **Seguridad financiera estricta (Requisito `AUTH-02`)**: RLS habilitado en `caso_facturacion` con política `caso_facturacion_dueno_all` exclusiva para `public.current_user_role() = 'dueno'`. Los roles `recepcion` y `taller` tienen **acceso 0** (denegación total por RLS).
  - Campos de auditoría en `public.casos`: `facturado_at`, `cobrado_at`, `motivo_reclamo`.
  - Check constraint `casos_datos_por_canal_check` ampliado para admitir casos particulares en `facturado` y `cobrado`.
  - Ampliación de la función trigger `public.validar_transicion_caso()`:
    - `firmado -> facturado`: exclusivo para `dueno`, exige registro en `caso_facturacion` con `monto_facturado > 0` y `numero_factura` no vacío. Setea `facturado_at`.
    - `facturado -> cobrado` o `reclamo a la compañía -> cobrado`: exclusivo para `dueno`, exige `monto_cobrado > 0` y `fecha_cobro` no nulo. Setea `cobrado_at`.
    - `facturado -> reclamo a la compañía`: permitido para `dueno` y `recepcion`, restringido estrictamente a `canal = 'seguro'` con `motivo_reclamo` no vacío.
    - `reclamo a la compañía -> facturado`: permitido para `dueno` y `recepcion` para resolver o destrabar el reclamo.
- **Task 2: Capa de datos y servicios API tipados (`4bc5a89`)**:
  - `types.ts`: interfaces `CasoFacturacion`, `MetodoPago`, `SaveFacturacionPayload`, `ResumenFacturacionItem`.
  - `api.ts`: funciones tipadas de persistencia y transiciones hacia Supabase: `getFacturacion`, `saveFacturacion`, `marcarComoFacturado`, `marcarComoCobrado`, `iniciarReclamoAseguradora`, `resolverReclamo`, `getResumenFacturacion`.
  - Tests unitarios en `api.test.ts` con cobertura de todas las operaciones y reglas de negocio.
- **Task 3: Pantalla Principal de Facturación y Navegación (`928e180`)**:
  - Pantalla `FacturacionPage.tsx` en ruta `/facturacion` protegida por `RequireRole roles={['dueno']}`.
  - 4 Tarjetas KPI financieras: Total Facturado, Total Cobrado, Pendiente de Cobro (diferencial acumulado), En Reclamo (conteo de casos en disputa).
  - Filtros combinados: buscador de texto por patente/cliente/vehículo/factura/aseguradora, selector de estado y selector de canal.
  - Tabla con cálculo de diferencial por caso (`monto_facturado - monto_cobrado`), formato de moneda en pesos argentinos y badges semafóricos.
  - Habilitado el ítem «Facturación» en `routes.ts` (`available: true` para `dueno`).
- **Task 4: Ficha de Facturación por Caso y Reclamo a Aseguradoras (`f248c0b`)**:
  - Pantalla `FichaFacturacionPage.tsx` en `/casos/:id/facturacion` protegida para rol `dueno`.
  - Emisión de factura, imputación de cobros, medio de pago y notas de cobranza.
  - Indicador de saldo/diferencial en tiempo real con actualización reactiva.
  - Botones adaptativos según estado del caso (`firmado`, `facturado`, `reclamo a la compañía`, `cobrado`).
  - Integración en `CasoDetailPage.tsx`:
    - Para `dueno`: botón «Gestión de Facturación y Cobranza».
    - Para `recepcion`: botón y modal «Iniciar Reclamo a Aseguradora» habilitado para casos de seguro en estado `facturado`.
    - Alerta destacada con el motivo del reclamo cuando el caso está en `reclamo a la compañía`.
    - Para `taller`: ningún elemento ni monto financiero visible (`AUTH-02`).
- **Task 5: Verificación Integral, Migración Remota y Despliegue**:
  - Suite completa de 225 tests aprobados (26 suites).
  - Typecheck `tsc -b` con 0 errores.
  - Build de producción Vite completado en 7.68s.
  - Migración `0006_facturacion_y_cobros.sql` aplicada exitosamente en Supabase remoto.

### Referencia operativa y Troubleshooting (Fase 5)

1. **Seguridad y Acceso a Datos Financieros (AUTH-02):**
   - La tabla `public.caso_facturacion` no contiene políticas para `recepcion` ni `taller`.
   - Cualquier consulta directa desde la API de Supabase con el token de un usuario sin rol `dueno` devolverá un array vacío `[]` o denegación de RLS.
   - Para verificar RLS en SQL:
     ```sql
     select public.current_user_role(); -- debe devolver 'dueno'
     select * from public.caso_facturacion;
     ```
2. **Máquina de Estados de Facturación y Cobros:**
   - La transición a `facturado` requiere que el registro en `caso_facturacion` exista con `monto_facturado > 0` y `numero_factura`. Por esta razón, la función `marcarComoFacturado` en `api.ts` siempre ejecuta el upsert en `caso_facturacion` **antes** del update en `casos`.
   - La transición a `cobrado` requiere `monto_cobrado > 0` y `fecha_cobro`. La función `marcarComoCobrado` ejecuta el upsert de cobranza previo a la transición de estado.
   - En casos particulares, no está permitido pasar a `reclamo a la compañía`. Solo los casos con `canal = 'seguro'` pueden ingresar en reclamo.
3. **Comandos de Verificación:**
   - Tests: `npm test` (225 tests).
   - Typecheck: `npx tsc -b`.
   - Lint: `npx oxlint`.
   - Build: `npm run build`.
   - Migraciones remotas: `npx supabase migration list`.

### 📋 Estado para continuar mañana (Próximos pasos)

Todo el roadmap principal v1 (Fases 1 a 6) se encuentra implementado, auditado técnicamente, sincronizado en Supabase con 10 migraciones y desplegado en producción. Los próximos pasos recomendados para retomar mañana son:

1. **Smoke Testing Manual / Humano en Producción:**
   - **Prueba en tablet física de 10-12"**: Validar la experiencia táctil, la barra inferior de navegación y el croquis de daños (`VehicleDamageMap`) sobre canvas en hardware real.
   - **Carga de fotos reales**: Tomar fotos con cámara móvil en condiciones de taller y verificar la compresión nativa WebP y la subida al bucket de Supabase.
   - **Recorrido multirol en producción**: Ingresar con los perfiles del taller para confirmar la segregación estricta de vistas (especialmente la inaccesibilidad de facturación para taller y recepción).

2. **Higiene de Linter (0 warnings):**
   - Desacoplar las dos exportaciones mixtas que emiten warning de Fast Refresh (`SemaforoBadge.tsx` y `AuthProvider.tsx`) hacia archivos dedicados de constantes y contexto.

3. **Planificación de Versión 2.0 (Backlog priorizado):**
   - `NOTIF-01`: Notificaciones push/email automáticas al avanzar estados o recibir repuestos.
   - `INFORMES-01`: Reportes mensuales de productividad y balances facturado vs. cobrado.
   - `PLANTILLAS-01`: Generación de plantillas de correo con los formatos específicos de cada compañía de seguros.

---

## Estado histórico: Fase 4 - Reparación y Stock — **completa en producción** (2026-09-10)

La funcionalidad está implementada, la migración `0005_reparacion_y_stock.sql` está aplicada en Supabase (`tnwrewghcowayuudvxey`), el PR #1 fue mergeado a `main` y desplegado exitosamente en Vercel (`https://sacabollos-aguila-blanca.vercel.app`). Se encuentran los 197 tests en verde, typecheck limpio, build pasando y lint sin errores:

- **Task 1: Persistencia y máquina de estados de reparación** (`209a94f`, `48b2988`, `2d15d66`):
  - Migración `0005_reparacion_y_stock.sql` con ampliación de `validar_transicion_caso()` para todas las etapas de taller.
  - Tablas `reparacion_danos` y `stock_items` con RLS para taller, dueño y recepción.
  - Guards estrictos:
    - `ingresado -> en reparación`: taller/dueño; `reparacion_iniciada_at` obligatorio.
    - `en reparación -> esperando repuesto`: taller/dueño; `repuesto_pendiente` no vacío.
    - `esperando repuesto -> en reparación`: taller/dueño; limpia `repuesto_pendiente`.
    - `en reparación -> listo para firma`: taller/dueño; todos los daños `reparado = true` y 4 fotos finales existentes en storage.
    - `listo para firma -> firmado`: taller/dueño; `orden-firmada.webp` existente en storage.
  - RPC `iniciar_reparacion()` atómica para copiar daños de inspección con coordenadas normalizadas.
  - Políticas de storage para fotos finales (`final-frente.webp`, `final-atras.webp`, `final-lateral-izquierdo.webp`, `final-lateral-derecho.webp`) y orden firmada (`orden-firmada.webp`).
- **Task 2: Tipos de dominio y APIs Supabase** (`472d649`, `e19a34b`):
  - APIs tipadas de reparación: `startRepair`, `listRepairDamages`, `createRepairDamage`, `updateRepairDamage`, `deleteRepairDamage`, `waitForPart`, `resumeRepair`, `markReadyForSignature`, `markSigned`.
  - Whitelist estricta de payloads para proteger campos controlados por triggers de base de datos.
  - APIs de stock compartido: `listStockItems`, `createStockItem`, `updateStockItem`, `deleteStockItem`.
- **Task 3: Croquis y ficha de trabajo del Taller** (`b7b458c`):
  - Croquis táctil interactivo en canvas (`konva@10.5.0` y `react-konva@19.2.7`) en `VehicleDamageMap.tsx` con coordenadas normalizadas `(0..1)` y lista accesible de daños debajo del dibujo.
  - Pantalla `FichaTrabajoPage.tsx` accesible para roles `taller` y `dueno` en la ruta `/casos/:id/ficha-trabajo`.
  - Soporte de prop `caseHref` en `CasosList.tsx` y vinculación directa desde `TallerHome.tsx`.
  - Integración en `AppRouter.tsx` protegida por `RequireRole`.
- **Task 4: Cierre fotográfico y orden firmada** (`05ad9ef`):
  - Pantalla `CierreReparacionPage.tsx` en `/casos/:id/cierre-reparacion` para roles `taller` y `dueno`.
  - Reutilización de `FotoUploader` con los 4 ángulos de fotos finales (`FINAL_PHOTO_ANGLES`) como compuerta para avanzar a `listo para firma`.
  - Reutilización de `FotoUploader` para `SIGNED_ORDER_ANGLES` (`orden-firmada.webp`) como compuerta para avanzar a `firmado`.
  - Enlace y navegación cruzada fluida desde `FichaTrabajoPage`.
- **Task 5: Stock compartido y navegación unificada**:
  - Pantalla `StockPage.tsx` en `/stock` accesible para `dueno`, `recepcion` y `taller`.
  - Formulario unificado de alta y edición con validación de cantidad no negativa antes de consultar a Supabase.
  - Tabla accesible de insumos con eliminación tras confirmación explícita del usuario.
  - Ítem de navegación «Stock» agregado al menú principal (`BottomTabBar`, `Sidebar`) para los tres roles autenticados.
  - Cobertura de tests: 197 tests aprobados (23 suites), typecheck limpio, build de producción en 5.53s (198 kB) y lint sin errores.

### Referencia operativa y Troubleshooting (Fase 4)

Si se presenta alguna contingencia, despliegue manual o se retoma el entorno desde una máquina limpia, tener en cuenta:

1. **Dependencias del frontend:**
   - La Fase 4 incorporó `konva@^10.5.0` y `react-konva@^19.2.7` para el croquis interactivo de daños (`VehicleDamageMap`). Ejecutar siempre `npm install` tras clonar o actualizar.
2. **Base de Datos y Migraciones:**
   - Proyecto Supabase vinculado: `tnwrewghcowayuudvxey`.
   - Migración 0005: `supabase/migrations/0005_reparacion_y_stock.sql`.
   - Si se trabaja en un *git worktree* aislado, copiar la carpeta `supabase/.temp/` desde la raíz del proyecto para que la CLI de Supabase reconozca el proyecto vinculado sin requerir nuevo login.
   - Para verificar migraciones aplicadas: `npx supabase migration list`.
3. **Reglas de la máquina de estados de taller (Trigger PostgreSQL):**
   - Las transiciones de taller están protegidas por `validar_transicion_caso()` y rechazan mutaciones directas sin cumplir los requisitos:
     - `ingresado -> en reparación`: requiere `reparacion_iniciada_at`.
     - `en reparación -> esperando repuesto`: requiere texto no vacío en `repuesto_pendiente`.
     - `esperando repuesto -> en reparación`: `repuesto_pendiente` debe limpiarse a `null`.
     - `en reparación -> listo para firma`: todos los registros en `reparacion_danos` para el caso deben tener `reparado = true` y deben existir en Storage los 4 archivos finales: `casos/<id>/final-frente.webp`, `casos/<id>/final-atras.webp`, `casos/<id>/final-lateral-izquierdo.webp` y `casos/<id>/final-lateral-derecho.webp`.
     - `listo para firma -> firmado`: debe existir en Storage el archivo `casos/<id>/orden-firmada.webp`.
   - Si una transición falla con error SQL `23514` (`check_violation`), verificar que las fotos o el estado de los daños cumplan el guard respectivo.
4. **Storage y RLS de fotos:**
   - Formato requerido: los nombres de archivo deben respetar estrictamente el formato `casos/<caso_id>/<nombre>.webp` con exactamente 3 segmentos de ruta delimitados por `/`.
   - Subidas permitidas para taller y dueño: `final-frente.webp`, `final-atras.webp`, `final-lateral-izquierdo.webp`, `final-lateral-derecho.webp`, `orden-firmada.webp`.
5. **Comandos de verificación de calidad:**
   - Tests: `npm test` (197 tests, Vitest con exclusión de `.worktrees`).
   - Typecheck: `npx tsc -b`.
   - Linter: `npx oxlint`.
   - Build de producción: `npm run build`.

## Estado histórico: Fase 3 - Caso Particular — **completa en producción** (2026-09-09)

La funcionalidad está implementada, la migración `0004` está aplicada en Supabase y el commit reconciliado `c097efd` fue desplegado correctamente por Vercel. El detalle y las evidencias están en la sección de Fase 3.

## Estado histórico: Fase 2 - Caso de Seguro — cerrada (2026-09-08)

Los 4 planes de la Fase 2 (`02-01` a `02-04`) están implementados, testados, y **los dos bugs críticos de producción están arreglados**:

1. **Bug RLS fotos (02-02/02-03 bloqueados)**: La política `casos_fotos_insert` usaba `storage.foldername(name)[3]` que siempre devuelve `NULL` (excluye el filename), rechazando el 100% de subidas. **Arreglado**: migración `0003_fix_casos_fotos_insert_rls.sql` → `split_part(name, '/', 3)` con allow-list de 8 ángulos `.webp`. Aplicada en producción ✅
2. **Bug navegación huérfana (02-03/02-04 bloqueados)**: `CasoDetailPage` no tenía link a `/casos/{id}/ficha-ingreso` para casos en `turno coordinado` — la ruta existía pero era inaccesible salvo tecleando la URL. **Arreglado**: botón "Registrar ingreso al taller" con `useNavigate()` en `CasoDetailPage.tsx` + test. Commit `3c33d49` ✅

**Build ✓, Typecheck ✓, lint ✓, 77 tests ✓** — todo verde. La Fase 2 quedó cerrada a nivel de ingeniería.

La producción responde y el login restaurado fue revisado visualmente con navegador real el 2026-09-08. La cuenta QA histórica de recepción expiró, por lo que no se repitió el circuito productivo mutante: no se usaron los scripts antiguos porque dejan datos permanentes y uno contiene una credencial privilegiada. La próxima automatización productiva será sanitizada, idempotente y con limpieza garantizada.

---

## Checklist — Estado real por plan

| Plan | Qué entrega | Código | Tests | Producción | Verificación humana |
|------|-------------|--------|-------|------------|---------------------|
| **02-01** | Modelo datos + compresión fotos + hook | ✅ `35 tests` | ✅ | ✅ | no aplica |
| **02-02** | Alta caso + Ficha inspección (4 fotos) | ✅ `47 tests` | ✅ | ✅ **fix RLS aplicado** | ⏳ revalidación con cuenta QA nueva |
| **02-03** | Turno + Ficha ingreso (4 fotos ingreso) | ✅ `58 tests` | ✅ | ✅ **fix RLS + nav aplicados** | ⏳ revalidación con cuenta QA nueva |
| **02-04** | Semáforo 9 etapas + Realtime 3 roles | ✅ `76 tests` | ✅ | ✅ | ⏳ revalidación multirol sanitizada |

**Leyenda**: ✅ = completo y verificado en CI | ⏳ = pendiente (requiere humano en prod) | 🔴 = estaba roto, ahora arreglado

---

## Restauración del frontend — 2026-09-08

Se revirtió de forma selectiva la regresión visual introducida por los commits `8ac99fe` y `4583d2a`. Esos cambios habían reemplazado la identidad de taller aprobada por un sistema Material 3 genérico y luego habían vuelto a modificar tema, primitivas UI, navegación y pantallas consumidoras.

La restauración toma `afdb1e0` como última referencia aprobada y la aplica como un commit nuevo, sin reescribir el historial. Volvieron la paleta graphite/steel/navy/blue/red/brass/green, las tipografías Oswald + IBM Plex Sans + IBM Plex Mono, las fichas con borde marcado y sombra desplazada, el cierre de sesión visible y el estado de acceso «Ingresando…».

**Alcance:**

- Restaurados `theme.css`, las cinco primitivas de `src/ui/`, el shell responsive y sus tres piezas de navegación.
- Restauradas únicamente las adaptaciones visuales de Login, Dueño, Recepción, Taller y pantallas de Casos que habían acompañado al rediseño.
- Conservados React Router, Supabase Auth, RLS, Realtime, fotos y la máquina de estados; no se modificaron backend, migraciones ni datos.
- Agregados diseño y plan auditables en `docs/superpowers/`.

**Verificación fresca:**

- `npm run typecheck` ✅
- `npm run build` ✅ — mantiene el aviso informativo existente de bundle principal mayor a 500 kB.
- `npm test` ✅ — 16 archivos, 77 tests aprobados.
- `npm run lint` ✅ — exit code 0; permanecen dos warnings preexistentes de `react(only-export-components)` en `AuthProvider.tsx` y `SemaforoBadge.tsx`.
- Prueba de regresión RED/GREEN ✅ — antes de restaurar fallaban el texto «Ingresando…» y la presencia de «Cerrar sesión»; después pasaron 11/11 tests focalizados.
- Smoke productivo con Chrome/Puppeteer ✅ — Vercel responde, redirige a `/login` y la pantalla restaurada fue inspeccionada en 1280×900; captura en `docs/screenshots/phase2-login-production.png`.

## Fase 3 — Caso Particular

La ingeniería local está completa: alta discriminada Seguro/Particular, presupuesto positivo, cuatro fotos persistidas, aceptación hacia el circuito compartido de turno e ingreso, rechazo con modalidad de contacto y seguimiento, detalle/listado por canal y errores recuperables. La migración `0004_casos_particulares_y_transiciones.sql` protege en PostgreSQL el grafo de estados, los campos permitidos por transición, roles y fotos obligatorias.

**Verificación fresca:** 18 archivos / 122 tests ✅, typecheck ✅, build de producción ✅ (permanece el aviso informativo de chunk >500 kB), lint ✅ con solo dos warnings históricos de Fast Refresh, y `git diff --check` ✅.

**Rollout completado:** Supabase CLI confirmó `0001–0003` alineadas, el dry-run propuso únicamente `0004_casos_particulares_y_transiciones.sql` y el push registró `0004` en remoto. GitHub `main` quedó en `c097efd` y el deployment canónico de Vercel terminó en `success`: **https://sacabollos-aguila-blanca.vercel.app**. El E2E productivo mutante sigue reservado hasta disponer de una cuenta QA legítima y una limpieza idempotente.
### Registro de cierre — Fase 3 (2026-09-09/10)

- Dos implementaciones paralelas partían de `fb0e5c8`: `7caa8b0` (flujo completo) y `8a28ea4` (tareas 1–3). Se compararon código, migraciones y pruebas; el merge `c097efd` conserva el árbol completo y registra ambos historiales sin mantener dos migraciones `0004` incompatibles.
- La variante descartada compilaba, pero su suite sólo ejecutó 62 pruebas y dejó 10 archivos fallidos por falta de entorno Supabase. El árbol elegido ejecutó 18 archivos y 122 pruebas correctamente, además de typecheck, build, lint sin errores y `git diff --check`.
- OpenCode con `DeepSeek V4 Pro 0813` y `Nemotron 3 Super` se usó para auditorías auxiliares de release, SQL y divergencia. Las decisiones finales se validaron contra el repositorio y los comandos reales; no se guardaron credenciales, tokens ni códigos de acceso.
- Supabase quedó `ACTIVE_HEALTHY`, el repositorio se vinculó al proyecto `tnwrewghcowayuudvxey` y el historial remoto confirmó `0001`, `0002`, `0003` y `0004` alineadas.
- El cierre documental quedó en `5f8a317`. GitHub Pages y los cuatro checks Vercel asociados terminaron en `success`; el dominio canónico es **https://sacabollos-aguila-blanca.vercel.app**.
- GitHub todavía registra tres proyectos Vercel adicionales (`sacabollos-aguila-blanca-3a`, `sacabollos-aguila-blanca-en` y `sacabollos-aguila-blanca-m3`). Su desvinculación queda pendiente de acceso administrativo a Vercel.
- Pendientes no bloqueantes: E2E productivo mutante con cuenta QA legítima y limpieza idempotente; verificación táctil en tablet física; plan diferido `01-04` para alta de usuarios.
- Próximo bloque: **Fase 4 — Reparación y Stock**.

---

## Estado histórico: Fase 1 - Fundaciones — COMPLETA

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

Con eso confirmado, la Fase 1 (Fundaciones) queda cerrada del todo.

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
│   ├── casos/         # Casos de seguro: listado, detalle, fichas, hooks, api
│   │   ├── api.ts
│   │   ├── CasoDetailPage.tsx + .test.tsx
│   │   ├── CasoNuevoPage.tsx
│   │   ├── CasosListPage.tsx + .test.tsx
│   │   ├── components/
│   │   │   ├── CasosList.tsx + .test.tsx
│   │   │   ├── SemaforoBadge.tsx + .test.tsx
│   │   │   ├── DamageCheckboxes.tsx
│   │   │   ├── FotoUploader.tsx
│   │   │   └── ...
│   │   ├── hooks/
│   │   │   └── useCasoFotos.ts
│   │   ├── FichaInspeccionPage.tsx
│   │   ├── FichaIngresoPage.tsx
│   │   └── types.ts
│   ├── dueno/
│   │   └── DuenoHome.tsx
│   ├── login/
│   │   └── LoginPage.tsx
│   ├── recepcion/
│   │   └── RecepcionHome.tsx
│   └── taller/
│       └── TallerHome.tsx
├── lib/
│   ├── imageCompression.ts
│   └── supabaseClient.ts
├── styles/
│   └── theme.css      # Tokens Tailwind v4 @theme (paleta, tipografías, spacing, breakpoint)
├── test/
│   ├── setup.ts       # matchMedia mock + jest-dom
│   └── harness.test.ts
├── ui/                # Primitivas visuales compartidas
│   ├── Ficha.tsx
│   ├── TextField.tsx
│   └── PrimaryButton.tsx
├── app/
│   ├── AppRouter.tsx
│   ├── routes.ts
│   └── roleHome.ts
├── layout/
│   ├── AppShell.tsx
│   ├── Topbar.tsx
│   ├── Sidebar.tsx
│   └── BottomTabBar.tsx
├── App.tsx
└── main.tsx

supabase/
├── migrations/
│   ├── 0001_profiles.sql
│   ├── 0002_casos.sql
│   └── 0003_fix_casos_fotos_insert_rls.sql   # <-- NUEVO: fix RLS fotos
└── seed/
    └── 0001-promote-first-dueno.sql

docs/
├── index.html           # Demo visual aprobada (fichas individuales por rol)
├── tablero.html         # Prototipo Planilla de Control (vista tabular tipo Excel con semáforo y stock)
└── proyecto.html        # Resumen del proyecto y roadmap visible en la demo

.planning/
├── phases/
│   ├── 01-fundaciones/
│   └── 02-caso-de-seguro/  # 02-01 a 02-04: PLAN, SUMMARY, CONTEXT, DISCUSSION, RESEARCH
└── quick/
    ├── 260827-rxx-fix-rls-policy-casos-fotos-insert-storag/   # Fix RLS fotos (aplicado en prod)
    │   ├── 260827-rxx-PLAN.md
    │   └── 260827-rxx-SUMMARY.md
    └── 260827-six-add-missing-navigation-link-to-casos-id-/   # Fix nav ficha-ingreso
        ├── 260827-six-PLAN.md
        └── 260827-six-SUMMARY.md
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

## Pendiente: llevar a la app real (Fase 2, plan `02-04` — YA HECHO)

El dueño pidió 3 mejoras sobre la Planilla de Control que por ahora **solo existían en el prototipo estático `docs/tablero.html`** (datos mock en JS, sin backend). El plan `02-04` las portó contra datos reales:

1. **Alerta de "una semana sin avance"** — segundo umbral en ≥7 días (`estado_changed_at`) que suma KPI "Sin avance ≥7 días", resalta cliente+patente en rojo con badge.
2. **Color por etapa (gradiente rojo → verde)** — 9 columnas del semáforo con color propio por columna, interpolado de rojo (etapa 1) a verde (etapa 9). Excepciones: bloqueado/reclamo = rojo fijo, cancelado = gris, esperando repuesto = brass con "REP".
3. **Buscador por patente y cliente** — input con normalización de acentos que filtra el listado en tiempo real.

Commits donde se prototipó cada pieza (todos sobre `docs/tablero.html`): `116b222` (alerta 7 días + gradiente), `26e8c69` (caso de ejemplo), `aedad37` (buscador).

---

## Changelog — Sesión 2026-08-27 (Fixes críticos de producción para Fase 2)

**Contexto:** La verificación con Chrome DevTools del 2026-08-26/27 reveló que los planes 02-02 y 02-03 **estaban rotos en producción** aunque el README decía "solo falta verificación humana". Dos bugs bloqueantes:

### 1. Fix RLS fotos — Quick Task `260827-rxx` (commits `4fa11e7`, `e5927d6`, `b5580be`)
- **Problema:** Política `casos_fotos_insert` en `supabase/migrations/0002_casos.sql:126-137` usaba `storage.foldername(name)[3]` para validar el ángulo. `foldername()` **excluye el filename**, así que para paths `casos/{caseId}/frente.webp` siempre devolvía `NULL` → INSERT rechazado 100%.
- **Fix:** Migración `supabase/migrations/0003_fix_casos_fotos_insert_rls.sql` → `split_part(name, '/', 3)` comparado contra allow-list con 8 valores exactos (`frente.webp`, `atras.webp`, `lateral-izquierdo.webp`, `lateral-derecho.webp`, `ingreso-frente.webp`, `ingreso-atras.webp`, `ingreso-lateral-izquierdo.webp`, `ingreso-lateral-derecho.webp`).
- **Verificación:** Subida real de `frente.webp` con usuario `qa.recepcion.aguilablanca@mailinator.com` → guardada en bucket `casos-fotos/casos/{caseId}/` sin errores de consola ni rechazo RLS.
- **Aplicado en producción:** `npx supabase db push` confirmado (`migration list --linked` muestra `0003` remoto).

### 2. Fix navegación ficha-ingreso — Quick Task `260827-six` (commits `3e8a56e`, `3c33d49`, `8a85777`)
- **Problema:** `CasoDetailPage.tsx` tenía ramas para `enviado a la aseguradora` (botón orden recibida) y `aprobado` (formulario turno), pero **ninguna rama para `turno coordinado`**. La ruta `/casos/:id/ficha-ingreso` existía en `AppRouter.tsx` bajo `RequireRole roles={['recepcion']}` y `FichaIngresoPage.tsx` estaba completa, pero nada linkeaba a ella.
- **Fix:** En `CasoDetailPage.tsx`: import `useNavigate`, `const navigate = useNavigate()`, y bloque condicional:
  ```tsx
  {caso.estado === 'turno coordinado' && (
    <PrimaryButton onClick={() => navigate(`/casos/${caseId}/ficha-ingreso`)}>
      Registrar ingreso al taller
    </PrimaryButton>
  )}
  ```
- **Test:** Nuevo caso en `CasoDetailPage.test.tsx` cubre render del botón + navegación a placeholder.
- **Verificación:** `npm run build` ✓, `npm run test` (77 tests) ✓, `npm run typecheck` ✓.

---

## Changelog — Sesión 2026-08-26/27 (Fase 2, plan 02-04 completo)

**Objetivo:** ejecutar el plan `02-04` completo (semáforo visual de 9 etapas + Realtime en las 3 home), cerrando el flujo de punta a punta de la Fase 2.

### Qué se hizo
- `SemaforoBadge`: reproduce fielmente `STAGES`/`stateMapping` de `docs/tablero.html` para los 13 estados (9 etapas, 6 `kind`), con los sentinelas `cobrado`/`cancelado` tratados aparte para no indexar el array fuera de rango.
- `CasosList`: lista compartida con semáforo + alerta de días trabado (≥5 días sin cambiar de etapa), reutilizada tal cual por Dueño, Taller y Recepción — ninguna de las 3 home vuelve a definir su propia fila de caso.
- `useCasoRealtime`: un solo canal de Supabase Realtime por sesión; `DuenoHome`, `TallerHome` y `CasosListPage` actualizan su lista en memoria sin recargar cuando cualquiera avanza un caso. `TallerHome` filtra `cobrado`/`cancelado` en el cliente.
- `npm run build` y `npm run test` (76 tests, 3 corridas seguidas) en verde. Ver `.planning/phases/02-caso-de-seguro/02-04-SUMMARY.md`.

### Qué falta
- Verificación humana de punta a punta (semáforo actualizándose entre pestañas/dispositivos, filtro de taller, alerta de días trabado con datos reales), no ejecutable desde este entorno.
- Con esto, la **Fase 2 (Caso de Seguro) queda funcionalmente completa** de alta a semáforo visible; solo faltan las verificaciones humanas acumuladas de los planes 02-02, 02-03 y 02-04.

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
- **AHORA RESUELTO:** El bug de navegación huérfana (fix `260827-six`) y el bug de RLS de fotos (fix `260827-rxx`) impedían que la verificación humana fuera siquiera posible. Ambos arreglados y en producción.

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
- **AHORA RESUELTO:** El bug de RLS de fotos (fix `260827-rxx`) impedía que la verificación humana fuera siquiera posible. Arreglado y en producción.

---

## Changelog — Sesión 2026-08-26 (Fase 2, plan 02-01 completo)

**Objetivo:** cerrar la Task 3 pendiente del plan `02-01` (compresión de imágenes + hook de fotos de casos), con lo que las 3 tasks del plan quedan completas.

### Qué se hizo
- `src/lib/imageCompression.ts` — `compressToWebP()` (compresión nativa a WebP vía `createImageBitmap` + `OffscreenCanvas`, sin dependencias externas, máx. 1920px / calidad 0.8) y `buildFotoPath()` (formador único del path `casos/{caseId}/{angulo}.webp`, reusado también por el plan 02-03 con el prefijo `ingreso-`).
- `src/features/casos/hooks/useCasoFotos.ts` — hook `useCasoFotos()` con `uploadFoto()` (comprime y sube al bucket privado `casos-fotos`) y `listFotos()` (URLs firmadas por ángulo, 1 hora de expiración; omite del mapa los ángulos sin foto subida en vez de tirar error).
- `npm run build`, `npm run test` (35 tests) y `npm run typecheck` en verde.
- Ver `.planning/phases/02-caso-de-seguro/02-01-SUMMARY.md` para el detalle completo del plan (tasks 1-3).

---

## Changelog — Sesión 2026-08-25 (Fase 1 cerrada de punta a punta)

**Objetivo:** terminar Tasks 3 y 4 con las credenciales que fue proveyendo el dueño del proyecto durante la sesión.

### Qué se hizo
- `npx supabase link` + `npx supabase db push` corridos contra el proyecto real (`tnwrewghcowayuudvxey`) — migración `0001_profiles` aplicada en remoto.
- Verificado con curl que RLS bloquea el acceso anónimo (`GET /rest/v1/profiles` → `[]`).
- Vercel: se creó una cuenta separada (equipo `aguila-blanca`, login vía Bitbucket con el email del taller) para poder transferirle la propiedad del proyecto al dueño más adelante sin migrar nada.
- En esa sesión se intentó limpiar los proyectos duplicados de Vercel. La auditoría del 2026-09-09/10 confirmó que actualmente vuelven a existir tres vínculos adicionales (`-3a`, `-en`, `-m3`); ver el registro de cierre de Fase 3.
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

### Estado histórico tras esa sesión (2026-08-23)

> Este bloque conserva el estado de aquel momento; el estado vigente está al inicio del README y en el registro de cierre de Fase 3.

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
