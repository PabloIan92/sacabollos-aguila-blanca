import { useEffect, useState } from 'react'
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
  const { uploadFoto } = useCasoFotos()
  const [previews, setPreviews] = useState<Record<string, string>>({})
  const [subiendo, setSubiendo] = useState<Record<string, boolean>>({})

  useEffect(() => {
    onUploadedCountChange(Object.keys(previews).length)
  }, [previews, onUploadedCountChange])

  async function handleFileChange(angulo: string, file: File | undefined) {
    if (!file) return

    setSubiendo((prev) => ({ ...prev, [angulo]: true }))
    const previewUrl = URL.createObjectURL(file)

    try {
      await uploadFoto(caseId, angulo, file)
      setPreviews((prev) => ({ ...prev, [angulo]: previewUrl }))
    } finally {
      setSubiendo((prev) => ({ ...prev, [angulo]: false }))
    }
  }

  return (
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
            onChange={(event) => handleFileChange(angulo, event.target.files?.[0])}
          />
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
