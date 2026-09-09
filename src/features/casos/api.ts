import { supabase } from '../../lib/supabaseClient'
import type {
  Caso,
  CasoEstado,
  CrearCasoInput,
  RechazarCasoParticularInput,
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

export async function createCaso(datos: CrearCasoInput) {
  const insertData =
    datos.canal === 'particular'
      ? { ...datos, respuesta_particular: 'pendiente' as const }
      : datos
  const { data, error } = await supabase
    .from('casos')
    .insert<typeof insertData>(insertData)
    .select()
    .single()
  if (error) throw error
  return data as Caso
}

async function updateCaso(id: string, cambios: Record<string, unknown>) {
  const { data, error } = await supabase
    .from('casos')
    .update(cambios)
    .eq('id', id)
    .select()
    .single()
  if (error) throw error
  return data as Caso
}

export function guardarInspeccion(id: string, danosZonas: ZonaDano[]) {
  return updateCaso(id, {
    danos_zonas: danosZonas,
    inspeccion_guardada_at: new Date().toISOString(),
  })
}

export function aceptarCasoParticular(id: string) {
  return updateCaso(id, {
    respuesta_particular: 'aceptado',
    estado: 'aprobado',
  })
}

export function rechazarCasoParticular(id: string, datos: RechazarCasoParticularInput) {
  return updateCaso(id, {
    respuesta_particular: 'rechazado',
    modalidad_contacto: datos.modalidad_contacto,
    seguimiento_observaciones: datos.seguimiento_observaciones ?? null,
    estado: 'cancelado',
  })
}

export function coordinarTurno(id: string, turnoFecha: string) {
  return updateCaso(id, {
    turno_fecha: turnoFecha,
    estado: 'turno coordinado',
  })
}

// Compatibilidad temporal para los flujos que se migrarán en las tareas siguientes.
export function updateCasoEstado(id: string, estado: CasoEstado, extra?: Partial<Caso>) {
  return updateCaso(id, { ...extra, estado })
}
