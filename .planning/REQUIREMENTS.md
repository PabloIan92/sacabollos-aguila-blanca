# Requirements: Sistema de Gestión — Sacabollos Aguila Blanca

**Defined:** 2026-08-19
**Core Value:** Que ningún auto, ficha, presupuesto o pago se pierda o se demore por depender de papel — todo el circuito (ingreso → reparación → cobro) queda registrado y visible en un solo lugar para dueño, recepción y taller.

## v1 Requirements

### Autenticación y Roles

- [ ] **AUTH-01**: Usuario inicia sesión y ve solo las secciones que corresponden a su rol (dueño, recepción o taller)
- [ ] **AUTH-02**: Solo el rol dueño puede ver el diferencial entre monto facturado y total cobrado; recepción y taller no lo ven en ninguna pantalla ni pueden acceder a él

### Casos

- [ ] **CASOS-01**: Recepción puede crear un caso nuevo eligiendo canal Seguro o Particular
- [ ] **CASOS-02**: Un caso de canal Seguro registra denuncia, número de siniestro y datos del productor/asesor, y avanza por sus estados (enviado a la aseguradora → orden de trabajo recibida → turno → ingresado al taller → en reparación → firmado → facturado → cobrado o reclamo a la compañía)
- [ ] **CASOS-03**: Un caso de canal Particular registra presupuesto y fotos; si el cliente acepta pasa a turno, si no acepta se guarda la modalidad de contacto para seguimiento futuro
- [ ] **CASOS-04**: Cada caso muestra un semáforo de estado visual que refleja en qué etapa está, actualizado sin necesidad de recargar la página
- [ ] **CASOS-05**: Recepción puede coordinar el turno del cliente, quedando registrada la fecha/hora de ingreso del auto

### Fichas Digitales

- [ ] **FICHAS-01**: Usuario completa la ficha de inspección pre-ingreso con datos del auto, del cliente, del seguro (si aplica), fotos y un bosquejo del auto para marcar daños
- [ ] **FICHAS-02**: Usuario completa la ficha de inspección de ingreso al momento real de entrar el auto al taller, con fotos y orden de ingreso
- [ ] **FICHAS-03**: Usuario completa la ficha de trabajo de reparación con la figura del auto, daños marcados y patente
- [ ] **FICHAS-04**: El sistema no permite guardar ninguna ficha sin sus campos obligatorios completos (patente, fotos mínimas requeridas, etc.)

### Reparación

- [ ] **REPARACION-01**: Taller puede marcar un caso como "esperando repuesto" indicando qué repuesto falta, y esto se refleja en el semáforo de estado
- [ ] **REPARACION-02**: Taller puede registrar la firma de la orden de trabajo con fotos al finalizar la reparación

### Facturación

- [ ] **FACTURACION-01**: Dueño registra, por caso, el monto facturado formalmente y el total realmente cobrado, viendo el diferencial entre ambos
- [ ] **FACTURACION-02**: Usuario puede marcar un caso como "reclamo a la compañía" cuando la aseguradora no paga

### CRM

- [ ] **CRM-01**: Usuario ve y edita la ficha de un cliente particular, incluyendo su historial de casos
- [ ] **CRM-02**: Usuario ve y edita la ficha de una compañía de seguro (San Cristóbal, Federación Patronal, Mercantil Andes, Triunfo, Sancor, Cooperativa de Seguros) con su historial de casos
- [ ] **CRM-03**: Usuario registra los datos de un productor/asesor de seguro asociado a un caso

### Stock

- [ ] **STOCK-01**: Usuario ve y actualiza un listado simple de materiales y repuestos disponibles

### Dispositivos

- [ ] **DISPOSITIVO-01**: El sistema se usa cómodamente tanto desde tablet (carga de fichas y fotos en el taller) como desde PC/notebook (oficina/recepción)

## v2 Requirements

Deferred to future release. Tracked but not in current roadmap.

### Notificaciones

- **NOTIF-01**: Notificar automáticamente cuando cambia el estado de un caso (ej. llegó el repuesto que faltaba)

### Informes

- **INFORMES-01**: Informes básicos: casos por mes, total facturado vs. total cobrado

### Integración con Aseguradoras

- **PLANTILLAS-01**: Plantillas de mail personalizadas por aseguradora, con formato específico que cada compañía espera

## Out of Scope

Explicitamente excluido. Documentado para prevenir scope creep.

| Feature | Reason |
|---------|--------|
| Bot de atención por WhatsApp | Requiere un servidor propio nuevo para Sacabollos, separado de la infraestructura de Lemmon Internet; se evalúa en un milestone futuro |
| Presencia web pública / sitio institucional | No es parte del sistema de gestión interno |
| Facturación electrónica / integración AFIP | No mencionado como necesidad actual; se evalúa más adelante si hace falta |
| Gestión de compras/proveedores de repuestos | v1 solo necesita saber si el repuesto llegó o no, no todo el ciclo de compra |
| Colaboración en tiempo real (edición simultánea de una misma ficha) | Riesgo de conflictos desproporcionado para un taller chico con 3 roles |
| Analítica avanzada de datos | Excesivo para la escala actual (decenas de casos/mes); cubierto por INFORMES-01 en v2 |

## Traceability

Which phases cover which requirements. Updated during roadmap creation.

| Requirement | Phase | Status |
|-------------|-------|--------|
| AUTH-01 | Phase 1 | Pending |
| DISPOSITIVO-01 | Phase 1 | Pending |
| CASOS-01 | Phase 2 | Pending |
| CASOS-02 | Phase 2 | Pending |
| CASOS-04 | Phase 2 | Pending |
| CASOS-05 | Phase 2 | Pending |
| FICHAS-01 | Phase 2 | Pending |
| FICHAS-02 | Phase 2 | Pending |
| FICHAS-04 | Phase 2 | Pending |
| CASOS-03 | Phase 3 | Pending |
| FICHAS-03 | Phase 4 | Pending |
| REPARACION-01 | Phase 4 | Pending |
| REPARACION-02 | Phase 4 | Pending |
| STOCK-01 | Phase 4 | Pending |
| FACTURACION-01 | Phase 5 | Pending |
| FACTURACION-02 | Phase 5 | Pending |
| AUTH-02 | Phase 5 | Pending |
| CRM-01 | Phase 6 | Pending |
| CRM-02 | Phase 6 | Pending |
| CRM-03 | Phase 6 | Pending |

**Coverage:**
- v1 requirements: 20 total
- Mapped to phases: 20
- Unmapped: 0 ✓

---
*Requirements defined: 2026-08-19*
*Last updated: 2026-08-19 after initial definition*
