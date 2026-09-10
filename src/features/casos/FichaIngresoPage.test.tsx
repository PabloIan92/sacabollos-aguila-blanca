import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { MemoryRouter, Routes, Route } from 'react-router'
import { FichaIngresoPage } from './FichaIngresoPage'
import { getCaso, registerCasoIngreso } from './api'
import { useCasoFotos } from './hooks/useCasoFotos'
import type { Caso } from './types'

vi.mock('./api', () => ({
  getCaso: vi.fn(),
  registerCasoIngreso: vi.fn(),
}))
vi.mock('./hooks/useCasoFotos', () => ({ useCasoFotos: vi.fn() }))

const mockedGetCaso = vi.mocked(getCaso)
const mockedRegisterCasoIngreso = vi.mocked(registerCasoIngreso)
const mockedUseCasoFotos = vi.mocked(useCasoFotos)

const uploadFoto = vi.fn()
const listFotos = vi.fn()

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
    denuncia: 'x',
    productor_nombre: null,
    productor_telefono: null,
    presupuesto_monto: null,
    presupuesto_respuesta: null,
    presupuesto_observaciones: null,
    modalidad_contacto: null,
    seguimiento_observaciones: null,
    inspeccion_guardada_at: null,
    danos_zonas: [],
    turno_fecha: '2026-03-01T10:30:00.000Z',
    orden_ingreso_numero: null,
    ingresado_at: null,
    repuesto_pendiente: null,
    reparacion_iniciada_at: null,
    reparacion_lista_at: null,
    firmado_at: null,
    estado: 'turno coordinado',
    created_at: '2026-01-01',
    updated_at: '2026-01-01',
    estado_changed_at: '2026-01-01',
    created_by: 'user-1',
    ...overrides,
  }
}

function renderPage() {
  return render(
    <MemoryRouter initialEntries={['/casos/caso-1/ficha-ingreso']}>
      <Routes>
        <Route path="/casos/:id/ficha-ingreso" element={<FichaIngresoPage />} />
        <Route path="/casos" element={<div>LISTADO DE CASOS</div>} />
      </Routes>
    </MemoryRouter>
  )
}

const ANGULOS_INGRESO = ['ingreso-frente', 'ingreso-atras', 'ingreso-lateral-izquierdo', 'ingreso-lateral-derecho']

async function subirLasCuatroFotosDeIngreso() {
  for (const angulo of ANGULOS_INGRESO) {
    const file = new File(['contenido'], `${angulo}.jpg`, { type: 'image/jpeg' })
    const etiqueta = angulo.replace(/-/g, ' ')
    const input = screen.getByLabelText(`Foto ${etiqueta}`)
    fireEvent.change(input, { target: { files: [file] } })
    await screen.findByAltText(`Preview ${etiqueta}`)
  }
}

beforeEach(() => {
  vi.clearAllMocks()
  URL.createObjectURL = vi.fn(() => 'blob:mock-url')
  mockedGetCaso.mockResolvedValue(caso())
  mockedRegisterCasoIngreso.mockResolvedValue(caso({ estado: 'ingresado' }))
  uploadFoto.mockResolvedValue('casos/caso-1/ingreso-frente.webp')
  listFotos.mockResolvedValue({})
  mockedUseCasoFotos.mockReturnValue({ uploadFoto, listFotos })
})

describe('FichaIngresoPage', () => {
  it('en un estado distinto a "turno coordinado" muestra el aviso y no el formulario', async () => {
    mockedGetCaso.mockResolvedValue(caso({ estado: 'aprobado' }))
    renderPage()

    expect(await screen.findByText('Este caso todavía no tiene un turno coordinado.')).toBeInTheDocument()
    expect(screen.queryByLabelText('Número de orden de ingreso')).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Registrar ingreso' })).not.toBeInTheDocument()
  })

  it('llama a FotoUploader con los 4 ángulos prefijados ingreso-', async () => {
    renderPage()
    await screen.findByText('Ficha de ingreso')
    expect(screen.getAllByLabelText(/^Foto ingreso /)).toHaveLength(4)
  })

  it('"Registrar ingreso" queda deshabilitado hasta subir las 4 fotos y completar la orden', async () => {
    renderPage()
    await screen.findByText('Ficha de ingreso')
    const boton = screen.getByRole('button', { name: 'Registrar ingreso' })
    expect(boton).toBeDisabled()

    await subirLasCuatroFotosDeIngreso()
    expect(boton).toBeDisabled()

    fireEvent.change(screen.getByLabelText('Número de orden de ingreso'), { target: { value: 'ORD-99' } })
    expect(boton).not.toBeDisabled()
  })

  it('al confirmar, llama a registerCasoIngreso una sola vez y navega a /casos', async () => {
    renderPage()
    await screen.findByText('Ficha de ingreso')

    await subirLasCuatroFotosDeIngreso()
    fireEvent.change(screen.getByLabelText('Número de orden de ingreso'), { target: { value: 'ORD-99' } })

    const boton = await waitFor(() => {
      const b = screen.getByRole('button', { name: 'Registrar ingreso' })
      expect(b).not.toBeDisabled()
      return b
    })

    fireEvent.click(boton)

    await waitFor(() =>
      expect(mockedRegisterCasoIngreso).toHaveBeenCalledWith(
        'caso-1',
        'ORD-99',
        expect.any(String)
      )
    )
    expect(mockedRegisterCasoIngreso).toHaveBeenCalledTimes(1)
    expect(await screen.findByText('LISTADO DE CASOS')).toBeInTheDocument()
  })

  it('rehabilita el botón y conserva la orden cuando falla el registro', async () => {
    mockedRegisterCasoIngreso.mockRejectedValue(new Error('sin red'))
    renderPage()
    await screen.findByText('Ficha de ingreso')

    await subirLasCuatroFotosDeIngreso()
    const orden = screen.getByLabelText('Número de orden de ingreso')
    fireEvent.change(orden, { target: { value: 'ORD-ERROR' } })
    fireEvent.click(screen.getByRole('button', { name: 'Registrar ingreso' }))

    expect(await screen.findByRole('alert')).toHaveTextContent('No se pudo registrar el ingreso')
    expect(screen.getByRole('button', { name: 'Registrar ingreso' })).not.toBeDisabled()
    expect(orden).toHaveValue('ORD-ERROR')
  })

  it('permite reintentar cuando falla la carga del caso', async () => {
    mockedGetCaso
      .mockRejectedValueOnce(new Error('sin red'))
      .mockResolvedValueOnce(caso())
    renderPage()

    expect(await screen.findByRole('alert')).toHaveTextContent('No se pudo cargar el caso')
    fireEvent.click(screen.getByRole('button', { name: 'Reintentar' }))
    expect(await screen.findByText('Ficha de ingreso')).toBeInTheDocument()
  })
})
