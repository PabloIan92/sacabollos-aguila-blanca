import { useEffect, useRef, useState } from 'react'
import { useCasoFotos } from '../hooks/useCasoFotos'

function etiquetaAngulo(angulo: string): string {
  return angulo.replace(/-/g, ' ')
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
  const [errorListando, setErrorListando] = useState<string | null>(null)
  const [errorSubida, setErrorSubida] = useState<Record<string, string | null>>({})
  const [retry, setRetry] = useState(0)
  const mountedRef = useRef(true)
  const listFotosRef = useRef(listFotos)
  const localPreviewUrlsRef = useRef(new Set<string>())

  listFotosRef.current = listFotos

  // Limpiar previews cuando cambie caseId o angulos
  useEffect(() => {
    setPreviews({})
    setErrorListando(null)
  }, [caseId, angulos])



  useEffect(() => {
    mountedRef.current = true
    const localPreviewUrls = localPreviewUrlsRef.current
    return () => {
      mountedRef.current = false
      localPreviewUrls.forEach((url) => URL.revokeObjectURL(url))
      localPreviewUrls.clear()
    }
  }, [])

  // Effect para cargar fotos cuando cambia retry
  useEffect(() => {
    let active = true;
    setPreviews({});
    setErrorListando(null);
    void listFotosRef.current(caseId, angulos).then((fotos) => {
      if (active && mountedRef.current) {
        setPreviews((prev) => ({ ...fotos, ...prev }));
      }
    }).catch(() => {
      if (active && mountedRef.current) {
        setErrorListando('No se pudieron cargar las fotos existentes.');
      }
    });
    return () => {
      active = false;
    };
  }, [caseId, angulos, retry])

  useEffect(() => {
    onUploadedCountChange(Object.keys(previews).length)
  }, [previews, onUploadedCountChange])

  async function handleFileChange(angulo: string, file: File | undefined) {
    if (!file) return

    // Limpiar error de subida para este ángulo cuando se selecciona un nuevo archivo
    setErrorSubida((prev) => ({ ...prev, [angulo]: null }))

    setSubiendo((prev) => ({ ...prev, [angulo]: true }))
    const previewUrl = URL.createObjectURL(file)
    localPreviewUrlsRef.current.add(previewUrl)

    try {
      await uploadFoto(caseId, angulo, file)
      if (mountedRef.current) {
        setPreviews((prev) => {
          const anterior = prev[angulo]
          if (anterior && localPreviewUrlsRef.current.has(anterior)) {
            URL.revokeObjectURL(anterior)
            localPreviewUrlsRef.current.delete(anterior)
          }
          return { ...prev, [angulo]: previewUrl }
        })
      }
} catch {
       // Siempre revocar la object URL recién creada
       URL.revokeObjectURL(previewUrl)
       localPreviewUrlsRef.current.delete(previewUrl)

       if (mountedRef.current) {
         // Mostrar error específico por ángulo
         setErrorSubida((prev) => ({ ...prev, [angulo]: 'No se pudo subir la foto. Intentá nuevamente.' }))
       }
     } finally {
      if (mountedRef.current) {
        setSubiendo((prev) => ({ ...prev, [angulo]: false }))
      }
    }
  }

  return (
    <div className="grid grid-cols-2 gap-4">
      {errorListando && (
        <div role="alert" className="mb-4 p-4 bg-red-50 border border-red-200 text-red-500">
          {errorListando} <button onClick={() => setRetry(r => r + 1)} className="underline ml-2">
            Reintentar
          </button>
        </div>
      )}
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
            onChange={(event) => handleFileChange(angulo, event.target.files?.[0])}
            disabled={subiendo[angulo]}
          />
          {errorSubida[angulo] && (
            <div role="alert" className="mb-2 p-2 bg-red-50 border border-red-200 text-red-500 text-xs">
              {errorSubida[angulo]}
            </div>
          )}
          {subiendo[angulo] && <p className="text-xs font-sans">Subiendo…</p>}
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
  )
}
