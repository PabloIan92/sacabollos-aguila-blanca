import { useEffect, useState, type ReactNode } from 'react'
import { NotificacionesContext } from './notificacionesContext'
import type { Notificacion, NotifKind } from './types'
import { supabase } from '../../lib/supabaseClient'
import type { Caso } from '../casos/types'

export function NotificacionesProvider({ children }: { children: ReactNode }) {
  const [notificaciones, setNotificaciones] = useState<Notificacion[]>([])

  useEffect(() => {
    const channel = supabase
      .channel('notificaciones_casos')
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'casos' },
        (payload) => {
          const oldCaso = payload.old as Partial<Caso>
          const newCaso = payload.new as Caso

          if (oldCaso.estado && newCaso.estado && oldCaso.estado !== newCaso.estado) {
            let kind: NotifKind = 'estado_cambio'
            let mensaje = `${newCaso.patente} avanzó a ${newCaso.estado}`

            if (oldCaso.estado === 'esperando repuesto' && newCaso.estado === 'en reparación') {
              kind = 'repuesto_llegado'
              mensaje = `Llegó repuesto para ${newCaso.patente} — retomando reparación`
            } else if (newCaso.estado === 'reclamo a la compañía') {
              kind = 'reclamo'
              mensaje = `⚠ Reclamo iniciado para ${newCaso.patente}`
            } else if (newCaso.estado === 'cobrado') {
              kind = 'cobrado'
              mensaje = `✓ Cobrado: ${newCaso.patente} — ${newCaso.cliente_nombre}`
            }

            const notificacion: Notificacion = {
              id: crypto.randomUUID(),
              casoId: newCaso.id,
              patente: newCaso.patente,
              mensaje,
              kind,
              leida: false,
              createdAt: new Date(),
            }

            setNotificaciones((prev) => {
              const nuevaLista = [notificacion, ...prev]
              return nuevaLista.slice(0, 50)
            })
          }
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [])

  const marcarLeida = (id: string) => {
    setNotificaciones((prev) =>
      prev.map((notif) => (notif.id === id ? { ...notif, leida: true } : notif))
    )
  }

  const marcarTodasLeidas = () => {
    setNotificaciones((prev) => prev.map((notif) => ({ ...notif, leida: true })))
  }

  const limpiar = () => {
    setNotificaciones([])
  }

  const sinLeer = notificaciones.filter((n) => !n.leida).length

  return (
    <NotificacionesContext.Provider
      value={{ notificaciones, marcarLeida, marcarTodasLeidas, limpiar, sinLeer }}
    >
      {children}
    </NotificacionesContext.Provider>
  )
}
