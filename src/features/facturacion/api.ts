import { supabase } from '../../lib/supabaseClient'
import type { Caso } from '../casos/types'
import type { CasoFacturacion, ResumenFacturacionItem, SaveFacturacionPayload } from './types'

export async function getFacturacion(casoId: string): Promise<CasoFacturacion | null> {
  const { data, error } = await supabase
    .from('caso_facturacion')
    .select('*')
    .eq('caso_id', casoId)
    .maybeSingle()

  if (error) throw error
  return data as CasoFacturacion | null
}

export async function saveFacturacion(
  casoId: string,
  payload: SaveFacturacionPayload
): Promise<CasoFacturacion> {
  if (payload.monto_facturado < 0) {
    throw new Error('El monto facturado no puede ser negativo')
  }
  if ((payload.monto_cobrado ?? 0) < 0) {
    throw new Error('El monto cobrado no puede ser negativo')
  }
  if (!payload.numero_factura || !payload.numero_factura.trim()) {
    throw new Error('El número de factura es obligatorio')
  }

  const row = {
    caso_id: casoId,
    monto_facturado: Number(payload.monto_facturado),
    monto_cobrado: Number(payload.monto_cobrado ?? 0),
    numero_factura: payload.numero_factura.trim(),
    fecha_factura: payload.fecha_factura || new Date().toISOString().split('T')[0],
    fecha_cobro: payload.fecha_cobro || null,
    metodo_pago: payload.metodo_pago || null,
    notas_cobranza: payload.notas_cobranza?.trim() || null,
  }

  const { data, error } = await supabase
    .from('caso_facturacion')
    .upsert(row)
    .select('*')
    .single()

  if (error) throw error
  return data as CasoFacturacion
}

export async function marcarComoFacturado(
  casoId: string,
  payload: SaveFacturacionPayload
): Promise<Caso> {
  if (payload.monto_facturado <= 0) {
    throw new Error('Para facturar, el monto facturado debe ser mayor a 0')
  }
  if (!payload.numero_factura || !payload.numero_factura.trim()) {
    throw new Error('Para facturar, el número de factura no puede estar vacío')
  }

  // Operación atómica obligatoria vía RPC transaccional (sin fallback no atómico)
  const { data, error } = await supabase.rpc('facturar_caso_atomic', {
    p_caso_id: casoId,
    p_monto_facturado: Number(payload.monto_facturado),
    p_numero_factura: payload.numero_factura.trim(),
    p_fecha_factura: payload.fecha_factura || new Date().toISOString().split('T')[0],
    p_notas_cobranza: payload.notas_cobranza?.trim() || null,
  })

  if (error) {
    throw error
  }
  if (!data) {
    throw new Error('No se recibió la respuesta del caso al facturar')
  }
  return data as Caso
}

export async function marcarComoCobrado(
  casoId: string,
  payload: SaveFacturacionPayload
): Promise<Caso> {
  if (!payload.monto_cobrado || payload.monto_cobrado <= 0) {
    throw new Error('Para marcar como cobrado, el monto cobrado debe ser mayor a 0')
  }
  if (!payload.fecha_cobro) {
    throw new Error('Para marcar como cobrado, debe indicar la fecha de cobro')
  }

  // Operación atómica obligatoria vía RPC transaccional (sin fallback no atómico)
  const { data, error } = await supabase.rpc('cobrar_caso_atomic', {
    p_caso_id: casoId,
    p_monto_cobrado: Number(payload.monto_cobrado),
    p_fecha_cobro: payload.fecha_cobro,
    p_metodo_pago: payload.metodo_pago || 'otro',
    p_notas_cobranza: payload.notas_cobranza?.trim() || null,
  })

  if (error) {
    throw error
  }
  if (!data) {
    throw new Error('No se recibió la respuesta del caso al cobrar')
  }
  return data as Caso
}

export async function iniciarReclamoAseguradora(
  casoId: string,
  motivoReclamo: string
): Promise<Caso> {
  if (!motivoReclamo || !motivoReclamo.trim()) {
    throw new Error('Debe especificar un motivo para el reclamo a la aseguradora')
  }

  const { data, error } = await supabase
    .from('casos')
    .update({
      estado: 'reclamo a la compañía',
      motivo_reclamo: motivoReclamo.trim(),
    })
    .eq('id', casoId)
    .select('*')
    .single()

  if (error) throw error
  return data as Caso
}

export async function resolverReclamo(casoId: string): Promise<Caso> {
  const { data, error } = await supabase
    .from('casos')
    .update({
      estado: 'facturado',
    })
    .eq('id', casoId)
    .select('*')
    .single()

  if (error) throw error
  return data as Caso
}

export async function getResumenFacturacion(): Promise<ResumenFacturacionItem[]> {
  const { data: casosData, error: casosError } = await supabase
    .from('casos')
    .select('id, patente, marca, modelo, cliente_nombre, canal, aseguradora, estado, motivo_reclamo')
    .in('estado', ['firmado', 'facturado', 'reclamo a la compañía', 'cobrado'])
    .order('created_at', { ascending: false })

  if (casosError) throw casosError
  if (!casosData || casosData.length === 0) return []

  const casoIds = casosData.map((c: any) => c.id)
  const { data: factData, error: factError } = await supabase
    .from('caso_facturacion')
    .select('*')
    .in('caso_id', casoIds)

  if (factError) throw factError

  const factMap = new Map<string, CasoFacturacion>()
  for (const f of (factData || []) as CasoFacturacion[]) {
    factMap.set(f.caso_id, f)
  }

  return casosData.map((c: any) => {
    const f = factMap.get(c.id)
    const montoFacturado = Number(f?.monto_facturado ?? 0)
    const montoCobrado = Number(f?.monto_cobrado ?? 0)
    const vehiculo = [c.marca, c.modelo].filter(Boolean).join(' ') || 'Vehículo'

    return {
      caso_id: c.id,
      patente: c.patente,
      vehiculo,
      cliente_nombre: c.cliente_nombre,
      canal: c.canal,
      aseguradora: c.aseguradora,
      estado: c.estado,
      monto_facturado: montoFacturado,
      monto_cobrado: montoCobrado,
      diferencial: montoFacturado - montoCobrado,
      numero_factura: f?.numero_factura ?? '',
      fecha_factura: f?.fecha_factura ?? '',
      fecha_cobro: f?.fecha_cobro ?? null,
      motivo_reclamo: c.motivo_reclamo ?? null,
    }
  })
}
