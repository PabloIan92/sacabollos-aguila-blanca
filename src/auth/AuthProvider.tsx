import { useCallback, useEffect, useState, type ReactNode } from 'react'
import type { Session } from '@supabase/supabase-js'
import { supabase } from '../lib/supabaseClient'
import { AuthContext } from './authContext'

// Re-export types and context so existing imports keep working without changes.
export type { Profile, AuthContextValue } from './authContext'
export { AuthContext } from './authContext'

async function loadProfile(userId: string) {
  const { data } = await supabase
    .from('profiles')
    .select('id, full_name, role')
    .eq('id', userId)
    .single()

  return data as import('./authContext').Profile | null
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null)
  const [profile, setProfile] = useState<import('./authContext').Profile | null>(null)
  const [loading, setLoading] = useState(true)
  const [profileError, setProfileError] = useState(false)

  const resolveProfile = useCallback(async (currentSession: Session | null) => {
    if (!currentSession) {
      setProfile(null)
      setProfileError(false)
      return
    }

    const loadedProfile = await loadProfile(currentSession.user.id)
    if (loadedProfile) {
      setProfile(loadedProfile)
      setProfileError(false)
    } else {
      setProfile(null)
      setProfileError(true)
    }
  }, [])

  useEffect(() => {
    let active = true

    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (!active) return
      setSession(session)
      await resolveProfile(session)
      setLoading(false)
    })

    const { data: subscription } = supabase.auth.onAuthStateChange(async (_event, session) => {
      if (!active) return
      setSession(session)
      await resolveProfile(session)
      setLoading(false)
    })

    return () => {
      active = false
      subscription.subscription.unsubscribe()
    }
  }, [resolveProfile])

  const retryProfile = useCallback(() => {
    resolveProfile(session)
  }, [resolveProfile, session])

  return (
    <AuthContext.Provider value={{ session, profile, loading, profileError, retryProfile }}>
      {children}
    </AuthContext.Provider>
  )
}
