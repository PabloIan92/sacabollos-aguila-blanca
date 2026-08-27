import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { SemaforoBadge, STATE_MAPPING } from './SemaforoBadge'
import { ESTADOS_CASO, type CasoEstado } from '../types'

const LABEL_POR_IDX: Record<number, string> = {
  0: 'Datos y Denuncia',
  1: 'Presupuesto + Fotos',
  2: 'Orden de Trabajo / OK',
  3: 'Turno Coordinado',
  4: 'Ingreso a Taller (Ficha 2)',
  5: 'Reparación PDR',
  6: 'Firma con Fotos',
  7: 'Facturación',
  8: 'Cobro / Cierre',
  9: 'Cobrado',
  [-1]: 'Cancelado',
}

const CASOS_ESPERADOS: Array<{ estado: CasoEstado; idx: number; kind: string }> = [
  { estado: 'borrador', idx: 0, kind: 'waiting' },
  { estado: 'enviado a la aseguradora', idx: 2, kind: 'waiting' },
  { estado: 'aprobado', idx: 3, kind: 'waiting' },
  { estado: 'turno coordinado', idx: 4, kind: 'waiting' },
  { estado: 'ingresado', idx: 5, kind: 'active' },
  { estado: 'esperando repuesto', idx: 5, kind: 'parts' },
  { estado: 'en reparación', idx: 5, kind: 'active' },
  { estado: 'listo para firma', idx: 6, kind: 'waiting' },
  { estado: 'firmado', idx: 7, kind: 'waiting' },
  { estado: 'facturado', idx: 8, kind: 'waiting' },
  { estado: 'cobrado', idx: 9, kind: 'done' },
  { estado: 'reclamo a la compañía', idx: 8, kind: 'blocked' },
  { estado: 'cancelado', idx: -1, kind: 'cancelled' },
]

describe('SemaforoBadge', () => {
  it('cubre los 13 estados exactos de ESTADOS_CASO en su mapa interno, sin faltantes ni sobrantes', () => {
    expect(CASOS_ESPERADOS).toHaveLength(ESTADOS_CASO.length)
    expect(CASOS_ESPERADOS.map((c) => c.estado).sort()).toEqual([...ESTADOS_CASO].sort())
    expect(Object.keys(STATE_MAPPING).sort()).toEqual([...ESTADOS_CASO].sort())
  })

  it.each(CASOS_ESPERADOS)('estado "$estado" mapea a idx $idx y kind $kind', ({ estado, idx, kind }) => {
    expect(STATE_MAPPING[estado]).toEqual({ idx, kind })

    render(<SemaforoBadge estado={estado} />)
    const badge = screen.getByText(LABEL_POR_IDX[idx])
    expect(badge).toHaveAttribute('data-kind', kind)
  })
})
