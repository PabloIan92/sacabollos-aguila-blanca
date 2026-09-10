import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router'
import { Ficha } from '../../ui/Ficha'
import { TextField } from '../../ui/TextField'
import { PrimaryButton } from '../../ui/PrimaryButton'
import { getCaso, registerCasoIngreso } from './api'
import { ANGULOS_FOTO, type Caso } from './types'
import { FotoUploader } from './components/FotoUploader'

const ANGULOS_INGRESO = ANGULOS_FOTO.map((angulo) => `ingreso-${angulo}`)

export function FichaIngresoPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()

  const [caso, setCaso] = useState<Caso | null>(null)
  const [ordenIngresoNumero, setOrdenIngresoNumero] = useState('')
  const [fotosSubidas, setFotosSubidas] = useState(0)
  const [registrando, setRegistrando] = useState(false)
  const [cargando, setCargando] = useState(true)
  const [errorCarga, setErrorCarga] = useState(false)
  const [errorRegistro, setErrorRegistro] = useState(false)
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

  if (caso.estado !== 'turno coordinado') {
    return (
      <div style={{ padding: '24px' }}>
        <p className="font-sans text-sm">Este caso todavía no tiene un turno coordinado.</p>
      </div>
    )
  }

  const canRegistrar =
    fotosSubidas >= ANGULOS_INGRESO.length && ordenIngresoNumero.trim().length > 0 && !registrando

  async function handleRegistrarIngreso() {
    setRegistrando(true)
    setErrorRegistro(false)
    try {
      await registerCasoIngreso(caseId, ordenIngresoNumero, new Date().toISOString())
      navigate('/casos')
    } catch {
      setErrorRegistro(true)
    } finally {
      setRegistrando(false)
    }
  }

  return (
    <div style={{ padding: '24px', maxWidth: '720px' }}>
      <h1 className="font-display text-2xl font-bold uppercase mb-4">Ficha de ingreso</h1>

      {errorRegistro && (
        <p role="alert" className="font-sans text-sm text-red mb-4">
          No se pudo registrar el ingreso. Intentá nuevamente.
        </p>
      )}

      <Ficha className="mb-4">
        <TextField
          label="Número de orden de ingreso"
          value={ordenIngresoNumero}
          onChange={(event) => setOrdenIngresoNumero(event.target.value)}
        />
      </Ficha>

      <Ficha className="mb-4">
        <h2 className="font-sans font-bold mb-2">Fotos de ingreso (4 obligatorias)</h2>
        <FotoUploader caseId={caseId} angulos={ANGULOS_INGRESO} onUploadedCountChange={setFotosSubidas} />
      </Ficha>

      <PrimaryButton onClick={handleRegistrarIngreso} disabled={!canRegistrar}>
        {registrando ? 'Registrando…' : 'Registrar ingreso'}
      </PrimaryButton>
    </div>
  )
}
