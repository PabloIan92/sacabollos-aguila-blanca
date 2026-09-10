import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { MemoryRouter } from 'react-router'
import { StockPage } from './StockPage'
import {
  listStockItems,
  createStockItem,
  updateStockItem,
  deleteStockItem,
} from './api'
import type { StockItem } from './types'

vi.mock('./api', () => ({
  listStockItems: vi.fn(),
  createStockItem: vi.fn(),
  updateStockItem: vi.fn(),
  deleteStockItem: vi.fn(),
}))

const mockedListStockItems = vi.mocked(listStockItems)
const mockedCreateStockItem = vi.mocked(createStockItem)
const mockedUpdateStockItem = vi.mocked(updateStockItem)
const mockedDeleteStockItem = vi.mocked(deleteStockItem)

function createItem(overrides: Partial<StockItem> = {}): StockItem {
  return {
    id: 'item-1',
    nombre: 'Masilla poliester',
    cantidad: 5,
    unidad: 'kg',
    observaciones: 'Para reparaciones de chapa',
    updated_at: '2026-03-01T10:00:00.000Z',
    updated_by: 'user-1',
    ...overrides,
  }
}

function renderPage() {
  return render(
    <MemoryRouter>
      <StockPage />
    </MemoryRouter>
  )
}

describe('StockPage', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    window.confirm = vi.fn(() => true)
  })

  it('muestra estado vacío cuando no hay ítems', async () => {
    mockedListStockItems.mockResolvedValue([])
    renderPage()

    expect(await screen.findByText(/no hay ítems en stock/i)).toBeInTheDocument()
  })

  it('muestra error y reintenta si falla la carga inicial', async () => {
    mockedListStockItems.mockRejectedValueOnce(new Error('Network error'))
    renderPage()

    expect(await screen.findByRole('alert')).toHaveTextContent(/no se pudo cargar/i)

    mockedListStockItems.mockResolvedValueOnce([createItem()])
    fireEvent.click(screen.getByRole('button', { name: /reintentar/i }))

    expect(await screen.findByText('Masilla poliester')).toBeInTheDocument()
  })

  it('permite crear un ítem completando el formulario', async () => {
    mockedListStockItems.mockResolvedValue([])
    mockedCreateStockItem.mockResolvedValue(createItem({ id: 'item-new', nombre: 'Lijas al agua 1200' }))

    renderPage()
    await screen.findByText(/no hay ítems en stock/i)

    fireEvent.change(screen.getByLabelText(/nombre/i), { target: { value: 'Lijas al agua 1200' } })
    fireEvent.change(screen.getByLabelText(/cantidad/i), { target: { value: '10' } })
    fireEvent.change(screen.getByLabelText(/unidad/i), { target: { value: 'unidades' } })
    fireEvent.change(screen.getByLabelText(/observaciones/i), { target: { value: 'Lijas finas' } })

    fireEvent.click(screen.getByRole('button', { name: /agregar al stock/i }))

    await waitFor(() => {
      expect(mockedCreateStockItem).toHaveBeenCalledWith({
        nombre: 'Lijas al agua 1200',
        cantidad: 10,
        unidad: 'unidades',
        observaciones: 'Lijas finas',
      })
    })
  })

  it('rechaza cantidad negativa antes de llamar a la API', async () => {
    mockedListStockItems.mockResolvedValue([])
    renderPage()
    await screen.findByText(/no hay ítems en stock/i)

    fireEvent.change(screen.getByLabelText(/nombre/i), { target: { value: 'Cinta de enmascarar' } })
    fireEvent.change(screen.getByLabelText(/cantidad/i), { target: { value: '-2' } })
    fireEvent.change(screen.getByLabelText(/unidad/i), { target: { value: 'rollos' } })

    fireEvent.click(screen.getByRole('button', { name: /agregar al stock/i }))

    expect(await screen.findByText(/la cantidad no puede ser negativa/i)).toBeInTheDocument()
    expect(mockedCreateStockItem).not.toHaveBeenCalled()
  })

  it('permite editar cantidad, unidad y observaciones', async () => {
    const item = createItem()
    mockedListStockItems.mockResolvedValue([item])
    mockedUpdateStockItem.mockResolvedValue({
      ...item,
      cantidad: 8,
      unidad: 'latas',
      observaciones: 'Actualizado',
    })

    renderPage()
    expect(await screen.findByText('Masilla poliester')).toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', { name: /editar/i }))

    const cantidadInput = screen.getByDisplayValue('5')
    fireEvent.change(cantidadInput, { target: { value: '8' } })

    const unidadInput = screen.getByDisplayValue('kg')
    fireEvent.change(unidadInput, { target: { value: 'latas' } })

    const obsInput = screen.getByDisplayValue('Para reparaciones de chapa')
    fireEvent.change(obsInput, { target: { value: 'Actualizado' } })

    fireEvent.click(screen.getByRole('button', { name: /guardar cambios/i }))

    await waitFor(() => {
      expect(mockedUpdateStockItem).toHaveBeenCalledWith('item-1', {
        nombre: 'Masilla poliester',
        cantidad: 8,
        unidad: 'latas',
        observaciones: 'Actualizado',
      })
    })
  })

  it('elimina un ítem solo tras confirmación del usuario', async () => {
    const item = createItem()
    mockedListStockItems.mockResolvedValue([item])
    mockedDeleteStockItem.mockResolvedValue(undefined)

    renderPage()
    expect(await screen.findByText('Masilla poliester')).toBeInTheDocument()

    // Caso 1: usuario cancela confirmación
    vi.mocked(window.confirm).mockReturnValueOnce(false)
    fireEvent.click(screen.getByRole('button', { name: /eliminar/i }))
    expect(mockedDeleteStockItem).not.toHaveBeenCalled()

    // Caso 2: usuario acepta confirmación
    vi.mocked(window.confirm).mockReturnValueOnce(true)
    fireEvent.click(screen.getByRole('button', { name: /eliminar/i }))
    await waitFor(() => {
      expect(mockedDeleteStockItem).toHaveBeenCalledWith('item-1')
    })
  })
})
