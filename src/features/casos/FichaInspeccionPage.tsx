import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router'
import { Ficha } from '../../ui/Ficha'
import { PrimaryButton } from '../../ui/PrimaryButton'
import { getCaso, updateCasoEstado } from './api'
import { ANGULOS_FOTO, type Caso, type ZonaDano } from './types'
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

  useEffect(() => {
    if (!id) return
    getCaso(id).then((data) => {
      setCaso(data)
      setZonas(data.danos_zonas)
    })
  }, [id])

  if (!id || !caso) {
    return <div style={{ padding: '24px' }}>Cargando…</div>
  }

  const caseId = id
  const casoActual = caso

  async function handleGuardar() {
    setGuardando(true)
    await updateCasoEstado(caseId, casoActual.estado, { danos_zonas: zonas })
    setGuardando(false)
    setFichaGuardada(true)
  }

  async function handleMarcarEnviado() {
    setEnviando(true)
    await updateCasoEstado(caseId, 'enviado a la aseguradora')
    setEnviando(false)
    navigate('/casos')
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

      <PrimaryButton onClick={handleMarcarEnviado} disabled={!fichaGuardada || enviando}>
        {enviando ? 'Marcando…' : 'Marcar como enviado a la aseguradora'}
      </PrimaryButton>
    </div>
  )
}
