import { AuthProvider } from './auth/AuthProvider'
import { AppRouter } from './app/AppRouter'
import { NotificacionesProvider } from './features/notificaciones/NotificacionesProvider'

export default function App() {
  return (
    <AuthProvider>
      <NotificacionesProvider>
        <AppRouter />
      </NotificacionesProvider>
    </AuthProvider>
  )
}
