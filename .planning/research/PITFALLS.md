# Pitfalls Research

**Domain:** Sistema de gestión para taller de reparación de bollos (PDR) con casos de seguro y particulares, fichas digitales con fotos, facturación y roles
**Researched:** 2026-08-19
**Confidence:** MEDIUM (patrones generales de sistemas de gestión de talleres; particularidades del mercado argentino con menor certeza)

## Critical Pitfalls

### Pitfall 1: Fichas incompletas o inconsistentes

**What goes wrong:** Faltan fotos, descripciones de daños o datos del cliente en las fichas, generando retrasos en la reparación o facturación.
**Why it happens:** Falta de validación en el frontend o backend para asegurar datos completos antes de guardar.
**How to avoid:** Campos obligatorios en las fichas (patente, fotos de daños, estado del repuesto); validación en tiempo real con mensajes claros; bosquejo interactivo del auto para marcar daños (ej. Fabric.js).
**Warning signs:** Fichas con campos vacíos en las primeras pruebas, o usuarios saltando pasos por frustración.
**Phase to address:** Diseño de UI/UX y desarrollo de las fichas.

---

### Pitfall 2: Gestión manual de estados de repuestos

**What goes wrong:** Demoras en reparaciones por no rastrear correctamente repuestos faltantes.
**Why it happens:** Falta de integración entre el control de stock y el flujo de reparación.
**How to avoid:** Vincular el estado de repuesto al estado del caso (ej. "esperando repuesto X"); reflejarlo en el semáforo de estado.
**Warning signs:** Casos que quedan en "en espera" sin actualizaciones por días.
**Phase to address:** Desarrollo del módulo de reparación y stock.

---

### Pitfall 3: Confusión entre canales (seguro vs. particular)

**What goes wrong:** Un caso particular se procesa como si fuera de seguro, o viceversa.
**Why it happens:** Lógica de flujo compartida sin separación clara entre canales.
**How to avoid:** Estados y pantallas específicas por canal; plantillas de mail diferenciadas.
**Warning signs:** Usuarios reportando errores en la secuencia de pasos de un caso.
**Phase to address:** Diseño de la máquina de estados (ver ARCHITECTURE.md).

---

### Pitfall 4: Facturación inconsistente o visible para roles no autorizados

**What goes wrong:** El diferencial entre monto facturado y cobrado queda visible para todos los roles, o los cálculos son incorrectos.
**Why it happens:** Falta de restricciones de permisos a nivel de base de datos (no solo de UI).
**How to avoid:** Restringir con RLS de Supabase, no solo ocultando el campo en el frontend (ver ARCHITECTURE.md, Anti-Pattern 2).
**Warning signs:** Reportes de facturación con datos inconsistentes, o algún rol no-dueño viendo el diferencial.
**Phase to address:** Desarrollo de facturación y permisos.

---

## Technical Debt Patterns

| Shortcut | Immediate Benefit | Long-term Cost | When Acceptable |
|----------|---------------------|-------------------|--------------------|
| Guardar fotos en almacenamiento plano/local en vez de Storage | Implementación rápida | Difícil de escalar, riesgo de pérdida de datos | Solo en un prototipo descartable |
| Hardcodear la lista de aseguradoras en el código | Evita crear una tabla | Difícil agregar o actualizar aseguradoras | Nunca — usar una tabla simple desde el inicio |
| Validar solo en el frontend | Interfaz más simple de construir | Datos inconsistentes si se saltea el frontend (ej. API directa) | Nunca — validar también en backend/RLS |

## Integration Gotchas

| Integration | Common Mistake | Correct Approach |
|-------------|-------------------|----------------------|
| Envío de fotos a aseguradoras por mail | Adjuntar fotos pesadas sin comprimir | Comprimir antes de enviar y/o mandar enlaces de descarga en vez de adjuntos |
| Subida de fotos desde tablet | Subir sin comprimir, saturando el storage | Comprimir en el cliente antes de subir, con límites de tamaño |
| Coordinación de turnos | No verificar disponibilidad en tiempo real | Vista de calendario con bloqueo de horarios ya ocupados |

## Performance Traps

| Trap | Symptoms | Prevention | When It Breaks |
|------|-----------|-------------|-------------------|
| Cargar todas las fotos de un caso a la vez | Tablet lenta o se traba al abrir un caso viejo | Lazy load / paginar fotos | Con casos que acumulan 15-20+ fotos |
| Consultas sin índices (ej. por patente o fecha) | Búsquedas lentas a medida que crece el historial | Índices en `patente`, `fecha_ingreso`, `estado` | A partir de varios cientos de casos acumulados |

## Security Mistakes

| Mistake | Risk | Prevention |
|---------|------|--------------|
| Exponer datos de clientes (DNI, teléfono) en URLs o respuestas sin filtrar | Fuga de información sensible | Rutas protegidas + RLS, nunca exponer más campos de los necesarios por vista |
| Dejar el diferencial facturado/cobrado accesible por API aunque esté oculto en la UI | Cualquiera con las dev tools del navegador podría verlo | Restringir con RLS a nivel de base de datos, no solo en el frontend |
| Fotos de autos/clientes en buckets públicos | Acceso no autorizado a imágenes de clientes | Buckets privados con signed URLs |

## UX Pitfalls

| Pitfall | User Impact | Better Approach |
|---------|----------------|---------------------|
| Botones pequeños en tablet | Difícil de tocar con guantes o manos sucias en el taller | Touch targets grandes (mínimo ~48px) |
| Formularios largos sin guardado progresivo | Se pierde todo si se cierra la app a mitad de una ficha | Guardar automáticamente por sección, no solo al final |
| No considerar la iluminación del taller | Difícil ver la pantalla al tomar fotos de daños | Modo claro/oscuro y buen contraste por defecto |

## "Looks Done But Isn't" Checklist

- [ ] **Validaciones de campos críticos:** patente y número de siniestro a menudo quedan sin validar — verificar que no se pueda guardar una ficha sin ellos
- [ ] **Aviso de repuesto llegado:** falta notificar cuando cambia el estado "esperando repuesto" — verificar que el cambio de estado dispare algo visible
- [ ] **Semáforo de estado en vivo:** puede quedar desactualizado hasta recargar la página — verificar que use Realtime, no solo carga inicial
- [ ] **Fotos recién subidas desde tablet:** pueden no verse hasta recargar — verificar que la subida actualice la vista sin refresh manual
- [ ] **Respaldo de datos:** fácil de asumir que "ya lo hace Supabase" sin confirmarlo — verificar que los backups automáticos estén realmente activados

## Recovery Strategies

| Pitfall | Recovery Cost | Recovery Steps |
|---------|-------------------|--------------------|
| Pérdida de datos por fallo de base | MEDIUM | Restaurar desde backups automáticos de Supabase |
| Deploy con errores críticos | LOW | Rollback a la versión anterior en Vercel/Netlify (deploys versionados) |
| Bug reportado por un usuario en producción | LOW-MEDIUM | Logs centralizados (Supabase logs / Sentry) para reproducir antes de corregir |

## Pitfall-to-Phase Mapping

| Pitfall | Prevention Phase | Verification |
|---------|----------------------|-------------------|
| Fichas incompletas | Fase de fichas digitales | Probar que no se pueda guardar una ficha sin los campos obligatorios |
| Gestión manual de repuestos | Fase de reparación y stock | Confirmar que "esperando repuesto" se refleje en el semáforo |
| Confusión entre canales | Fase de casos / máquina de estados | Revisar que las transiciones de estado sean distintas por canal |
| Facturación visible a roles no autorizados | Fase de facturación y permisos | Probar con un usuario "recepción" o "taller" que no pueda ver el diferencial vía API |

## Sources

- Investigación de dominio delegada a modelo NVIDIA NIM (nvidia/llama-3.3-nemotron-super-49b-v1.5)
- Patrones generales de sistemas de gestión de talleres/carrocerías y buenas prácticas de UX para entornos industriales

---
*Pitfalls research for: gestión de taller PDR con casos de seguro y particulares*
*Researched: 2026-08-19*
