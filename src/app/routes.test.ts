import { describe, it, expect } from 'vitest'
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
})
