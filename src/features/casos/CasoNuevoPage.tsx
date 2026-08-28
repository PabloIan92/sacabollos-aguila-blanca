import { useState, type FormEvent } from 'react'
import { useNavigate } from 'react-router'
import { Ficha } from '../../ui/Ficha'
import { TextField } from '../../ui/TextField'
import { PrimaryButton } from '../../ui/PrimaryButton'
import { useAuth } from '../../auth/useAuth'
import { createCaso } from './api'

const ASEGURADORAS = [
  'San Cristóbal',
  'Federación Patronal',
  'Mercantil Andes',
  'Triunfo',
  'Sancor',
  'Cooperativa de Seguros',
] as const

const selectClassName =
  'w-full px-3 py-2.5 text-sm font-sans bg-white border-2 border-steel-300 focus:border-blue focus:outline-none focus:ring-0'
const labelClassName = 'block text-xs font-mono font-semibold uppercase tracking-wide text-graphite mb-1'
const textareaClassName = selectClassName

export function CasoNuevoPage() {
  const navigate = useNavigate()
  const { session } = useAuth()

  const [clienteNombre, setClienteNombre] = useState('')
  const [clienteTelefono, setClienteTelefono] = useState('')
  const [patente, setPatente] = useState('')
  const [marca, setMarca] = useState('')
  const [modelo, setModelo] = useState('')
  const [color, setColor] = useState('')
  const [aseguradora, setAseguradora] = useState<string>(ASEGURADORAS[0])
  const [numeroSiniestro, setNumeroSiniestro] = useState('')
  const [denuncia, setDenuncia] = useState('')
  const [productorNombre, setProductorNombre] = useState('')
  const [productorTelefono, setProductorTelefono] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const canSubmit =
    patente.trim().length > 0 &&
    clienteNombre.trim().length > 0 &&
    clienteTelefono.trim().length > 0 &&
    aseguradora.trim().length > 0 &&
    numeroSiniestro.trim().length > 0 &&
    denuncia.trim().length > 0 &&
    !submitting

  async function handleSubmit(event: FormEvent) {
    event.preventDefault()
    if (!canSubmit || !session) return

    setSubmitting(true)
    const caso = await createCaso({
      canal: 'seguro',
      patente,
      marca: marca || null,
      modelo: modelo || null,
      color: color || null,
      cliente_nombre: clienteNombre,
      cliente_telefono: clienteTelefono,
      aseguradora,
      numero_siniestro: numeroSiniestro,
      denuncia,
      productor_nombre: productorNombre || null,
      productor_telefono: productorTelefono || null,
      danos_zonas: [],
      turno_fecha: null,
      orden_ingreso_numero: null,
      ingresado_at: null,
      created_by: session.user.id,
    })
    setSubmitting(false)
    navigate(`/casos/${caso.id}/ficha-inspeccion`)
  }

  return (
    <div style={{ padding: '24px', maxWidth: '640px' }}>
      <h1 className="font-display text-2xl font-bold uppercase mb-4">Nuevo caso — Seguro</h1>
      <Ficha>
        <form onSubmit={handleSubmit}>
          <TextField
            label="Cliente"
            value={clienteNombre}
            onChange={setClienteNombre}
            className="mb-4"
          />
          <TextField
            label="Teléfono del cliente"
            value={clienteTelefono}
            onChange={setClienteTelefono}
            className="mb-4"
          />
          <TextField
            label="Patente"
            value={patente}
            onChange={setPatente}
            className="mb-4"
          />
          <TextField
            label="Marca"
            value={marca}
            onChange={setMarca}
            className="mb-4"
          />
          <TextField
            label="Modelo"
            value={modelo}
            onChange={setModelo}
            className="mb-4"
          />
          <TextField
            label="Color"
            value={color}
            onChange={setColor}
            className="mb-4"
          />

          <div className="mb-4">
            <label htmlFor="aseguradora" className={labelClassName}>
              Aseguradora
            </label>
            <select
              id="aseguradora"
              value={aseguradora}
              onChange={(event) => setAseguradora(event.target.value)}
              className={selectClassName}
            >
              {ASEGURADORAS.map((nombre) => (
                <option key={nombre} value={nombre}>
                  {nombre}
                </option>
              ))}
            </select>
          </div>

          <TextField
            label="Número de siniestro"
            value={numeroSiniestro}
            onChange={setNumeroSiniestro}
            className="mb-4"
          />

          <div className="mb-4">
            <label htmlFor="denuncia" className={labelClassName}>
              Denuncia
            </label>
            <textarea
              id="denuncia"
              value={denuncia}
              onChange={(event) => setDenuncia(event.target.value)}
              rows={3}
              className={textareaClassName}
            />
          </div>

          <TextField
            label="Productor / asesor"
            value={productorNombre}
            onChange={setProductorNombre}
            className="mb-4"
          />
          <TextField
            label="Teléfono del productor"
            value={productorTelefono}
            onChange={setProductorTelefono}
            className="mb-4"
          />

          <PrimaryButton type="submit" disabled={!canSubmit}>
            {submitting ? 'Guardando…' : 'Crear caso'}
          </PrimaryButton>
        </form>
      </Ficha>
    </div>
  )
}
