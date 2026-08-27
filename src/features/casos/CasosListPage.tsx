import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router'
import { ClipboardList } from 'lucide-react'
import { EmptyState } from '../../ui/EmptyState'
import { PrimaryButton } from '../../ui/PrimaryButton'
import { listCasos } from './api'
import type { Caso } from './types'

export function CasosListPage() {
  const navigate = useNavigate()
  const [casos, setCasos] = useState<Caso[] | null>(null)

  useEffect(() => {
    listCasos().then(setCasos)
  }, [])

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
        <table className="w-full text-sm font-sans bg-white border-2 border-graphite">
          <thead>
            <tr className="border-b-2 border-graphite text-left font-mono text-xs uppercase">
              <th className="p-2">Patente</th>
              <th className="p-2">Cliente</th>
              <th className="p-2">Aseguradora</th>
              <th className="p-2">Estado</th>
            </tr>
          </thead>
          <tbody>
            {casos.map((caso) => {
              const destino = caso.estado === 'borrador' ? `/casos/${caso.id}/ficha-inspeccion` : `/casos/${caso.id}`
              return (
                <tr key={caso.id} className="border-b border-steel-300">
                  <td className="p-2">
                    <Link to={destino} className="text-blue underline">
                      {caso.patente}
                    </Link>
                  </td>
                  <td className="p-2">{caso.cliente_nombre}</td>
                  <td className="p-2">{caso.aseguradora}</td>
                  <td className="p-2">{caso.estado}</td>
                </tr>
              )
            })}
          </tbody>
        </table>
      )}
    </div>
  )
}
