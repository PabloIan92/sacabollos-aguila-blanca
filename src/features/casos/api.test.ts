import { describe, it, expect, vi, beforeEach } from 'vitest'
import { ESTADOS_CASO, ZONAS_DANO } from './types'
import { listCasos, getCaso, createCaso, updateCasoEstado } from './api'

const select = vi.fn()
const eq = vi.fn()
const single = vi.fn()
const insert = vi.fn()
const update = vi.fn()
const from = vi.fn()

vi.mock('../../lib/supabaseClient', () => ({
  supabase: { from: (...args: unknown[]) => from(...args) },
}))

beforeEach(() => {
  vi.clearAllMocks()
  from.mockReturnValue({ select, insert, update })
  select.mockReturnValue({ eq, single, then: undefined, data: [], error: null })
  eq.mockReturnValue({ single, select, data: [], error: null })
  single.mockResolvedValue({ data: {}, error: null })
  insert.mockReturnValue({ select: () => ({ single }) })
  update.mockReturnValue({ eq: () => ({ select: () => ({ single }) }) })
})

describe('types', () => {
  it('ESTADOS_CASO tiene los 13 valores exactos', () => {
    expect(ESTADOS_CASO).toHaveLength(13)
    expect(ESTADOS_CASO).toEqual([
      'borrador',
      'enviado a la aseguradora',
      'aprobado',
      'turno coordinado',
      'ingresado',
      'esperando repuesto',
      'en reparación',
      'listo para firma',
      'firmado',
      'facturado',
      'cobrado',
      'reclamo a la compañía',
      'cancelado',
    ])
  })

  it('ZONAS_DANO tiene 10 zonas', () => {
    expect(ZONAS_DANO).toHaveLength(10)
  })
})

describe('api', () => {
  it('listCasos llama a supabase.from("casos").select()', async () => {
    select.mockReturnValue(Promise.resolve({ data: [], error: null }))
    await listCasos()
    expect(from).toHaveBeenCalledWith('casos')
    expect(select).toHaveBeenCalledWith('*')
  })

  it('getCaso llama a select().eq().single()', async () => {
    eq.mockReturnValue({ single })
    await getCaso('abc')
    expect(select).toHaveBeenCalledWith('*')
    expect(eq).toHaveBeenCalledWith('id', 'abc')
    expect(single).toHaveBeenCalled()
  })

  it('createCaso llama a insert()', async () => {
    await createCaso({
      canal: 'seguro',
      patente: 'AA123BB',
      marca: null,
      modelo: null,
      color: null,
      cliente_nombre: 'Juan',
      cliente_telefono: '123',
      aseguradora: 'Sancor',
      numero_siniestro: '1',
      denuncia: 'x',
      productor_nombre: null,
      productor_telefono: null,
      danos_zonas: [],
      turno_fecha: null,
      orden_ingreso_numero: null,
      ingresado_at: null,
      created_by: 'user-1',
    })
    expect(from).toHaveBeenCalledWith('casos')
    expect(insert).toHaveBeenCalled()
  })

  it('updateCasoEstado incluye la clave estado en el payload', async () => {
    await updateCasoEstado('abc', 'turno coordinado', { turno_fecha: '2026-01-01' })
    expect(update).toHaveBeenCalledWith(
      expect.objectContaining({ estado: 'turno coordinado', turno_fecha: '2026-01-01' })
    )
  })
})
