import { useEffect, useState } from 'react'
import { Copy, Mail, RefreshCw, AlertTriangle, CheckCircle2 } from 'lucide-react'
import { listCasos } from '../casos/api'
import { listAseguradoras } from '../crm/api'
import type { Caso } from '../casos/types'
import type { Aseguradora } from '../crm/types'
import { generarEmail } from './templates'
import type { TipoTemplate, TemplateVars, EmailGenerado } from './types'

function formatMoneda(monto: number | undefined | null): string {
  if (monto === undefined || monto === null) return '$ 0,00'
  return `$ ${new Intl.NumberFormat('es-AR', {
    minimumFractionDigits: monto % 1 === 0 ? 0 : 2,
    maximumFractionDigits: 2,
  }).format(monto)}`
}

export function PlantillasPage() {
  const [casos, setCasos] = useState<Caso[]>([])
  const [aseguradoras, setAseguradoras] = useState<Aseguradora[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const [selectedCasoId, setSelectedCasoId] = useState<string>('')
  const [selectedTipo, setSelectedTipo] = useState<TipoTemplate>('inicio_tramite')
  const [emailGenerado, setEmailGenerado] = useState<EmailGenerado | null>(null)
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    async function loadData() {
      setLoading(true)
      try {
        const [casosData, asegData] = await Promise.all([
          listCasos(),
          listAseguradoras()
        ])
        setCasos(casosData.filter(c => c.canal === 'seguro'))
        setAseguradoras(asegData)
      } catch (err: any) {
        setError(err?.message || 'Error al cargar datos')
      } finally {
        setLoading(false)
      }
    }
    loadData()
  }, [])

  const handleGenerar = () => {
    if (!selectedCasoId) return
    const caso = casos.find(c => c.id === selectedCasoId)
    if (!caso) return

    const aseguradora = aseguradoras.find(a => a.nombre.toLowerCase() === caso.aseguradora?.toLowerCase())
    
    const vars: TemplateVars = {
      aseguradora_nombre: aseguradora?.nombre || caso.aseguradora || 'Aseguradora',
      aseguradora_email: aseguradora?.email_siniestros || 'sin-email@aseguradora.com',
      aseguradora_contacto: aseguradora?.contacto_nombre || 'Contacto',
      patente: caso.patente || 'S/P',
      marca_modelo: `${caso.marca || ''} ${caso.modelo || ''}`.trim() || 'Vehículo',
      color: caso.color || 'S/C',
      cliente_nombre: caso.cliente_nombre || 'Cliente',
      cliente_telefono: caso.cliente_telefono || 'S/T',
      numero_siniestro: caso.numero_siniestro || 'S/N',
      productor_nombre: caso.productor_nombre || 'Productor',
      presupuesto_monto: formatMoneda(caso.presupuesto_monto),
      fecha_hoy: new Intl.DateTimeFormat('es-AR').format(new Date()),
      taller_nombre: 'Aguila Blanca',
    }

    const email = generarEmail(selectedTipo, vars)
    setEmailGenerado(email)
    setCopied(false)
  }

  const handleCopiar = async () => {
    if (!emailGenerado) return
    try {
      await navigator.clipboard.writeText(emailGenerado.cuerpo)
      setCopied(true)
      setTimeout(() => setCopied(false), 3000)
    } catch (err) {
      console.error('Error al copiar', err)
    }
  }

  if (loading) {
    return (
      <div className="p-6">
        <div className="flex items-center gap-3 text-steel-500 py-12 justify-center">
          <RefreshCw className="animate-spin" size={24} />
          <span className="font-mono text-sm">Cargando datos...</span>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="p-6">
        <div className="bg-red-50 border-2 border-red text-red p-4 flex flex-col gap-3">
          <div className="flex items-center gap-2 font-bold font-mono">
            <AlertTriangle size={20} />
            <span>Error al cargar datos</span>
          </div>
          <p className="text-sm font-sans">{error}</p>
        </div>
      </div>
    )
  }

  return (
    <div className="p-6 max-w-7xl mx-auto flex flex-col gap-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 border-b-2 border-graphite pb-4">
        <div>
          <h1 className="text-2xl font-display font-bold uppercase tracking-tight text-navy">
            Generador de Emails
          </h1>
          <p className="text-xs font-mono text-steel-500 uppercase mt-0.5">
            Plantillas para comunicación con aseguradoras
          </p>
        </div>
      </div>

      <div className="flex flex-col md:flex-row gap-6">
        {/* Panel izquierdo */}
        <div className="w-full md:w-1/3 flex flex-col gap-4 bg-white border-2 border-graphite p-4 shadow-sm h-fit">
          <div className="flex flex-col gap-1.5">
            <label htmlFor="caso" className="text-xs font-mono uppercase text-steel-500 font-bold">
              Caso (Canal Seguro)
            </label>
            <select
              id="caso"
              data-testid="select-caso"
              value={selectedCasoId}
              onChange={e => setSelectedCasoId(e.target.value)}
              className="text-sm font-sans border border-steel-300 py-2 px-3 bg-white focus:outline-none focus:border-navy"
            >
              <option value="">Seleccione un caso...</option>
              {casos.map(c => (
                <option key={c.id} value={c.id}>
                  {c.patente} - {c.cliente_nombre}
                </option>
              ))}
            </select>
          </div>

          <div className="flex flex-col gap-1.5">
            <label htmlFor="tipo" className="text-xs font-mono uppercase text-steel-500 font-bold">
              Tipo de Email
            </label>
            <select
              id="tipo"
              data-testid="select-tipo"
              value={selectedTipo}
              onChange={e => setSelectedTipo(e.target.value as TipoTemplate)}
              className="text-sm font-sans border border-steel-300 py-2 px-3 bg-white focus:outline-none focus:border-navy"
            >
              <option value="inicio_tramite">Inicio de Trámite / Denuncia</option>
              <option value="presupuesto">Envío de Presupuesto</option>
              <option value="reclamo">Reclamo / Seguimiento</option>
              <option value="cierre">Cierre / Confirmación de pago</option>
            </select>
          </div>

          <button
            onClick={handleGenerar}
            disabled={!selectedCasoId}
            className="mt-2 w-full py-2 bg-navy text-white text-xs font-mono font-bold uppercase hover:bg-blue transition disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Generar Email
          </button>
        </div>

        {/* Panel derecho */}
        <div className="w-full md:w-2/3 bg-white border-2 border-graphite p-4 shadow-sm flex flex-col gap-4">
          {!emailGenerado ? (
            <div className="flex flex-col items-center justify-center text-steel-400 py-12 gap-2 h-full">
              <Mail size={32} />
              <span className="font-mono text-sm">Seleccione un caso y genere el email</span>
            </div>
          ) : (
            <>
              <div className="flex flex-col gap-1 border-b border-steel-200 pb-3">
                <div className="flex gap-2 items-start">
                  <span className="text-xs font-mono text-steel-500 font-bold w-24 shrink-0">Para:</span>
                  <span className="text-sm font-sans text-navy">{emailGenerado.destinatario}</span>
                </div>
                <div className="flex gap-2 items-start">
                  <span className="text-xs font-mono text-steel-500 font-bold w-24 shrink-0">Asunto:</span>
                  <span className="text-sm font-sans font-bold text-navy">{emailGenerado.asunto}</span>
                </div>
              </div>

              <div className="flex-1 min-h-[200px] flex flex-col">
                <textarea
                  readOnly
                  className="w-full flex-1 p-3 text-sm font-sans border border-steel-300 bg-steel-50 resize-none focus:outline-none focus:border-navy min-h-[200px]"
                  value={emailGenerado.cuerpo}
                />
              </div>

              <div className="flex flex-col sm:flex-row gap-3 pt-2">
                <button
                  onClick={handleCopiar}
                  className="flex-1 flex items-center justify-center gap-2 py-2 border-2 border-graphite text-navy text-xs font-mono font-bold uppercase hover:bg-steel-50 transition relative"
                >
                  {copied ? (
                    <>
                      <CheckCircle2 size={16} className="text-green" />
                      <span className="text-green">¡Copiado!</span>
                    </>
                  ) : (
                    <>
                      <Copy size={16} />
                      <span>Copiar al portapapeles</span>
                    </>
                  )}
                </button>
                <a
                  href={`mailto:${emailGenerado.destinatario}?subject=${encodeURIComponent(emailGenerado.asunto)}&body=${encodeURIComponent(emailGenerado.cuerpo)}`}
                  target="_blank"
                  rel="noreferrer"
                  className="flex-1 flex items-center justify-center gap-2 py-2 bg-navy text-white text-xs font-mono font-bold uppercase hover:bg-blue transition"
                >
                  <Mail size={16} />
                  <span>Abrir en correo</span>
                </a>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
