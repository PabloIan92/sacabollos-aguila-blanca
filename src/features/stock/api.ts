import { supabase } from '../../lib/supabaseClient'
import type { CreateStockItemInput, StockItem, UpdateStockItemInput } from './types'

function normalizeName(value: string) {
  const normalized = value.trim()
  if (!normalized) throw new Error('El nombre es obligatorio')
  return normalized
}

function normalizeUnit(value: string) {
  const normalized = value.trim()
  if (!normalized) throw new Error('La unidad es obligatoria')
  return normalized
}

function validateQuantity(value: number) {
  if (!Number.isFinite(value) || value < 0) throw new Error('La cantidad debe ser un número no negativo')
  return value
}

function normalizeCreateInput(input: CreateStockItemInput): CreateStockItemInput {
  return {
    nombre: normalizeName(input.nombre),
    cantidad: validateQuantity(input.cantidad),
    unidad: normalizeUnit(input.unidad),
    observaciones: input.observaciones,
  }
}

function normalizePatch(patch: UpdateStockItemInput): UpdateStockItemInput {
  return {
    ...(patch.nombre === undefined ? {} : { nombre: normalizeName(patch.nombre) }),
    ...(patch.cantidad === undefined ? {} : { cantidad: validateQuantity(patch.cantidad) }),
    ...(patch.unidad === undefined ? {} : { unidad: normalizeUnit(patch.unidad) }),
    ...(patch.observaciones === undefined ? {} : { observaciones: patch.observaciones }),
  }
}

export async function listStockItems() {
  const { data, error } = await supabase.from('stock_items').select('*').order('nombre', { ascending: true })
  if (error) throw error
  return data as StockItem[]
}

export async function createStockItem(input: CreateStockItemInput) {
  const normalizedInput = normalizeCreateInput(input)
  const { data, error } = await supabase
    .from('stock_items')
    .insert(normalizedInput)
    .select()
    .single()
  if (error) throw error
  return data as StockItem
}

export async function updateStockItem(id: string, patch: UpdateStockItemInput) {
  const normalizedPatch = normalizePatch(patch)
  const { data, error } = await supabase
    .from('stock_items')
    .update(normalizedPatch)
    .eq('id', id)
    .select()
    .single()
  if (error) throw error
  return data as StockItem
}

export async function deleteStockItem(id: string) {
  const { error } = await supabase.from('stock_items').delete().eq('id', id)
  if (error) throw error
}
