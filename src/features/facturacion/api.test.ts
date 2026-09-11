import { beforeEach, describe, expect, it, vi } from 'vitest'
import {
  getFacturacion,
  saveFacturacion,
  marcarComoFacturado,
  marcarComoCobrado,
  iniciarReclamoAseguradora,
  resolverReclamo,
  getResumenFacturacion,
} from './api'
import { supabase } from '../../lib/supabaseClient'

vi.mock('../../lib/supabaseClient', () => ({
  supabase: {
    from: vi.fn(),
    rpc: vi.fn(),
  },
}))


describe('facturacion api', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('obtiene los datos de facturación de un caso', async () => {
    const mockMaybeSingle = vi.fn().mockResolvedValue({
      data: { caso_id: 'c-1', monto_facturado: 150000, monto_cobrado: 0, numero_factura: 'F-001' },
      error: null,
    })
    const mockEq = vi.fn().mockReturnValue({ maybeSingle: mockMaybeSingle })
    const mockSelect = vi.fn().mockReturnValue({ eq: mockEq })
    vi.mocked(supabase.from).mockReturnValue({ select: mockSelect } as any)

    const result = await getFacturacion('c-1')
    expect(result?.monto_facturado).toBe(150000)
    expect(result?.numero_factura).toBe('F-001')
    expect(supabase.from).toHaveBeenCalledWith('caso_facturacion')
  })

  it('rechaza montos negativos o factura vacía en saveFacturacion', async () => {
    await expect(saveFacturacion('c-1', { monto_facturado: -10, numero_factura: 'F-1' }))
      .rejects.toThrow('El monto facturado no puede ser negativo')

    await expect(saveFacturacion('c-1', { monto_facturado: 100, monto_cobrado: -5, numero_factura: 'F-1' }))
      .rejects.toThrow('El monto cobrado no puede ser negativo')

    await expect(saveFacturacion('c-1', { monto_facturado: 100, numero_factura: '   ' }))
      .rejects.toThrow('El número de factura es obligatorio')
  })

  it('guarda o actualiza los datos de facturación con sanitización', async () => {
    const mockSingle = vi.fn().mockResolvedValue({
      data: { caso_id: 'c-1', monto_facturado: 200000, monto_cobrado: 100000, numero_factura: 'B-100' },
      error: null,
    })
    const mockSelect = vi.fn().mockReturnValue({ single: mockSingle })
    const mockUpsert = vi.fn().mockReturnValue({ select: mockSelect })
    vi.mocked(supabase.from).mockReturnValue({ upsert: mockUpsert } as any)

    const saved = await saveFacturacion('c-1', {
      monto_facturado: 200000,
      monto_cobrado: 100000,
      numero_factura: '  B-100  ',
      metodo_pago: 'transferencia',
    })

    expect(saved.monto_facturado).toBe(200000)
    expect(mockUpsert).toHaveBeenCalledWith(
      expect.objectContaining({
        caso_id: 'c-1',
        monto_facturado: 200000,
        monto_cobrado: 100000,
        numero_factura: 'B-100',
        metodo_pago: 'transferencia',
      })
    )
  })

  it('marcarComoFacturado utiliza RPC atómico y propaga errores explícitamente', async () => {
    vi.mocked(supabase.rpc).mockResolvedValueOnce({
      data: { id: 'c-1', estado: 'facturado' },
      error: null,
    } as any)

    const caso = await marcarComoFacturado('c-1', {
      monto_facturado: 250000,
      numero_factura: 'A-001',
    })

    expect(caso.estado).toBe('facturado')
    expect(supabase.rpc).toHaveBeenCalledWith('facturar_caso_atomic', expect.objectContaining({
      p_caso_id: 'c-1',
      p_monto_facturado: 250000,
      p_numero_factura: 'A-001',
    }))

    // Falla explícitamente ante error de RPC (sin degradar a fallback no atómico)
    vi.mocked(supabase.rpc).mockResolvedValueOnce({
      data: null,
      error: new Error('Error en transacción de base de datos'),
    } as any)

    await expect(marcarComoFacturado('c-1', {
      monto_facturado: 250000,
      numero_factura: 'A-001',
    })).rejects.toThrow('Error en transacción de base de datos')
  })

  it('marcarComoCobrado valida fecha_cobro y monto_cobrado mayor a 0', async () => {
    await expect(marcarComoCobrado('c-1', { monto_facturado: 100, numero_factura: 'F-1', monto_cobrado: 0 }))
      .rejects.toThrow('Para marcar como cobrado, el monto cobrado debe ser mayor a 0')

    await expect(marcarComoCobrado('c-1', { monto_facturado: 100, numero_factura: 'F-1', monto_cobrado: 100 }))
      .rejects.toThrow('Para marcar como cobrado, debe indicar la fecha de cobro')
  })

  it('marcarComoCobrado utiliza RPC atómico y propaga errores explícitamente', async () => {
    vi.mocked(supabase.rpc).mockResolvedValueOnce({
      data: { id: 'c-1', estado: 'cobrado' },
      error: null,
    } as any)

    const caso = await marcarComoCobrado('c-1', {
      monto_facturado: 250000,
      numero_factura: 'A-001',
      monto_cobrado: 250000,
      fecha_cobro: '2026-09-10',
      metodo_pago: 'transferencia',
    })

    expect(caso.estado).toBe('cobrado')
    expect(supabase.rpc).toHaveBeenCalledWith('cobrar_caso_atomic', expect.objectContaining({
      p_caso_id: 'c-1',
      p_monto_cobrado: 250000,
      p_fecha_cobro: '2026-09-10',
      p_metodo_pago: 'transferencia',
    }))

    // Falla explícitamente ante error de RPC
    vi.mocked(supabase.rpc).mockResolvedValueOnce({
      data: null,
      error: new Error('Fallo al cobrar caso'),
    } as any)

    await expect(marcarComoCobrado('c-1', {
      monto_facturado: 250000,
      numero_factura: 'A-001',
      monto_cobrado: 250000,
      fecha_cobro: '2026-09-10',
    })).rejects.toThrow('Fallo al cobrar caso')
  })

  it('iniciarReclamoAseguradora valida motivo no vacío y actualiza estado', async () => {
    await expect(iniciarReclamoAseguradora('c-1', '   '))
      .rejects.toThrow('Debe especificar un motivo para el reclamo')

    const mockSingle = vi.fn().mockResolvedValue({
      data: { id: 'c-1', estado: 'reclamo a la compañía', motivo_reclamo: 'Falta de pago' },
      error: null,
    })
    const mockUpdate = vi.fn().mockReturnValue({
      eq: vi.fn().mockReturnValue({
        select: vi.fn().mockReturnValue({ single: mockSingle }),
      }),
    })
    vi.mocked(supabase.from).mockReturnValue({ update: mockUpdate } as any)

    const caso = await iniciarReclamoAseguradora('c-1', 'Falta de pago')
    expect(caso.estado).toBe('reclamo a la compañía')
  })

  it('resolverReclamo devuelve el estado a facturado', async () => {
    const mockSingle = vi.fn().mockResolvedValue({
      data: { id: 'c-1', estado: 'facturado' },
      error: null,
    })
    const mockUpdate = vi.fn().mockReturnValue({
      eq: vi.fn().mockReturnValue({
        select: vi.fn().mockReturnValue({ single: mockSingle }),
      }),
    })
    vi.mocked(supabase.from).mockReturnValue({ update: mockUpdate } as any)

    const caso = await resolverReclamo('c-1')
    expect(caso.estado).toBe('facturado')
  })

  it('getResumenFacturacion consolida casos y facturacion calculando diferencial', async () => {
    const mockCasos = [
      { id: 'c-1', patente: 'AA111BB', marca: 'Toyota', modelo: 'Corolla', cliente_nombre: 'Juan', canal: 'seguro', aseguradora: 'Sancor', estado: 'facturado' },
      { id: 'c-2', patente: 'CC222DD', marca: 'Ford', modelo: 'Focus', cliente_nombre: 'Maria', canal: 'particular', aseguradora: null, estado: 'cobrado' },
    ]
    const mockFacturacion = [
      { caso_id: 'c-1', monto_facturado: 300000, monto_cobrado: 100000, numero_factura: 'F-100', fecha_factura: '2026-09-01' },
      { caso_id: 'c-2', monto_facturado: 200000, monto_cobrado: 200000, numero_factura: 'F-101', fecha_factura: '2026-09-02', fecha_cobro: '2026-09-03' },
    ]

    vi.mocked(supabase.from).mockImplementation((table: string) => {
      if (table === 'casos') {
        return {
          select: vi.fn().mockReturnValue({
            in: vi.fn().mockReturnValue({
              order: vi.fn().mockResolvedValue({ data: mockCasos, error: null }),
            }),
          }),
        } as any
      }
      if (table === 'caso_facturacion') {
        return {
          select: vi.fn().mockReturnValue({
            in: vi.fn().mockResolvedValue({ data: mockFacturacion, error: null }),
          }),
        } as any
      }
      return {} as any
    })

    const resumen = await getResumenFacturacion()
    expect(resumen).toHaveLength(2)
    expect(resumen[0].diferencial).toBe(200000) // 300000 - 100000
    expect(resumen[0].vehiculo).toBe('Toyota Corolla')
    expect(resumen[1].diferencial).toBe(0) // 200000 - 200000
  })
})
