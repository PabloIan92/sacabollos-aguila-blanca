import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router'
import { CasosList } from './CasosList'
import type { Caso } from '../types'

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
    estado: 'en reparación',
    created_at: '2026-01-01',
    updated_at: '2026-01-01',
    estado_changed_at: new Date().toISOString(),
    created_by: 'user-1',
    ...overrides,
  }
}

function haceNDias(n: number): string {
  const fecha = new Date()
  fecha.setDate(fecha.getDate() - n)
  return fecha.toISOString()
}

function renderList(casos: Caso[]) {
  return render(
    <MemoryRouter>
      <CasosList casos={casos} />
    </MemoryRouter>
  )
}

describe('CasosList', () => {
  it('con casos vacío, no renderiza ninguna fila (solo el header)', () => {
    renderList([])
    expect(screen.getAllByRole('row')).toHaveLength(1)
  })

  it('muestra una fila por caso con patente, cliente y semáforo', () => {
    renderList([caso()])
    expect(screen.getByText('AA123BB')).toBeInTheDocument()
    expect(screen.getByText('Juan Pérez')).toBeInTheDocument()
    expect(screen.getByText('Reparación PDR')).toBeInTheDocument()
  })

  it('marca con alerta un caso con 5 días o más en la misma etapa', () => {
    renderList([caso({ estado_changed_at: haceNDias(6) })])
    expect(screen.getByText('⚠ 6d')).toBeInTheDocument()
  })

  it('no marca alerta un caso con menos de 5 días en la etapa', () => {
    renderList([caso({ estado_changed_at: haceNDias(2) })])
    expect(screen.queryByText(/⚠/)).not.toBeInTheDocument()
  })
})
