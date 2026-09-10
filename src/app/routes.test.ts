import React from 'react'
import { describe, it, expect, vi } from 'vitest'
import { navItemsForRole } from './routes'

describe('navItemsForRole', () => {
  it('devuelve Casos, Facturación e Invitar para dueno', () => {
    const labels = navItemsForRole('dueno').map((item) => item.label)
    expect(labels).toEqual(['Casos', 'Facturación', 'Invitar'])
  })

  it('devuelve Turnos, Casos e Invitar para recepcion', () => {
    const labels = navItemsForRole('recepcion').map((item) => item.label)
    expect(labels).toEqual(['Turnos', 'Casos', 'Invitar'])
  })

  it('devuelve solo Casos para taller', () => {
    const labels = navItemsForRole('taller').map((item) => item.label)
    expect(labels).toEqual(['Casos'])
  })

  it('ningún rol recibe más de 3 items', () => {
    for (const role of ['dueno', 'recepcion', 'taller'] as const) {
      expect(navItemsForRole(role).length).toBeLessThanOrEqual(3)
    }
  })

  it('marca Facturación e Invitar como no disponibles todavía; Casos de recepción ya está disponible', () => {
    const dueno = navItemsForRole('dueno')
    expect(dueno.find((item) => item.label === 'Facturación')?.available).toBe(false)
    expect(dueno.find((item) => item.label === 'Invitar')?.available).toBe(false)

    const recepcion = navItemsForRole('recepcion')
    expect(recepcion.find((item) => item.to === '/casos')?.available).toBe(true)
  })

  it('en TallerHome los casos enlazan a /casos/:id/ficha-trabajo', async () => {
    const { TallerHome } = await import('../features/taller/TallerHome')
    const casosApi = await import('../features/casos/api')
    const { render, screen } = await import('@testing-library/react')
    const { MemoryRouter } = await import('react-router')

    vi.spyOn(casosApi, 'listCasos').mockResolvedValue([
      {
        id: 'caso-taller-1',
        patente: 'TALLER1',
        cliente_nombre: 'Cliente Taller',
        canal: 'seguro',
        estado: 'en reparación',
        estado_changed_at: new Date().toISOString(),
      } as any,
    ])

    render(
      React.createElement(
        MemoryRouter,
        null,
        React.createElement(TallerHome)
      )
    )

    const link = await screen.findByRole('link', { name: 'TALLER1' })
    expect(link).toHaveAttribute('href', '/casos/caso-taller-1/ficha-trabajo')
  })
})
