import { Navigate, Outlet } from 'react-router'
import { useAuth } from './useAuth'
import type { Profile } from './AuthProvider'

export function RequireRole({ roles }: { roles: Array<Profile['role']> }) {
  const { session, profile, loading } = useAuth()

  if (loading) {
    return <div data-testid="auth-loading" />
  }

  if (!session) {
    return <Navigate to="/login" replace />
  }

  if (!profile || !roles.includes(profile.role)) {
    return <Navigate to="/" replace />
  }

  return <Outlet />
}
