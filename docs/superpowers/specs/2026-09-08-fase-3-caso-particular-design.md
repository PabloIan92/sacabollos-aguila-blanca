# Fase 3 — Caso Particular

**Fecha:** 2026-09-08  
**Estado:** aprobado por el usuario  
**Requisito principal:** `CASOS-03`

## Objetivo

Permitir que recepción cree y gestione casos particulares con presupuesto y cuatro fotos. Una aceptación reutiliza el circuito existente de turno e ingreso; un rechazo conserva cómo contactar al cliente y cierra el caso sin introducir un segundo flujo paralelo.

## Decisiones aprobadas

- El alta de casos será una sola pantalla con selector `Seguro` / `Particular`.
- Un particular exige monto de presupuesto mayor que cero y admite observaciones opcionales.
- La ficha de inspección y sus cuatro fotos se reutilizan para ambos canales.
- `aceptado` avanza al estado existente `aprobado`; desde allí usa turno e ingreso sin bifurcaciones.
- `rechazado` avanza a `cancelado` y exige modalidad de contacto.
- No se crea un estado `seguimiento`: el seguimiento queda como dato del rechazo y CRM lo podrá explotar en Fase 6.
- Las transiciones de estado se validan en PostgreSQL, no solamente en la interfaz.

## Modelo de datos

La migración `0004_casos_particulares.sql` amplía `public.casos`:

- `canal`: admite `seguro | particular`.
- Los campos exclusivos de seguro pasan a ser anulables, con un `check` condicional que los exige para `seguro` y los prohíbe para `particular`.
- `presupuesto_monto numeric(12,2)` positivo para particulares.
- `presupuesto_observaciones text` opcional.
- `respuesta_particular`: `pendiente | aceptado | rechazado`, solo para particulares.
- `modalidad_contacto`: `whatsapp | telefono | email | presencial`, obligatoria al rechazar.
- `seguimiento_observaciones text` opcional.
- `inspeccion_guardada_at timestamptz` registra que la ficha común fue guardada y permite retomar un borrador después de recargar.

Los datos financieros de Fase 5 no se agregan a `casos`: vivirán en una tabla separada con RLS exclusiva del dueño.

## Integridad y transiciones

Un trigger `before update` rechazará transiciones no permitidas para el rol y canal actuales. En esta fase se admiten:

- Seguro: `borrador → enviado a la aseguradora → aprobado → turno coordinado → ingresado`.
- Particular: `borrador → aprobado` cuando la respuesta es `aceptado`.
- Particular: `borrador → cancelado` cuando la respuesta es `rechazado` y hay modalidad de contacto.
- Ambos: `aprobado → turno coordinado → ingresado`, exigiendo los datos de cada etapa.

Las actualizaciones sin cambio de estado siguen permitiendo guardar la ficha. Las fases 4 y 5 ampliarán la misma validación para reparación, firma y cobro.

## Experiencia de usuario

### Alta

La pantalla muestra primero el canal. Los datos de cliente y vehículo son comunes. Seguro conserva aseguradora, siniestro, denuncia y productor. Particular muestra presupuesto y observaciones. Al crear, ambos navegan a la ficha de inspección.

### Ficha de inspección

La ficha conserva zonas dañadas y cuatro fotos obligatorias. Las fotos existentes se recuperan desde Storage al recargar.

- Seguro: después de guardar, ofrece “Marcar como enviado a la aseguradora”.
- Particular: después de guardar, ofrece “Cliente aceptó” y “Cliente no aceptó”. Para rechazar se selecciona la modalidad de contacto y se pueden agregar observaciones.

### Detalle y listado

El detalle muestra canal y campos correspondientes. Un particular aceptado usa el mismo selector de turno. El listado agrega el canal para distinguir casos sin duplicar pantallas.

## Errores y recuperación

Las pantallas dejan de quedar en “Cargando…” o “Guardando…” ante un error. Cada operación muestra un mensaje fijo en español, conserva los datos ingresados y rehabilita el control para reintentar.

## Seguridad

- RLS sigue limitando creación y operación administrativa a recepción y dueño.
- El trigger valida rol, canal, origen, destino y campos obligatorios incluso ante pedidos directos a PostgREST.
- Taller conserva lectura de casos activos y no obtiene permisos de escritura en esta fase.
- Ninguna clave privilegiada se usa en tests ni en el frontend.

## Verificación

- Tests de contratos y API para ambos canales.
- Tests de alta condicional, payload y recuperación de errores.
- Tests de fotos rehidratadas, guardado persistente, aceptación y rechazo.
- Tests del detalle/listado por canal y reutilización de turno.
- Tests SQL estáticos de constraints, trigger y políticas; verificación remota antes de aplicar producción.
- Suite completa, typecheck, build y lint.

## Fuera de alcance

- Agenda de seguimientos, historial de contactos y entidades CRM.
- Reparación, stock, firma y fotos finales.
- Facturación, cobros y reclamos.
- Invitación de usuarios.

