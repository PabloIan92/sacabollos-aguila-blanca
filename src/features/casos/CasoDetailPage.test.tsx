import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { MemoryRouter, Routes, Route } from 'react-router'
import { CasoDetailPage } from './CasoDetailPage'
import { coordinateCasoTurno, getCaso, markSeguroApproved } from './api'
import type { Caso } from './types'

vi.mock('./api', () => ({
  coordinateCasoTurno: vi.fn(),
  getCaso: vi.fn(),
  markSeguroApproved: vi.fn(),
}))

const mockedGetCaso = vi.mocked(getCaso)
const mockedMarkSeguroApproved = vi.mocked(markSeguroApproved)
const mockedCoordinateCasoTurno = vi.mocked(coordinateCasoTurno)

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
    turno_fecha: null,
    orden_ingreso_numero: null,
    ingresado_at: null,
    estado: 'enviado a la aseguradora',
    created_at: '2026-01-01',
    updated_at: '2026-01-01',
    estado_changed_at: '2026-01-01',
    created_by: 'user-1',
    ...overrides,
  }
}

function renderPage(id = 'caso-1') {
  return render(
    <MemoryRouter initialEntries={[`/casos/${id}`]}>
      <Routes>
        <Route path="/casos/:id" element={<CasoDetailPage />} />
        <Route path="/casos/:id/ficha-ingreso" element={<div>FICHA INGRESO PLACEHOLDER</div>} />
      </Routes>
    </MemoryRouter>
  )
}

beforeEach(() => {
  vi.clearAllMocks()
  mockedGetCaso.mockResolvedValue(caso())
})

describe('CasoDetailPage', () => {
  it('en "enviado a la aseguradora" muestra el botón de orden recibida y avanza a aprobado', async () => {
    mockedGetCaso.mockResolvedValue(caso({ estado: 'enviado a la aseguradora' }))
    mockedMarkSeguroApproved.mockResolvedValue(caso({ estado: 'aprobado' }))
    renderPage()

    const boton = await screen.findByRole('button', { name: 'Marcar orden de trabajo recibida' })
    expect(screen.queryByLabelText('Turno')).not.toBeInTheDocument()

    fireEvent.click(boton)
    await waitFor(() => expect(mockedMarkSeguroApproved).toHaveBeenCalledWith('caso-1'))
  })

  it('en "aprobado" muestra el input de turno y confirma con el ISO elegido', async () => {
    mockedGetCaso.mockResolvedValue(caso({ estado: 'aprobado' }))
    mockedCoordinateCasoTurno.mockResolvedValue(caso({ estado: 'turno coordinado' }))
    renderPage()

    const input = await screen.findByLabelText('Turno')
    expect(
      screen.queryByRole('button', { name: 'Marcar orden de trabajo recibida' })
    ).not.toBeInTheDocument()

    const confirmar = screen.getByRole('button', { name: 'Confirmar turno' })
    expect(confirmar).toBeDisabled()

    fireEvent.change(input, { target: { value: '2026-03-01T10:30' } })
    expect(confirmar).not.toBeDisabled()

    fireEvent.click(confirmar)
    await waitFor(() =>
      expect(mockedCoordinateCasoTurno).toHaveBeenCalledWith(
        'caso-1',
        new Date('2026-03-01T10:30').toISOString()
      )
    )
  })

  it('muestra solo los datos correspondientes al canal particular', async () => {
    mockedGetCaso.mockResolvedValue(
      caso({
        canal: 'particular',
        aseguradora: null,
        numero_siniestro: null,
        denuncia: null,
        presupuesto_monto: 125000.5,
        presupuesto_respuesta: 'aceptado',
        estado: 'aprobado',
      })
    )
    renderPage()

    expect(await screen.findByText(/Particular/)).toBeInTheDocument()
    expect(screen.getByText(/Presupuesto:/)).toBeInTheDocument()
    expect(screen.getByText(/125/)).toBeInTheDocument()
    expect(screen.queryByText(/Aseguradora:/)).not.toBeInTheDocument()
    expect(screen.queryByText(/Siniestro:/)).not.toBeInTheDocument()
    expect(screen.getByLabelText('Turno')).toBeInTheDocument()
  })

  it('muestra la modalidad definida cuando el particular fue rechazado', async () => {
    mockedGetCaso.mockResolvedValue(
      caso({
        canal: 'particular',
        aseguradora: null,
        numero_siniestro: null,
        denuncia: null,
        presupuesto_monto: 50000,
        presupuesto_respuesta: 'rechazado',
        modalidad_contacto: 'whatsapp',
        estado: 'cancelado',
      })
    )
    renderPage()

    expect(await screen.findByText(/WhatsApp/)).toBeInTheDocument()
  })

  it('rehabilita el turno y conserva la fecha cuando falla la coordinación', async () => {
    mockedGetCaso.mockResolvedValue(caso({ estado: 'aprobado' }))
    mockedCoordinateCasoTurno.mockRejectedValue(new Error('sin red'))
    renderPage()

    const input = await screen.findByLabelText('Turno')
    fireEvent.change(input, { target: { value: '2026-03-01T10:30' } })
    fireEvent.click(screen.getByRole('button', { name: 'Confirmar turno' }))

    expect(await screen.findByRole('alert')).toHaveTextContent('No se pudo coordinar el turno')
    expect(screen.getByRole('button', { name: 'Confirmar turno' })).not.toBeDisabled()
    expect(input).toHaveValue('2026-03-01T10:30')
  })

  it('permite reintentar cuando falla la carga del caso', async () => {
    mockedGetCaso
      .mockRejectedValueOnce(new Error('sin red'))
      .mockResolvedValueOnce(caso({ patente: 'RETRY01' }))
    renderPage()

    expect(await screen.findByRole('alert')).toHaveTextContent('No se pudo cargar el caso')
    fireEvent.click(screen.getByRole('button', { name: 'Reintentar' }))
    expect(await screen.findByText('Caso RETRY01')).toBeInTheDocument()
  })

  it('en "turno coordinado" muestra el botón de registrar ingreso y navega a ficha de ingreso', async () => {
    mockedGetCaso.mockResolvedValue(caso({ estado: 'turno coordinado' }))
    renderPage()

    const boton = await screen.findByRole('button', { name: 'Registrar ingreso al taller' })
    expect(
      screen.queryByRole('button', { name: 'Marcar orden de trabajo recibida' })
    ).not.toBeInTheDocument()
    expect(screen.queryByLabelText('Turno')).not.toBeInTheDocument()

    fireEvent.click(boton)
    await screen.findByText('FICHA INGRESO PLACEHOLDER')
  })

  it('en cualquier otro estado no muestra ningún control de transición', async () => {
    mockedGetCaso.mockResolvedValue(caso({ estado: 'ingresado' }))
    renderPage()

    await screen.findByText('Caso AA123BB')
    expect(
      screen.queryByRole('button', { name: 'Marcar orden de trabajo recibida' })
    ).not.toBeInTheDocument()
    expect(screen.queryByLabelText('Turno')).not.toBeInTheDocument()
  })
})
