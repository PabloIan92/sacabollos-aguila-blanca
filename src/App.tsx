import { AuthProvider } from './auth/AuthProvider'
import { useAuth } from './auth/useAuth'
import { LoginPage } from './features/login/LoginPage'
import { Ficha } from './ui/Ficha'
import { PrimaryButton } from './ui/PrimaryButton'
import { supabase } from './lib/supabaseClient'

const ROLE_LABELS = {
  dueno: 'Dueño',
  recepcion: 'Recepción',
  taller: 'Taller',
} as const

function AuthenticatedPanel() {
  const { profile } = useAuth()

  if (!profile) return null

  return (
    <div style={{ padding: '2rem', minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <Ficha style={{ width: '100%', maxWidth: '400px' }}>
        <p className="font-sans text-lg font-semibold mb-1">{profile.full_name}</p>
        <p className="font-mono text-xs uppercase tracking-wide text-graphite mb-4">
          {ROLE_LABELS[profile.role]}
        </p>
        <PrimaryButton style={{ width: '100%' }} onClick={() => supabase.auth.signOut()}>
          Cerrar sesión
        </PrimaryButton>
      </Ficha>
    </div>
  )
}

function AppContent() {
  const { session, loading } = useAuth()

  if (loading) return null

  return session ? <AuthenticatedPanel /> : <LoginPage />
}

export default function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  )
}
