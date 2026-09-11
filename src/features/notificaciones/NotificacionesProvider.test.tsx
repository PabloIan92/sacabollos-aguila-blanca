import { render, screen, act, fireEvent } from '@testing-library/react'
import { vi, describe, it, expect, beforeEach } from 'vitest'
import { NotificacionesProvider } from './NotificacionesProvider'
import { useNotificaciones } from './notificacionesContext'
import { supabase } from '../../lib/supabaseClient'

vi.mock('../../lib/supabaseClient', () => ({
  supabase: {
    channel: vi.fn(),
    removeChannel: vi.fn(),
  }
}))

function TestComponent() {
  const { notificaciones, sinLeer, marcarLeida, marcarTodasLeidas, limpiar } = useNotificaciones()
  return (
    <div>
      <div data-testid="sin-leer">{sinLeer}</div>
      <button onClick={() => limpiar()}>Limpiar</button>
      <button onClick={() => marcarTodasLeidas()}>Marcar Todas</button>
      <ul>
        {notificaciones.map(n => (
          <li key={n.id}>
            <span data-testid="mensaje">{n.mensaje}</span>
            <span data-testid="leida">{n.leida ? 'si' : 'no'}</span>
            <button data-testid={`marcar-${n.id}`} onClick={() => marcarLeida(n.id)}>Marcar</button>
          </li>
        ))}
      </ul>
    </div>
  )
}

describe('NotificacionesProvider', () => {
  let mockSubscribe: any;
  let mockOn: any;
  let callback: any;

  beforeEach(() => {
    mockSubscribe = vi.fn();
    mockOn = vi.fn().mockImplementation((_event, _filter, cb) => {
      callback = cb;
      return { subscribe: mockSubscribe };
    });
    
    vi.mocked(supabase.channel).mockReturnValue({ on: mockOn } as any);
  })

  it('debe recibir notificación al cambiar estado', () => {
    render(
      <NotificacionesProvider>
        <TestComponent />
      </NotificacionesProvider>
    )

    act(() => {
      callback({
        old: { id: '1', patente: 'AB123CD', estado: 'ingresado' },
        new: { id: '1', patente: 'AB123CD', estado: 'esperando repuesto' }
      })
    })

    expect(screen.getByTestId('sin-leer').textContent).toBe('1')
    expect(screen.getByTestId('mensaje').textContent).toBe('AB123CD avanzó a esperando repuesto')
  })

  it('marcarLeida funciona', () => {
    render(
      <NotificacionesProvider>
        <TestComponent />
      </NotificacionesProvider>
    )

    act(() => {
      callback({
        old: { id: '1', patente: 'AB123CD', estado: 'ingresado' },
        new: { id: '1', patente: 'AB123CD', estado: 'esperando repuesto' }
      })
    })

    const button = screen.getByText('Marcar')
    fireEvent.click(button)

    expect(screen.getByTestId('leida').textContent).toBe('si')
    expect(screen.getByTestId('sin-leer').textContent).toBe('0')
  })

  it('conteo sin leer es correcto', () => {
    render(
      <NotificacionesProvider>
        <TestComponent />
      </NotificacionesProvider>
    )

    act(() => {
      callback({
        old: { id: '1', patente: 'AB123CD', estado: 'ingresado' },
        new: { id: '1', patente: 'AB123CD', estado: 'esperando repuesto' }
      })
    })

    act(() => {
      callback({
        old: { id: '2', patente: 'ZZ999ZZ', estado: 'ingresado' },
        new: { id: '2', patente: 'ZZ999ZZ', estado: 'en reparación' }
      })
    })

    expect(screen.getByTestId('sin-leer').textContent).toBe('2')
    
    const buttons = screen.getAllByText('Marcar')
    fireEvent.click(buttons[0])

    expect(screen.getByTestId('sin-leer').textContent).toBe('1')
  })
})
