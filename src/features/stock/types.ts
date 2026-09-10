export interface StockItem {
  id: string
  nombre: string
  cantidad: number
  unidad: string
  observaciones: string | null
  updated_at: string
  updated_by: string | null
}

export interface CreateStockItemInput {
  nombre: string
  cantidad: number
  unidad: string
  observaciones: string | null
}

export type UpdateStockItemInput = Partial<
  Pick<StockItem, 'nombre' | 'cantidad' | 'unidad' | 'observaciones'>
>
