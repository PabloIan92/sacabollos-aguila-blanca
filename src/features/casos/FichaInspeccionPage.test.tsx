import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { MemoryRouter, Routes, Route } from 'react-router'
import { FichaInspeccionPage } from './FichaInspeccionPage'
import {
  aceptarCasoParticular,
  getCaso,
  guardarInspeccion,
  rechazarCasoParticular,
  updateCasoEstado,
} from './api'
import { useCasoFotos } from './hooks/useCasoFotos'
import { ZONAS_DANO } from './types'
import type { Caso, CasoParticular, CasoSeguro } from './types'

vi.mock('./api')
vi.mock('./hooks/useCasoFotos')

const mockedGetCaso = vi.mocked(getCaso)
const mockedGuardarInspeccion = vi.mocked(guardarInspeccion)
const mockedAceptarCasoParticular = vi.mocked(aceptarCasoParticular)
const mockedRechazarCasoParticular = vi.mocked(rechazarCasoParticular)
const mockedUpdateCasoEstado = vi.mocked(updateCasoEstado)
const mockedUseCasoFotos = vi.mocked(useCasoFotos)

const uploadFoto = vi.fn()
const listFotos = vi.fn()

function caso(overrides: Partial<CasoSeguro> = {}): Caso {
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
    danos_zonas: [],
    turno_fecha: null,
    orden_ingreso_numero: null,
    ingresado_at: null,
    estado: 'borrador',
    created_at: '2026-01-01',
    updated_at: '2026-01-01',
    estado_changed_at: '2026-01-01',
    created_by: 'user-1',
    ...overrides,
  }
}

function casoParticular(overrides: Partial<CasoParticular> = {}): CasoParticular {
  return {
    ...caso(),
    canal: 'particular',
    aseguradora: null,
    numero_siniestro: null,
    denuncia: null,
    productor_nombre: null,
    productor_telefono: null,
    presupuesto_monto: 180000,
    presupuesto_observaciones: null,
    respuesta_particular: 'pendiente',
    modalidad_contacto: null,
    seguimiento_observaciones: null,
    inspeccion_guardada_at: null,
    ...overrides,
  }
}

function renderPage() {
  return render(
    <MemoryRouter initialEntries={['/casos/caso-1/ficha-inspeccion']}>
      <Routes>
        <Route path="/casos/:id/ficha-inspeccion" element={<FichaInspeccionPage />} />
        <Route path="/casos" element={<div>LISTADO DE CASOS</div>} />
      </Routes>
    </MemoryRouter>
  )
}

async function subirLasCuatroFotos() {
  for (const angulo of ['frente', 'atras', 'lateral-izquierdo', 'lateral-derecho']) {
    const file = new File(['contenido'], `${angulo}.jpg`, { type: 'image/jpeg' })
    const etiqueta = angulo.replace(/-/g, ' ')
    const input = screen.getByLabelText(`Foto ${etiqueta}`)
    await waitFor(() => expect(input).toBeEnabled())
    fireEvent.change(input, { target: { files: [file] } })
    await screen.findByAltText(`Preview ${etiqueta}`)
  }

  await waitFor(() =>
    expect(screen.getByRole('button', { name: 'Guardar ficha de inspección' })).not.toBeDisabled()
  )
}

beforeEach(() => {
  vi.clearAllMocks()
  URL.createObjectURL = vi.fn(() => 'blob:mock-url')
  mockedGetCaso.mockResolvedValue(caso())
  mockedGuardarInspeccion.mockResolvedValue(caso({ inspeccion_guardada_at: '2026-09-08' }))
  mockedAceptarCasoParticular.mockResolvedValue(
    casoParticular({ respuesta_particular: 'aceptado', estado: 'aprobado' })
  )
  mockedRechazarCasoParticular.mockResolvedValue(
    casoParticular({
      respuesta_particular: 'rechazado',
      modalidad_contacto: 'whatsapp',
      estado: 'cancelado',
    })
  )
  mockedUpdateCasoEstado.mockResolvedValue(caso())
  uploadFoto.mockResolvedValue('casos/caso-1/frente.webp')
  listFotos.mockResolvedValue({})
  mockedUseCasoFotos.mockReturnValue({ uploadFoto, listFotos })
})

describe('FichaInspeccionPage', () => {
  it('renderiza exactamente las 10 zonas de ZONAS_DANO', async () => {
    renderPage()
    await screen.findByText('Ficha de inspección')
    expect(screen.getAllByRole('checkbox')).toHaveLength(ZONAS_DANO.length)
  })

  it('renderiza exactamente 4 dropzones, una por ángulo', async () => {
    renderPage()
    await screen.findByText('Ficha de inspección')
    expect(screen.getAllByLabelText(/^Foto /)).toHaveLength(4)
  })

  it('el botón de guardar queda deshabilitado hasta subir las 4 fotos', async () => {
    renderPage()
    await screen.findByText('Ficha de inspección')
    const guardar = screen.getByRole('button', { name: 'Guardar ficha de inspección' })
    expect(guardar).toBeDisabled()

    await subirLasCuatroFotos()
    expect(guardar).not.toBeDisabled()
  })

  it('guarda la inspección mediante la API de dominio y conserva el flujo Seguro', async () => {
    renderPage()
    await screen.findByText('Ficha de inspección')
    expect(screen.getByRole('button', { name: 'Marcar como enviado a la aseguradora' })).toBeDisabled()

    await subirLasCuatroFotos()
    fireEvent.click(screen.getByRole('button', { name: 'Guardar ficha de inspección' }))
    await waitFor(() =>
      expect(mockedGuardarInspeccion).toHaveBeenCalledWith('caso-1', [])
    )

    const marcarEnviado = await waitFor(() => {
      const boton = screen.getByRole('button', { name: 'Marcar como enviado a la aseguradora' })
      expect(boton).not.toBeDisabled()
      return boton
    })

    fireEvent.click(marcarEnviado)
    await waitFor(() =>
      expect(mockedUpdateCasoEstado).toHaveBeenCalledWith('caso-1', 'enviado a la aseguradora')
    )
    expect(await screen.findByText('LISTADO DE CASOS')).toBeInTheDocument()
  })

  it('recupera una inspección guardada y habilita la acción de Seguro después de recargar', async () => {
    mockedGetCaso.mockResolvedValue(caso({ inspeccion_guardada_at: '2026-09-08T10:00:00Z' }))
    listFotos.mockResolvedValue({
      frente: 'https://storage.example/frente.webp',
      atras: 'https://storage.example/atras.webp',
      'lateral-izquierdo': 'https://storage.example/izquierdo.webp',
      'lateral-derecho': 'https://storage.example/derecho.webp',
    })
    renderPage()

    expect(
      await screen.findByRole('button', { name: 'Marcar como enviado a la aseguradora' })
    ).not.toBeDisabled()
  })

  it('permite aceptar un caso Particular guardado mediante la API de dominio', async () => {
    mockedGetCaso.mockResolvedValue(
      casoParticular({ inspeccion_guardada_at: '2026-09-08T10:00:00Z' })
    )
    renderPage()

    expect(await screen.findByRole('button', { name: 'Cliente aceptó' })).toBeEnabled()
    expect(screen.queryByText(/Mandá el mail a la aseguradora/)).not.toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: 'Cliente aceptó' }))

    await waitFor(() => expect(mockedAceptarCasoParticular).toHaveBeenCalledWith('caso-1'))
    expect(await screen.findByText('LISTADO DE CASOS')).toBeInTheDocument()
  })

  it('exige modalidad para rechazar un Particular y persiste modalidad y observaciones', async () => {
    mockedGetCaso.mockResolvedValue(
      casoParticular({ inspeccion_guardada_at: '2026-09-08T10:00:00Z' })
    )
    renderPage()
    await screen.findByRole('button', { name: 'Cliente no aceptó' })

    fireEvent.click(screen.getByRole('button', { name: 'Cliente no aceptó' }))
    expect(screen.getByRole('alert')).toHaveTextContent(
      'Seleccioná una modalidad de contacto para registrar el rechazo.'
    )
    expect(mockedRechazarCasoParticular).not.toHaveBeenCalled()

    fireEvent.change(screen.getByLabelText('Modalidad de contacto'), {
      target: { value: 'whatsapp' },
    })
    fireEvent.change(screen.getByLabelText('Observaciones de seguimiento'), {
      target: { value: 'Volver a contactar el viernes' },
    })
    fireEvent.click(screen.getByRole('button', { name: 'Cliente no aceptó' }))

    await waitFor(() =>
      expect(mockedRechazarCasoParticular).toHaveBeenCalledWith('caso-1', {
        modalidad_contacto: 'whatsapp',
        seguimiento_observaciones: 'Volver a contactar el viernes',
      })
    )
    expect(await screen.findByText('LISTADO DE CASOS')).toBeInTheDocument()
  })

  it('sale del error de carga y permite reintentar', async () => {
    mockedGetCaso
      .mockRejectedValueOnce(new Error('network error'))
      .mockResolvedValueOnce(caso())
    renderPage()

    expect(await screen.findByRole('alert')).toHaveTextContent(
      'No se pudo cargar el caso. Intentá nuevamente.'
    )
    expect(screen.queryByText('Cargando…')).not.toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: 'Reintentar' }))

    expect(await screen.findByText('Ficha de inspección')).toBeInTheDocument()
    expect(mockedGetCaso).toHaveBeenCalledTimes(2)
  })

  it('sale del error de guardado, conserva la ficha y permite reintentar', async () => {
    mockedGuardarInspeccion
      .mockRejectedValueOnce(new Error('save error'))
      .mockResolvedValueOnce(caso({ inspeccion_guardada_at: '2026-09-08' }))
    renderPage()
    await screen.findByText('Ficha de inspección')
    await subirLasCuatroFotos()
    const guardar = screen.getByRole('button', { name: 'Guardar ficha de inspección' })

    fireEvent.click(guardar)
    expect(await screen.findByRole('alert')).toHaveTextContent(
      'No se pudo guardar la ficha. Intentá nuevamente.'
    )
    expect(guardar).toBeEnabled()
    fireEvent.click(guardar)

    await waitFor(() => expect(mockedGuardarInspeccion).toHaveBeenCalledTimes(2))
    expect(screen.getByRole('button', { name: 'Marcar como enviado a la aseguradora' })).toBeEnabled()
  })

  it('sale de errores de decisión Particular y permite reintentar', async () => {
    mockedGetCaso.mockResolvedValue(
      casoParticular({ inspeccion_guardada_at: '2026-09-08T10:00:00Z' })
    )
    mockedAceptarCasoParticular
      .mockRejectedValueOnce(new Error('decision error'))
      .mockResolvedValueOnce(casoParticular({ estado: 'aprobado' }))
    renderPage()
    const aceptar = await screen.findByRole('button', { name: 'Cliente aceptó' })

    fireEvent.click(aceptar)
    expect(await screen.findByRole('alert')).toHaveTextContent(
      'No se pudo registrar la decisión. Intentá nuevamente.'
    )
    expect(aceptar).toBeEnabled()
    fireEvent.click(aceptar)

    await waitFor(() => expect(mockedAceptarCasoParticular).toHaveBeenCalledTimes(2))
    expect(await screen.findByText('LISTADO DE CASOS')).toBeInTheDocument()
  })

  it('sale del error de rechazo Particular y conserva los datos para reintentar', async () => {
    mockedGetCaso.mockResolvedValue(
      casoParticular({ inspeccion_guardada_at: '2026-09-08T10:00:00Z' })
    )
    mockedRechazarCasoParticular
      .mockRejectedValueOnce(new Error('decision error'))
      .mockResolvedValueOnce(casoParticular({ estado: 'cancelado' }))
    renderPage()
    await screen.findByRole('button', { name: 'Cliente no aceptó' })
    fireEvent.change(screen.getByLabelText('Modalidad de contacto'), {
      target: { value: 'telefono' },
    })
    fireEvent.change(screen.getByLabelText('Observaciones de seguimiento'), {
      target: { value: 'Pidió una nueva llamada' },
    })

    fireEvent.click(screen.getByRole('button', { name: 'Cliente no aceptó' }))
    expect(await screen.findByRole('alert')).toHaveTextContent(
      'No se pudo registrar la decisión. Intentá nuevamente.'
    )
    expect(screen.getByLabelText('Modalidad de contacto')).toHaveValue('telefono')
    expect(screen.getByLabelText('Observaciones de seguimiento')).toHaveValue(
      'Pidió una nueva llamada'
    )
    fireEvent.click(screen.getByRole('button', { name: 'Cliente no aceptó' }))

    await waitFor(() => expect(mockedRechazarCasoParticular).toHaveBeenCalledTimes(2))
    expect(await screen.findByText('LISTADO DE CASOS')).toBeInTheDocument()
  })

  it('sale del error al marcar Seguro y permite reintentar', async () => {
    mockedGetCaso.mockResolvedValue(caso({ inspeccion_guardada_at: '2026-09-08T10:00:00Z' }))
    mockedUpdateCasoEstado
      .mockRejectedValueOnce(new Error('transition error'))
      .mockResolvedValueOnce(caso({ estado: 'enviado a la aseguradora' }))
    renderPage()
    const enviar = await screen.findByRole('button', {
      name: 'Marcar como enviado a la aseguradora',
    })

    fireEvent.click(enviar)
    expect(await screen.findByRole('alert')).toHaveTextContent(
      'No se pudo marcar el caso como enviado. Intentá nuevamente.'
    )
    expect(enviar).toBeEnabled()
    fireEvent.click(enviar)

    await waitFor(() => expect(mockedUpdateCasoEstado).toHaveBeenCalledTimes(2))
    expect(await screen.findByText('LISTADO DE CASOS')).toBeInTheDocument()
  })
})
