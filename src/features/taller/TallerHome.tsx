import { useCallback, useEffect, useState } from 'react'
import { Wrench } from 'lucide-react'
import { EmptyState } from '../../ui/EmptyState'
import { CasosList } from '../casos/components/CasosList'
import { listCasos } from '../casos/api'
import { useCasoRealtime } from '../casos/hooks/useCasoRealtime'
import type { Caso, CasoEstado } from '../casos/types'

const ESTADOS_EXCLUIDOS_TALLER: CasoEstado[] = ['cobrado', 'cancelado']

export function TallerHome() {
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

  const casosActivos = casos === null ? null : casos.filter((caso) => !ESTADOS_EXCLUIDOS_TALLER.includes(caso.estado))

  return (
    <div style={{ padding: '24px' }}>
      <h1 className="font-display text-2xl font-bold uppercase mb-4">Casos activos</h1>
      {casosActivos === null ? null : casosActivos.length === 0 ? (
        <EmptyState
          icon={Wrench}
          title="No hay casos en el taller todavía"
          body="Los autos en reparación o esperando repuesto van a aparecer acá."
        />
      ) : (
        <CasosList casos={casosActivos} />
      )}
    </div>
  )
}
