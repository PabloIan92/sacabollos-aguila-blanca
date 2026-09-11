import React from 'react'
import { describe, it, expect, vi } from 'vitest'
import { navItemsForRole } from './routes'
import { useAuth } from '../auth/useAuth'

vi.mock('../auth/useAuth', () => ({
  useAuth: vi.fn(),
}))

describe('navItemsForRole', () => {
  it('devuelve Casos, Stock, Facturación, Informes, CRM e Invitar para dueno', () => {
    const labels = navItemsForRole('dueno').map((item) => item.label)
    expect(labels).toEqual(['Casos', 'Stock', 'Facturación', 'Informes', 'CRM', 'Invitar'])
  })

  it('devuelve Turnos, Casos, Stock, CRM e Invitar para recepcion', () => {
    const labels = navItemsForRole('recepcion').map((item) => item.label)
    expect(labels).toEqual(['Turnos', 'Casos', 'Stock', 'CRM', 'Invitar'])
  })

  it('devuelve Casos y Stock para taller', () => {
    const labels = navItemsForRole('taller').map((item) => item.label)
    expect(labels).toEqual(['Casos', 'Stock'])
  })

  it('muestra el ítem Stock disponible para todos los roles autenticados', () => {
    for (const role of ['dueno', 'recepcion', 'taller'] as const) {
      const stockItem = navItemsForRole(role).find((item) => item.to === '/stock')
      expect(stockItem).toBeDefined()
      expect(stockItem?.available).toBe(true)
    }
  })

  it('ningún rol recibe más de 6 items', () => {
    for (const role of ['dueno', 'recepcion', 'taller'] as const) {
      expect(navItemsForRole(role).length).toBeLessThanOrEqual(6)
    }
  })

  it('marca Facturación, CRM e Invitar como disponibles para dueño y recepción', () => {
    const dueno = navItemsForRole('dueno')
    expect(dueno.find((item) => item.label === 'Facturación')?.available).toBe(true)
    expect(dueno.find((item) => item.label === 'CRM')?.available).toBe(true)
    expect(dueno.find((item) => item.label === 'Invitar')?.available).toBe(true)

    const recepcion = navItemsForRole('recepcion')
    expect(recepcion.find((item) => item.to === '/casos')?.available).toBe(true)
    expect(recepcion.find((item) => item.label === 'CRM')?.available).toBe(true)
    expect(recepcion.find((item) => item.label === 'Invitar')?.available).toBe(true)
  })

  it('el ítem Informes aparece solo para dueno y no para recepcion ni taller', () => {
    const dueno = navItemsForRole('dueno')
    const informesItem = dueno.find((item) => item.to === '/informes')
    expect(informesItem).toBeDefined()
    expect(informesItem?.label).toBe('Informes')
    expect(informesItem?.available).toBe(true)

    for (const role of ['recepcion', 'taller'] as const) {
      const items = navItemsForRole(role)
      expect(items.find((item) => item.to === '/informes')).toBeUndefined()
    }
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

  it('deniega acceso a /facturacion y /casos/:id/facturacion para recepcion y taller', async () => {
    const { RequireRole } = await import('../auth/RequireRole')
    const { render, screen } = await import('@testing-library/react')
    const { MemoryRouter, Routes, Route } = await import('react-router')

    const mockedAuth = vi.mocked(useAuth)

    for (const role of ['recepcion', 'taller'] as const) {
      mockedAuth.mockReturnValue({
        session: { user: { id: 'u-1' } },
        profile: { id: 'u-1', full_name: 'Test', role },
        loading: false,
      } as any)

      const { unmount } = render(
        React.createElement(
          MemoryRouter,
          { initialEntries: ['/facturacion'] },
          React.createElement(
            Routes,
            null,
            React.createElement(Route, { path: '/', element: React.createElement('div', null, 'ACCESO DENEGADO / HOME') }),
            React.createElement(
              Route,
              { element: React.createElement(RequireRole, { roles: ['dueno'] }) },
              React.createElement(Route, { path: '/facturacion', element: React.createElement('div', null, 'FACTURACION PAGE') }),
              React.createElement(Route, { path: '/casos/:id/facturacion', element: React.createElement('div', null, 'FICHA FACTURACION') })
            )
          )
        )
      )

      expect(screen.getByText('ACCESO DENEGADO / HOME')).toBeInTheDocument()
      expect(screen.queryByText('FACTURACION PAGE')).not.toBeInTheDocument()
      unmount()

      const { unmount: unmountFicha } = render(
        React.createElement(
          MemoryRouter,
          { initialEntries: ['/casos/123/facturacion'] },
          React.createElement(
            Routes,
            null,
            React.createElement(Route, { path: '/', element: React.createElement('div', null, 'ACCESO DENEGADO / HOME') }),
            React.createElement(
              Route,
              { element: React.createElement(RequireRole, { roles: ['dueno'] }) },
              React.createElement(Route, { path: '/facturacion', element: React.createElement('div', null, 'FACTURACION PAGE') }),
              React.createElement(Route, { path: '/casos/:id/facturacion', element: React.createElement('div', null, 'FICHA FACTURACION') })
            )
          )
        )
      )

      expect(screen.getByText('ACCESO DENEGADO / HOME')).toBeInTheDocument()
      expect(screen.queryByText('FICHA FACTURACION')).not.toBeInTheDocument()
      unmountFicha()
    }
  })
})
