import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router'
import { Ficha } from '../../ui/Ficha'
import { TextField } from '../../ui/TextField'
import { PrimaryButton } from '../../ui/PrimaryButton'
import { SemaforoBadge } from './components/SemaforoBadge'
import { VehicleDamageMap } from './components/VehicleDamageMap'
import {
  getCaso,
  startRepair,
  listRepairDamages,
  createRepairDamage,
  updateRepairDamage,
  deleteRepairDamage,
  waitForPart,
  resumeRepair,
} from './api'
import type { Caso, ReparacionDano, ZonaDano } from './types'

export function FichaTrabajoPage() {
  const { id } = useParams<{ id: string }>()

  const [caso, setCaso] = useState<Caso | null>(null)
  const [danos, setDanos] = useState<ReparacionDano[]>([])
  const [repuestoInput, setRepuestoInput] = useState('')
  const [errorRepuesto, setErrorRepuesto] = useState<string | null>(null)
  const [cargando, setCargando] = useState(true)
  const [errorCarga, setErrorCarga] = useState(false)
  const [errorAccion, setErrorAccion] = useState<string | null>(null)
  const [reintento, setReintento] = useState(0)

  useEffect(() => {
    if (!id) return
    let active = true
    setCargando(true)
    setErrorCarga(false)

    Promise.all([getCaso(id), listRepairDamages(id)])
      .then(([casoData, danosData]) => {
        if (active) {
          setCaso(casoData)
          setDanos(danosData)
        }
      })
      .catch(() => {
        if (active) {
          setCaso(null)
          setDanos([])
          setErrorCarga(true)
        }
      })
      .finally(() => {
        if (active) setCargando(false)
      })

    return () => {
      active = false
    }
  }, [id, reintento])

  if (!id || cargando) {
    return <div style={{ padding: '24px' }}>Cargando…</div>
  }

  if (errorCarga || !caso) {
    return (
      <div style={{ padding: '24px' }}>
        <p role="alert" className="font-sans text-sm text-red mb-4">
          No se pudo cargar el caso.
        </p>
        <PrimaryButton onClick={() => setReintento((v) => v + 1)}>
          Reintentar
        </PrimaryButton>
      </div>
    )
  }

  const caseId = id

  async function handleStartRepair() {
    setErrorAccion(null)
    try {
      const actualizado = await startRepair(caseId)
      setCaso(actualizado)
      const nuevosDanos = await listRepairDamages(caseId)
      setDanos(nuevosDanos)
    } catch (err: any) {
      setErrorAccion(err.message || 'Error al iniciar la reparación')
    }
  }

  async function handleAddDamage(coords: { x: number; y: number; zona: ZonaDano }) {
    setErrorAccion(null)
    try {
      const nuevo = await createRepairDamage(caseId, {
        zona: coords.zona,
        x: coords.x,
        y: coords.y,
        descripcion: null,
      })
      setDanos((prev) => [...prev, nuevo])
    } catch (err: any) {
      setErrorAccion(err.message || 'Error al agregar daño')
    }
  }

  async function handleToggleRepaired(damage: ReparacionDano) {
    setErrorAccion(null)
    try {
      const actualizado = await updateRepairDamage(damage.id, {
        reparado: !damage.reparado,
      })
      setDanos((prev) =>
        prev.map((d) => (d.id === actualizado.id ? actualizado : d))
      )
    } catch (err: any) {
      setErrorAccion(err.message || 'Error al actualizar daño')
    }
  }

  async function handleDeleteDamage(damageId: string) {
    setErrorAccion(null)
    try {
      await deleteRepairDamage(damageId)
      setDanos((prev) => prev.filter((d) => d.id !== damageId))
    } catch (err: any) {
      setErrorAccion(err.message || 'Error al eliminar daño')
    }
  }

  async function handleWaitForPart() {
    const trimmed = repuestoInput.trim()
    if (!trimmed) {
      setErrorRepuesto('El repuesto es obligatorio')
      return
    }
    setErrorRepuesto(null)
    setErrorAccion(null)
    try {
      const actualizado = await waitForPart(caseId, trimmed)
      setCaso(actualizado)
      setRepuestoInput('')
    } catch (err: any) {
      setErrorAccion(err.message || 'Error al cambiar a esperando repuesto')
    }
  }

  async function handleResumeRepair() {
    setErrorAccion(null)
    try {
      const actualizado = await resumeRepair(caseId)
      setCaso(actualizado)
    } catch (err: any) {
      setErrorAccion(err.message || 'Error al reanudar la reparación')
    }
  }

  return (
    <div style={{ padding: '24px', maxWidth: '800px' }} className="font-sans">
      <div className="flex items-center justify-between gap-4 mb-4">
        <div>
          <h1 className="font-display text-2xl font-bold uppercase">{caso.patente}</h1>
          <p className="text-sm text-steel-600">
            {caso.marca} {caso.modelo} {caso.color ? `· ${caso.color}` : ''}
          </p>
        </div>
        <div className="flex items-center gap-3">
          {caso.estado === 'en reparación' && (
            <Link
              to={`/casos/${caseId}/cierre-reparacion`}
              className="px-3 py-1.5 text-xs font-mono font-semibold uppercase bg-navy text-white hover:bg-navy-dark rounded text-center inline-block"
            >
              Cierre de reparación
            </Link>
          )}
          <SemaforoBadge estado={caso.estado} />
        </div>
      </div>

      {errorAccion && (
        <div role="alert" className="p-3 mb-4 bg-red-50 text-red text-sm border border-red rounded">
          {errorAccion}
        </div>
      )}

      {/* Daños iniciales de la inspección */}
      <Ficha title="Daños iniciales de inspección" className="mb-6">
        {caso.danos_zonas && caso.danos_zonas.length > 0 ? (
          <div className="flex flex-wrap gap-2">
            {caso.danos_zonas.map((zona) => (
              <span
                key={zona}
                className="px-2 py-1 text-xs font-mono font-medium uppercase bg-steel-200 border border-steel-400 rounded"
              >
                {zona}
              </span>
            ))}
          </div>
        ) : (
          <p className="text-sm text-steel-500">Sin zonas de daño registradas en inspección.</p>
        )}
      </Ficha>

      {/* Estado: ingresado -> Iniciar reparación */}
      {caso.estado === 'ingresado' && (
        <Ficha title="Inicio de reparación" className="mb-6">
          <p className="text-sm mb-4">
            El vehículo está ingresado en el taller. Haz clic en "Iniciar reparación" para copiar los
            daños al croquis y comenzar los trabajos.
          </p>
          <PrimaryButton onClick={handleStartRepair}>
            Iniciar reparación
          </PrimaryButton>
        </Ficha>
      )}

      {/* Estado: esperando repuesto */}
      {caso.estado === 'esperando repuesto' && (
        <Ficha title="En espera de repuesto" className="mb-6">
          <p className="text-sm text-amber-800 bg-amber-50 p-3 rounded border border-amber-300 mb-4">
            Repuesto pendiente: <strong className="font-semibold">{caso.repuesto_pendiente}</strong>
          </p>
          <PrimaryButton onClick={handleResumeRepair}>
            Reanudar reparación
          </PrimaryButton>
        </Ficha>
      )}

      {/* Estado: en reparación o esperando repuesto -> Croquis y gestión de repuestos */}
      {(caso.estado === 'en reparación' || caso.estado === 'esperando repuesto') && (
        <>
          <Ficha title="Croquis de daños y reparación" className="mb-6">
            <VehicleDamageMap
              damages={danos}
              onAdd={caso.estado === 'en reparación' ? handleAddDamage : undefined}
              onToggleRepaired={handleToggleRepaired}
              onDelete={handleDeleteDamage}
              readonly={caso.estado !== 'en reparación'}
            />
          </Ficha>

          {caso.estado === 'en reparación' && (
            <Ficha title="Pausar por falta de repuesto" className="mb-6">
              <div className="flex flex-col sm:flex-row items-start sm:items-end gap-3">
                <div className="flex-1 w-full">
                  <TextField
                    label="Repuesto"
                    name="repuesto"
                    value={repuestoInput}
                    onChange={(e) => {
                      setRepuestoInput(e.target.value)
                      if (errorRepuesto) setErrorRepuesto(null)
                    }}
                    error={errorRepuesto || undefined}
                    placeholder="Ej. Óptica delantera derecha"
                  />
                </div>
                <button
                  type="button"
                  onClick={handleWaitForPart}
                  className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white font-sans text-sm font-semibold rounded cursor-pointer whitespace-nowrap"
                >
                  Esperar repuesto
                </button>
              </div>
            </Ficha>
          )}
        </>
      )}
    </div>
  )
}
