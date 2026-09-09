import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import {
  CANALES_CASO,
  ESTADOS_CASO,
  MODALIDADES_CONTACTO,
  RESPUESTAS_PARTICULAR,
  ZONAS_DANO,
  type CasoParticular,
  type CasoSeguro,
  type CrearCasoInput,
} from './types'
import {
  aceptarCasoParticular,
  coordinarTurno,
  createCaso,
  getCaso,
  guardarInspeccion,
  listCasos,
  rechazarCasoParticular,
  updateCasoEstado,
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

const casoSeguro: CasoSeguro = {
  id: 'seguro-1',
  canal: 'seguro',
  patente: 'AA123BB',
  marca: null,
  modelo: null,
  color: null,
  cliente_nombre: 'Ana',
  cliente_telefono: '111',
  aseguradora: 'Sancor',
  numero_siniestro: 'S-1',
  denuncia: 'Choque',
  productor_nombre: null,
  productor_telefono: null,
  presupuesto_monto: null,
  presupuesto_observaciones: null,
  respuesta_particular: null,
  modalidad_contacto: null,
  seguimiento_observaciones: null,
  danos_zonas: [],
  inspeccion_guardada_at: null,
  turno_fecha: null,
  orden_ingreso_numero: null,
  ingresado_at: null,
  estado: 'borrador',
  created_at: '2026-09-08T10:00:00.000Z',
  updated_at: '2026-09-08T10:00:00.000Z',
  estado_changed_at: '2026-09-08T10:00:00.000Z',
  created_by: 'user-1',
}

const casoParticular: CasoParticular = {
  ...casoSeguro,
  id: 'particular-1',
  canal: 'particular',
  aseguradora: null,
  numero_siniestro: null,
  denuncia: null,
  productor_nombre: null,
  productor_telefono: null,
  presupuesto_monto: 150000,
  presupuesto_observaciones: 'Incluye materiales',
  respuesta_particular: 'pendiente',
  modalidad_contacto: null,
  seguimiento_observaciones: null,
  inspeccion_guardada_at: null,
}

const crearSeguro: CrearCasoInput = {
  canal: 'seguro',
  patente: 'AA123BB',
  marca: null,
  modelo: null,
  color: null,
  cliente_nombre: 'Ana',
  cliente_telefono: '111',
  aseguradora: 'Sancor',
  numero_siniestro: 'S-1',
  denuncia: 'Choque',
  productor_nombre: null,
  productor_telefono: null,
  danos_zonas: [],
  turno_fecha: null,
  orden_ingreso_numero: null,
  ingresado_at: null,
  created_by: 'user-1',
}

const crearParticular: CrearCasoInput = {
  canal: 'particular',
  patente: 'BB234CC',
  marca: 'Ford',
  modelo: 'Ka',
  color: 'blanco',
  cliente_nombre: 'Luis',
  cliente_telefono: '222',
  presupuesto_monto: 85000.5,
  presupuesto_observaciones: null,
  danos_zonas: [],
  turno_fecha: null,
  orden_ingreso_numero: null,
  ingresado_at: null,
  created_by: 'user-1',
}

beforeEach(() => {
  vi.clearAllMocks()
  from.mockReturnValue({ select, insert, update })
  select.mockReturnValue({ eq })
  eq.mockReturnValue({ single })
  single.mockResolvedValue({ data: casoSeguro, error: null })
  insert.mockReturnValue({ select: () => ({ single }) })
  update.mockReturnValue({ eq: () => ({ select: () => ({ single }) }) })
})

afterEach(() => {
  vi.useRealTimers()
})

describe('contratos de casos', () => {
  it('mantiene los estados existentes y declara ambos canales', () => {
    expect(ESTADOS_CASO).toHaveLength(13)
    expect(CANALES_CASO).toEqual(['seguro', 'particular'])
    expect(ZONAS_DANO).toHaveLength(10)
  })

  it('declara las respuestas y modalidades exactas del caso particular', () => {
    expect(RESPUESTAS_PARTICULAR).toEqual(['pendiente', 'aceptado', 'rechazado'])
    expect(MODALIDADES_CONTACTO).toEqual(['whatsapp', 'telefono', 'email', 'presencial'])
  })
})

describe('consultas y alta', () => {
  it('lista ambos tipos sin convertir los null de particular en datos de seguro', async () => {
    select.mockResolvedValue({ data: [casoSeguro, casoParticular], error: null })

    const casos = await listCasos()

    expect(from).toHaveBeenCalledWith('casos')
    expect(select).toHaveBeenCalledWith('*')
    expect(casos).toEqual([casoSeguro, casoParticular])
    expect(casos[1].aseguradora).toBeNull()
  })

  it('obtiene un caso por id', async () => {
    single.mockResolvedValue({ data: casoParticular, error: null })

    await expect(getCaso('particular-1')).resolves.toEqual(casoParticular)
    expect(select).toHaveBeenCalledWith('*')
    expect(eq).toHaveBeenCalledWith('id', 'particular-1')
  })

  it.each([
    ['seguro', crearSeguro, casoSeguro],
    ['particular', crearParticular, casoParticular],
  ] as const)('crea el canal %s con su payload discriminado', async (_canal, payload, resultado) => {
    single.mockResolvedValue({ data: resultado, error: null })

    await expect(createCaso(payload)).resolves.toEqual(resultado)
    expect(insert).toHaveBeenCalledWith(
      payload.canal === 'particular'
        ? { ...payload, respuesta_particular: 'pendiente' }
        : payload
    )
  })

  it('no inventa campos de seguro al crear un particular', async () => {
    await createCaso(crearParticular)

    const payload = insert.mock.calls[0][0]
    expect(payload).not.toHaveProperty('aseguradora')
    expect(payload).not.toHaveProperty('numero_siniestro')
    expect(payload).not.toHaveProperty('denuncia')
  })

  it('propaga errores de Supabase', async () => {
    const error = new Error('fallo de base')
    select.mockResolvedValue({ data: null, error })

    await expect(listCasos()).rejects.toBe(error)
  })
})

describe('operaciones de dominio', () => {
  it('guarda la inspeccion y registra el instante de persistencia', async () => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2026-09-08T12:30:00.000Z'))

    await guardarInspeccion('caso-1', ['capot'])

    expect(update).toHaveBeenCalledWith({
      danos_zonas: ['capot'],
      inspeccion_guardada_at: '2026-09-08T12:30:00.000Z',
    })
  })

  it('acepta un particular en una sola escritura consistente', async () => {
    await aceptarCasoParticular('caso-1')

    expect(update).toHaveBeenCalledWith({
      respuesta_particular: 'aceptado',
      estado: 'aprobado',
    })
  })

  it('rechaza un particular con contacto y seguimiento en una sola escritura', async () => {
    await rechazarCasoParticular('caso-1', {
      modalidad_contacto: 'whatsapp',
      seguimiento_observaciones: 'Volver a llamar en octubre',
    })

    expect(update).toHaveBeenCalledWith({
      respuesta_particular: 'rechazado',
      modalidad_contacto: 'whatsapp',
      seguimiento_observaciones: 'Volver a llamar en octubre',
      estado: 'cancelado',
    })
  })

  it('normaliza a null las observaciones omitidas al rechazar', async () => {
    await rechazarCasoParticular('caso-1', { modalidad_contacto: 'telefono' })

    expect(update).toHaveBeenCalledWith(
      expect.objectContaining({ seguimiento_observaciones: null })
    )
  })

  it('coordina el turno con la fecha y el estado en la misma escritura', async () => {
    await coordinarTurno('caso-1', '2026-09-10T14:00:00.000Z')

    expect(update).toHaveBeenCalledWith({
      turno_fecha: '2026-09-10T14:00:00.000Z',
      estado: 'turno coordinado',
    })
  })

  it('conserva updateCasoEstado como compatibilidad temporal', async () => {
    await updateCasoEstado('caso-1', 'ingresado', { orden_ingreso_numero: 'OI-10' })

    expect(update).toHaveBeenCalledWith({
      orden_ingreso_numero: 'OI-10',
      estado: 'ingresado',
    })
  })
})
