import { useCallback, useEffect, useState } from 'react'
import { ClipboardList } from 'lucide-react'
import { EmptyState } from '../../ui/EmptyState'
import { CasosList } from '../casos/components/CasosList'
import { listCasos } from '../casos/api'
import { useCasoRealtime } from '../casos/hooks/useCasoRealtime'
import type { Caso } from '../casos/types'

export function DuenoHome() {
  const [casos, setCasos] = useState<Caso[] | null>(null)

  useEffect(() => {
    listCasos().then(setCasos)
  }, [])

  const handleCasoChange = useCallback((casoActualizado: Caso) => {
    setCasos((prev) =>
      prev === null ? prev : prev.map((caso) => (caso.id === casoActualizado.id ? casoActualizado : caso))
    )
  }, [])

  useCasoRealtime(handleCasoChange)

  return (
    <div style={{ padding: '24px' }}>
      <h1 className="font-display text-2xl font-bold uppercase mb-4">Casos activos</h1>
      {casos === null ? null : casos.length === 0 ? (
        <EmptyState
          icon={ClipboardList}
          title="Todavía no hay casos cargados"
          description="Los casos que se creen en recepción van a aparecer acá con su semáforo de estado."
        />
      ) : (
        <CasosList casos={casos} />
      )}
    </div>
  )
}
