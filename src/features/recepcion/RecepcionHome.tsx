import { Calendar } from 'lucide-react'
import { useNavigate } from 'react-router'
import { EmptyState } from '../../ui/EmptyState'
import { PrimaryButton } from '../../ui/PrimaryButton'

export function RecepcionHome() {
  const navigate = useNavigate()

  return (
    <div style={{ padding: '24px' }}>
      <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
        <h1 className="font-display text-2xl font-bold uppercase">Turnos de hoy</h1>
        <PrimaryButton onClick={() => navigate('/casos/nuevo')}>Nuevo caso</PrimaryButton>
      </div>
      <EmptyState
        icon={Calendar}
        title="No hay turnos para hoy"
        body="Cuando coordines un turno con un cliente, va a aparecer en esta agenda."
      />
    </div>
  )
}
