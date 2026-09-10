import { supabase } from '../../lib/supabaseClient'
import type { Caso, CreateCasoInput, ModalidadContacto, ZonaDano } from './types'

export async function listCasos() {
  const { data, error } = await supabase.from('casos').select('*')
  if (error) throw error
  return data as Caso[]
}

export async function getCaso(id: string) {
  const { data, error } = await supabase.from('casos').select('*').eq('id', id).single()
  if (error) throw error
  return data as Caso
}

export async function createCaso(datos: CreateCasoInput) {
  const payload: Record<string, unknown> = { ...datos }
  const { data, error } = await supabase.from('casos').insert(payload).select().single()
  if (error) throw error
  return data as Caso
}

async function updateCaso(id: string, changes: Partial<Caso>) {
  const { data, error } = await supabase
    .from('casos')
    .update(changes)
    .eq('id', id)
    .select()
    .single()
  if (error) throw error
  return data as Caso
}

export function saveCasoInspection(id: string, danosZonas: ZonaDano[]) {
  return updateCaso(id, {
    danos_zonas: danosZonas,
    inspeccion_guardada_at: new Date().toISOString(),
  })
}

export function markSeguroSent(id: string) {
  return updateCaso(id, { estado: 'enviado a la aseguradora' })
}

export function markSeguroApproved(id: string) {
  return updateCaso(id, { estado: 'aprobado' })
}

export function acceptParticular(id: string) {
  return updateCaso(id, {
    presupuesto_respuesta: 'aceptado',
    estado: 'aprobado',
  })
}

export function rejectParticular(
  id: string,
  modalidadContacto: ModalidadContacto,
  seguimientoObservaciones: string | null = null
) {
  return updateCaso(id, {
    presupuesto_respuesta: 'rechazado',
    modalidad_contacto: modalidadContacto,
    seguimiento_observaciones: seguimientoObservaciones,
    estado: 'cancelado',
  })
}

export function coordinateCasoTurno(id: string, turnoFecha: string) {
  return updateCaso(id, {
    turno_fecha: turnoFecha,
    estado: 'turno coordinado',
  })
}

export function registerCasoIngreso(
  id: string,
  ordenIngresoNumero: string,
  ingresadoAt: string
) {
  return updateCaso(id, {
    orden_ingreso_numero: ordenIngresoNumero,
    ingresado_at: ingresadoAt,
    estado: 'ingresado',
  })
}
