# Sistema de Gestión — Sacabollos Aguila Blanca

## What This Is

Web app propia para gestionar el taller de reparación de bollos (PDR - paintless dent repair) Aguila Blanca, reemplazando el proceso que hoy es 100% en papel. Cubre todo el circuito de un caso — desde el ingreso del auto (por seguro o particular) hasta el cobro — con fichas digitales, turnos, seguimiento de repuestos y facturación. Uso multiusuario: dueño, recepción y taller.

## Core Value

Que ningún auto, ficha, presupuesto o pago se pierda o se demore por depender de papel: todo el circuito (ingreso → reparación → cobro) queda registrado y visible en un solo lugar para dueño, recepción y taller.

## Business Context

- **Customer**: Uso interno del taller Aguila Blanca (dueño, recepción, taller); los clientes finales del taller son propietarios de autos (particulares) y compañías de seguro
- **Revenue model**: N/A directo (herramienta interna), pero impacta el cobro real del taller — reparaciones facturadas a particulares y a compañías de seguro
- **Success metric**: Reducción de casos "perdidos" en papel — fichas sin seguimiento, presupuestos sin respuesta, pagos no reclamados a tiempo
- **Strategy notes**: —

## Requirements

### Validated

(None yet — ship to validate)

### Active

- [ ] Gestión de casos por dos ramas: Seguro y Particular, desde el ingreso del auto
- [ ] 3 fichas digitales: inspección pre-ingreso, inspección de ingreso, ficha de trabajo/reparación — cada una con fotos y bosquejo/figura del auto marcando daños
- [ ] Rama Seguro: registro de denuncia, número de siniestro, datos del productor/asesor, envío de presupuesto + fotos a la compañía, registro de la orden de trabajo que envía la compañía
- [ ] Rama Particular: presupuesto y fotos → confirmación → turno, o registro de "no" con modalidad de contacto para seguimiento futuro
- [ ] Coordinación de turno con el cliente e ingreso del auto al taller (ficha de ingreso con fotos y orden de ingreso)
- [ ] Seguimiento de reparación con estado de repuestos faltantes (ej. falta repuesto → coordinar colocación → reparación continúa)
- [ ] Firma de orden de trabajo con fotos al finalizar la reparación
- [ ] Facturación: registrar monto facturado formalmente vs. total cobrado real (dos números, sin detalle línea por línea); reclamo a la compañía si no paga
- [ ] "Semáforo de estado" visual por caso, para ver de un vistazo en qué etapa está cada auto
- [ ] CRM básico: clientes particulares, compañías de seguro y productores/asesores, historial de casos por cliente/aseguradora
- [ ] Control de stock simple: listado de materiales y repuestos (sin lógica de compras/proveedores en v1)
- [ ] 3 roles con permisos diferenciados: dueño (ve todo, incluida facturación), recepción (ingreso, fichas, turnos, CRM), taller (reparación, repuestos, fotos)
- [ ] Uso cómodo desde tablet (carga en el taller) y desde PC/notebook (oficina)

### Out of Scope

- Bot de atención/chat automático (WhatsApp) — depende de un servidor propio para Sacabollos, separado de la infraestructura de Lemmon Internet; se evalúa como milestone futuro una vez exista ese servidor
- Presencia web pública / sitio institucional para Aguila Blanca — no es parte del sistema de gestión interno
- Facturación electrónica / integración AFIP — no mencionado como necesidad actual; se evalúa más adelante si hace falta
- Gestión de compras/proveedores de repuestos — v1 solo necesita saber si el repuesto llegó o no, no todo el ciclo de compra

## Context

- Hoy el negocio funciona 100% en papel: agenda física y fichas sueltas escritas a mano
- El dueño (Pablo) también gestiona Lemmon Internet (ISP) y ya tiene experiencia con sistemas propios a medida: un sistema de turnos de técnicos hecho en Apps Script, y un bot de WhatsApp con n8n + Chatwoot en producción para Lemmon
- Decisión explícita del dueño: la infraestructura de Sacabollos debe estar completamente separada de la de Lemmon Internet — nueva base de datos (ej. Supabase u otra), nuevo hosting, nada compartido con el VPS/Tailscale de Lemmon
- Aseguradoras con las que ya trabajan (mencionadas explícitamente): San Cristóbal, Federación Patronal, Mercantil Andes, Triunfo, Sancor, Cooperativa de Seguros
- El flujo completo fue relevado a partir de 7 fotos de anotaciones a mano del dueño (carpeta `Desktop\saca bollos`), ya transcriptas e incorporadas a los requisitos de este documento
- El proceso se pensó desde el inicio para usarse en tablet en el taller (carga de fotos, datos del caso, estado del proceso)

## Constraints

- **Infraestructura**: Debe ser 100% independiente de la infraestructura de Lemmon Internet (servidor, base de datos, dominio) — por decisión explícita del dueño, no por límite técnico
- **Dispositivos**: Debe funcionar bien tanto en tablet (uso en el taller) como en PC/notebook (oficina/recepción)
- **Datos sensibles**: El diferencial "facturado vs. cobrado" debe ser visible solo para el rol dueño

## Key Decisions

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| Infraestructura y base de datos nuevas, separadas de Lemmon Internet (ej. Supabase) | El dueño no quiere mezclar los dos negocios en el mismo servidor/DB | — Pending |
| Web app multiusuario (no una planilla/Apps Script liviano) | Necesita roles reales y uso simultáneo de dueño, recepción y taller | — Pending |
| CRM básico entra en v1; bot de chat queda para un milestone futuro | El bot requiere un servidor propio para Sacabollos que todavía no existe | — Pending |
| Facturación solo diferencia formal vs. total cobrado, sin detalle línea por línea | Así lo pidió el dueño explícitamente | — Pending |

## Evolution

This document evolves at phase transitions and milestone boundaries.

**After each phase transition** (via `/gsd-transition`):
1. Requirements invalidated? → Move to Out of Scope with reason
2. Requirements validated? → Move to Validated with phase reference
3. New requirements emerged? → Add to Active
4. Decisions to log? → Add to Key Decisions
5. "What This Is" still accurate? → Update if drifted

**After each milestone** (via `/gsd-complete-milestone`):
1. Full review of all sections
2. Core Value check — still the right priority?
3. Audit Out of Scope — reasons still valid?
4. Update Context with current state

---
*Last updated: 2026-08-19 after initialization*
