import { useState, type FormEvent } from 'react'
import { useNavigate } from 'react-router'
import { Ficha } from '../../ui/Ficha'
import { TextField } from '../../ui/TextField'
import { PrimaryButton } from '../../ui/PrimaryButton'
import { useAuth } from '../../auth/useAuth'
import { createCaso } from './api'
import type { CasoCanal, CrearCasoInput } from './types'

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

  const [canal, setCanal] = useState<CasoCanal>('seguro')
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
  const [presupuestoMonto, setPresupuestoMonto] = useState('')
  const [presupuestoObservaciones, setPresupuestoObservaciones] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState(false)

  const monto = Number(presupuestoMonto)
  const canalCompleto =
    canal === 'seguro'
      ? aseguradora.trim().length > 0 &&
        numeroSiniestro.trim().length > 0 &&
        denuncia.trim().length > 0
      : presupuestoMonto.trim().length > 0 && Number.isFinite(monto) && monto > 0

  const canSubmit =
    patente.trim().length > 0 &&
    clienteNombre.trim().length > 0 &&
    clienteTelefono.trim().length > 0 &&
    canalCompleto &&
    !submitting

  async function handleSubmit(event: FormEvent) {
    event.preventDefault()
    if (!canSubmit || !session) return

    const datosComunes = {
      patente,
      marca: marca || null,
      modelo: modelo || null,
      color: color || null,
      cliente_nombre: clienteNombre,
      cliente_telefono: clienteTelefono,
      danos_zonas: [],
      turno_fecha: null,
      orden_ingreso_numero: null,
      ingresado_at: null,
      created_by: session.user.id,
    }
    const datos: CrearCasoInput =
      canal === 'seguro'
        ? {
            ...datosComunes,
            canal,
            aseguradora,
            numero_siniestro: numeroSiniestro,
            denuncia,
            productor_nombre: productorNombre || null,
            productor_telefono: productorTelefono || null,
          }
        : {
            ...datosComunes,
            canal,
            presupuesto_monto: monto,
            presupuesto_observaciones: presupuestoObservaciones || null,
          }

    setSubmitError(false)
    setSubmitting(true)
    try {
      const caso = await createCaso(datos)
      setSubmitting(false)
      navigate(`/casos/${caso.id}/ficha-inspeccion`)
    } catch {
      setSubmitError(true)
      setSubmitting(false)
    }
  }

  return (
    <div style={{ padding: '24px', maxWidth: '640px' }}>
      <h1 className="font-display text-2xl font-bold uppercase mb-4">
        Nuevo caso — {canal === 'seguro' ? 'Seguro' : 'Particular'}
      </h1>
      <Ficha>
        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label htmlFor="canal" className={labelClassName}>
              Canal
            </label>
            <select
              id="canal"
              value={canal}
              onChange={(event) =>
                setCanal(event.target.value === 'particular' ? 'particular' : 'seguro')
              }
              className={selectClassName}
            >
              <option value="seguro">Seguro</option>
              <option value="particular">Particular</option>
            </select>
          </div>

          <TextField
            label="Cliente"
            value={clienteNombre}
            onChange={(event) => setClienteNombre(event.target.value)}
            className="mb-4"
          />
          <TextField
            label="Teléfono del cliente"
            value={clienteTelefono}
            onChange={(event) => setClienteTelefono(event.target.value)}
            className="mb-4"
          />
          <TextField
            label="Patente"
            value={patente}
            onChange={(event) => setPatente(event.target.value)}
            className="mb-4"
          />
          <TextField
            label="Marca"
            value={marca}
            onChange={(event) => setMarca(event.target.value)}
            className="mb-4"
          />
          <TextField
            label="Modelo"
            value={modelo}
            onChange={(event) => setModelo(event.target.value)}
            className="mb-4"
          />
          <TextField
            label="Color"
            value={color}
            onChange={(event) => setColor(event.target.value)}
            className="mb-4"
          />

          {canal === 'seguro' ? (
            <>
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
                onChange={(event) => setNumeroSiniestro(event.target.value)}
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
                onChange={(event) => setProductorNombre(event.target.value)}
                className="mb-4"
              />
              <TextField
                label="Teléfono del productor"
                value={productorTelefono}
                onChange={(event) => setProductorTelefono(event.target.value)}
                className="mb-4"
              />
            </>
          ) : (
            <>
              <TextField
                label="Presupuesto"
                type="number"
                min="0.01"
                step="0.01"
                value={presupuestoMonto}
                onChange={(event) => setPresupuestoMonto(event.target.value)}
                className="mb-4"
              />
              <div className="mb-4">
                <label htmlFor="presupuesto-observaciones" className={labelClassName}>
                  Observaciones del presupuesto
                </label>
                <textarea
                  id="presupuesto-observaciones"
                  value={presupuestoObservaciones}
                  onChange={(event) => setPresupuestoObservaciones(event.target.value)}
                  rows={3}
                  className={textareaClassName}
                />
              </div>
            </>
          )}

          {submitError && (
            <p role="alert" className="mb-4 text-sm font-mono text-red">
              No se pudo crear el caso. Intentá nuevamente.
            </p>
          )}

          <PrimaryButton type="submit" disabled={!canSubmit}>
            {submitting ? 'Guardando…' : 'Crear caso'}
          </PrimaryButton>
        </form>
      </Ficha>
    </div>
  )
}
