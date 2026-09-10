import type { Profile } from '../../auth/AuthProvider'

export interface Colaborador {
  id: string
  full_name: string
  role: Profile['role']
  email?: string | null
  created_at?: string
}

export interface InvitarColaboradorPayload {
  full_name: string
  email: string
  role: 'recepcion' | 'taller'
}
