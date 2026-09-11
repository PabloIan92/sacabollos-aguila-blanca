import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { describe, expect, it, vi, beforeEach } from 'vitest'
import { InformesPage } from './InformesPage'
import { getResumenMensual } from './api'

vi.mock('./api', () => ({
  getResumenMensual: vi.fn(),
}))

const mockData = [
  {
    mes: '2026-09',
    label: 'Sep 2026',
    casosCreados: 5,
    casosCerrados: 3,
    casosSeguro: 4,
    casosParticular: 1,
    montoFacturado: 150000,
    montoCobrado: 100000,
    diferencial: 50000,
    casosEnReclamo: 1,
  },
  {
    mes: '2026-08',
    label: 'Ago 2026',
    casosCreados: 8,
    casosCerrados: 8,
    casosSeguro: 5,
    casosParticular: 3,
    montoFacturado: 200000,
    montoCobrado: 200000,
    diferencial: 0,
    casosEnReclamo: 0,
  }
]

describe('InformesPage', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renderiza el spinner de carga', () => {
    vi.mocked(getResumenMensual).mockReturnValue(new Promise(() => {}))
    render(<InformesPage />)
    expect(screen.getByTestId('loading-spinner')).toBeInTheDocument()
    expect(screen.getByText('Cargando informes...')).toBeInTheDocument()
  })

  it('muestra los KPIs cuando los datos cargan', async () => {
    vi.mocked(getResumenMensual).mockResolvedValue(mockData)
    render(<InformesPage />)
    
    await waitFor(() => {
      expect(screen.getByTestId('kpi-total-casos')).toHaveTextContent('13')
      expect(screen.getByTestId('kpi-total-facturado')).toHaveTextContent('$ 350.000')
      expect(screen.getByTestId('kpi-total-cobrado')).toHaveTextContent('$ 300.000')
      expect(screen.getByTestId('kpi-diferencial')).toHaveTextContent('$ 50.000')
    })
  })

  it('muestra una fila por mes', async () => {
    vi.mocked(getResumenMensual).mockResolvedValue(mockData)
    render(<InformesPage />)
    
    await waitFor(() => {
      expect(screen.getByText('Sep 2026')).toBeInTheDocument()
      expect(screen.getByText('Ago 2026')).toBeInTheDocument()
    })
    
    const rows = screen.getAllByRole('row')
    // 1 header + 2 data rows
    expect(rows.length).toBe(3)
  })

  it('muestra mensaje vacío si no hay datos', async () => {
    vi.mocked(getResumenMensual).mockResolvedValue([])
    render(<InformesPage />)
    
    await waitFor(() => {
      expect(screen.getByText('No se encontraron datos para los informes.')).toBeInTheDocument()
    })
  })

  it('botón actualizar recarga los datos', async () => {
    vi.mocked(getResumenMensual).mockResolvedValue(mockData)
    render(<InformesPage />)
    
    await waitFor(() => {
      expect(screen.getByText('Sep 2026')).toBeInTheDocument()
    })
    
    expect(vi.mocked(getResumenMensual)).toHaveBeenCalledTimes(1)
    
    const btnActualizar = screen.getByRole('button', { name: /actualizar/i })
    fireEvent.click(btnActualizar)
    
    expect(vi.mocked(getResumenMensual)).toHaveBeenCalledTimes(2)
  })
})

