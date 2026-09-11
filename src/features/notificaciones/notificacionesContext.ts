import { createContext, useContext } from 'react'
import type { Notificacion } from './types'

export interface NotificacionesContextType {
  notificaciones: Notificacion[]
  marcarLeida: (id: string) => void
  marcarTodasLeidas: () => void
  limpiar: () => void
  sinLeer: number
}

export const NotificacionesContext = createContext<NotificacionesContextType | undefined>(undefined)

export function useNotificaciones() {
  const context = useContext(NotificacionesContext)
  if (context === undefined) {
    throw new Error('useNotificaciones must be used within a NotificacionesProvider')
  }
  return context
}
