import type { TipoTemplate, TemplateVars, EmailGenerado } from './types'

export function generarEmail(tipo: TipoTemplate, vars: TemplateVars): EmailGenerado {
  let asunto = ''
  let cuerpo = ''

  switch (tipo) {
    case 'inicio_tramite':
      asunto = `Nuevo siniestro - Patente ${vars.patente} - ${vars.numero_siniestro}`
      cuerpo = `Estimados,

Nos dirigimos a ustedes para informarles sobre el ingreso de un nuevo siniestro.

Datos del vehículo:
Patente: ${vars.patente}
Marca y Modelo: ${vars.marca_modelo}
Color: ${vars.color}
Siniestro: ${vars.numero_siniestro}

Datos del cliente:
Nombre: ${vars.cliente_nombre}
Teléfono: ${vars.cliente_telefono}

Productor asignado: ${vars.productor_nombre}

Quedamos a la espera de sus instrucciones para avanzar.

Saludos cordiales,
${vars.taller_nombre}`
      break

    case 'presupuesto':
      asunto = `Presupuesto PDR - ${vars.patente} - Siniestro ${vars.numero_siniestro}`
      cuerpo = `Estimados,

Adjuntamos a este correo el presupuesto correspondiente a la reparación del vehículo patente ${vars.patente}.

El monto total presupuestado asciende a ${vars.presupuesto_monto}.

Siniestro: ${vars.numero_siniestro}
Vehículo: ${vars.marca_modelo}
Cliente: ${vars.cliente_nombre}

Aguardamos su pronta aprobación para dar inicio a los trabajos de reparación.

Saludos cordiales,
${vars.taller_nombre}`
      break

    case 'reclamo':
      asunto = `Reclamo pendiente de resolución - ${vars.patente} - Siniestro ${vars.numero_siniestro}`
      cuerpo = `Estimados,

Nos ponemos en contacto para solicitarles una actualización sobre el estado del siniestro ${vars.numero_siniestro}, correspondiente al vehículo patente ${vars.patente}.

Al día de la fecha (${vars.fecha_hoy}), nos encontramos a la espera de una resolución para poder continuar con la gestión del trámite.

Cliente: ${vars.cliente_nombre}
Productor: ${vars.productor_nombre}

Agradecemos nos informen a la brevedad posible.

Saludos cordiales,
${vars.taller_nombre}`
      break

    case 'cierre':
      asunto = `Cierre de expediente - ${vars.patente} - Siniestro ${vars.numero_siniestro}`
      cuerpo = `Estimados,

Por medio de la presente, confirmamos la finalización de los trabajos y el cierre del expediente correspondiente al siniestro ${vars.numero_siniestro}.

Vehículo: ${vars.marca_modelo} (Patente: ${vars.patente})
Cliente: ${vars.cliente_nombre}

Todos los trámites administrativos han sido concluidos exitosamente.

Agradecemos su colaboración y quedamos a entera disposición ante cualquier eventualidad.

Saludos cordiales,
${vars.taller_nombre}`
      break
  }

  return {
    asunto,
    cuerpo,
    destinatario: vars.aseguradora_email,
  }
}
