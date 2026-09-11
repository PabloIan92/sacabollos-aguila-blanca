export type TipoTemplate = 'inicio_tramite' | 'presupuesto' | 'reclamo' | 'cierre'

export interface TemplateVars {
  aseguradora_nombre: string
  aseguradora_email: string
  aseguradora_contacto: string
  patente: string
  marca_modelo: string
  color: string
  cliente_nombre: string
  cliente_telefono: string
  numero_siniestro: string
  productor_nombre: string
  presupuesto_monto: string  // formateado
  fecha_hoy: string          // dd/mm/yyyy
  taller_nombre: string      // 'Aguila Blanca'
}

export interface EmailGenerado {
  asunto: string
  cuerpo: string
  destinatario: string
}
