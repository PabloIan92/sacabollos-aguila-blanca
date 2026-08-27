import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { MemoryRouter, Routes, Route } from 'react-router'
import { CasosListPage } from './CasosListPage'
import { listCasos } from './api'
import type { Caso } from './types'

vi.mock('./api')

const mockedListCasos = vi.mocked(listCasos)

function renderPage() {
  return render(
    <MemoryRouter initialEntries={['/casos']}>
      <Routes>
        <Route path="/casos" element={<CasosListPage />} />
        <Route path="/casos/nuevo" element={<div>NUEVO CASO</div>} />
        <Route path="/casos/:id" element={<div>DETALLE CASO</div>} />
        <Route path="/casos/:id/ficha-inspeccion" element={<div>FICHA DE INSPECCION</div>} />
      </Routes>
    </MemoryRouter>
  )
}

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
    estado: 'borrador',
    created_at: '2026-01-01',
    updated_at: '2026-01-01',
    estado_changed_at: '2026-01-01',
    created_by: 'user-1',
    ...overrides,
  }
}

beforeEach(() => {
  vi.clearAllMocks()
})

describe('CasosListPage', () => {
  it('muestra el EmptyState cuando no hay casos', async () => {
    mockedListCasos.mockResolvedValue([])
    renderPage()
    expect(await screen.findByText('No hay casos todavía')).toBeInTheDocument()
  })

  it('lista los casos con patente, cliente y estado', async () => {
    mockedListCasos.mockResolvedValue([caso({ estado: 'aprobado' })])
    renderPage()
    expect(await screen.findByText('AA123BB')).toBeInTheDocument()
    expect(screen.getByText('Juan Pérez')).toBeInTheDocument()
    expect(screen.getByText('aprobado')).toBeInTheDocument()
  })

  it('un caso en borrador navega a la ficha de inspección al hacer click', async () => {
    mockedListCasos.mockResolvedValue([caso({ estado: 'borrador' })])
    renderPage()
    fireEvent.click(await screen.findByText('AA123BB'))
    expect(await screen.findByText('FICHA DE INSPECCION')).toBeInTheDocument()
  })

  it('un caso que no está en borrador navega al detalle al hacer click', async () => {
    mockedListCasos.mockResolvedValue([caso({ estado: 'aprobado' })])
    renderPage()
    fireEvent.click(await screen.findByText('AA123BB'))
    expect(await screen.findByText('DETALLE CASO')).toBeInTheDocument()
  })

  it('el botón Nuevo caso navega a /casos/nuevo', async () => {
    mockedListCasos.mockResolvedValue([])
    renderPage()
    await screen.findByText('No hay casos todavía')
    fireEvent.click(screen.getByRole('button', { name: 'Nuevo caso' }))
    expect(await screen.findByText('NUEVO CASO')).toBeInTheDocument()
  })
})
