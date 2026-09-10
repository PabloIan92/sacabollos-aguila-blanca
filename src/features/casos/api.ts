import { supabase } from '../../lib/supabaseClient'
import type {
  Caso,
  CreateCasoInput,
  CreateReparacionDanoInput,
  ModalidadContacto,
  ReparacionDano,
  UpdateReparacionDanoInput,
  ZonaDano,
} from './types'

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

export async function startRepair(id: string) {
  const { data, error } = await supabase.rpc('iniciar_reparacion', { p_caso_id: id })
  if (error) throw error
  return (Array.isArray(data) ? data[0] : data) as Caso
}

export async function listRepairDamages(casoId: string) {
  const { data, error } = await supabase
    .from('reparacion_danos')
    .select('*')
    .eq('caso_id', casoId)
    .order('created_at', { ascending: true })
  if (error) throw error
  return data as ReparacionDano[]
}

export async function createRepairDamage(casoId: string, input: CreateReparacionDanoInput) {
  const { data, error } = await supabase
    .from('reparacion_danos')
    .insert({ ...input, caso_id: casoId, reparado: false, origen_inspeccion: false })
    .select()
    .single()
  if (error) throw error
  return data as ReparacionDano
}

export async function updateRepairDamage(id: string, patch: UpdateReparacionDanoInput) {
  const { data, error } = await supabase
    .from('reparacion_danos')
    .update(patch)
    .eq('id', id)
    .select()
    .single()
  if (error) throw error
  return data as ReparacionDano
}

export async function deleteRepairDamage(id: string) {
  const { error } = await supabase.from('reparacion_danos').delete().eq('id', id)
  if (error) throw error
}

export async function waitForPart(id: string, part: string) {
  const repuestoPendiente = part.trim()
  if (!repuestoPendiente) throw new Error('El repuesto es obligatorio')
  return updateCaso(id, { estado: 'esperando repuesto', repuesto_pendiente: repuestoPendiente })
}

export function resumeRepair(id: string) {
  return updateCaso(id, { estado: 'en reparación', repuesto_pendiente: null })
}

export function markReadyForSignature(id: string) {
  return updateCaso(id, { estado: 'listo para firma' })
}

export function markSigned(id: string) {
  return updateCaso(id, { estado: 'firmado' })
}
