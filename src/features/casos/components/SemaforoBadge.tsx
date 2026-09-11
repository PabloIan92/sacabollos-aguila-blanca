import { STATE_MAPPING, KIND_CLASSNAME, etiquetaEtapa } from './semaforoConstants'
import type { CasoEstado } from '../types'

export function SemaforoBadge({ estado }: { estado: CasoEstado }) {
  const { idx, kind } = STATE_MAPPING[estado]

  return (
    <span
      data-kind={kind}
      className={`inline-block px-2 py-1 text-xs font-mono font-semibold uppercase tracking-wide text-white ${KIND_CLASSNAME[kind]}`}
    >
      {etiquetaEtapa(idx)}
    </span>
  )
}
