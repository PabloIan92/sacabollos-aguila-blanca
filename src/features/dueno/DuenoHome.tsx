import { ClipboardList } from 'lucide-react'
import { EmptyState } from '../../ui/EmptyState'

export function DuenoHome() {
  return (
    <div style={{ padding: '24px' }}>
      <h1 className="font-display text-2xl font-bold uppercase mb-4">Casos activos</h1>
      <EmptyState
        icon={ClipboardList}
        title="Todavía no hay casos cargados"
        body="Los casos que se creen en recepción van a aparecer acá con su semáforo de estado."
      />
    </div>
  )
}
