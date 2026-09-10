import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { MemoryRouter, Routes, Route } from 'react-router'
import { FichaFacturacionPage } from './FichaFacturacionPage'
import * as facturacionApi from './api'
import * as casosApi from '../casos/api'
import type { Caso } from '../casos/types'
import type { CasoFacturacion } from './types'

vi.mock('./api', () => ({
  getFacturacion: vi.fn(),
  saveFacturacion: vi.fn(),
  marcarComoFacturado: vi.fn(),
  marcarComoCobrado: vi.fn(),
  iniciarReclamoAseguradora: vi.fn(),
  resolverReclamo: vi.fn(),
}))

vi.mock('../casos/api', () => ({
  getCaso: vi.fn(),
}))

const mockedGetCaso = vi.mocked(casosApi.getCaso)
const mockedGetFacturacion = vi.mocked(facturacionApi.getFacturacion)
const mockedMarcarFacturado = vi.mocked(facturacionApi.marcarComoFacturado)
const mockedMarcarCobrado = vi.mocked(facturacionApi.marcarComoCobrado)
const mockedIniciarReclamo = vi.mocked(facturacionApi.iniciarReclamoAseguradora)
const mockedResolverReclamo = vi.mocked(facturacionApi.resolverReclamo)
const mockedSaveFacturacion = vi.mocked(facturacionApi.saveFacturacion)

function renderPage(casoId = 'caso-1') {
  return render(
    <MemoryRouter initialEntries={[`/casos/${casoId}/facturacion`]}>
      <Routes>
        <Route path="/casos/:id/facturacion" element={<FichaFacturacionPage />} />
      </Routes>
    </MemoryRouter>
  )
}

const mockCasoFirmado: Caso = {
  id: 'caso-1',
  patente: 'AA123BB',
  marca: 'Toyota',
  modelo: 'Hilux',
  color: 'Blanco',
  cliente_nombre: 'Juan Pérez',
  cliente_telefono: '1122334455',
  canal: 'particular',
  aseguradora: null,
  numero_siniestro: null,
  denuncia: null,
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
  firmado_at: '2026-09-08T10:00:00Z',
  estado: 'firmado',
  created_at: '2026-09-01T10:00:00Z',
  updated_at: '2026-09-08T10:00:00Z',
  estado_changed_at: '2026-09-08T10:00:00Z',
  created_by: 'user-1',
}

const mockFacturacion: CasoFacturacion = {
  caso_id: 'caso-1',
  monto_facturado: 250000,
  monto_cobrado: 100000,
  numero_factura: 'FC-0001-00001234',
  fecha_factura: '2026-09-08',
  fecha_cobro: '2026-09-09',
  metodo_pago: 'transferencia',
  notas_cobranza: 'Seña inicial recibida',
  created_at: '2026-09-08T10:00:00Z',
  updated_at: '2026-09-09T10:00:00Z',
}

describe('FichaFacturacionPage', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('muestra datos del caso y calcula diferencial en tiempo real', async () => {
    mockedGetCaso.mockResolvedValue(mockCasoFirmado)
    mockedGetFacturacion.mockResolvedValue(mockFacturacion)

    renderPage()

    await waitFor(() => {
      expect(screen.getByText('AA123BB')).toBeInTheDocument()
    })

    expect(screen.getByText('Juan Pérez')).toBeInTheDocument()
    expect(screen.getByDisplayValue('FC-0001-00001234')).toBeInTheDocument()
    expect(screen.getByDisplayValue('250000')).toBeInTheDocument()
    expect(screen.getByDisplayValue('100000')).toBeInTheDocument()

    // Diferencial: 250000 - 100000 = 150000
    expect(screen.getByTestId('diferencial-display')).toHaveTextContent(/150\.000/)

    // Cambiar monto cobrado a 250000
    const inputCobrado = screen.getByLabelText(/monto cobrado/i)
    fireEvent.change(inputCobrado, { target: { value: '250000' } })

    // Diferencial ahora debe ser 0
    expect(screen.getByTestId('diferencial-display')).toHaveTextContent(/0/)
  })

  it('permite facturar un caso en estado firmado llamando a marcarComoFacturado', async () => {
    mockedGetCaso.mockResolvedValue(mockCasoFirmado)
    mockedGetFacturacion.mockResolvedValue(null)
    mockedMarcarFacturado.mockResolvedValue({
      ...mockCasoFirmado,
      estado: 'facturado',
      facturado_at: '2026-09-10T12:00:00Z',
    })

    renderPage()

    await waitFor(() => {
      expect(screen.getByText('AA123BB')).toBeInTheDocument()
    })

    const inputFacturado = screen.getByLabelText(/monto facturado/i)
    const inputNumero = screen.getByLabelText(/número de factura/i)

    fireEvent.change(inputFacturado, { target: { value: '180000' } })
    fireEvent.change(inputNumero, { target: { value: 'FC-0001-00009999' } })

    const btnFacturar = screen.getByRole('button', { name: /marcar como facturado/i })
    fireEvent.click(btnFacturar)

    await waitFor(() => {
      expect(mockedMarcarFacturado).toHaveBeenCalledWith(
        'caso-1',
        expect.objectContaining({
          monto_facturado: 180000,
          numero_factura: 'FC-0001-00009999',
        })
      )
    })
  })

  it('permite confirmar cobro cuando está en estado facturado llamando a marcarComoCobrado', async () => {
    const casoFacturado: Caso = {
      ...mockCasoFirmado,
      estado: 'facturado',
      facturado_at: '2026-09-09T10:00:00Z',
    }
    mockedGetCaso.mockResolvedValue(casoFacturado)
    mockedGetFacturacion.mockResolvedValue({
      ...mockFacturacion,
      monto_cobrado: 0,
      fecha_cobro: null,
    })
    mockedMarcarCobrado.mockResolvedValue({
      ...casoFacturado,
      estado: 'cobrado',
      cobrado_at: '2026-09-10T12:00:00Z',
    })

    renderPage()

    await waitFor(() => {
      expect(screen.getByText('AA123BB')).toBeInTheDocument()
    })

    const inputCobrado = screen.getByLabelText(/monto cobrado/i)
    const inputFechaCobro = screen.getByLabelText(/fecha de cobro/i)

    fireEvent.change(inputCobrado, { target: { value: '250000' } })
    fireEvent.change(inputFechaCobro, { target: { value: '2026-09-10' } })

    const btnCobrar = screen.getByRole('button', { name: /confirmar cobro y cerrar/i })
    fireEvent.click(btnCobrar)

    await waitFor(() => {
      expect(mockedMarcarCobrado).toHaveBeenCalledWith(
        'caso-1',
        expect.objectContaining({
          monto_cobrado: 250000,
          fecha_cobro: '2026-09-10',
        })
      )
    })
  })

  it('permite iniciar reclamo a aseguradora si el caso es de seguro', async () => {
    const casoSeguro: Caso = {
      ...mockCasoFirmado,
      canal: 'seguro',
      aseguradora: 'Sancor Seguros',
      estado: 'facturado',
      facturado_at: '2026-09-09T10:00:00Z',
    }
    mockedGetCaso.mockResolvedValue(casoSeguro)
    mockedGetFacturacion.mockResolvedValue(mockFacturacion)
    mockedIniciarReclamo.mockResolvedValue({
      ...casoSeguro,
      estado: 'reclamo a la compañía',
      motivo_reclamo: 'Falta liquidación de franquicia',
    })

    renderPage()

    await waitFor(() => {
      expect(screen.getByText('AA123BB')).toBeInTheDocument()
    })

    const btnAbrirReclamo = screen.getByRole('button', { name: /iniciar reclamo a aseguradora/i })
    fireEvent.click(btnAbrirReclamo)

    const inputMotivo = screen.getByLabelText(/motivo del reclamo/i)
    fireEvent.change(inputMotivo, { target: { value: 'Falta liquidación de franquicia' } })

    const btnConfirmarReclamo = screen.getByRole('button', { name: /confirmar reclamo/i })
    fireEvent.click(btnConfirmarReclamo)

    await waitFor(() => {
      expect(mockedIniciarReclamo).toHaveBeenCalledWith(
        'caso-1',
        'Falta liquidación de franquicia'
      )
    })
  })

  it('muestra banner de reclamo y permite resolverlo si está en reclamo a la compañía', async () => {
    const casoEnReclamo: Caso = {
      ...mockCasoFirmado,
      canal: 'seguro',
      aseguradora: 'Sancor Seguros',
      estado: 'reclamo a la compañía',
      motivo_reclamo: 'Auditoría pendiente',
    }
    mockedGetCaso.mockResolvedValue(casoEnReclamo)
    mockedGetFacturacion.mockResolvedValue(mockFacturacion)
    mockedResolverReclamo.mockResolvedValue({
      ...casoEnReclamo,
      estado: 'facturado',
    })

    renderPage()

    await waitFor(() => {
      expect(screen.getByText('AA123BB')).toBeInTheDocument()
    })

    expect(screen.getByText(/Auditoría pendiente/i)).toBeInTheDocument()

    const btnResolver = screen.getByRole('button', { name: /resolver reclamo/i })
    fireEvent.click(btnResolver)

    await waitFor(() => {
      expect(mockedResolverReclamo).toHaveBeenCalledWith('caso-1')
    })
  })

  it('guarda los datos de facturación sin cambiar estado al presionar Guardar Datos', async () => {
    mockedGetCaso.mockResolvedValue(mockCasoFirmado)
    mockedGetFacturacion.mockResolvedValue(mockFacturacion)
    mockedSaveFacturacion.mockResolvedValue(mockFacturacion)

    renderPage()

    await waitFor(() => {
      expect(screen.getByText('AA123BB')).toBeInTheDocument()
    })

    const btnGuardar = screen.getByRole('button', { name: /guardar datos/i })
    fireEvent.click(btnGuardar)

    await waitFor(() => {
      expect(mockedSaveFacturacion).toHaveBeenCalledWith(
        'caso-1',
        expect.objectContaining({
          monto_facturado: 250000,
          numero_factura: 'FC-0001-00001234',
        })
      )
    })
  })
})
