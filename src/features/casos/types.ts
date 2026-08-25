export const ESTADOS_CASO = [
  'borrador',
  'enviado a la aseguradora',
  'aprobado',
  'turno coordinado',
  'ingresado',
  'esperando repuesto',
  'en reparación',
  'listo para firma',
  'firmado',
  'facturado',
  'cobrado',
  'reclamo a la compañía',
  'cancelado',
] as const

export type CasoEstado = (typeof ESTADOS_CASO)[number]

export const ZONAS_DANO = [
  'paragolpes delantero',
  'paragolpes trasero',
  'capot',
  'techo',
  'puerta delantera izquierda',
  'puerta trasera izquierda',
  'puerta delantera derecha',
  'puerta trasera derecha',
  'guardabarros',
  'baul',
] as const

export type ZonaDano = (typeof ZONAS_DANO)[number]

export const ANGULOS_FOTO = ['frente', 'atras', 'lateral-izquierdo', 'lateral-derecho'] as const

export type AnguloFoto = (typeof ANGULOS_FOTO)[number]

export interface Caso {
  id: string
  canal: 'seguro'
  patente: string
  marca: string | null
  modelo: string | null
  color: string | null
  cliente_nombre: string
  cliente_telefono: string
  aseguradora: string
  numero_siniestro: string
  denuncia: string
  productor_nombre: string | null
  productor_telefono: string | null
  danos_zonas: ZonaDano[]
  turno_fecha: string | null
  orden_ingreso_numero: string | null
  ingresado_at: string | null
  estado: CasoEstado
  created_at: string
  updated_at: string
  estado_changed_at: string
  created_by: string
}
