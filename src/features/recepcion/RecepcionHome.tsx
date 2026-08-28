import { useEffect, useState } from 'react'
import { Calendar } from 'lucide-react'
import { Link, useNavigate } from 'react-router'
import { EmptyState } from '../../ui/EmptyState'
import { PrimaryButton } from '../../ui/PrimaryButton'
import { listCasos } from '../casos/api'
import type { Caso } from '../casos/types'

function esHoy(fechaISO: string): boolean {
  const fecha = new Date(fechaISO)
  const hoy = new Date()
  return (
    fecha.getFullYear() === hoy.getFullYear() &&
    fecha.getMonth() === hoy.getMonth() &&
    fecha.getDate() === hoy.getDate()
  )
}

function tieneTurnoHoy(caso: Caso): caso is Caso & { turno_fecha: string } {
  return caso.turno_fecha != null && esHoy(caso.turno_fecha)
}

export function RecepcionHome() {
  const navigate = useNavigate()
  const [casos, setCasos] = useState<Caso[] | null>(null)

  useEffect(() => {
    listCasos().then(setCasos)
  }, [])

  const turnosDeHoy =
    casos === null
      ? null
      : casos
          .filter(tieneTurnoHoy)
          .sort((a, b) => new Date(a.turno_fecha).getTime() - new Date(b.turno_fecha).getTime())

  return (
    <div style={{ padding: '24px' }}>
      <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
        <h1 className="font-display text-2xl font-bold uppercase">Turnos de hoy</h1>
        <PrimaryButton onClick={() => navigate('/casos/nuevo')}>Nuevo caso</PrimaryButton>
      </div>

      {turnosDeHoy === null ? null : turnosDeHoy.length === 0 ? (
        <EmptyState
          icon={Calendar}
          title="No hay turnos para hoy"
          description="Cuando coordines un turno con un cliente, va a aparecer en esta agenda."
        />
      ) : (
        <table className="w-full text-sm font-sans bg-white border-2 border-graphite">
          <thead>
            <tr className="border-b-2 border-graphite text-left font-mono text-xs uppercase">
              <th className="p-2">Hora</th>
              <th className="p-2">Patente</th>
              <th className="p-2">Cliente</th>
            </tr>
          </thead>
          <tbody>
            {turnosDeHoy.map((caso) => (
              <tr key={caso.id} className="border-b border-steel-300">
                <td className="p-2">
                  <Link to={`/casos/${caso.id}`} className="text-blue underline">
                    {new Date(caso.turno_fecha).toLocaleTimeString('es-AR', {
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </Link>
                </td>
                <td className="p-2">{caso.patente}</td>
                <td className="p-2">{caso.cliente_nombre}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  )
}
