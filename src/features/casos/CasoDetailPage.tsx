import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router'
import { Ficha } from '../../ui/Ficha'
import { PrimaryButton } from '../../ui/PrimaryButton'
import { coordinateCasoTurno, getCaso, markSeguroApproved } from './api'
import type { Caso, ModalidadContacto } from './types'

const labelClassName = 'block text-xs font-mono font-semibold uppercase tracking-wide text-graphite mb-1'
const inputClassName =
  'w-full px-3 py-2.5 text-sm font-sans bg-white border-2 border-steel-300 focus:border-blue focus:outline-none focus:ring-0 mb-4'
const MODALIDAD_LABELS: Record<ModalidadContacto, string> = {
  whatsapp: 'WhatsApp',
  telefono: 'Teléfono',
  email: 'Email',
  presencial: 'Presencial',
}

export function CasoDetailPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()

  const [caso, setCaso] = useState<Caso | null>(null)
  const [turnoFecha, setTurnoFecha] = useState('')
  const [actualizando, setActualizando] = useState(false)
  const [cargando, setCargando] = useState(true)
  const [errorCarga, setErrorCarga] = useState(false)
  const [errorOperacion, setErrorOperacion] = useState<string | null>(null)
  const [reintento, setReintento] = useState(0)

  useEffect(() => {
    if (!id) return
    let active = true
    setCargando(true)
    setErrorCarga(false)
    void getCaso(id)
      .then((data) => {
        if (active) setCaso(data)
      })
      .catch(() => {
        if (active) {
          setCaso(null)
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
        <p role="alert" className="font-sans text-sm text-red mb-4">No se pudo cargar el caso.</p>
        <PrimaryButton onClick={() => setReintento((valor) => valor + 1)}>Reintentar</PrimaryButton>
      </div>
    )
  }

  const caseId = id

  async function handleOrdenRecibida() {
    setActualizando(true)
    setErrorOperacion(null)
    try {
      const actualizado = await markSeguroApproved(caseId)
      setCaso(actualizado)
    } catch {
      setErrorOperacion('No se pudo registrar la orden de trabajo. Intentá nuevamente.')
    } finally {
      setActualizando(false)
    }
  }

  async function handleConfirmarTurno() {
    if (!turnoFecha) return
    setActualizando(true)
    setErrorOperacion(null)
    try {
      const actualizado = await coordinateCasoTurno(caseId, new Date(turnoFecha).toISOString())
      setCaso(actualizado)
    } catch {
      setErrorOperacion('No se pudo coordinar el turno. Intentá nuevamente.')
    } finally {
      setActualizando(false)
    }
  }

  return (
    <div style={{ padding: '24px', maxWidth: '640px' }}>
      <h1 className="font-display text-2xl font-bold uppercase mb-4">Caso {caso.patente}</h1>

      {errorOperacion && <p role="alert" className="font-sans text-sm text-red mb-4">{errorOperacion}</p>}

      <Ficha className="mb-4">
        <p className="font-sans text-sm mb-1">
          <strong>Cliente:</strong> {caso.cliente_nombre}
        </p>
        <p className="font-sans text-sm mb-1">
          <strong>Canal:</strong> {caso.canal === 'seguro' ? 'Seguro' : 'Particular'}
        </p>
        {caso.canal === 'seguro' ? (
          <>
            <p className="font-sans text-sm mb-1">
              <strong>Aseguradora:</strong> {caso.aseguradora}
            </p>
            <p className="font-sans text-sm mb-1">
              <strong>Siniestro:</strong> {caso.numero_siniestro}
            </p>
          </>
        ) : (
          <>
            <p className="font-sans text-sm mb-1">
              <strong>Presupuesto:</strong>{' '}
              {caso.presupuesto_monto?.toLocaleString('es-AR', {
                style: 'currency',
                currency: 'ARS',
              })}
            </p>
            <p className="font-sans text-sm mb-1">
              <strong>Respuesta:</strong> {caso.presupuesto_respuesta}
            </p>
            {caso.presupuesto_observaciones && (
              <p className="font-sans text-sm mb-1">
                <strong>Observaciones del presupuesto:</strong>{' '}
                {caso.presupuesto_observaciones}
              </p>
            )}
            {caso.modalidad_contacto && (
              <p className="font-sans text-sm mb-1">
                <strong>Modalidad de contacto:</strong>{' '}
                {MODALIDAD_LABELS[caso.modalidad_contacto]}
              </p>
            )}
            {caso.seguimiento_observaciones && (
              <p className="font-sans text-sm mb-1">
                <strong>Observaciones de seguimiento:</strong>{' '}
                {caso.seguimiento_observaciones}
              </p>
            )}
          </>
        )}
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
