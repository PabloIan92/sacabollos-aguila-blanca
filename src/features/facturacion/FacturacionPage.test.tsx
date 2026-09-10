import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { MemoryRouter } from 'react-router'
import { FacturacionPage } from './FacturacionPage'
import * as api from './api'
import type { ResumenFacturacionItem } from './types'

vi.mock('./api', () => ({
  getResumenFacturacion: vi.fn(),
}))

const mockedGetResumen = vi.mocked(api.getResumenFacturacion)

const mockItems: ResumenFacturacionItem[] = [
  {
    caso_id: 'caso-1',
    patente: 'AA123BB',
    vehiculo: 'Toyota Hilux',
    cliente_nombre: 'Juan Pérez',
    canal: 'seguro',
    aseguradora: 'La Segunda',
    estado: 'facturado',
    monto_facturado: 300000,
    monto_cobrado: 100000,
    diferencial: 200000,
    numero_factura: 'FC-0001-00001234',
    fecha_factura: '2026-09-01',
    fecha_cobro: null,
    motivo_reclamo: null,
  },
  {
    caso_id: 'caso-2',
    patente: 'CC999DD',
    vehiculo: 'Ford Ranger',
    cliente_nombre: 'Carlos López',
    canal: 'seguro',
    aseguradora: 'Federación Patronal',
    estado: 'reclamo a la compañía',
    monto_facturado: 450000,
    monto_cobrado: 0,
    diferencial: 450000,
    numero_factura: 'FC-0001-00001235',
    fecha_factura: '2026-08-15',
    fecha_cobro: null,
    motivo_reclamo: 'Demora en auditoría técnica',
  },
  {
    caso_id: 'caso-3',
    patente: 'EE555FF',
    vehiculo: 'Volkswagen Gol',
    cliente_nombre: 'María Gómez',
    canal: 'particular',
    aseguradora: null,
    estado: 'cobrado',
    monto_facturado: 150000,
    monto_cobrado: 150000,
    diferencial: 0,
    numero_factura: 'FB-0001-00000088',
    fecha_factura: '2026-09-05',
    fecha_cobro: '2026-09-06',
    motivo_reclamo: null,
  },
  {
    caso_id: 'caso-4',
    patente: 'GG777HH',
    vehiculo: 'Peugeot 208',
    cliente_nombre: 'Ana Suárez',
    canal: 'particular',
    aseguradora: null,
    estado: 'firmado',
    monto_facturado: 0,
    monto_cobrado: 0,
    diferencial: 0,
    numero_factura: '',
    fecha_factura: '',
    fecha_cobro: null,
    motivo_reclamo: null,
  },
]

describe('FacturacionPage', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('muestra estado de carga inicialmente', () => {
    mockedGetResumen.mockReturnValue(new Promise(() => {}))
    render(
      <MemoryRouter>
        <FacturacionPage />
      </MemoryRouter>
    )
    expect(screen.getByText(/cargando facturación/i)).toBeInTheDocument()
  })

  it('renderiza tarjetas de KPI con los totales calculados', async () => {
    mockedGetResumen.mockResolvedValue(mockItems)
    render(
      <MemoryRouter>
        <FacturacionPage />
      </MemoryRouter>
    )

    await waitFor(() => {
      expect(screen.queryByText(/cargando facturación/i)).not.toBeInTheDocument()
    })

    // Total Facturado: 300000 + 450000 + 150000 = 900000
    // Total Cobrado: 100000 + 0 + 150000 = 250000
    // Pendiente: 200000 + 450000 = 650000
    // En Reclamo: 1 caso
    expect(screen.getByTestId('kpi-total-facturado')).toHaveTextContent(/900\.000/)
    expect(screen.getByTestId('kpi-total-cobrado')).toHaveTextContent(/250\.000/)
    expect(screen.getByTestId('kpi-pendiente-cobro')).toHaveTextContent(/650\.000/)
    expect(screen.getByTestId('kpi-en-reclamo')).toHaveTextContent('1')
  })

  it('renderiza la lista de casos con enlaces a su ficha de facturación', async () => {
    mockedGetResumen.mockResolvedValue(mockItems)
    render(
      <MemoryRouter>
        <FacturacionPage />
      </MemoryRouter>
    )

    await waitFor(() => {
      expect(screen.getByText('AA123BB')).toBeInTheDocument()
    })

    expect(screen.getByText('CC999DD')).toBeInTheDocument()
    expect(screen.getByText('EE555FF')).toBeInTheDocument()
    expect(screen.getByText('GG777HH')).toBeInTheDocument()

    const link = screen.getByRole('link', { name: /AA123BB/i })
    expect(link).toHaveAttribute('href', '/casos/caso-1/facturacion')
  })

  it('filtra por texto de patente o cliente', async () => {
    mockedGetResumen.mockResolvedValue(mockItems)
    render(
      <MemoryRouter>
        <FacturacionPage />
      </MemoryRouter>
    )

    await waitFor(() => {
      expect(screen.getByText('AA123BB')).toBeInTheDocument()
    })

    const searchInput = screen.getByPlaceholderText(/buscar por patente, cliente, factura/i)
    fireEvent.change(searchInput, { target: { value: 'Toyota' } })

    expect(screen.getByText('AA123BB')).toBeInTheDocument()
    expect(screen.queryByText('CC999DD')).not.toBeInTheDocument()
    expect(screen.queryByText('EE555FF')).not.toBeInTheDocument()
  })

  it('filtra por estado', async () => {
    mockedGetResumen.mockResolvedValue(mockItems)
    render(
      <MemoryRouter>
        <FacturacionPage />
      </MemoryRouter>
    )

    await waitFor(() => {
      expect(screen.getByText('AA123BB')).toBeInTheDocument()
    })

    const selectEstado = screen.getByLabelText(/estado/i)
    fireEvent.change(selectEstado, { target: { value: 'reclamo a la compañía' } })

    expect(screen.queryByText('AA123BB')).not.toBeInTheDocument()
    expect(screen.getByText('CC999DD')).toBeInTheDocument()
    expect(screen.getByText(/Demora en auditoría técnica/i)).toBeInTheDocument()
  })

  it('muestra mensaje de error cuando falla la carga', async () => {
    mockedGetResumen.mockRejectedValue(new Error('Network error'))
    render(
      <MemoryRouter>
        <FacturacionPage />
      </MemoryRouter>
    )

    await waitFor(() => {
      expect(screen.getByText(/error al cargar el resumen de facturación/i)).toBeInTheDocument()
    })
  })
})
