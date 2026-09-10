import { describe, it, expect, vi, beforeEach } from 'vitest'
import { ESTADOS_CASO, FINAL_PHOTO_ANGLES, SIGNED_ORDER_ANGLES, ZONAS_DANO } from './types'
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
  startRepair,
  listRepairDamages,
  createRepairDamage,
  updateRepairDamage,
  deleteRepairDamage,
  waitForPart,
  resumeRepair,
  markReadyForSignature,
  markSigned,
} from './api'

const select = vi.fn()
const eq = vi.fn()
const single = vi.fn()
const insert = vi.fn()
const update = vi.fn()
const order = vi.fn()
const remove = vi.fn()
const rpc = vi.fn()
const from = vi.fn()

vi.mock('../../lib/supabaseClient', () => ({
  supabase: { from: (...args: unknown[]) => from(...args), rpc: (...args: unknown[]) => rpc(...args) },
}))

beforeEach(() => {
  vi.clearAllMocks()
  from.mockReturnValue({ select, insert, update, delete: remove })
  select.mockReturnValue({ eq, order, single, then: undefined, data: [], error: null })
  eq.mockReturnValue({ single, select, order, data: [], error: null })
  order.mockResolvedValue({ data: [], error: null })
  single.mockResolvedValue({ data: {}, error: null })
  insert.mockReturnValue({ select: () => ({ single }) })
  update.mockReturnValue({ eq: (...args: unknown[]) => {
    eq(...args)
    return { select: () => ({ single }) }
  } })
  remove.mockReturnValue({ eq: (...args: unknown[]) => {
    eq(...args)
    return Promise.resolve({ error: null })
  } })
  rpc.mockResolvedValue({ data: {}, error: null })
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

  it('expone los ángulos exactos de fotos finales y orden firmada', () => {
    expect(FINAL_PHOTO_ANGLES).toEqual([
      'final-frente', 'final-atras', 'final-lateral-izquierdo', 'final-lateral-derecho',
    ])
    expect(SIGNED_ORDER_ANGLES).toEqual(['orden-firmada'])
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

  it('startRepair invoca el RPC y devuelve el caso', async () => {
    const caso = { id: 'abc', estado: 'en reparación' }
    rpc.mockResolvedValue({ data: caso, error: null })
    await expect(startRepair('abc')).resolves.toEqual(caso)
    expect(rpc).toHaveBeenCalledWith('iniciar_reparacion', { p_caso_id: 'abc' })
  })

  it('startRepair propaga el error del RPC', async () => {
    const error = new Error('no autorizado')
    rpc.mockResolvedValue({ data: null, error })
    await expect(startRepair('abc')).rejects.toThrow('no autorizado')
  })

  it('listRepairDamages consulta los daños del caso ordenados por creación', async () => {
    const danos = [{ id: 'd1' }]
    order.mockResolvedValue({ data: danos, error: null })
    await expect(listRepairDamages('abc')).resolves.toEqual(danos)
    expect(from).toHaveBeenCalledWith('reparacion_danos')
    expect(select).toHaveBeenCalledWith('*')
    expect(eq).toHaveBeenCalledWith('caso_id', 'abc')
    expect(order).toHaveBeenCalledWith('created_at', { ascending: true })
  })

  it('listRepairDamages propaga errores de Supabase', async () => {
    const error = new Error('falló listado')
    order.mockResolvedValue({ data: null, error })
    await expect(listRepairDamages('abc')).rejects.toThrow('falló listado')
  })

  it('createRepairDamage agrega los valores controlados y devuelve el daño', async () => {
    const dano = { id: 'd1', caso_id: 'abc' }
    single.mockResolvedValue({ data: dano, error: null })
    await expect(createRepairDamage('abc', { zona: 'capot', x: 0.25, y: 0.5, descripcion: 'abollón' })).resolves.toEqual(dano)
    expect(from).toHaveBeenCalledWith('reparacion_danos')
    expect(insert).toHaveBeenCalledWith({
      caso_id: 'abc', zona: 'capot', x: 0.25, y: 0.5, descripcion: 'abollón', reparado: false, origen_inspeccion: false,
    })
  })

  it('createRepairDamage propaga errores de Supabase', async () => {
    const error = new Error('falló alta')
    single.mockResolvedValue({ data: null, error })
    await expect(createRepairDamage('abc', { zona: 'capot', x: 0, y: 0, descripcion: null })).rejects.toThrow('falló alta')
  })

  it('updateRepairDamage limita el payload a los campos editables y devuelve el daño', async () => {
    const dano = { id: 'd1', reparado: true }
    single.mockResolvedValue({ data: dano, error: null })
    await expect(updateRepairDamage('d1', { reparado: true, descripcion: null })).resolves.toEqual(dano)
    expect(from).toHaveBeenCalledWith('reparacion_danos')
    expect(update).toHaveBeenCalledWith({ reparado: true, descripcion: null })
    expect(eq).toHaveBeenCalledWith('id', 'd1')
  })

  it('updateRepairDamage propaga errores de Supabase', async () => {
    const error = new Error('falló edición')
    single.mockResolvedValue({ data: null, error })
    await expect(updateRepairDamage('d1', { x: 0.4 })).rejects.toThrow('falló edición')
  })

  it('deleteRepairDamage elimina por id', async () => {
    await deleteRepairDamage('d1')
    expect(from).toHaveBeenCalledWith('reparacion_danos')
    expect(remove).toHaveBeenCalled()
    expect(eq).toHaveBeenCalledWith('id', 'd1')
  })

  it('deleteRepairDamage propaga errores de Supabase', async () => {
    const error = new Error('falló baja')
    remove.mockReturnValue({ eq: () => Promise.resolve({ error }) })
    await expect(deleteRepairDamage('d1')).rejects.toThrow('falló baja')
  })

  it('waitForPart normaliza el repuesto y actualiza solo sus campos', async () => {
    await waitForPart('abc', '  guardabarros  ')
    expect(update).toHaveBeenCalledWith({ estado: 'esperando repuesto', repuesto_pendiente: 'guardabarros' })
  })

  it('waitForPart rechaza un repuesto vacío antes de consultar Supabase', async () => {
    await expect(waitForPart('abc', '   ')).rejects.toThrow('repuesto')
    expect(from).not.toHaveBeenCalled()
  })

  it('waitForPart propaga errores de Supabase', async () => {
    const error = new Error('falló espera')
    single.mockResolvedValue({ data: null, error })
    await expect(waitForPart('abc', 'capot')).rejects.toThrow('falló espera')
  })

  it('resumeRepair limpia el repuesto pendiente', async () => {
    await resumeRepair('abc')
    expect(update).toHaveBeenCalledWith({ estado: 'en reparación', repuesto_pendiente: null })
  })

  it('resumeRepair propaga errores de Supabase', async () => {
    const error = new Error('falló reanudar')
    single.mockResolvedValue({ data: null, error })
    await expect(resumeRepair('abc')).rejects.toThrow('falló reanudar')
  })

  it('markReadyForSignature delega el timestamp al servidor', async () => {
    await markReadyForSignature('abc')
    expect(update).toHaveBeenCalledWith({ estado: 'listo para firma' })
  })

  it('markReadyForSignature propaga errores de Supabase', async () => {
    const error = new Error('falló cierre')
    single.mockResolvedValue({ data: null, error })
    await expect(markReadyForSignature('abc')).rejects.toThrow('falló cierre')
  })

  it('markSigned delega el timestamp al servidor', async () => {
    await markSigned('abc')
    expect(update).toHaveBeenCalledWith({ estado: 'firmado' })
  })

  it('markSigned propaga errores de Supabase', async () => {
    const error = new Error('falló firma')
    single.mockResolvedValue({ data: null, error })
    await expect(markSigned('abc')).rejects.toThrow('falló firma')
  })
})
