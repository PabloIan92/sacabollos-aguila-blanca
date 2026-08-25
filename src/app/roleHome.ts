import { createElement } from 'react'
import { useAuth } from '../auth/useAuth'
import { DuenoHome } from '../features/dueno/DuenoHome'
import { RecepcionHome } from '../features/recepcion/RecepcionHome'
import { TallerHome } from '../features/taller/TallerHome'
import { FullScreenError } from '../ui/FullScreenError'

export function RoleHome() {
  const { profile } = useAuth()

  switch (profile?.role) {
    case 'dueno':
      return createElement(DuenoHome)
    case 'recepcion':
      return createElement(RecepcionHome)
    case 'taller':
      return createElement(TallerHome)
    default:
      return createElement(FullScreenError, {
        title: 'No pudimos cargar tu perfil',
        body: 'Volvé a intentar o cerrá sesión y entrá de nuevo.',
        actions: null,
      })
  }
}
