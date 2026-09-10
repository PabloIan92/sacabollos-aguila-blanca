import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { VehicleDamageMap } from './VehicleDamageMap'
import type { ReparacionDano } from '../types'

vi.mock('react-konva', () => ({
  Stage: ({ children, onPointerDown, onClick, ...props }: any) => (
    <div
      data-testid="konva-stage"
      onClick={(e) => {
        const target = {
          getStage: () => ({
            getPointerPosition: () => ({ x: 150, y: 100 }),
            width: () => 300,
            height: () => 200,
          }),
        }
        onClick?.({ ...e, target })
      }}
      onPointerDown={(e) => {
        const target = {
          getStage: () => ({
            getPointerPosition: () => ({ x: 150, y: 100 }),
            width: () => 300,
            height: () => 200,
          }),
        }
        onPointerDown?.({ ...e, target })
      }}
      {...props}
    >
      {children}
    </div>
  ),
  Layer: ({ children }: any) => <div data-testid="konva-layer">{children}</div>,
  Rect: (props: any) => <div data-testid="konva-rect" {...props} />,
  Circle: ({ onClick, ...props }: any) => (
    <div data-testid="konva-circle" onClick={onClick} {...props} />
  ),
  Text: (props: any) => <div data-testid="konva-text" {...props} />,
  Group: ({ children, onClick, ...props }: any) => (
    <div data-testid="konva-group" onClick={onClick} {...props}>
      {children}
    </div>
  ),
  Path: (props: any) => <div data-testid="konva-path" {...props} />,
  Line: (props: any) => <div data-testid="konva-line" {...props} />,
}))

function createDano(overrides: Partial<ReparacionDano> = {}): ReparacionDano {
  return {
    id: 'dano-1',
    caso_id: 'caso-1',
    zona: 'capot',
    x: 0.5,
    y: 0.2,
    descripcion: 'Bollos varios',
    reparado: false,
    origen_inspeccion: false,
    created_at: '2026-01-01',
    updated_at: '2026-01-01',
    ...overrides,
  }
}

describe('VehicleDamageMap', () => {
  it('renderiza el canvas y la lista de zonas/daños', () => {
    render(<VehicleDamageMap damages={[createDano()]} />)
    expect(screen.getByTestId('konva-stage')).toBeInTheDocument()
    expect(screen.getByText('capot')).toBeInTheDocument()
    expect(screen.getByText('Bollos varios')).toBeInTheDocument()
  })

  it('un puntero sobre el croquis llama onAdd con coordenadas normalizadas entre 0 y 1', () => {
    const onAdd = vi.fn()
    render(<VehicleDamageMap damages={[]} onAdd={onAdd} />)
    fireEvent.click(screen.getByTestId('konva-stage'))
    expect(onAdd).toHaveBeenCalled()
    const coords = onAdd.mock.calls[0][0]
    expect(coords.x).toBeGreaterThanOrEqual(0)
    expect(coords.x).toBeLessThanOrEqual(1)
    expect(coords.y).toBeGreaterThanOrEqual(0)
    expect(coords.y).toBeLessThanOrEqual(1)
  })

  it('los marcadores reparados cambian de apariencia y reflejan su estado', () => {
    const damages: ReparacionDano[] = [
      createDano({ id: 'd-1', zona: 'techo', reparado: false }),
      createDano({ id: 'd-2', zona: 'baul', reparado: true }),
    ]
    render(<VehicleDamageMap damages={damages} />)
    expect(screen.getByTestId('marker-reparado-d-2')).toHaveAttribute('data-reparado', 'true')
    expect(screen.getByTestId('marker-reparado-d-1')).toHaveAttribute('data-reparado', 'false')
  })

  it('permite alternar el estado reparado llamando onToggleRepaired', () => {
    const dano = createDano({ id: 'd-1', reparado: false })
    const onToggle = vi.fn()
    render(<VehicleDamageMap damages={[dano]} onToggleRepaired={onToggle} />)
    const toggleBtn = screen.getByRole('button', { name: /marcar reparado/i })
    fireEvent.click(toggleBtn)
    expect(onToggle).toHaveBeenCalledWith(dano)
  })

  it('los botones de eliminación destructiva tienen nombres accesibles y llaman onDelete', () => {
    const dano = createDano({ id: 'd-1', zona: 'puerta delantera izquierda' })
    const onDelete = vi.fn()
    render(<VehicleDamageMap damages={[dano]} onDelete={onDelete} />)
    const deleteBtn = screen.getByRole('button', {
      name: /eliminar daño puerta delantera izquierda/i,
    })
    expect(deleteBtn).toBeInTheDocument()
    fireEvent.click(deleteBtn)
    expect(onDelete).toHaveBeenCalledWith('d-1')
  })

  it('cuando readonly es true no muestra controles de agregado ni eliminación', () => {
    const dano = createDano()
    const onAdd = vi.fn()
    const onDelete = vi.fn()
    render(
      <VehicleDamageMap
        damages={[dano]}
        onAdd={onAdd}
        onDelete={onDelete}
        readonly={true}
      />
    )
    expect(
      screen.queryByRole('button', { name: /eliminar daño/i })
    ).not.toBeInTheDocument()
    fireEvent.click(screen.getByTestId('konva-stage'))
    expect(onAdd).not.toHaveBeenCalled()
  })
})
