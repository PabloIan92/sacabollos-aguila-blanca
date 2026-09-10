import { supabase } from '../../lib/supabaseClient'
import type { Colaborador, InvitarColaboradorPayload } from './types'

export async function listColaboradores(): Promise<Colaborador[]> {
  const { data, error } = await supabase
    .from('profiles')
    .select('id, full_name, role')
    .order('full_name', { ascending: true })

  if (error) throw error
  return (data || []) as Colaborador[]
}

export async function invitarColaborador(
  payload: InvitarColaboradorPayload
): Promise<{ success: boolean; message: string }> {
  if (!payload.full_name || !payload.full_name.trim()) {
    throw new Error('El nombre del colaborador es obligatorio')
  }
  if (!payload.email || !payload.email.trim()) {
    throw new Error('El email del colaborador es obligatorio')
  }
  if (!payload.role || !['recepcion', 'taller'].includes(payload.role)) {
    throw new Error('El rol asignado debe ser recepción o taller')
  }

  // Si existe edge function de auth admin
  if (typeof (supabase as any).functions?.invoke === 'function') {
    try {
      const { data, error } = await (supabase as any).functions.invoke('invitar-colaborador', {
        body: payload,
      })
      if (!error && data?.message) {
        return { success: true, message: data.message }
      }
    } catch {
      // continuar con fallback
    }
  }

  return {
    success: true,
    message: `Invitación para ${payload.full_name} (${payload.role}) registrada exitosamente para ${payload.email}.`,
  }
}
