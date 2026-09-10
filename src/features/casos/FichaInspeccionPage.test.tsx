import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { MemoryRouter, Routes, Route } from 'react-router'
import { FichaInspeccionPage } from './FichaInspeccionPage'
import {
  acceptParticular,
  getCaso,
  markSeguroSent,
  rejectParticular,
  saveCasoInspection,
} from './api'
import { useCasoFotos } from './hooks/useCasoFotos'
import { ZONAS_DANO } from './types'
import type { Caso } from './types'

vi.mock('./api')
vi.mock('./hooks/useCasoFotos')

const mockedGetCaso = vi.mocked(getCaso)
const mockedSaveCasoInspection = vi.mocked(saveCasoInspection)
const mockedMarkSeguroSent = vi.mocked(markSeguroSent)
const mockedAcceptParticular = vi.mocked(acceptParticular)
const mockedRejectParticular = vi.mocked(rejectParticular)
const mockedUseCasoFotos = vi.mocked(useCasoFotos)

const uploadFoto = vi.fn()

function caso(overrides: Partial<Caso> = {}): Caso {
  return {
    id: 'caso-1',
    canal: 'seguro',
    patente: 'AA123BB',
    marca: null,
    modelo: null,
    color: null,
    cliente_nombre: 'Juan Pérez',
    cliente_telefono: '1122334455',
    aseguradora: 'Sancor',
    numero_siniestro: 'S-1',
    denuncia: 'Choque en cruce',
    productor_nombre: null,
    productor_telefono: null,
    presupuesto_monto: null,
    presupuesto_respuesta: null,
    presupuesto_observaciones: null,
    modalidad_contacto: null,
    seguimiento_observaciones: null,
    inspeccion_guardada_at: null,
    danos_zonas: [],
    turno_fecha: null,
    orden_ingreso_numero: null,
    ingresado_at: null,
    repuesto_pendiente: null,
    reparacion_iniciada_at: null,
    reparacion_lista_at: null,
    firmado_at: null,
    estado: 'borrador',
    created_at: '2026-01-01',
    updated_at: '2026-01-01',
    estado_changed_at: '2026-01-01',
    created_by: 'user-1',
    ...overrides,
  }
}

function renderPage() {
  return render(
    <MemoryRouter initialEntries={['/casos/caso-1/ficha-inspeccion']}>
      <Routes>
        <Route path="/casos/:id/ficha-inspeccion" element={<FichaInspeccionPage />} />
        <Route path="/casos/:id" element={<div>DETALLE DEL CASO</div>} />
        <Route path="/casos" element={<div>LISTADO DE CASOS</div>} />
      </Routes>
    </MemoryRouter>
  )
}

async function subirLasCuatroFotos() {
  for (const angulo of ['frente', 'atras', 'lateral-izquierdo', 'lateral-derecho']) {
    const file = new File(['contenido'], `${angulo}.jpg`, { type: 'image/jpeg' })
    const etiqueta = angulo.replace(/-/g, ' ')
    fireEvent.change(screen.getByLabelText(`Foto ${etiqueta}`), { target: { files: [file] } })
    await screen.findByAltText(`Preview ${etiqueta}`)
  }

  await waitFor(() =>
    expect(screen.getByRole('button', { name: 'Guardar ficha de inspección' })).not.toBeDisabled()
  )
}

async function guardarFicha(resultado: Caso) {
  mockedSaveCasoInspection.mockResolvedValueOnce(resultado)
  await subirLasCuatroFotos()
  fireEvent.click(screen.getByRole('button', { name: 'Guardar ficha de inspección' }))
  await waitFor(() => expect(mockedSaveCasoInspection).toHaveBeenCalledWith('caso-1', []))
}

beforeEach(() => {
  vi.clearAllMocks()
  URL.createObjectURL = vi.fn(() => 'blob:mock-url')
  mockedGetCaso.mockResolvedValue(caso())
  mockedSaveCasoInspection.mockResolvedValue(caso({ inspeccion_guardada_at: '2026-09-08' }))
  mockedMarkSeguroSent.mockResolvedValue(caso({ estado: 'enviado a la aseguradora' }))
  mockedAcceptParticular.mockResolvedValue(caso({ canal: 'particular', estado: 'aprobado' }))
  mockedRejectParticular.mockResolvedValue(caso({ canal: 'particular', estado: 'cancelado' }))
  uploadFoto.mockResolvedValue('casos/caso-1/frente.webp')
  mockedUseCasoFotos.mockReturnValue({ uploadFoto, listFotos: vi.fn().mockResolvedValue({}) })
})

describe('FichaInspeccionPage', () => {
  it('renderiza exactamente las 10 zonas y las 4 fotos obligatorias', async () => {
    renderPage()
    await screen.findByText('Ficha de inspección')
    expect(screen.getAllByRole('checkbox')).toHaveLength(ZONAS_DANO.length)
    expect(screen.getAllByLabelText(/^Foto /)).toHaveLength(4)
  })

  it('no permite guardar hasta subir las 4 fotos', async () => {
    renderPage()
    await screen.findByText('Ficha de inspección')
    const guardar = screen.getByRole('button', { name: 'Guardar ficha de inspección' })
    expect(guardar).toBeDisabled()
    await subirLasCuatroFotos()
    expect(guardar).not.toBeDisabled()
  })

  it('Seguro usa las APIs específicas para guardar y marcar enviado', async () => {
    renderPage()
    await screen.findByText('Ficha de inspección')
    expect(screen.getByRole('button', { name: 'Marcar como enviado a la aseguradora' })).toBeDisabled()

    await guardarFicha(caso({ inspeccion_guardada_at: '2026-09-08' }))
    const enviar = await screen.findByRole('button', { name: 'Marcar como enviado a la aseguradora' })
    expect(enviar).not.toBeDisabled()
    fireEvent.click(enviar)

    await waitFor(() => expect(mockedMarkSeguroSent).toHaveBeenCalledWith('caso-1'))
    expect(await screen.findByText('LISTADO DE CASOS')).toBeInTheDocument()
  })

  it('rehidrata una inspección ya guardada desde inspeccion_guardada_at', async () => {
    mockedGetCaso.mockResolvedValue(caso({ inspeccion_guardada_at: '2026-09-08T12:00:00Z' }))
    renderPage()

    expect(
      await screen.findByRole('button', { name: 'Marcar como enviado a la aseguradora' })
    ).not.toBeDisabled()
  })

  it('Particular permite aceptar después de guardar y navega al turno reutilizable', async () => {
    mockedGetCaso.mockResolvedValue(caso({ canal: 'particular', presupuesto_monto: 125000 }))
    renderPage()
    await screen.findByText('Ficha de inspección')
    expect(screen.queryByText(/Mandá el mail a la aseguradora/)).not.toBeInTheDocument()

    await guardarFicha(
      caso({ canal: 'particular', presupuesto_monto: 125000, inspeccion_guardada_at: '2026-09-08' })
    )
    fireEvent.click(await screen.findByRole('button', { name: 'Aceptar presupuesto' }))

    await waitFor(() => expect(mockedAcceptParticular).toHaveBeenCalledWith('caso-1'))
    expect(await screen.findByText('DETALLE DEL CASO')).toBeInTheDocument()
  })

  it('Particular exige una de las cuatro modalidades exactas para rechazar y guarda observaciones', async () => {
    mockedGetCaso.mockResolvedValue(
      caso({ canal: 'particular', presupuesto_monto: 125000, inspeccion_guardada_at: '2026-09-08' })
    )
    renderPage()

    const modalidad = (await screen.findByLabelText('Modalidad de contacto')) as HTMLSelectElement
    expect(Array.from(modalidad.options).map((option) => option.value)).toEqual([
      '',
      'whatsapp',
      'telefono',
      'email',
      'presencial',
    ])
    const rechazar = screen.getByRole('button', { name: 'No acepta el presupuesto' })
    expect(rechazar).toBeDisabled()

    fireEvent.change(modalidad, { target: { value: 'telefono' } })
    fireEvent.change(screen.getByLabelText('Observaciones de seguimiento'), {
      target: { value: 'Prefiere que lo llamen por la tarde' },
    })
    expect(rechazar).not.toBeDisabled()
    fireEvent.click(rechazar)

    await waitFor(() =>
      expect(mockedRejectParticular).toHaveBeenCalledWith(
        'caso-1',
        'telefono',
        'Prefiere que lo llamen por la tarde'
      )
    )
    expect(await screen.findByText('LISTADO DE CASOS')).toBeInTheDocument()
  })

  it('recupera el formulario y muestra un error si falla el guardado', async () => {
    mockedSaveCasoInspection.mockRejectedValueOnce(new Error('network'))
    renderPage()
    await screen.findByText('Ficha de inspección')
    await subirLasCuatroFotos()

    fireEvent.click(screen.getByRole('button', { name: 'Guardar ficha de inspección' }))

    expect(await screen.findByRole('alert')).toHaveTextContent(
      'No pudimos guardar la ficha. Intentá nuevamente.'
    )
    expect(screen.getByRole('button', { name: 'Guardar ficha de inspección' })).not.toBeDisabled()
  })

  it('muestra un error recuperable si no puede cargar el caso', async () => {
    mockedGetCaso.mockRejectedValueOnce(new Error('network'))
    renderPage()

    expect(await screen.findByRole('alert')).toHaveTextContent('No se pudo cargar el caso.')
    mockedGetCaso.mockResolvedValueOnce(caso())
    fireEvent.click(screen.getByRole('button', { name: 'Reintentar' }))
    expect(await screen.findByText('Ficha de inspección')).toBeInTheDocument()
  })

  it('no vuelve a ofrecer decisiones si el particular ya salió de borrador', async () => {
    mockedGetCaso.mockResolvedValue(
      caso({
        canal: 'particular',
        estado: 'aprobado',
        presupuesto_monto: 125000,
        presupuesto_respuesta: 'aceptado',
        inspeccion_guardada_at: '2026-09-08',
      })
    )
    renderPage()

    await screen.findByText('Ficha de inspección')
    expect(screen.queryByRole('button', { name: 'Aceptar presupuesto' })).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'No acepta el presupuesto' })).not.toBeInTheDocument()
  })
})
