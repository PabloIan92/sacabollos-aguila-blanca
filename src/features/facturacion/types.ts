export type MetodoPago =
  | 'transferencia'
  | 'efectivo'
  | 'cheque'
  | 'tarjeta_debito'
  | 'tarjeta_credito'
  | 'otro'

export interface CasoFacturacion {
  caso_id: string
  monto_facturado: number
  monto_cobrado: number
  numero_factura: string
  fecha_factura: string
  fecha_cobro: string | null
  metodo_pago: MetodoPago | null
  notas_cobranza: string | null
  created_at: string
  updated_at: string
}

export interface SaveFacturacionPayload {
  monto_facturado: number
  monto_cobrado?: number
  numero_factura: string
  fecha_factura?: string
  fecha_cobro?: string | null
  metodo_pago?: MetodoPago | null
  notas_cobranza?: string | null
}

export interface ResumenFacturacionItem {
  caso_id: string
  patente: string
  vehiculo: string
  cliente_nombre: string
  canal: 'seguro' | 'particular'
  aseguradora: string | null
  estado: string
  monto_facturado: number
  monto_cobrado: number
  diferencial: number
  numero_factura: string
  fecha_factura: string
  fecha_cobro: string | null
  motivo_reclamo: string | null
}
