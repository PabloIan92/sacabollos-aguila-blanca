import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router'
import { Ficha } from '../../ui/Ficha'
import { PrimaryButton } from '../../ui/PrimaryButton'
import {
  aceptarCasoParticular,
  getCaso,
  guardarInspeccion,
  rechazarCasoParticular,
  updateCasoEstado,
} from './api'
import {
  ANGULOS_FOTO,
  MODALIDADES_CONTACTO,
  type Caso,
  type ModalidadContacto,
  type ZonaDano,
} from './types'
import { DamageCheckboxes } from './components/DamageCheckboxes'
import { FotoUploader } from './components/FotoUploader'

export function FichaInspeccionPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()

  const [caso, setCaso] = useState<Caso | null>(null)
  const [zonas, setZonas] = useState<ZonaDano[]>([])
  const [fotosSubidas, setFotosSubidas] = useState(0)
  const [fichaGuardada, setFichaGuardada] = useState(false)
  const [guardando, setGuardando] = useState(false)
  const [enviando, setEnviando] = useState(false)
  const [decidiendo, setDecidiendo] = useState(false)
  const [modalidadContacto, setModalidadContacto] = useState<ModalidadContacto | ''>('')
  const [observaciones, setObservaciones] = useState('')
  const [cargando, setCargando] = useState(true)
  const [errorCarga, setErrorCarga] = useState(false)
  const [errorAccion, setErrorAccion] = useState<string | null>(null)
  const [intentoCarga, setIntentoCarga] = useState(0)

  useEffect(() => {
    if (!id) return
    let activo = true
    setCargando(true)
    setErrorCarga(false)

    getCaso(id)
      .then((data) => {
        if (!activo) return
        setCaso(data)
        setZonas(data.danos_zonas)
        setFichaGuardada(Boolean(data.inspeccion_guardada_at))
        if (data.canal === 'particular') {
          setModalidadContacto(data.modalidad_contacto ?? '')
          setObservaciones(data.seguimiento_observaciones ?? '')
        }
      })
      .catch(() => {
        if (activo) setErrorCarga(true)
      })
      .finally(() => {
        if (activo) setCargando(false)
      })

    return () => {
      activo = false
    }
  }, [id, intentoCarga])

  if (!id || cargando) {
    return <div style={{ padding: '24px' }}>Cargando…</div>
  }

  if (errorCarga || !caso) {
    return (
      <div style={{ padding: '24px' }}>
        <p role="alert" className="font-sans text-sm mb-3">
          No se pudo cargar el caso. Intentá nuevamente.
        </p>
        <PrimaryButton onClick={() => setIntentoCarga((intento) => intento + 1)}>
          Reintentar
        </PrimaryButton>
      </div>
    )
  }

  const caseId = id
  const casoActual = caso

  async function handleGuardar() {
    setGuardando(true)
    setErrorAccion(null)
    try {
      const casoGuardado = await guardarInspeccion(caseId, zonas)
      setCaso(casoGuardado)
      setFichaGuardada(true)
    } catch {
      setErrorAccion('No se pudo guardar la ficha. Intentá nuevamente.')
    } finally {
      setGuardando(false)
    }
  }

  async function handleMarcarEnviado() {
    setEnviando(true)
    setErrorAccion(null)
    try {
      await updateCasoEstado(caseId, 'enviado a la aseguradora')
      navigate('/casos')
    } catch {
      setErrorAccion('No se pudo marcar el caso como enviado. Intentá nuevamente.')
    } finally {
      setEnviando(false)
    }
  }

  async function handleAceptar() {
    setDecidiendo(true)
    setErrorAccion(null)
    try {
      await aceptarCasoParticular(caseId)
      navigate('/casos')
    } catch {
      setErrorAccion('No se pudo registrar la decisión. Intentá nuevamente.')
    } finally {
      setDecidiendo(false)
    }
  }

  async function handleRechazar() {
    if (!modalidadContacto) {
      setErrorAccion('Seleccioná una modalidad de contacto para registrar el rechazo.')
      return
    }

    setDecidiendo(true)
    setErrorAccion(null)
    try {
      await rechazarCasoParticular(caseId, {
        modalidad_contacto: modalidadContacto,
        seguimiento_observaciones: observaciones.trim() || null,
      })
      navigate('/casos')
    } catch {
      setErrorAccion('No se pudo registrar la decisión. Intentá nuevamente.')
    } finally {
      setDecidiendo(false)
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

      {errorAccion && (
        <p role="alert" className="font-sans text-sm text-red-700 mb-4">
          {errorAccion}
        </p>
      )}

      {casoActual.canal === 'seguro' ? (
        <>
          <Ficha className="mb-4">
            <p className="font-sans text-sm mb-2">
              Mandá el mail a la aseguradora desde tu correo con estos datos, y después marcá como enviado.
            </p>
            <p className="font-mono text-sm" style={{ userSelect: 'text' }}>
              Número de siniestro: {casoActual.numero_siniestro}
            </p>
            <p className="font-mono text-sm" style={{ userSelect: 'text' }}>
              Denuncia: {casoActual.denuncia}
            </p>
          </Ficha>

          <PrimaryButton onClick={handleMarcarEnviado} disabled={!fichaGuardada || enviando}>
            {enviando ? 'Marcando…' : 'Marcar como enviado a la aseguradora'}
          </PrimaryButton>
        </>
      ) : (
        <Ficha className="mb-4">
          <h2 className="font-sans font-bold mb-3">Respuesta del cliente</h2>
          <label className="block font-sans text-sm font-semibold mb-3">
            Modalidad de contacto
            <select
              value={modalidadContacto}
              onChange={(event) => {
                setModalidadContacto(event.target.value as ModalidadContacto | '')
                setErrorAccion(null)
              }}
              className="block w-full border-2 border-steel-300 p-2 mt-1"
            >
              <option value="">Seleccioná una modalidad</option>
              {MODALIDADES_CONTACTO.map((modalidad) => (
                <option key={modalidad} value={modalidad}>
                  {modalidad}
                </option>
              ))}
            </select>
          </label>
          <label className="block font-sans text-sm font-semibold mb-4">
            Observaciones de seguimiento
            <textarea
              value={observaciones}
              onChange={(event) => setObservaciones(event.target.value)}
              className="block w-full border-2 border-steel-300 p-2 mt-1"
            />
          </label>
          <div className="flex flex-wrap gap-3">
            <PrimaryButton onClick={handleAceptar} disabled={!fichaGuardada || decidiendo}>
              {decidiendo ? 'Registrando…' : 'Cliente aceptó'}
            </PrimaryButton>
            <PrimaryButton onClick={handleRechazar} disabled={!fichaGuardada || decidiendo}>
              {decidiendo ? 'Registrando…' : 'Cliente no aceptó'}
            </PrimaryButton>
          </div>
        </Ficha>
      )}
    </div>
  )
}
