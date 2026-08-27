import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router'
import { Ficha } from '../../ui/Ficha'
import { PrimaryButton } from '../../ui/PrimaryButton'
import { getCaso, updateCasoEstado } from './api'
import type { Caso } from './types'

const labelClassName = 'block text-xs font-mono font-semibold uppercase tracking-wide text-graphite mb-1'
const inputClassName =
  'w-full px-3 py-2.5 text-sm font-sans bg-white border-2 border-steel-300 focus:border-blue focus:outline-none focus:ring-0 mb-4'

export function CasoDetailPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()

  const [caso, setCaso] = useState<Caso | null>(null)
  const [turnoFecha, setTurnoFecha] = useState('')
  const [actualizando, setActualizando] = useState(false)

  useEffect(() => {
    if (!id) return
    getCaso(id).then(setCaso)
  }, [id])

  if (!id || !caso) {
    return <div style={{ padding: '24px' }}>Cargando…</div>
  }

  const caseId = id

  async function handleOrdenRecibida() {
    setActualizando(true)
    const actualizado = await updateCasoEstado(caseId, 'aprobado')
    setCaso(actualizado)
    setActualizando(false)
  }

  async function handleConfirmarTurno() {
    if (!turnoFecha) return
    setActualizando(true)
    const actualizado = await updateCasoEstado(caseId, 'turno coordinado', {
      turno_fecha: new Date(turnoFecha).toISOString(),
    })
    setCaso(actualizado)
    setActualizando(false)
  }

  return (
    <div style={{ padding: '24px', maxWidth: '640px' }}>
      <h1 className="font-display text-2xl font-bold uppercase mb-4">Caso {caso.patente}</h1>

      <Ficha className="mb-4">
        <p className="font-sans text-sm mb-1">
          <strong>Cliente:</strong> {caso.cliente_nombre}
        </p>
        <p className="font-sans text-sm mb-1">
          <strong>Aseguradora:</strong> {caso.aseguradora}
        </p>
        <p className="font-sans text-sm mb-1">
          <strong>Siniestro:</strong> {caso.numero_siniestro}
        </p>
        <p className="font-sans text-sm">
          <strong>Estado:</strong> {caso.estado}
        </p>
      </Ficha>

      {caso.estado === 'enviado a la aseguradora' && (
        <PrimaryButton onClick={handleOrdenRecibida} disabled={actualizando}>
          Marcar orden de trabajo recibida
        </PrimaryButton>
      )}

      {caso.estado === 'aprobado' && (
        <Ficha>
          <label htmlFor="turno_fecha" className={labelClassName}>
            Turno
          </label>
          <input
            id="turno_fecha"
            type="datetime-local"
            value={turnoFecha}
            onChange={(event) => setTurnoFecha(event.target.value)}
            className={inputClassName}
          />
          <PrimaryButton onClick={handleConfirmarTurno} disabled={!turnoFecha || actualizando}>
            Confirmar turno
          </PrimaryButton>
        </Ficha>
      )}

      {caso.estado === 'turno coordinado' && (
        <PrimaryButton onClick={() => navigate(`/casos/${caseId}/ficha-ingreso`)}>
          Registrar ingreso al taller
        </PrimaryButton>
      )}
    </div>
  )
}
