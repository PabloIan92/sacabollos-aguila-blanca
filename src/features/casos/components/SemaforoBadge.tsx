import type { CasoEstado } from '../types'

type Kind = 'waiting' | 'active' | 'parts' | 'done' | 'blocked' | 'cancelled'

const STAGE_LABELS = [
  '1. Datos y Denuncia',
  '2. Presupuesto + Fotos',
  '3. Orden de Trabajo / OK',
  '4. Turno Coordinado',
  '5. Ingreso a Taller (Ficha 2)',
  '6. Reparación PDR',
  '7. Firma con Fotos',
  '8. Facturación',
  '9. Cobro / Cierre',
] as const

export const STATE_MAPPING: Record<CasoEstado, { idx: number; kind: Kind }> = {
  borrador: { idx: 0, kind: 'waiting' },
  'enviado a la aseguradora': { idx: 2, kind: 'waiting' },
  aprobado: { idx: 3, kind: 'waiting' },
  'turno coordinado': { idx: 4, kind: 'waiting' },
  ingresado: { idx: 5, kind: 'active' },
  'esperando repuesto': { idx: 5, kind: 'parts' },
  'en reparación': { idx: 5, kind: 'active' },
  'listo para firma': { idx: 6, kind: 'waiting' },
  firmado: { idx: 7, kind: 'waiting' },
  facturado: { idx: 8, kind: 'waiting' },
  cobrado: { idx: 9, kind: 'done' },
  'reclamo a la compañía': { idx: 8, kind: 'blocked' },
  cancelado: { idx: -1, kind: 'cancelled' },
}

const KIND_CLASSNAME: Record<Kind, string> = {
  waiting: 'bg-gray',
  active: 'bg-blue',
  parts: 'bg-brass',
  done: 'bg-green',
  blocked: 'bg-red',
  cancelled: 'bg-graphite opacity-50',
}

function etiquetaEtapa(idx: number): string {
  if (idx === 9) return 'Cobrado'
  if (idx === -1) return 'Cancelado'
  return STAGE_LABELS[idx].replace(/^\d+\.\s*/, '')
}

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
