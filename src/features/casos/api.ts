import { supabase } from '../../lib/supabaseClient'
import type { Caso, CasoEstado } from './types'

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

export async function createCaso(
  datos: Omit<Caso, 'id' | 'estado' | 'created_at' | 'updated_at' | 'estado_changed_at'>
) {
  const { data, error } = await supabase.from('casos').insert(datos).select().single()
  if (error) throw error
  return data as Caso
}

export async function updateCasoEstado(id: string, estado: CasoEstado, extra?: Partial<Caso>) {
  const { data, error } = await supabase
    .from('casos')
    .update({ ...extra, estado })
    .eq('id', id)
    .select()
    .single()
  if (error) throw error
  return data as Caso
}
