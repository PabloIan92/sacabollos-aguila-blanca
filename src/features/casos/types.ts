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

export const RESPUESTAS_PRESUPUESTO = ['pendiente', 'aceptado', 'rechazado'] as const
export type RespuestaPresupuesto = (typeof RESPUESTAS_PRESUPUESTO)[number]

export const MODALIDADES_CONTACTO = ['whatsapp', 'telefono', 'email', 'presencial'] as const
export type ModalidadContacto = (typeof MODALIDADES_CONTACTO)[number]

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

export const FINAL_PHOTO_ANGLES = [
  'final-frente',
  'final-atras',
  'final-lateral-izquierdo',
  'final-lateral-derecho',
] as const

export const SIGNED_ORDER_ANGLES = ['orden-firmada'] as const

export interface Caso {
  id: string
  canal: 'seguro' | 'particular'
  patente: string
  marca: string | null
  modelo: string | null
  color: string | null
  cliente_nombre: string
  cliente_telefono: string
  aseguradora: string | null
  numero_siniestro: string | null
  denuncia: string | null
  productor_nombre: string | null
  productor_telefono: string | null
  presupuesto_monto: number | null
  presupuesto_respuesta: RespuestaPresupuesto | null
  presupuesto_observaciones: string | null
  modalidad_contacto: ModalidadContacto | null
  seguimiento_observaciones: string | null
  inspeccion_guardada_at: string | null
  danos_zonas: ZonaDano[]
  turno_fecha: string | null
  orden_ingreso_numero: string | null
  ingresado_at: string | null
  repuesto_pendiente: string | null
  reparacion_iniciada_at: string | null
  reparacion_lista_at: string | null
  firmado_at: string | null
  estado: CasoEstado
  created_at: string
  updated_at: string
  estado_changed_at: string
  created_by: string
}

type CasoGeneratedField =
  | 'id'
  | 'estado'
  | 'created_at'
  | 'updated_at'
  | 'estado_changed_at'
  | 'repuesto_pendiente'
  | 'reparacion_iniciada_at'
  | 'reparacion_lista_at'
  | 'firmado_at'

type CasoChannelField =
  | 'canal'
  | 'aseguradora'
  | 'numero_siniestro'
  | 'denuncia'
  | 'productor_nombre'
  | 'productor_telefono'
  | 'presupuesto_monto'
  | 'presupuesto_respuesta'
  | 'presupuesto_observaciones'
  | 'modalidad_contacto'
  | 'seguimiento_observaciones'
  | 'inspeccion_guardada_at'

type CasoCreateBase = Omit<Caso, CasoGeneratedField | CasoChannelField>

export type CreateCasoInput =
  | (CasoCreateBase & {
      canal: 'seguro'
      aseguradora: string
      numero_siniestro: string
      denuncia: string
      productor_nombre: string | null
      productor_telefono: string | null
      presupuesto_monto?: null
      presupuesto_respuesta?: null
      presupuesto_observaciones?: null
      modalidad_contacto?: null
      seguimiento_observaciones?: null
      inspeccion_guardada_at?: string | null
    })
  | (CasoCreateBase & {
      canal: 'particular'
      aseguradora: null
      numero_siniestro: null
      denuncia: null
      productor_nombre: null
      productor_telefono: null
      presupuesto_monto: number
      presupuesto_respuesta: 'pendiente'
      presupuesto_observaciones?: string | null
      modalidad_contacto: null
      seguimiento_observaciones?: null
      inspeccion_guardada_at?: string | null
    })

export interface ReparacionDano {
  id: string
  caso_id: string
  zona: string
  x: number
  y: number
  descripcion: string | null
  reparado: boolean
  origen_inspeccion: boolean
  created_at: string
  updated_at: string
}

export interface CreateReparacionDanoInput {
  zona: string
  x: number
  y: number
  descripcion: string | null
}

export type UpdateReparacionDanoInput = Partial<
  Pick<ReparacionDano, 'zona' | 'x' | 'y' | 'descripcion' | 'reparado'>
>
