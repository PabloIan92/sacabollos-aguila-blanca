import { useEffect, useEffectEvent, useState } from 'react'
import { useCasoFotos } from '../hooks/useCasoFotos'

function etiquetaAngulo(angulo: string): string {
  return angulo.replace(/-/g, ' ')
}

function esUrlValida(url: string): boolean {
  try {
    return ['http:', 'https:', 'blob:'].includes(new URL(url).protocol)
  } catch {
    return false
  }
}

export function FotoUploader({
  caseId,
  angulos,
  onUploadedCountChange,
}: {
  caseId: string
  angulos: readonly string[]
  onUploadedCountChange: (count: number) => void
}) {
  const { uploadFoto, listFotos } = useCasoFotos()
  const [previews, setPreviews] = useState<Record<string, string>>({})
  const [subiendo, setSubiendo] = useState<Record<string, boolean>>({})
  const [cargandoFotos, setCargandoFotos] = useState(true)
  const [errorCarga, setErrorCarga] = useState(false)
  const [erroresSubida, setErroresSubida] = useState<Record<string, boolean>>({})
  const [intentoCarga, setIntentoCarga] = useState(0)
  const cargarFotos = useEffectEvent(() => listFotos(caseId, angulos))

  useEffect(() => {
    let activo = true
    setCargandoFotos(true)
    setErrorCarga(false)
    setPreviews({})

    Promise.resolve()
      .then(cargarFotos)
      .then((fotos) => {
        if (!activo) return
        const fotosValidas = Object.fromEntries(
          angulos
            .filter((angulo) => typeof fotos?.[angulo] === 'string' && esUrlValida(fotos[angulo]))
            .map((angulo) => [angulo, fotos[angulo]])
        )
        setPreviews(fotosValidas)
      })
      .catch(() => {
        if (activo) setErrorCarga(true)
      })
      .finally(() => {
        if (activo) setCargandoFotos(false)
      })

    return () => {
      activo = false
    }
  }, [caseId, angulos, intentoCarga])

  useEffect(() => {
    onUploadedCountChange(Object.values(previews).filter(esUrlValida).length)
  }, [previews, onUploadedCountChange])

  async function handleFileChange(angulo: string, file: File | undefined) {
    if (!file) return

    setSubiendo((prev) => ({ ...prev, [angulo]: true }))
    setErroresSubida((prev) => ({ ...prev, [angulo]: false }))
    const previewUrl = URL.createObjectURL(file)

    try {
      await uploadFoto(caseId, angulo, file)
      setPreviews((prev) => ({ ...prev, [angulo]: previewUrl }))
    } catch {
      URL.revokeObjectURL(previewUrl)
      setErroresSubida((prev) => ({ ...prev, [angulo]: true }))
    } finally {
      setSubiendo((prev) => ({ ...prev, [angulo]: false }))
    }
  }

  return (
    <>
      {cargandoFotos && <p className="font-sans text-sm mb-3">Cargando fotos…</p>}
      {errorCarga && (
        <div className="mb-3">
          <p role="alert" className="font-sans text-sm text-red-700 mb-2">
            No se pudieron cargar las fotos. Intentá nuevamente.
          </p>
          <button
            type="button"
            className="font-sans text-sm font-semibold underline"
            onClick={() => setIntentoCarga((intento) => intento + 1)}
          >
            Reintentar carga de fotos
          </button>
        </div>
      )}
      <div className="grid grid-cols-2 gap-4">
        {angulos.map((angulo) => (
          <div key={angulo} className="border-2 border-steel-300 p-2">
            <p className="text-xs font-mono font-semibold uppercase tracking-wide text-graphite mb-1">
              {etiquetaAngulo(angulo)}
            </p>
            <input
              type="file"
              accept="image/*"
              capture="environment"
              aria-label={`Foto ${etiquetaAngulo(angulo)}`}
              disabled={cargandoFotos || subiendo[angulo]}
              onChange={(event) => {
                const file = event.target.files?.[0]
                event.target.value = ''
                handleFileChange(angulo, file)
              }}
            />
            {subiendo[angulo] && <p className="text-xs font-sans">Subiendo…</p>}
            {erroresSubida[angulo] && (
              <p role="alert" className="text-xs font-sans text-red-700">
                No se pudo subir la foto. Intentá nuevamente.
              </p>
            )}
            {previews[angulo] && (
              <img
                src={previews[angulo]}
                alt={`Preview ${etiquetaAngulo(angulo)}`}
                style={{ maxWidth: '100%', marginTop: '8px' }}
              />
            )}
          </div>
        ))}
      </div>
    </>
  )
}
