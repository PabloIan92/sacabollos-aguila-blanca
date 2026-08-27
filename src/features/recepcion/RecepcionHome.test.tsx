import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { MemoryRouter, Routes, Route } from 'react-router'
import { RecepcionHome } from './RecepcionHome'
import { listCasos } from '../casos/api'
import type { Caso } from '../casos/types'

vi.mock('../casos/api')

const mockedListCasos = vi.mocked(listCasos)

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
    danos_zonas: [],
    turno_fecha: null,
    orden_ingreso_numero: null,
    ingresado_at: null,
    estado: 'turno coordinado',
    created_at: '2026-01-01',
    updated_at: '2026-01-01',
    estado_changed_at: '2026-01-01',
    created_by: 'user-1',
    ...overrides,
  }
}

function isoHoy(hora: string): string {
  const hoy = new Date()
  const [h, m] = hora.split(':')
  hoy.setHours(Number(h), Number(m), 0, 0)
  return hoy.toISOString()
}

function isoAyer(): string {
  const ayer = new Date()
  ayer.setDate(ayer.getDate() - 1)
  return ayer.toISOString()
}

function renderPage() {
  return render(
    <MemoryRouter initialEntries={['/']}>
      <Routes>
        <Route path="/" element={<RecepcionHome />} />
        <Route path="/casos/nuevo" element={<div>NUEVO CASO</div>} />
        <Route path="/casos/:id" element={<div>DETALLE CASO</div>} />
      </Routes>
    </MemoryRouter>
  )
}

beforeEach(() => {
  vi.clearAllMocks()
})

describe('RecepcionHome', () => {
  it('sin turnos hoy, muestra el EmptyState original', async () => {
    mockedListCasos.mockResolvedValue([caso({ id: 'c1', turno_fecha: isoAyer() })])
    renderPage()
    expect(await screen.findByText('No hay turnos para hoy')).toBeInTheDocument()
  })

  it('lista los turnos de hoy ordenados por hora ascendente, ignorando otras fechas', async () => {
    mockedListCasos.mockResolvedValue([
      caso({ id: 'c-tarde', patente: 'BB222CC', turno_fecha: isoHoy('15:00') }),
      caso({ id: 'c-manana', patente: 'AA111BB', turno_fecha: isoHoy('09:00') }),
      caso({ id: 'c-otro-dia', patente: 'ZZ999ZZ', turno_fecha: isoAyer() }),
    ])
    renderPage()

    await screen.findByText('AA111BB')
    const filas = screen.getAllByRole('row').slice(1)
    expect(filas[0]).toHaveTextContent('AA111BB')
    expect(filas[1]).toHaveTextContent('BB222CC')
    expect(screen.queryByText('ZZ999ZZ')).not.toBeInTheDocument()
  })

  it('un turno de hoy navega al detalle del caso', async () => {
    mockedListCasos.mockResolvedValue([caso({ id: 'c1', turno_fecha: isoHoy('11:00') })])
    renderPage()

    const link = await screen.findByRole('link', { name: /\d{2}:\d{2}/ })
    fireEvent.click(link)
    expect(await screen.findByText('DETALLE CASO')).toBeInTheDocument()
  })

  it('el botón Nuevo caso navega a /casos/nuevo', async () => {
    mockedListCasos.mockResolvedValue([])
    renderPage()
    await screen.findByText('No hay turnos para hoy')
    fireEvent.click(screen.getByRole('button', { name: 'Nuevo caso' }))
    expect(await screen.findByText('NUEVO CASO')).toBeInTheDocument()
  })
})
