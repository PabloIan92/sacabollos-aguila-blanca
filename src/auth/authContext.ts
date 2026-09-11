import { createContext } from 'react'
import type { Session } from '@supabase/supabase-js'

export type Profile = {
  id: string
  full_name: string
  role: 'dueno' | 'recepcion' | 'taller'
}

export type AuthContextValue = {
  session: Session | null
  profile: Profile | null
  loading: boolean
  profileError: boolean
  retryProfile: () => void
}

export const AuthContext = createContext<AuthContextValue | undefined>(undefined)
