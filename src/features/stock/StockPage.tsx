import { useEffect, useState } from 'react'
import { Ficha } from '../../ui/Ficha'
import { TextField } from '../../ui/TextField'
import { PrimaryButton } from '../../ui/PrimaryButton'
import {
  listStockItems,
  createStockItem,
  updateStockItem,
  deleteStockItem,
} from './api'
import type { StockItem } from './types'

export function StockPage() {
  const [items, setItems] = useState<StockItem[] | null>(null)
  const [cargando, setCargando] = useState(true)
  const [errorCarga, setErrorCarga] = useState(false)
  const [errorAccion, setErrorAccion] = useState<string | null>(null)
  const [reintento, setReintento] = useState(0)

  // Form state
  const [editingId, setEditingId] = useState<string | null>(null)
  const [nombre, setNombre] = useState('')
  const [cantidad, setCantidad] = useState('')
  const [unidad, setUnidad] = useState('')
  const [observaciones, setObservaciones] = useState('')

  const [errorNombre, setErrorNombre] = useState<string | null>(null)
  const [errorCantidad, setErrorCantidad] = useState<string | null>(null)
  const [errorUnidad, setErrorUnidad] = useState<string | null>(null)
  const [guardando, setGuardando] = useState(false)

  useEffect(() => {
    let active = true
    setCargando(true)
    setErrorCarga(false)

    listStockItems()
      .then((data) => {
        if (active) setItems(data)
      })
      .catch(() => {
        if (active) {
          setItems(null)
          setErrorCarga(true)
        }
      })
      .finally(() => {
        if (active) setCargando(false)
      })

    return () => {
      active = false
    }
  }, [reintento])

  function resetForm() {
    setEditingId(null)
    setNombre('')
    setCantidad('')
    setUnidad('')
    setObservaciones('')
    setErrorNombre(null)
    setErrorCantidad(null)
    setErrorUnidad(null)
  }

  function handleStartEdit(item: StockItem) {
    setErrorAccion(null)
    setEditingId(item.id)
    setNombre(item.nombre)
    setCantidad(String(item.cantidad))
    setUnidad(item.unidad)
    setObservaciones(item.observaciones || '')
    setErrorNombre(null)
    setErrorCantidad(null)
    setErrorUnidad(null)
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setErrorAccion(null)

    let valid = true
    if (!nombre.trim()) {
      setErrorNombre('El nombre es obligatorio')
      valid = false
    } else {
      setErrorNombre(null)
    }

    const numCantidad = Number(cantidad)
    if (cantidad.trim() === '' || isNaN(numCantidad)) {
      setErrorCantidad('La cantidad es obligatoria')
      valid = false
    } else if (numCantidad < 0) {
      setErrorCantidad('La cantidad no puede ser negativa')
      valid = false
    } else {
      setErrorCantidad(null)
    }

    if (!unidad.trim()) {
      setErrorUnidad('La unidad es obligatoria')
      valid = false
    } else {
      setErrorUnidad(null)
    }

    if (!valid) return

    setGuardando(true)
    try {
      if (editingId) {
        const actualizado = await updateStockItem(editingId, {
          nombre: nombre.trim(),
          cantidad: numCantidad,
          unidad: unidad.trim(),
          observaciones: observaciones.trim() || null,
        })
        setItems((prev) =>
          prev ? prev.map((item) => (item.id === editingId ? actualizado : item)) : [actualizado]
        )
      } else {
        const nuevo = await createStockItem({
          nombre: nombre.trim(),
          cantidad: numCantidad,
          unidad: unidad.trim(),
          observaciones: observaciones.trim() || null,
        })
        setItems((prev) => (prev ? [...prev, nuevo] : [nuevo]))
      }
      resetForm()
    } catch (err: any) {
      setErrorAccion(err.message || 'Error al guardar el ítem')
    } finally {
      setGuardando(false)
    }
  }

  async function handleDelete(item: StockItem) {
    setErrorAccion(null)
    const confirmed = window.confirm(`¿Seguro que deseas eliminar "${item.nombre}" del stock?`)
    if (!confirmed) return

    try {
      await deleteStockItem(item.id)
      setItems((prev) => (prev ? prev.filter((i) => i.id !== item.id) : []))
      if (editingId === item.id) {
        resetForm()
      }
    } catch (err: any) {
      setErrorAccion(err.message || 'Error al eliminar el ítem')
    }
  }

  if (cargando) {
    return <div style={{ padding: '24px' }}>Cargando…</div>
  }

  if (errorCarga || items === null) {
    return (
      <div style={{ padding: '24px' }}>
        <p role="alert" className="font-sans text-sm text-red mb-4">
          No se pudo cargar el stock.
        </p>
        <PrimaryButton onClick={() => setReintento((v) => v + 1)}>
          Reintentar
        </PrimaryButton>
      </div>
    )
  }

  return (
    <div style={{ padding: '24px', maxWidth: '900px' }} className="font-sans">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="font-display text-2xl font-bold uppercase">Stock del taller</h1>
          <p className="text-sm text-steel-600">
            Control simple de repuestos, insumos y consumibles compartidos.
          </p>
        </div>
      </div>

      {errorAccion && (
        <div role="alert" className="p-3 mb-4 bg-red-50 text-red text-sm border border-red rounded">
          {errorAccion}
        </div>
      )}

      {/* Formulario de Alta y Edición */}
      <Ficha
        title={editingId ? 'Editar ítem de stock' : 'Agregar nuevo ítem'}
        className="mb-8"
      >
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="sm:col-span-1">
              <TextField
                label="Nombre"
                name="nombre"
                value={nombre}
                onChange={(e) => setNombre(e.target.value)}
                error={errorNombre || undefined}
                placeholder="Ej. Masilla poliester"
              />
            </div>
            <div>
              <TextField
                label="Cantidad"
                name="cantidad"
                type="number"
                step="any"
                value={cantidad}
                onChange={(e) => setCantidad(e.target.value)}
                error={errorCantidad || undefined}
                placeholder="Ej. 5"
              />
            </div>
            <div>
              <TextField
                label="Unidad"
                name="unidad"
                value={unidad}
                onChange={(e) => setUnidad(e.target.value)}
                error={errorUnidad || undefined}
                placeholder="Ej. kg, rollos, unidades"
              />
            </div>
          </div>

          <div>
            <TextField
              label="Observaciones (opcional)"
              name="observaciones"
              value={observaciones}
              onChange={(e) => setObservaciones(e.target.value)}
              placeholder="Detalles sobre marca, compatibilidad o ubicación"
            />
          </div>

          <div className="flex items-center gap-3">
            <PrimaryButton disabled={guardando}>
              {guardando
                ? 'Guardando…'
                : editingId
                ? 'Guardar cambios'
                : 'Agregar al stock'}
            </PrimaryButton>
            {editingId && (
              <button
                type="button"
                onClick={resetForm}
                className="px-4 py-2 text-sm font-sans font-semibold border-2 border-graphite rounded bg-white hover:bg-steel-100 cursor-pointer"
              >
                Cancelar
              </button>
            )}
          </div>
        </form>
      </Ficha>

      {/* Tabla de ítems */}
      <Ficha title={`Ítems registrados (${items.length})`}>
        {items.length === 0 ? (
          <p className="text-sm text-steel-600 py-4">
            No hay ítems en stock todavía. Usá el formulario superior para registrar el primer insumo.
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm font-sans bg-white border-2 border-graphite">
              <thead>
                <tr className="border-b-2 border-graphite text-left font-mono text-xs uppercase bg-steel-100">
                  <th className="p-2">Ítem</th>
                  <th className="p-2">Cantidad</th>
                  <th className="p-2">Unidad</th>
                  <th className="p-2">Observaciones</th>
                  <th className="p-2 text-right">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {items.map((item) => (
                  <tr key={item.id} className="border-b border-steel-300 hover:bg-steel-50">
                    <td className="p-2 font-bold">{item.nombre}</td>
                    <td className="p-2 font-mono font-semibold">{item.cantidad}</td>
                    <td className="p-2 text-steel-700">{item.unidad}</td>
                    <td className="p-2 text-xs text-steel-600">{item.observaciones || '—'}</td>
                    <td className="p-2 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          type="button"
                          onClick={() => handleStartEdit(item)}
                          className="px-2 py-1 text-xs font-mono font-semibold bg-steel-200 hover:bg-steel-300 border border-steel-400 rounded cursor-pointer"
                        >
                          Editar
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDelete(item)}
                          className="px-2 py-1 text-xs font-mono font-semibold bg-red-50 text-red hover:bg-red hover:text-white border border-red rounded cursor-pointer"
                        >
                          Eliminar
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Ficha>
    </div>
  )
}
