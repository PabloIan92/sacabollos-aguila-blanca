import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { MemoryRouter, Routes, Route } from 'react-router'
import { FichaTrabajoPage } from './FichaTrabajoPage'
import {
  getCaso,
  startRepair,
  listRepairDamages,
  createRepairDamage,
  updateRepairDamage,
  deleteRepairDamage,
  waitForPart,
  resumeRepair,
} from './api'
import type { Caso, ReparacionDano } from './types'

vi.mock('./api', () => ({
  getCaso: vi.fn(),
  startRepair: vi.fn(),
  listRepairDamages: vi.fn(),
  createRepairDamage: vi.fn(),
  updateRepairDamage: vi.fn(),
  deleteRepairDamage: vi.fn(),
  waitForPart: vi.fn(),
  resumeRepair: vi.fn(),
}))

vi.mock('./components/VehicleDamageMap', () => ({
  VehicleDamageMap: ({ damages, onAdd, onToggleRepaired, onDelete, readonly }: any) => (
    <div data-testid="vehicle-damage-map" data-readonly={readonly}>
      <button onClick={() => onAdd?.({ x: 0.5, y: 0.5, zona: 'capot' })}>
        Simulate Add Damage
      </button>
      {damages?.map((d: any) => (
        <div key={d.id} data-testid={`damage-item-${d.id}`}>
          <span>{d.zona}</span>
          <button onClick={() => onToggleRepaired?.(d)}>Toggle {d.id}</button>
          <button aria-label={`Eliminar daño ${d.zona}`} onClick={() => onDelete?.(d.id)}>
            Eliminar {d.id}
          </button>
        </div>
      ))}
    </div>
  ),
}))

const mockedGetCaso = vi.mocked(getCaso)
const mockedStartRepair = vi.mocked(startRepair)
const mockedListRepairDamages = vi.mocked(listRepairDamages)
const mockedCreateRepairDamage = vi.mocked(createRepairDamage)
const mockedUpdateRepairDamage = vi.mocked(updateRepairDamage)
const mockedDeleteRepairDamage = vi.mocked(deleteRepairDamage)
const mockedWaitForPart = vi.mocked(waitForPart)
const mockedResumeRepair = vi.mocked(resumeRepair)

function caso(overrides: Partial<Caso> = {}): Caso {
  return {
    id: 'caso-1',
    canal: 'seguro',
    patente: 'AA123BB',
    marca: 'Ford',
    modelo: 'Focus',
    color: 'Gris',
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
    danos_zonas: ['capot', 'techo'],
    turno_fecha: '2026-03-01T10:30:00.000Z',
    orden_ingreso_numero: 'ORD-001',
    ingresado_at: '2026-03-01T11:00:00.000Z',
    repuesto_pendiente: null,
    reparacion_iniciada_at: null,
    reparacion_lista_at: null,
    firmado_at: null,
    estado: 'ingresado',
    created_at: '2026-01-01',
    updated_at: '2026-01-01',
    estado_changed_at: '2026-01-01',
    created_by: 'user-1',
    ...overrides,
  }
}

function dano(overrides: Partial<ReparacionDano> = {}): ReparacionDano {
  return {
    id: 'dano-1',
    caso_id: 'caso-1',
    zona: 'capot',
    x: 0.5,
    y: 0.2,
    descripcion: 'Golpe central',
    reparado: false,
    origen_inspeccion: true,
    created_at: '2026-01-01',
    updated_at: '2026-01-01',
    ...overrides,
  }
}

function renderPage(initialPath = '/casos/caso-1/ficha-trabajo') {
  return render(
    <MemoryRouter initialEntries={[initialPath]}>
      <Routes>
        <Route path="/casos/:id/ficha-trabajo" element={<FichaTrabajoPage />} />
      </Routes>
    </MemoryRouter>
  )
}

describe('FichaTrabajoPage', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockedListRepairDamages.mockResolvedValue([])
  })

  it('muestra la patente y los daños originales de la inspección', async () => {
    mockedGetCaso.mockResolvedValue(caso())
    renderPage()

    expect(await screen.findByText('AA123BB')).toBeInTheDocument()
    expect(screen.getByText(/capot/i)).toBeInTheDocument()
    expect(screen.getByText(/techo/i)).toBeInTheDocument()
  })

  it('en estado ingresado muestra botón Iniciar reparación y transiciona a en reparación', async () => {
    const c = caso({ estado: 'ingresado' })
    mockedGetCaso.mockResolvedValue(c)
    mockedStartRepair.mockResolvedValue(caso({ estado: 'en reparación', reparacion_iniciada_at: new Date().toISOString() }))
    renderPage()

    const btn = await screen.findByRole('button', { name: /iniciar reparación/i })
    fireEvent.click(btn)

    await waitFor(() => {
      expect(mockedStartRepair).toHaveBeenCalledWith('caso-1')
    })
  })

  it('en estado en reparación permite agregar, editar/reparar y eliminar daños', async () => {
    mockedGetCaso.mockResolvedValue(caso({ estado: 'en reparación' }))
    const initialDamage = dano({ id: 'd-1', reparado: false, zona: 'capot' })
    mockedListRepairDamages.mockResolvedValue([initialDamage])
    mockedCreateRepairDamage.mockResolvedValue(dano({ id: 'd-2', zona: 'puerta delantera izquierda' }))
    mockedUpdateRepairDamage.mockResolvedValue(dano({ id: 'd-1', reparado: true }))
    mockedDeleteRepairDamage.mockResolvedValue(undefined)

    renderPage()

    expect(await screen.findByTestId('vehicle-damage-map')).toBeInTheDocument()
    expect(screen.getByTestId('damage-item-d-1')).toBeInTheDocument()

    // Add damage
    fireEvent.click(screen.getByRole('button', { name: /simulate add damage/i }))
    await waitFor(() => {
      expect(mockedCreateRepairDamage).toHaveBeenCalledWith(
        'caso-1',
        expect.objectContaining({ x: 0.5, y: 0.5, zona: 'capot' })
      )
    })

    // Toggle repair
    fireEvent.click(screen.getByRole('button', { name: /toggle d-1/i }))
    await waitFor(() => {
      expect(mockedUpdateRepairDamage).toHaveBeenCalledWith('d-1', { reparado: true })
    })

    // Delete damage
    fireEvent.click(screen.getByRole('button', { name: /eliminar daño capot/i }))
    await waitFor(() => {
      expect(mockedDeleteRepairDamage).toHaveBeenCalledWith('d-1')
    })
  })

  it('valida que el nombre del repuesto no esté vacío antes de esperar repuesto', async () => {
    mockedGetCaso.mockResolvedValue(caso({ estado: 'en reparación' }))
    renderPage()

    const btn = await screen.findByRole('button', { name: /esperar repuesto/i })
    fireEvent.click(btn)

    expect(await screen.findByText(/el repuesto es obligatorio/i)).toBeInTheDocument()
    expect(mockedWaitForPart).not.toHaveBeenCalled()
  })

  it('en estado en reparación transiciona a esperando repuesto con un repuesto válido', async () => {
    mockedGetCaso.mockResolvedValue(caso({ estado: 'en reparación' }))
    mockedWaitForPart.mockResolvedValue(caso({ estado: 'esperando repuesto', repuesto_pendiente: 'Guardabarros' }))
    renderPage()

    const input = await screen.findByLabelText(/repuesto/i)
    fireEvent.change(input, { target: { value: 'Guardabarros' } })

    const btn = screen.getByRole('button', { name: /esperar repuesto/i })
    fireEvent.click(btn)

    await waitFor(() => {
      expect(mockedWaitForPart).toHaveBeenCalledWith('caso-1', 'Guardabarros')
    })
  })

  it('en estado esperando repuesto muestra el repuesto y botón Reanudar reparación', async () => {
    mockedGetCaso.mockResolvedValue(
      caso({ estado: 'esperando repuesto', repuesto_pendiente: 'Paragolpes nuevo' })
    )
    mockedResumeRepair.mockResolvedValue(caso({ estado: 'en reparación', repuesto_pendiente: null }))
    renderPage()

    expect(await screen.findByText(/paragolpes nuevo/i)).toBeInTheDocument()
    expect(screen.queryByLabelText(/repuesto/i)).not.toBeInTheDocument()

    const resumeBtn = screen.getByRole('button', { name: /reanudar reparación/i })
    fireEvent.click(resumeBtn)

    await waitFor(() => {
      expect(mockedResumeRepair).toHaveBeenCalledWith('caso-1')
    })
  })

  it('muestra error y botón de reintento si falla la carga del caso', async () => {
    mockedGetCaso.mockRejectedValueOnce(new Error('Network error'))
    renderPage()

    expect(await screen.findByRole('alert')).toHaveTextContent(/no se pudo cargar/i)
    const retryBtn = screen.getByRole('button', { name: /reintentar/i })

    mockedGetCaso.mockResolvedValueOnce(caso())
    fireEvent.click(retryBtn)

    expect(await screen.findByText('AA123BB')).toBeInTheDocument()
  })
})
