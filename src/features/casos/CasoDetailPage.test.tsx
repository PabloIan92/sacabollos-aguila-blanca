import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { MemoryRouter, Routes, Route } from 'react-router'
import { CasoDetailPage } from './CasoDetailPage'
import { getCaso, updateCasoEstado } from './api'
import type { Caso } from './types'

vi.mock('./api')

const mockedGetCaso = vi.mocked(getCaso)
const mockedUpdateCasoEstado = vi.mocked(updateCasoEstado)

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
      </Routes>
    </MemoryRouter>
  )
}

beforeEach(() => {
  vi.clearAllMocks()
})

describe('CasoDetailPage', () => {
  it('en "enviado a la aseguradora" muestra el botón de orden recibida y avanza a aprobado', async () => {
    mockedGetCaso.mockResolvedValue(caso({ estado: 'enviado a la aseguradora' }))
    mockedUpdateCasoEstado.mockResolvedValue(caso({ estado: 'aprobado' }))
    renderPage()

    const boton = await screen.findByRole('button', { name: 'Marcar orden de trabajo recibida' })
    expect(screen.queryByLabelText('Turno')).not.toBeInTheDocument()

    fireEvent.click(boton)
    await waitFor(() => expect(mockedUpdateCasoEstado).toHaveBeenCalledWith('caso-1', 'aprobado'))
  })

  it('en "aprobado" muestra el input de turno y confirma con el ISO elegido', async () => {
    mockedGetCaso.mockResolvedValue(caso({ estado: 'aprobado' }))
    mockedUpdateCasoEstado.mockResolvedValue(caso({ estado: 'turno coordinado' }))
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
      expect(mockedUpdateCasoEstado).toHaveBeenCalledWith('caso-1', 'turno coordinado', {
        turno_fecha: new Date('2026-03-01T10:30').toISOString(),
      })
    )
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
