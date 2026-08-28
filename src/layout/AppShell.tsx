import { useEffect, useState } from 'react'
import { Outlet } from 'react-router'
import { useAuth } from '../auth/useAuth'
import { Topbar } from './Topbar'
import { Sidebar } from './Sidebar'
import { BottomTabBar } from './BottomTabBar'
import { FullScreenError } from '../ui/FullScreenError'
import { Button } from '../ui/PrimaryButton'
import { supabase } from '../lib/supabaseClient'

const TABLET_QUERY = '(max-width: 820px)'

function useIsTabletOrBelow() {
  const [matches, setMatches] = useState(() => {
    if (typeof window === 'undefined') return false
    return window.matchMedia(TABLET_QUERY).matches
  })

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
    return (
      <div
        data-testid="shell-loading"
        className="min-h-screen flex items-center justify-center bg-surface"
      >
        <div className="animate-spin w-8 h-8 border-3 border-primary border-t-transparent rounded-full" />
      </div>
    )
  }

  if (profileError) {
    return (
      <FullScreenError
        title="No pudimos cargar tu perfil"
        body="Volvé a intentar o cerrá sesión y entrá de nuevo."
        actions={
          <>
            <Button variant="filled" onClick={retryProfile}>
              Reintentar
            </Button>
            <Button variant="outlined" onClick={() => supabase.auth.signOut()}>
              Cerrar sesión
            </Button>
          </>
        }
      />
    )
  }

  if (!profile) {
    return null
  }

  return (
    <div className="min-h-screen bg-surface flex flex-col transition-all duration-medium easing-standard">
      <Topbar profile={profile} />
      <div className="flex flex-1 overflow-hidden">
        {!isTabletOrBelow && <Sidebar role={profile.role} />}
        <main
          className="flex-1 overflow-auto p-4 sm:p-6 transition-all duration-medium easing-standard"
          style={{
            marginLeft: isTabletOrBelow ? 0 : '288px',
            width: isTabletOrBelow ? '100%' : 'calc(100% - 288px)'
          }}
        >
          <Outlet />
        </main>
      </div>
      {isTabletOrBelow && <BottomTabBar role={profile.role} />}
    </div>
  )
}