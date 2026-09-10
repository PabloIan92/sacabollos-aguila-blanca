import { describe, it, expect, vi, beforeEach } from 'vitest'
import { ESTADOS_CASO, ZONAS_DANO } from './types'
import {
  listCasos,
  getCaso,
  createCaso,
  saveCasoInspection,
  markSeguroSent,
  markSeguroApproved,
  acceptParticular,
  rejectParticular,
  coordinateCasoTurno,
  registerCasoIngreso,
} from './api'

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

  it('saveCasoInspection guarda daños y timestamp sin forzar un cambio de estado', async () => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2026-09-10T13:00:00.000Z'))

    await saveCasoInspection('abc', ['capot'])

    expect(update).toHaveBeenCalledWith({
      danos_zonas: ['capot'],
      inspeccion_guardada_at: '2026-09-10T13:00:00.000Z',
    })
    vi.useRealTimers()
  })

  it('markSeguroSent avanza solamente a enviado a la aseguradora', async () => {
    await markSeguroSent('abc')
    expect(update).toHaveBeenCalledWith({ estado: 'enviado a la aseguradora' })
  })

  it('markSeguroApproved registra la orden recibida sin aceptar campos arbitrarios', async () => {
    await markSeguroApproved('abc')
    expect(update).toHaveBeenCalledWith({ estado: 'aprobado' })
  })

  it('acceptParticular persiste respuesta y estado de manera atómica', async () => {
    await acceptParticular('abc')
    expect(update).toHaveBeenCalledWith({ presupuesto_respuesta: 'aceptado', estado: 'aprobado' })
  })

  it('rejectParticular exige una modalidad y persiste el rechazo atómicamente', async () => {
    await rejectParticular('abc', 'whatsapp', 'Retomar contacto en noviembre')
    expect(update).toHaveBeenCalledWith({
      presupuesto_respuesta: 'rechazado',
      modalidad_contacto: 'whatsapp',
      seguimiento_observaciones: 'Retomar contacto en noviembre',
      estado: 'cancelado',
    })
  })

  it('coordinateCasoTurno persiste fecha y estado de manera atómica', async () => {
    await coordinateCasoTurno('abc', '2026-09-10T13:00:00.000Z')
    expect(update).toHaveBeenCalledWith({
      turno_fecha: '2026-09-10T13:00:00.000Z',
      estado: 'turno coordinado',
    })
  })

  it('registerCasoIngreso persiste orden, fecha y estado de manera atómica', async () => {
    await registerCasoIngreso('abc', 'ORD-10', '2026-09-10T13:00:00.000Z')
    expect(update).toHaveBeenCalledWith({
      orden_ingreso_numero: 'ORD-10',
      ingresado_at: '2026-09-10T13:00:00.000Z',
      estado: 'ingresado',
    })
  })
})
