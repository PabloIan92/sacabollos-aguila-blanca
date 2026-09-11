import { describe, expect, it, vi, beforeEach } from 'vitest'
import { getResumenMensual } from './api'
import { listCasos } from '../casos/api'
import { getResumenFacturacion } from '../facturacion/api'

vi.mock('../casos/api', () => ({
  listCasos: vi.fn(),
}))

vi.mock('../facturacion/api', () => ({
  getResumenFacturacion: vi.fn(),
}))

describe('Informes API', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('retorna array vacío si no hay casos ni facturación', async () => {
    vi.mocked(listCasos).mockResolvedValue([])
    vi.mocked(getResumenFacturacion).mockResolvedValue([])

    const result = await getResumenMensual()
    expect(result).toEqual([])
  })

  it('agrupa correctamente por mes', async () => {
    vi.mocked(listCasos).mockResolvedValue([
      {
        id: '1',
        created_at: '2026-09-10T10:00:00Z',
        canal: 'seguro',
        estado: 'cobrado',
      } as any,
      {
        id: '2',
        created_at: '2026-09-12T10:00:00Z',
        canal: 'particular',
        estado: 'en reparación',
      } as any,
      {
        id: '3',
        created_at: '2026-08-15T10:00:00Z',
        canal: 'seguro',
        estado: 'reclamo a la compañía',
      } as any,
    ])

    vi.mocked(getResumenFacturacion).mockResolvedValue([
      {
        caso_id: '1',
        fecha_factura: '2026-09-11',
        monto_facturado: 100,
        monto_cobrado: 100,
        diferencial: 0,
        estado: 'cobrado',
      } as any,
      {
        caso_id: '4',
        fecha_factura: '2026-07-05',
        monto_facturado: 200,
        monto_cobrado: 50,
        diferencial: 150,
        estado: 'facturado',
      } as any,
    ])

    const result = await getResumenMensual()

    expect(result).toHaveLength(3)
    
    // Debería estar ordenado de más reciente a más antiguo
    expect(result[0].mes).toBe('2026-09')
    expect(result[0].label).toBe('Sep 2026')
    expect(result[0].casosCreados).toBe(2)
    expect(result[0].casosSeguro).toBe(1)
    expect(result[0].casosParticular).toBe(1)
    expect(result[0].casosCerrados).toBe(1)
    expect(result[0].casosEnReclamo).toBe(0)
    expect(result[0].montoFacturado).toBe(100)
    expect(result[0].montoCobrado).toBe(100)
    expect(result[0].diferencial).toBe(0)

    expect(result[1].mes).toBe('2026-08')
    expect(result[1].label).toBe('Ago 2026')
    expect(result[1].casosCreados).toBe(1)
    expect(result[1].casosSeguro).toBe(1)
    expect(result[1].casosParticular).toBe(0)
    expect(result[1].casosCerrados).toBe(0)
    expect(result[1].casosEnReclamo).toBe(1)
    expect(result[1].montoFacturado).toBe(0)

    expect(result[2].mes).toBe('2026-07')
    expect(result[2].label).toBe('Jul 2026')
    expect(result[2].casosCreados).toBe(0)
    expect(result[2].montoFacturado).toBe(200)
    expect(result[2].montoCobrado).toBe(50)
    expect(result[2].diferencial).toBe(150)
  })
})
