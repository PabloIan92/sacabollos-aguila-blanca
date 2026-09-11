export type NotifKind = 'estado_cambio' | 'repuesto_llegado' | 'reclamo' | 'cobrado'

export interface Notificacion {
  id: string
  casoId: string
  patente: string
  mensaje: string
  kind: NotifKind
  leida: boolean
  createdAt: Date
}
