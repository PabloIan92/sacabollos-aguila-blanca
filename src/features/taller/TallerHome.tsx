import { Wrench } from 'lucide-react'
import { EmptyState } from '../../ui/EmptyState'

export function TallerHome() {
  return (
    <div style={{ padding: '24px' }}>
      <h1 className="font-display text-2xl font-bold uppercase mb-4">Casos activos</h1>
      <EmptyState
        icon={Wrench}
        title="No hay casos en el taller todavía"
        body="Los autos en reparación o esperando repuesto van a aparecer acá."
      />
    </div>
  )
}
