import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router'
import { Ficha } from '../../ui/Ficha'
import { PrimaryButton } from '../../ui/PrimaryButton'
import { SemaforoBadge } from './components/SemaforoBadge'
import { FotoUploader } from './components/FotoUploader'
import { getCaso, markReadyForSignature, markSigned } from './api'
import { FINAL_PHOTO_ANGLES, SIGNED_ORDER_ANGLES, type Caso } from './types'

export function CierreReparacionPage() {
  const { id } = useParams<{ id: string }>()

  const [caso, setCaso] = useState<Caso | null>(null)
  const [fotosFinalesCount, setFotosFinalesCount] = useState(0)
  const [ordenFirmadaCount, setOrdenFirmadaCount] = useState(0)
  const [submitting, setSubmitting] = useState(false)
  const [cargando, setCargando] = useState(true)
  const [errorCarga, setErrorCarga] = useState(false)
  const [errorAccion, setErrorAccion] = useState<string | null>(null)
  const [reintento, setReintento] = useState(0)

  useEffect(() => {
    if (!id) return
    let active = true
    setCargando(true)
    setErrorCarga(false)

    getCaso(id)
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

  async function handleMarkReadyForSignature() {
    setSubmitting(true)
    setErrorAccion(null)
    try {
      const actualizado = await markReadyForSignature(caseId)
      setCaso(actualizado)
    } catch (err: any) {
      setErrorAccion(err.message || 'Error al pasar a listo para firma')
    } finally {
      setSubmitting(false)
    }
  }

  async function handleMarkSigned() {
    setSubmitting(true)
    setErrorAccion(null)
    try {
      const actualizado = await markSigned(caseId)
      setCaso(actualizado)
    } catch (err: any) {
      setErrorAccion(err.message || 'Error al marcar como firmado')
    } finally {
      setSubmitting(false)
    }
  }

  const canReadyForSignature =
    fotosFinalesCount >= FINAL_PHOTO_ANGLES.length && !submitting

  const canMarkSigned =
    ordenFirmadaCount >= SIGNED_ORDER_ANGLES.length && !submitting

  return (
    <div style={{ padding: '24px', maxWidth: '800px' }} className="font-sans">
      <div className="flex items-center justify-between gap-4 mb-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Link
              to={`/casos/${caseId}/ficha-trabajo`}
              className="text-xs text-blue underline font-mono"
            >
              ← Volver a ficha de trabajo
            </Link>
          </div>
          <h1 className="font-display text-2xl font-bold uppercase">{caso.patente}</h1>
          <p className="text-sm text-steel-600">
            {caso.marca} {caso.modelo} {caso.color ? `· ${caso.color}` : ''}
          </p>
        </div>
        <SemaforoBadge estado={caso.estado} />
      </div>

      {errorAccion && (
        <div role="alert" className="p-3 mb-4 bg-red-50 text-red text-sm border border-red rounded">
          {errorAccion}
        </div>
      )}

      {/* Cierre fotográfico en estado 'en reparación' */}
      {caso.estado === 'en reparación' && (
        <Ficha title="Fotos finales de la reparación (4 requeridas)" className="mb-6">
          <p className="text-sm text-steel-700 mb-4">
            Para avanzar a la etapa de firma, es obligatorio registrar las 4 fotos finales del vehículo terminado.
          </p>

          <FotoUploader
            caseId={caseId}
            angulos={FINAL_PHOTO_ANGLES}
            onUploadedCountChange={setFotosFinalesCount}
          />

          <div className="mt-6 flex items-center justify-between">
            <span className="text-xs font-mono text-steel-600">
              Fotos subidas: {fotosFinalesCount} de {FINAL_PHOTO_ANGLES.length}
            </span>
            <PrimaryButton
              disabled={!canReadyForSignature}
              onClick={handleMarkReadyForSignature}
            >
              {submitting ? 'Guardando…' : 'Listo para firma'}
            </PrimaryButton>
          </div>
        </Ficha>
      )}

      {/* Orden firmada en estado 'listo para firma' */}
      {caso.estado === 'listo para firma' && (
        <Ficha title="Orden de trabajo firmada en papel (1 requerida)" className="mb-6">
          <p className="text-sm text-steel-700 mb-4">
            El trabajo fue finalizado. Por favor, hacé firmar la orden de entrega física en papel al cliente o autorizado, y subí la foto legible para cerrar el caso.
          </p>

          <FotoUploader
            caseId={caseId}
            angulos={SIGNED_ORDER_ANGLES}
            onUploadedCountChange={setOrdenFirmadaCount}
          />

          <div className="mt-6 flex items-center justify-between">
            <span className="text-xs font-mono text-steel-600">
              Orden firmada: {ordenFirmadaCount > 0 ? 'Cargada ✓' : 'Pendiente'}
            </span>
            <PrimaryButton
              disabled={!canMarkSigned}
              onClick={handleMarkSigned}
            >
              {submitting ? 'Guardando…' : 'Marcar firmado'}
            </PrimaryButton>
          </div>
        </Ficha>
      )}

      {/* Estado firmado */}
      {caso.estado === 'firmado' && (
        <Ficha title="Reparación finalizada y firmada" className="mb-6">
          <div className="p-4 bg-emerald-50 border border-emerald-300 rounded text-emerald-900 mb-4">
            <h2 className="font-bold text-base mb-1">¡Reparación cerrada con éxito!</h2>
            <p className="text-sm">
              La orden de trabajo fue firmada y archivada. El vehículo queda listo para las etapas de facturación y cobro.
            </p>
          </div>
          <Link
            to={`/casos/${caseId}/ficha-trabajo`}
            className="text-sm text-blue underline font-semibold"
          >
            Ver ficha de trabajo
          </Link>
        </Ficha>
      )}

      {/* Estados anteriores */}
      {caso.estado !== 'en reparación' &&
        caso.estado !== 'listo para firma' &&
        caso.estado !== 'firmado' && (
          <Ficha title="Estado no apto para cierre" className="mb-6">
            <p className="text-sm text-steel-600 mb-4">
              El caso se encuentra en estado <strong>"{caso.estado}"</strong>. Debe estar en <em>en reparación</em> o <em>listo para firma</em> para realizar el cierre.
            </p>
            <Link
              to={`/casos/${caseId}/ficha-trabajo`}
              className="text-sm text-blue underline font-semibold"
            >
              Ir a la ficha de trabajo
            </Link>
          </Ficha>
        )}
    </div>
  )
}
