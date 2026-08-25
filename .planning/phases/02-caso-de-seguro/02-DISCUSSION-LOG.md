# Phase 2: Caso de Seguro - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-08-25
**Phase:** 2-Caso de Seguro
**Areas discussed:** Envio a aseguradora, Fotos minimas, Bosquejo de daños, Aseguradora/productor

---

## Envio de denuncia/presupuesto a la aseguradora

| Option | Description | Selected |
|--------|-------------|----------|
| Manual | Recepción manda el mail desde su propio correo, el sistema solo marca "enviado a la aseguradora" | ✓ |
| Automatizado desde ahora | El sistema compone y envia el mail directamente, requiere elegir proveedor de mail y disenar formato | |

**User's choice:** Manual
**Notes:** Coherente con que las plantillas de mail por aseguradora (PLANTILLAS-01) estan diferidas a v2.

---

## Fotos minimas por ficha

| Option | Description | Selected |
|--------|-------------|----------|
| 4 fotos | Las 4 caras del auto (frente, atras, lateral izq, lateral der) | ✓ |
| 1 foto | Solo una general obligatoria, resto opcionales | |
| Otro/depende de la ficha | Numero distinto o minimo particular por ficha | |

**User's choice:** 4 fotos

---

## Bosquejo de daños

| Option | Description | Selected |
|--------|-------------|----------|
| SVG interactivo | Dibujo del auto tocable, se marca el punto de daño sobre el dibujo | |
| Checkboxes por zona | Lista fija de zonas del auto (paragolpes, capot, puertas, etc.) sin dibujo | ✓ |

**User's choice:** Checkboxes por zona (mas simple/rapido de construir)

---

## Aseguradora y productor/asesor

| Option | Description | Selected |
|--------|-------------|----------|
| Aseguradora dropdown fijo + Productor texto libre | 6 companias conocidas en dropdown, productor sin tabla propia hasta Fase 6 | ✓ |
| Ambos texto libre | Sin restriccion en ninguno de los dos | |

**User's choice:** Aseguradora dropdown fijo + Productor texto libre

---

## Claude's Discretion

- Nombres exactos de columnas/tablas de la tabla `casos`
- Uso de Supabase Realtime vs. refetch simple para el semaforo "sin recargar" (CASOS-04)
- Estructura de Supabase Storage para las fotos, libreria de upload

## Deferred Ideas

- Envio automatico de mail con plantilla por aseguradora — PLANTILLAS-01, v2
- Tabla `aseguradoras` con CRUD e historial — CRM-02, Fase 6
- Tabla `productores` con CRUD propio — CRM-03, Fase 6
- Bosquejo interactivo tipo SVG clickeable — considerado y descartado para esta fase a favor de checkboxes por zona; se puede agregar mas adelante como mejora de UI sin cambiar el modelo de datos
