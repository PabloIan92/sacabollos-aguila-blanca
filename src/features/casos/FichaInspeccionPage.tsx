import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router'
import { Ficha } from '../../ui/Ficha'
import { PrimaryButton } from '../../ui/PrimaryButton'
import {
  acceptParticular,
  getCaso,
  markSeguroSent,
  rejectParticular,
  saveCasoInspection,
} from './api'
import { ANGULOS_FOTO, type Caso, type ModalidadContacto, type ZonaDano } from './types'
import { DamageCheckboxes } from './components/DamageCheckboxes'
import { FotoUploader } from './components/FotoUploader'

export function FichaInspeccionPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()

  const [caso, setCaso] = useState<Caso | null>(null)
  const [zonas, setZonas] = useState<ZonaDano[]>([])
  const [fotosSubidas, setFotosSubidas] = useState(0)
  const [guardando, setGuardando] = useState(false)
  const [accionando, setAccionando] = useState(false)
  const [modalidad, setModalidad] = useState<ModalidadContacto | ''>('')
  const [seguimientoObservaciones, setSeguimientoObservaciones] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [cargando, setCargando] = useState(true)
  const [errorCarga, setErrorCarga] = useState(false)
  const [reintento, setReintento] = useState(0)

  useEffect(() => {
    if (!id) return
    let active = true
    setCargando(true)
    setErrorCarga(false)
    void getCaso(id)
      .then((data) => {
        if (!active) return
        setCaso(data)
        setZonas(data.danos_zonas)
      })
      .catch(() => {
        if (!active) return
        setCaso(null)
        setErrorCarga(true)
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
        <PrimaryButton onClick={() => setReintento((valor) => valor + 1)}>
          Reintentar
        </PrimaryButton>
      </div>
    )
  }

  const caseId = id
  const fichaGuardada = Boolean(caso.inspeccion_guardada_at)

  async function handleGuardar() {
    setGuardando(true)
    setError(null)
    try {
      setCaso(await saveCasoInspection(caseId, zonas))
    } catch {
      setError('No pudimos guardar la ficha. Intentá nuevamente.')
    } finally {
      setGuardando(false)
    }
  }

  async function handleMarcarEnviado() {
    setAccionando(true)
    setError(null)
    try {
      await markSeguroSent(caseId)
      navigate('/casos')
    } catch {
      setError('No pudimos marcar el caso como enviado. Intentá nuevamente.')
    } finally {
      setAccionando(false)
    }
  }

  async function handleAceptarParticular() {
    setAccionando(true)
    setError(null)
    try {
      await acceptParticular(caseId)
      navigate(`/casos/${caseId}`)
    } catch {
      setError('No pudimos aceptar el presupuesto. Intentá nuevamente.')
    } finally {
      setAccionando(false)
    }
  }

  async function handleRechazarParticular() {
    if (!modalidad) return
    setAccionando(true)
    setError(null)
    try {
      await rejectParticular(caseId, modalidad, seguimientoObservaciones.trim() || null)
      navigate('/casos')
    } catch {
      setError('No pudimos registrar el rechazo. Intentá nuevamente.')
    } finally {
      setAccionando(false)
    }
  }

  return (
    <div style={{ padding: '24px', maxWidth: '720px' }}>
      <h1 className="font-display text-2xl font-bold uppercase mb-4">Ficha de inspección</h1>

      <Ficha className="mb-4">
        <h2 className="font-sans font-bold mb-2">Zonas dañadas</h2>
        <DamageCheckboxes selected={zonas} onChange={setZonas} />
      </Ficha>

      <Ficha className="mb-4">
        <h2 className="font-sans font-bold mb-2">Fotos (4 obligatorias)</h2>
        <FotoUploader caseId={id} angulos={ANGULOS_FOTO} onUploadedCountChange={setFotosSubidas} />
      </Ficha>

      <PrimaryButton
        onClick={handleGuardar}
        disabled={fotosSubidas < ANGULOS_FOTO.length || guardando}
        className="mb-4"
      >
        {guardando ? 'Guardando…' : 'Guardar ficha de inspección'}
      </PrimaryButton>

      {error && (
        <p role="alert" className="mb-4 border-2 border-red bg-white p-3 text-sm font-sans text-red">
          {error}
        </p>
      )}

      {caso.estado === 'borrador' && (caso.canal === 'seguro' ? (
        <>
          <Ficha className="mb-4">
            <p className="font-sans text-sm mb-2">
              Mandá el mail a la aseguradora desde tu correo con estos datos, y después marcá como enviado.
            </p>
            <p className="font-mono text-sm" style={{ userSelect: 'text' }}>
              Número de siniestro: {caso.numero_siniestro}
            </p>
            <p className="font-mono text-sm" style={{ userSelect: 'text' }}>
              Denuncia: {caso.denuncia}
            </p>
          </Ficha>

          <PrimaryButton onClick={handleMarcarEnviado} disabled={!fichaGuardada || accionando}>
            {accionando ? 'Marcando…' : 'Marcar como enviado a la aseguradora'}
          </PrimaryButton>
        </>
      ) : (
        fichaGuardada && (
          <Ficha>
            <h2 className="font-sans font-bold mb-3">Respuesta al presupuesto</h2>
            <PrimaryButton
              onClick={handleAceptarParticular}
              disabled={accionando}
              className="mb-4"
            >
              {accionando ? 'Registrando…' : 'Aceptar presupuesto'}
            </PrimaryButton>

            <div className="border-t-2 border-steel-300 pt-4">
              <label
                htmlFor="modalidad_contacto"
                className="block text-xs font-mono font-semibold uppercase tracking-wide text-graphite mb-1"
              >
                Modalidad de contacto
              </label>
              <select
                id="modalidad_contacto"
                value={modalidad}
                onChange={(event) => setModalidad(event.target.value as ModalidadContacto | '')}
                className="w-full px-3 py-2.5 text-sm font-sans bg-white border-2 border-steel-300 focus:border-blue focus:outline-none focus:ring-0 mb-4"
              >
                <option value="">Seleccionar…</option>
                <option value="whatsapp">WhatsApp</option>
                <option value="telefono">Teléfono</option>
                <option value="email">Email</option>
                <option value="presencial">Presencial</option>
              </select>

              <label
                htmlFor="seguimiento_observaciones"
                className="block text-xs font-mono font-semibold uppercase tracking-wide text-graphite mb-1"
              >
                Observaciones de seguimiento
              </label>
              <textarea
                id="seguimiento_observaciones"
                value={seguimientoObservaciones}
                onChange={(event) => setSeguimientoObservaciones(event.target.value)}
                rows={3}
                className="w-full px-3 py-2.5 text-sm font-sans bg-white border-2 border-steel-300 focus:border-blue focus:outline-none focus:ring-0 mb-4"
              />

              <PrimaryButton
                onClick={handleRechazarParticular}
                disabled={!modalidad || accionando}
              >
                {accionando ? 'Registrando…' : 'No acepta el presupuesto'}
              </PrimaryButton>
            </div>
          </Ficha>
        )
      ))}
    </div>
  )
}
