import { render, screen, fireEvent } from '@testing-library/react'
import { vi, describe, it, expect } from 'vitest'
import { CampanaNotificaciones } from './CampanaNotificaciones'
import { NotificacionesContext } from './notificacionesContext'

describe('CampanaNotificaciones', () => {
  it('el badge no aparece si sinLeer=0', () => {
    render(
      <NotificacionesContext.Provider value={{
        notificaciones: [],
        sinLeer: 0,
        marcarLeida: vi.fn(),
        marcarTodasLeidas: vi.fn(),
        limpiar: vi.fn(),
      }}>
        <CampanaNotificaciones />
      </NotificacionesContext.Provider>
    )

    const button = screen.getByRole('button', { name: /notificaciones/i })
    expect(button).toBeDefined()
    // The badge should not be in the document
    expect(screen.queryByText('0')).toBeNull()
  })

  it('aparece con el número correcto', () => {
    render(
      <NotificacionesContext.Provider value={{
        notificaciones: [
          { id: '1', casoId: '1', patente: 'ABC', mensaje: 'msg', kind: 'estado_cambio', leida: false, createdAt: new Date() }
        ],
        sinLeer: 1,
        marcarLeida: vi.fn(),
        marcarTodasLeidas: vi.fn(),
        limpiar: vi.fn(),
      }}>
        <CampanaNotificaciones />
      </NotificacionesContext.Provider>
    )

    expect(screen.getByText('1')).toBeDefined()
  })

  it('marcarTodasLeidas resetea', () => {
    const mockMarcar = vi.fn()
    render(
      <NotificacionesContext.Provider value={{
        notificaciones: [
          { id: '1', casoId: '1', patente: 'ABC', mensaje: 'msg', kind: 'estado_cambio', leida: false, createdAt: new Date() }
        ],
        sinLeer: 1,
        marcarLeida: vi.fn(),
        marcarTodasLeidas: mockMarcar,
        limpiar: vi.fn(),
      }}>
        <CampanaNotificaciones />
      </NotificacionesContext.Provider>
    )

    // Open dropdown
    const button = screen.getByRole('button', { name: /notificaciones/i })
    fireEvent.click(button)

    const resetBtn = screen.getByText('Marcar leídas')
    fireEvent.click(resetBtn)

    expect(mockMarcar).toHaveBeenCalled()
  })
})
