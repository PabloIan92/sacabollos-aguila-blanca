import { useEffect, useState } from 'react'
import { Outlet } from 'react-router'
import { useAuth } from '../auth/useAuth'
import { Topbar } from './Topbar'
import { Sidebar } from './Sidebar'
import { BottomTabBar } from './BottomTabBar'
import { FullScreenError } from '../ui/FullScreenError'
import { PrimaryButton } from '../ui/PrimaryButton'
import { supabase } from '../lib/supabaseClient'

const TABLET_QUERY = '(max-width: 820px)'

function useIsTabletOrBelow() {
  const [matches, setMatches] = useState(() => window.matchMedia(TABLET_QUERY).matches)

  useEffect(() => {
    const mediaQueryList = window.matchMedia(TABLET_QUERY)
    const listener = () => setMatches(mediaQueryList.matches)
    mediaQueryList.addEventListener('change', listener)
    return () => mediaQueryList.removeEventListener('change', listener)
  }, [])

  return matches
}

export function AppShell() {
  const { profile, loading, profileError, retryProfile } = useAuth()
  const isTabletOrBelow = useIsTabletOrBelow()

  if (loading) {
    return <div data-testid="shell-loading" />
  }

  if (profileError) {
    return (
      <FullScreenError
        title="No pudimos cargar tu perfil"
        body="Volvé a intentar o cerrá sesión y entrá de nuevo."
        actions={
          <>
            <PrimaryButton onClick={retryProfile}>Reintentar</PrimaryButton>
            <PrimaryButton onClick={() => supabase.auth.signOut()}>Cerrar sesión</PrimaryButton>
          </>
        }
      />
    )
  }

  if (!profile) {
    return null
  }

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <Topbar profile={profile} />
      <div style={{ flex: 1, display: 'flex' }}>
        {!isTabletOrBelow && <Sidebar role={profile.role} />}
        <main style={{ flex: 1 }}>
          <Outlet />
        </main>
      </div>
      {isTabletOrBelow && <BottomTabBar role={profile.role} />}
    </div>
  )
}
