import { createContext, useEffect, useState, type ReactNode } from 'react'
import type { Session } from '@supabase/supabase-js'
import { supabase } from '../lib/supabaseClient'

export type Profile = {
  id: string
  full_name: string
  role: 'dueno' | 'recepcion' | 'taller'
}

export type AuthContextValue = {
  session: Session | null
  profile: Profile | null
  loading: boolean
}

export const AuthContext = createContext<AuthContextValue | undefined>(undefined)

async function loadProfile(userId: string): Promise<Profile | null> {
  const { data } = await supabase
    .from('profiles')
    .select('id, full_name, role')
    .eq('id', userId)
    .single()

  return data as Profile | null
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null)
  const [profile, setProfile] = useState<Profile | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let active = true

    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (!active) return
      setSession(session)
      setProfile(session ? await loadProfile(session.user.id) : null)
      setLoading(false)
    })

    const { data: subscription } = supabase.auth.onAuthStateChange(async (_event, session) => {
      if (!active) return
      setSession(session)
      setProfile(session ? await loadProfile(session.user.id) : null)
      setLoading(false)
    })

    return () => {
      active = false
      subscription.subscription.unsubscribe()
    }
  }, [])

  return (
    <AuthContext.Provider value={{ session, profile, loading }}>
      {children}
    </AuthContext.Provider>
  )
}
