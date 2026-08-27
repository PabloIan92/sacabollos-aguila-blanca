import { useEffect } from 'react'
import { supabase } from '../../../lib/supabaseClient'
import type { Caso } from '../types'

export function useCasoRealtime(onCasoChange: (caso: Caso) => void, enabled = true) {
  useEffect(() => {
    if (!enabled) return

    const channel = supabase
      .channel('casos-semaforo')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'casos' }, (payload) => {
        onCasoChange(payload.new as Caso)
      })
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [enabled, onCasoChange])
}
