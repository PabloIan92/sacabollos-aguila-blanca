# Transcripción de los flujos a mano (dueño, enero 2026)

Transcripción de las 7 fotos de anotaciones a mano que dieron origen a este proyecto. Fotos originales en esta misma carpeta.

## Flujo general — "Sistema de gestión c/IA, Sacabollos Aguila Blanca"

- Ingreso del auto → Asesoramiento → dos ramas: **SEGURO** o **PARTICULAR**
- Rama SEGURO: Denuncia (sí) → Inspección del auto y presupuesto + fotos → Enviar a Cía de seguro por mail → Compañía de seguro envía orden de trabajo → (continúa en flujo de taller)
- Rama PARTICULAR: Presupuesto y fotos → Sí → Turno / No → ver modalidad de contacto
- Módulos aparte: CRM, Stock (solo listado de materiales y cosas), Facturación (con una "parte en negro" a controlar aparte de la factura formal — se resolvió: solo diferenciar formal vs. total cobrado), bot de chat/atención (futuro)

## Flujo de taller (continuación, tras recibir la orden de trabajo de la aseguradora)

- Coordinación de turno con cliente → Ingreso del auto al taller (fotos y orden de ingreso = Ficha 1) → Reparación del auto (repuesto)
  - Si falta repuesto (faro, baliza, etc.) → esperar que llegue el repuesto → Coordinar colocación → vuelve a reparación
- Firma de orden de trabajo con fotos → Enviar factura y orden de trabajo firmada → Controlar pagos (vía facturación)
  - Si no pagan → Reclamo a la compañía
  - Si pagan → Pagado (FIN)

## Fichas (3 tipos)

1. **Ficha de inspección** (antes de ingresar el auto): datos del auto, datos de la persona, seguro, número de siniestro, guiar a la persona a realizar la denuncia, fotos a full, bosquejo del auto, datos del productor/asesor de seguro
2. **Ficha de inspección de ingreso**: muy similar a la ficha 1, se llena al momento de ingreso real del auto al taller
3. **Ficha de trabajo de reparación**: figura del auto y daños que tiene, patente, auto

## Notas sueltas (agenda día por día)

- Al ingreso: anotar ingreso por compañía de seguro — patente, seguro, teléfono, contacto, color, fotos
- Se planteó dominio y hosting gratuitos, ver con la persona que hizo una web anterior, usuario/contraseña de Instagram
- El proceso se pensó para tablet: ingreso del vehículo de seguro, datos del caso, "semáforo de estado", fotos de todo el proceso
- Proceso administrativo con aseguradoras: mail a la compañía, ver figura del auto, ver si falta repuesto, fecha de denuncia del siniestro, ver stock, facturación
- Aseguradoras con las que ya trabajan: San Cristóbal, Federación Patronal, Mercantil Andes, Triunfo, Sancor, Cooperativa de Seguros
- Mail interno se deriva a "Administración" o a "Ventas" según el caso

Este contenido ya está incorporado a `.planning/PROJECT.md`. Este archivo queda como respaldo de la fuente original.
