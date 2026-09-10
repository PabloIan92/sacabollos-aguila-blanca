import { beforeEach, describe, expect, it, vi } from 'vitest'
import { createStockItem, deleteStockItem, listStockItems, updateStockItem } from './api'

const select = vi.fn()
const order = vi.fn()
const insert = vi.fn()
const update = vi.fn()
const eq = vi.fn()
const single = vi.fn()
const remove = vi.fn()
const from = vi.fn()

vi.mock('../../lib/supabaseClient', () => ({ supabase: { from: (...args: unknown[]) => from(...args) } }))

beforeEach(() => {
  vi.clearAllMocks()
  from.mockReturnValue({ select, insert, update, delete: remove })
  select.mockReturnValue({ order })
  order.mockResolvedValue({ data: [], error: null })
  insert.mockReturnValue({ select: () => ({ single }) })
  update.mockReturnValue({ eq: (...args: unknown[]) => {
    eq(...args)
    return { select: () => ({ single }) }
  } })
  remove.mockReturnValue({ eq: (...args: unknown[]) => {
    eq(...args)
    return Promise.resolve({ error: null })
  } })
  single.mockResolvedValue({ data: {}, error: null })
})

describe('stock api', () => {
  it('listStockItems obtiene el stock por nombre ascendente', async () => {
    const items = [{ id: 's1', nombre: 'Masilla' }]
    order.mockResolvedValue({ data: items, error: null })
    await expect(listStockItems()).resolves.toEqual(items)
    expect(from).toHaveBeenCalledWith('stock_items')
    expect(select).toHaveBeenCalledWith('*')
    expect(order).toHaveBeenCalledWith('nombre', { ascending: true })
  })

  it('listStockItems propaga errores de Supabase', async () => {
    const error = new Error('falló listado')
    order.mockResolvedValue({ data: null, error })
    await expect(listStockItems()).rejects.toThrow('falló listado')
  })

  it('createStockItem normaliza nombre y unidad y devuelve el item', async () => {
    const item = { id: 's1', nombre: 'Masilla', unidad: 'kg' }
    single.mockResolvedValue({ data: item, error: null })
    await expect(createStockItem({ nombre: '  Masilla ', cantidad: 2, unidad: ' kg ', observaciones: null })).resolves.toEqual(item)
    expect(insert).toHaveBeenCalledWith({ nombre: 'Masilla', cantidad: 2, unidad: 'kg', observaciones: null })
  })

  it.each([
    [{ nombre: ' ', cantidad: 1, unidad: 'kg', observaciones: null }, 'nombre'],
    [{ nombre: 'Masilla', cantidad: 1, unidad: ' ', observaciones: null }, 'unidad'],
    [{ nombre: 'Masilla', cantidad: -1, unidad: 'kg', observaciones: null }, 'cantidad'],
    [{ nombre: 'Masilla', cantidad: Number.NaN, unidad: 'kg', observaciones: null }, 'cantidad'],
  ])('createStockItem rechaza valores inválidos', async (input, message) => {
    await expect(createStockItem(input)).rejects.toThrow(message)
    expect(from).not.toHaveBeenCalled()
  })

  it('createStockItem propaga errores de Supabase', async () => {
    const error = new Error('falló alta')
    single.mockResolvedValue({ data: null, error })
    await expect(createStockItem({ nombre: 'Masilla', cantidad: 1, unidad: 'kg', observaciones: null })).rejects.toThrow('falló alta')
  })

  it('updateStockItem normaliza y limita el patch permitido', async () => {
    const item = { id: 's1', nombre: 'Masilla fina', cantidad: 3 }
    single.mockResolvedValue({ data: item, error: null })
    await expect(updateStockItem('s1', { nombre: ' Masilla fina ', cantidad: 3, observaciones: ' nueva ' })).resolves.toEqual(item)
    expect(update).toHaveBeenCalledWith({ nombre: 'Masilla fina', cantidad: 3, observaciones: ' nueva ' })
    expect(eq).toHaveBeenCalledWith('id', 's1')
  })

  it.each([
    [{ nombre: ' ' }, 'nombre'], [{ unidad: ' ' }, 'unidad'], [{ cantidad: -1 }, 'cantidad'], [{ cantidad: Number.NaN }, 'cantidad'],
  ])('updateStockItem rechaza valores inválidos', async (patch, message) => {
    await expect(updateStockItem('s1', patch)).rejects.toThrow(message)
    expect(from).not.toHaveBeenCalled()
  })

  it('updateStockItem propaga errores de Supabase', async () => {
    const error = new Error('falló edición')
    single.mockResolvedValue({ data: null, error })
    await expect(updateStockItem('s1', { cantidad: 2 })).rejects.toThrow('falló edición')
  })

  it('deleteStockItem elimina por id', async () => {
    await deleteStockItem('s1')
    expect(from).toHaveBeenCalledWith('stock_items')
    expect(remove).toHaveBeenCalled()
    expect(eq).toHaveBeenCalledWith('id', 's1')
  })

  it('deleteStockItem propaga errores de Supabase', async () => {
    const error = new Error('falló baja')
    remove.mockReturnValue({ eq: () => Promise.resolve({ error }) })
    await expect(deleteStockItem('s1')).rejects.toThrow('falló baja')
  })
})
