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

  it('muestra la columna Canal para distinguir seguro y particular', () => {
    renderList([
      caso(),
      caso({
        id: 'caso-2',
        patente: 'PART123',
        canal: 'particular',
        aseguradora: null,
        numero_siniestro: null,
        denuncia: null,
        presupuesto_monto: 10000,
        presupuesto_respuesta: 'pendiente',
      }),
    ])

    expect(screen.getByRole('columnheader', { name: 'Canal' })).toBeInTheDocument()
    expect(screen.getByText('Seguro')).toBeInTheDocument()
    expect(screen.getByText('Particular')).toBeInTheDocument()
  })

  it('marca con alerta un caso con 5 días o más en la misma etapa', () => {
    renderList([caso({ estado_changed_at: haceNDias(6) })])
    expect(screen.getByText('⚠ 6d')).toBeInTheDocument()
  })

  it('no marca alerta un caso con menos de 5 días en la etapa', () => {
    renderList([caso({ estado_changed_at: haceNDias(2) })])
    expect(screen.queryByText(/⚠/)).not.toBeInTheDocument()
  })

  it('permite personalizar el destino del link mediante caseHref', () => {
    render(
      <MemoryRouter>
        <CasosList
          casos={[caso({ id: 'caso-99' })]}
          caseHref={(c) => `/casos/${c.id}/ficha-trabajo`}
        />
      </MemoryRouter>
    )
    const link = screen.getByRole('link', { name: 'AA123BB' })
    expect(link).toHaveAttribute('href', '/casos/caso-99/ficha-trabajo')
  })
})
