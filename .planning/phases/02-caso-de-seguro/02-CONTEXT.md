# Phase 2: Caso de Seguro - Context

**Gathered:** 2026-08-25
**Status:** Ready for planning

<domain>
## Phase Boundary

Un caso de canal Seguro se puede seguir de punta a punta, desde la denuncia hasta que el auto ingresa al taller: recepcion crea el caso con denuncia+siniestro+datos del productor, completa la ficha de inspeccion pre-ingreso (fotos+bosquejo), coordina el turno, y registra el ingreso real del auto (ficha 2). El caso muestra un semaforo de estado que avanza por las 9 etapas ya validadas visualmente en `docs/tablero.html`. No incluye: reparacion en si (Fase 4), facturacion/cobro (Fase 5), ni CRM de aseguradoras/productores con historial (Fase 6) — en esta fase esos datos son solo campos sobre el caso, sin pantalla propia.

</domain>

<decisions>
## Implementation Decisions

### Maquina de estados (ya validada visualmente, no se discute de nuevo)
- **D-14:** Los 9 estados y su mapeo a etapa son los de `docs/tablero.html` (`STAGES`/`stateMapping`), palabra por palabra: `borrador`, `enviado a la aseguradora`, `aprobado`, `turno coordinado`, `ingresado`, `esperando repuesto` (rama), `en reparación`, `listo para firma`, `firmado`, `facturado`, `cobrado`, mas los estados terminales alternativos `reclamo a la compañía` y `cancelado`. Esta fase implementa hasta `ingresado` inclusive (CASOS-02); los estados posteriores a "ingresado" quedan definidos en el modelo de datos pero sus pantallas/acciones llegan en fases siguientes (reparación=Fase 4, facturación/cobro=Fase 5).

### Envio de denuncia/presupuesto a la aseguradora
- **D-15:** El envio del mail a la compañía es MANUAL — recepción lo redacta y manda desde su propio cliente de correo (Gmail/Outlook), el sistema no envia mails en esta fase. El sistema solo ofrece los datos para copiar (denuncia, numero de siniestro, presupuesto) y un boton "Marcar como enviado a la aseguradora" que avanza el estado.
- **Rationale:** las plantillas de mail por aseguradora (PLANTILLAS-01) estan diferidas a v2 — automatizar el envio ahora requeriria construir esas plantillas antes de tiempo.

### Fotos minimas por ficha
- **D-16:** Cada una de las fichas de esta fase (inspeccion pre-ingreso, ficha de ingreso) exige un minimo de 4 fotos para poder guardarse: las 4 caras del auto (frente, atras, lateral izquierdo, lateral derecho). Sin esas 4, el guardado queda bloqueado (cumple FICHAS-04).

### Bosquejo de daños
- **D-17:** NO es un dibujo interactivo (SVG clickeable). Es una lista fija de checkboxes por zona del auto: paragolpes delantero, paragolpes trasero, capot, techo, puerta delantera izquierda, puerta trasera izquierda, puerta delantera derecha, puerta trasera derecha, guardabarros, baul. El SVG decorativo que ya existe en `docs/index.html` (`.car-sketch`) NO se usa como base de esta interaccion — queda solo como elemento visual de la demo.

### Aseguradora y productor/asesor
- **D-18:** Aseguradora se elige de una lista fija de 6 valores (no una tabla con CRUD propio todavia — eso es CRM-02 en Fase 6): San Cristóbal, Federación Patronal, Mercantil Andes, Triunfo, Sancor, Cooperativa de Seguros. Se guarda como texto/enum en el caso, sin FK a una tabla `aseguradoras` que no existe aun.
- **D-19:** Productor/asesor es texto libre (nombre + telefono) guardado directamente en el caso — sin tabla propia hasta Fase 6 (CRM-03).

### Claude's Discretion
- Nombres exactos de columnas/tablas, uso de Supabase Realtime vs. refetch simple para el semaforo "sin recargar" (CASOS-04), estructura de Storage para fotos, libreria de upload de imagenes.

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Dominio de negocio (fuente original, ya transcripta)
- `docs/flujos-originales/TRANSCRIPCION.md` — transcripcion completa de las 7 fotos de anotaciones a mano del dueño: flujo Seguro vs Particular, las 3 fichas, notas de la agenda diaria, lista de aseguradoras
- `.planning/PROJECT.md` — vision completa y constraints del proyecto
- `.planning/REQUIREMENTS.md` — CASOS-01, CASOS-02, CASOS-04, CASOS-05, FICHAS-01, FICHAS-02, FICHAS-04 son los requisitos de esta fase

### Maquina de estados y semaforo (ya validado visualmente por el dueño)
- `docs/tablero.html` líneas 992-1021 (`STAGES`, `stateMapping`) — los 9 estados exactos y su mapeo a etapa/kind, palabra por palabra, no se reinterpretan
- `docs/tablero.html` — prototipo completo de la Planilla de Control (12 casos mock, KPIs, columna "Días" con alerta de trabado, filtros) — referencia de que datos debe exponer el listado de casos aunque el semaforo real se construye recien en 02-04

### Fase 1 (base que esta fase extiende)
- `.planning/phases/01-fundaciones/01-CONTEXT.md` — decisiones de auth/roles/shell que esta fase hereda
- `.planning/phases/01-fundaciones/01-01-SUMMARY.md`, `01-02-SUMMARY.md`, `01-03-SUMMARY.md` — que quedo implementado (login real, shell responsive, RoleHome) y que quedo diferido (01-04, invite-user)

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `src/app/routes.ts` (`navItemsForRole`) — el item "Casos" ya existe para dueño/taller en `/`, y "Casos" para recepción en `/casos` (marcado `available: false`) — esta fase es la que lo habilita
- `src/ui/EmptyState.tsx` — mismo tratamiento visual para reemplazar por el listado real de casos
- `src/features/dueno/DuenoHome.tsx`, `taller/TallerHome.tsx` — muestran el `EmptyState` de "Todavía no hay casos cargados" que esta fase reemplaza por datos reales
- `src/auth/useAuth.ts` — `profile.role` disponible para filtrar que puede hacer cada rol sobre un caso

### Established Patterns
- Paleta y tipografia fijadas en `src/styles/theme.css` (`@theme`), incluida la Status Stamp Palette (`--color-navy`, `--color-blue`, `--color-red`, `--color-brass`, `--color-green`, `--color-gray`) pensada especificamente para los sellos de estado del semaforo
- RLS + `current_user_role()` de `supabase/migrations/0001_profiles.sql` es el patron a seguir para las politicas de la nueva tabla `casos` (nunca confiar en el filtrado de UI como control de acceso)
- Copy fija en español, nunca el mensaje crudo de Supabase/Postgres

### Integration Points
- La nueva tabla `casos` se relaciona con `auth.users`/`profiles` para saber quien creo/es responsable de cada caso
- El listado de casos reemplaza el `EmptyState` actual en `DuenoHome`/`RecepcionHome`/`TallerHome`, filtrado segun D-06/D-07/D-08 de la Fase 1 (dueño y taller ven todos los casos activos, recepción ve la agenda de turnos)

</code_context>

<specifics>
## Specific Ideas

- El semaforo visual final (colores, iconos ✓/●/◐/✖/—) ya esta diseñado y aprobado en `docs/tablero.html` — reusar esa paleta de "kind" (waiting/active/parts/done/blocked/cancelled) en 02-04, no inventar una nueva
- La columna "Días" de `docs/tablero.html` (roja si ≥5 días trabado en la misma etapa) es una idea validada visualmente pero pertenece a 02-04 (semaforo), no a esta fase de modelo de datos — se deja anotada para cuando llegue esa fase

</specifics>

<deferred>
## Deferred Ideas

- Envio automatico de mail a la aseguradora con plantilla por compañia — ya esta en el roadmap como PLANTILLAS-01 (v2), confirmado que sigue diferido
- Tabla `aseguradoras` con CRUD propio e historial de casos — CRM-02, Fase 6
- Tabla `productores` con CRUD propio — CRM-03, Fase 6
- Bosquejo interactivo tipo SVG clickeable para marcar daños — el dueño prefirio checkboxes por zona para esta fase; si mas adelante pide el dibujo interactivo, es una mejora de UI sobre el mismo modelo de datos (los checkboxes por zona ya capturan que zona tiene daño), no un cambio de alcance

None - discusión se mantuvo dentro del alcance de la fase.

</deferred>

---

*Phase: 2-Caso de Seguro*
*Context gathered: 2026-08-25*
