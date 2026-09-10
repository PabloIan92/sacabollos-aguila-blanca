import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { MemoryRouter, Routes, Route } from 'react-router'
import { AuthContext } from '../../auth/AuthProvider'
import { CasoDetailPage } from './CasoDetailPage'
import { coordinateCasoTurno, getCaso, markSeguroApproved } from './api'
import { iniciarReclamoAseguradora } from '../facturacion/api'
import type { Caso } from './types'

vi.mock('./api', () => ({
  coordinateCasoTurno: vi.fn(),
  getCaso: vi.fn(),
  markSeguroApproved: vi.fn(),
}))

vi.mock('../facturacion/api', () => ({
  iniciarReclamoAseguradora: vi.fn(),
}))

const mockedGetCaso = vi.mocked(getCaso)
const mockedMarkSeguroApproved = vi.mocked(markSeguroApproved)
const mockedCoordinateCasoTurno = vi.mocked(coordinateCasoTurno)
const mockedIniciarReclamo = vi.mocked(iniciarReclamoAseguradora)

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
    repuesto_pendiente: null,
    reparacion_iniciada_at: null,
    reparacion_lista_at: null,
    firmado_at: null,
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
        <Route path="/casos/:id/facturacion" element={<div>FACTURACION PLACEHOLDER</div>} />
      </Routes>
    </MemoryRouter>
  )
}

function renderPageWithRole(id = 'caso-1', role: 'dueno' | 'recepcion' | 'taller' = 'recepcion') {
  return render(
    <AuthContext.Provider
      value={{
        session: {} as any,
        profile: { id: 'u-1', full_name: 'Usuario Test', role },
        loading: false,
        profileError: false,
        retryProfile: () => {},
      }}
    >
      <MemoryRouter initialEntries={[`/casos/${id}`]}>
        <Routes>
          <Route path="/casos/:id" element={<CasoDetailPage />} />
          <Route path="/casos/:id/ficha-ingreso" element={<div>FICHA INGRESO PLACEHOLDER</div>} />
          <Route path="/casos/:id/facturacion" element={<div>FACTURACION PLACEHOLDER</div>} />
        </Routes>
      </MemoryRouter>
    </AuthContext.Provider>
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

  it('para un caso de seguro en facturado, permite a recepción iniciar reclamo con motivo', async () => {
    mockedGetCaso.mockResolvedValue(
      caso({ canal: 'seguro', estado: 'facturado' })
    )
    mockedIniciarReclamo.mockResolvedValue(
      caso({ canal: 'seguro', estado: 'reclamo a la compañía', motivo_reclamo: 'Demora en pago' })
    )

    renderPageWithRole('caso-1', 'recepcion')

    const btnIniciar = await screen.findByRole('button', { name: /iniciar reclamo a aseguradora/i })
    fireEvent.click(btnIniciar)

    const inputMotivo = screen.getByLabelText(/motivo del reclamo/i)
    fireEvent.change(inputMotivo, { target: { value: 'Demora en pago' } })

    const btnConfirmar = screen.getByRole('button', { name: /confirmar reclamo/i })
    fireEvent.click(btnConfirmar)

    await waitFor(() => {
      expect(mockedIniciarReclamo).toHaveBeenCalledWith('caso-1', 'Demora en pago')
    })
  })

  it('para un caso en reclamo a la compañía, muestra el motivo del reclamo', async () => {
    mockedGetCaso.mockResolvedValue(
      caso({
        canal: 'seguro',
        estado: 'reclamo a la compañía',
        motivo_reclamo: 'Falta liquidar deducible',
      })
    )

    renderPageWithRole('caso-1', 'recepcion')

    expect(await screen.findByText(/Falta liquidar deducible/i)).toBeInTheDocument()
    expect(screen.getByText(/Caso en reclamo a la aseguradora/i)).toBeInTheDocument()
  })

  it('para rol dueño, muestra botón a Gestión de Facturación y navega', async () => {
    mockedGetCaso.mockResolvedValue(caso({ estado: 'firmado' }))

    renderPageWithRole('caso-1', 'dueno')

    const btnFacturacion = await screen.findByRole('button', { name: /gestión de facturación y cobranza/i })
    fireEvent.click(btnFacturacion)

    await screen.findByText('FACTURACION PLACEHOLDER')
  })

  it('para rol taller, no muestra controles de reclamo ni facturación', async () => {
    mockedGetCaso.mockResolvedValue(
      caso({ canal: 'seguro', estado: 'facturado' })
    )

    renderPageWithRole('caso-1', 'taller')

    await screen.findByText('Caso AA123BB')
    expect(screen.queryByRole('button', { name: /iniciar reclamo a aseguradora/i })).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /gestión de facturación/i })).not.toBeInTheDocument()
  })
})
