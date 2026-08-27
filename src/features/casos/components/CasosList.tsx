import { Link } from 'react-router'
import { SemaforoBadge } from './SemaforoBadge'
import type { Caso } from '../types'

const DIAS_TRABADO = 5

function diasEnEtapa(caso: Caso): number {
  const cambiado = new Date(caso.estado_changed_at).getTime()
  return Math.floor((Date.now() - cambiado) / (1000 * 60 * 60 * 24))
}

export function CasosList({ casos }: { casos: Caso[] }) {
  return (
    <table className="w-full text-sm font-sans bg-white border-2 border-graphite">
      <thead>
        <tr className="border-b-2 border-graphite text-left font-mono text-xs uppercase">
          <th className="p-2">Patente</th>
          <th className="p-2">Cliente</th>
          <th className="p-2">Semáforo</th>
        </tr>
      </thead>
      <tbody>
        {casos.map((caso) => {
          const dias = diasEnEtapa(caso)
          const trabado = dias >= DIAS_TRABADO
          return (
            <tr key={caso.id} className="border-b border-steel-300">
              <td className="p-2">
                <Link to={`/casos/${caso.id}`} className="text-blue underline">
                  {caso.patente}
                </Link>
              </td>
              <td className="p-2">{caso.cliente_nombre}</td>
              <td className="p-2">
                <div className="flex items-center gap-2">
                  <SemaforoBadge estado={caso.estado} />
                  {trabado && (
                    <span className="text-red text-xs font-mono font-semibold" title="Trabado 5 días o más en la misma etapa">
                      ⚠ {dias}d
                    </span>
                  )}
                </div>
              </td>
            </tr>
          )
        })}
      </tbody>
    </table>
  )
}
