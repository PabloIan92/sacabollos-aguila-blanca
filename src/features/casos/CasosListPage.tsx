import { useCallback, useEffect, useState } from 'react'
import { useNavigate } from 'react-router'
import { ClipboardList } from 'lucide-react'
import { EmptyState } from '../../ui/EmptyState'
import { PrimaryButton } from '../../ui/PrimaryButton'
import { CasosList } from './components/CasosList'
import { listCasos } from './api'
import { useCasoRealtime } from './hooks/useCasoRealtime'
import type { Caso } from './types'

export function CasosListPage() {
  const navigate = useNavigate()
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
      <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
        <h1 className="font-display text-2xl font-bold uppercase">Casos</h1>
        <PrimaryButton onClick={() => navigate('/casos/nuevo')}>Nuevo caso</PrimaryButton>
      </div>

      {casos === null ? null : casos.length === 0 ? (
        <EmptyState
          icon={ClipboardList}
          title="No hay casos todavía"
          body="Cuando dés de alta un caso, va a aparecer en este listado."
        />
      ) : (
        <CasosList casos={casos} />
      )}
    </div>
  )
}
