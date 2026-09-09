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

export const CANALES_CASO = ['seguro', 'particular'] as const

export type CasoCanal = (typeof CANALES_CASO)[number]

export const RESPUESTAS_PARTICULAR = ['pendiente', 'aceptado', 'rechazado'] as const

export type RespuestaParticular = (typeof RESPUESTAS_PARTICULAR)[number]

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

interface CasoBase {
  id: string
  patente: string
  marca: string | null
  modelo: string | null
  color: string | null
  cliente_nombre: string
  cliente_telefono: string
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

export interface CasoSeguro extends CasoBase {
  canal: 'seguro'
  aseguradora: string
  numero_siniestro: string
  denuncia: string
  productor_nombre: string | null
  productor_telefono: string | null
  presupuesto_monto?: null
  presupuesto_observaciones?: null
  respuesta_particular?: null
  modalidad_contacto?: null
  seguimiento_observaciones?: null
  inspeccion_guardada_at?: string | null
}

export interface CasoParticular extends CasoBase {
  canal: 'particular'
  aseguradora: null
  numero_siniestro: null
  denuncia: null
  productor_nombre: null
  productor_telefono: null
  presupuesto_monto: number
  presupuesto_observaciones: string | null
  respuesta_particular: RespuestaParticular
  modalidad_contacto: ModalidadContacto | null
  seguimiento_observaciones: string | null
  inspeccion_guardada_at: string | null
}

export type Caso = CasoSeguro | CasoParticular

type CasoCreacionBase = Omit<
  CasoBase,
  'id' | 'estado' | 'created_at' | 'updated_at' | 'estado_changed_at'
>

export type CrearCasoInput =
  | (CasoCreacionBase &
      Pick<
        CasoSeguro,
        | 'canal'
        | 'aseguradora'
        | 'numero_siniestro'
        | 'denuncia'
        | 'productor_nombre'
        | 'productor_telefono'
      >)
  | (CasoCreacionBase &
      Pick<CasoParticular, 'canal' | 'presupuesto_monto' | 'presupuesto_observaciones'>)

export interface RechazarCasoParticularInput {
  modalidad_contacto: ModalidadContacto
  seguimiento_observaciones?: string | null
}
