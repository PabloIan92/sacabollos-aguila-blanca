import { useEffect, useMemo, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router'
import {
  AlertTriangle,
  ArrowLeft,
  CheckCircle2,
  DollarSign,
  FileCheck,
  FileText,
  Save,
  ShieldAlert,
} from 'lucide-react'
import { getCaso } from '../casos/api'
import type { Caso, CasoEstado } from '../casos/types'
import {
  getFacturacion,
  iniciarReclamoAseguradora,
  marcarComoCobrado,
  marcarComoFacturado,
  resolverReclamo,
  saveFacturacion,
} from './api'
import type { MetodoPago } from './types'
import { SemaforoBadge } from '../casos/components/SemaforoBadge'

function formatMoneda(monto: number): string {
  return `$ ${new Intl.NumberFormat('es-AR', {
    minimumFractionDigits: monto % 1 === 0 ? 0 : 2,
    maximumFractionDigits: 2,
  }).format(monto)}`
}

export function FichaFacturacionPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()

  const [caso, setCaso] = useState<Caso | null>(null)
  const [loading, setLoading] = useState(true)
  const [errorCarga, setErrorCarga] = useState(false)
  const [errorOperacion, setErrorOperacion] = useState<string | null>(null)
  const [mensajeExito, setMensajeExito] = useState<string | null>(null)
  const [guardando, setGuardando] = useState(false)

  // Campos de formulario
  const [montoFacturado, setMontoFacturado] = useState<string>('')
  const [numeroFactura, setNumeroFactura] = useState<string>('')
  const [fechaFactura, setFechaFactura] = useState<string>('')
  const [montoCobrado, setMontoCobrado] = useState<string>('')
  const [fechaCobro, setFechaCobro] = useState<string>('')
  const [metodoPago, setMetodoPago] = useState<MetodoPago | ''>('')
  const [notasCobranza, setNotasCobranza] = useState<string>('')

  // Modal / Formulario de Reclamo
  const [mostrarReclamoForm, setMostrarReclamoForm] = useState(false)
  const [motivoReclamoInput, setMotivoReclamoInput] = useState('')

  useEffect(() => {
    if (!id) return
    let active = true
    setLoading(true)
    setErrorCarga(false)

    Promise.all([getCaso(id), getFacturacion(id)])
      .then(([casoData, factData]) => {
        if (!active) return
        setCaso(casoData)
        if (factData) {
          setMontoFacturado(String(factData.monto_facturado))
          setNumeroFactura(factData.numero_factura || '')
          setFechaFactura(factData.fecha_factura || '')
          setMontoCobrado(factData.monto_cobrado ? String(factData.monto_cobrado) : '')
          setFechaCobro(factData.fecha_cobro || '')
          setMetodoPago(factData.metodo_pago || '')
          setNotasCobranza(factData.notas_cobranza || '')
        } else {
          setFechaFactura(new Date().toISOString().split('T')[0])
        }
      })
      .catch(() => {
        if (active) setErrorCarga(true)
      })
      .finally(() => {
        if (active) setLoading(false)
      })

    return () => {
      active = false
    }
  }, [id])

  // Cálculo de diferencial en tiempo real
  const diferencial = useMemo(() => {
    const fact = Number(montoFacturado) || 0
    const cobr = Number(montoCobrado) || 0
    return fact - cobr
  }, [montoFacturado, montoCobrado])

  const payloadComun = () => ({
    monto_facturado: Number(montoFacturado) || 0,
    monto_cobrado: Number(montoCobrado) || 0,
    numero_factura: numeroFactura.trim(),
    fecha_factura: fechaFactura || new Date().toISOString().split('T')[0],
    fecha_cobro: fechaCobro || null,
    metodo_pago: (metodoPago || null) as MetodoPago | null,
    notas_cobranza: notasCobranza.trim() || null,
  })

  // Guardar datos sin cambiar estado
  const handleGuardarDatos = async () => {
    if (!id) return
    setGuardando(true)
    setErrorOperacion(null)
    setMensajeExito(null)
    try {
      await saveFacturacion(id, payloadComun())
      setMensajeExito('Datos de facturación guardados correctamente.')
    } catch (err: any) {
      setErrorOperacion(err?.message || 'Error al guardar los datos.')
    } finally {
      setGuardando(false)
    }
  }

  // Marcar como Facturado (firmado -> facturado)
  const handleMarcarFacturado = async () => {
    if (!id) return
    setGuardando(true)
    setErrorOperacion(null)
    setMensajeExito(null)
    try {
      const casoActualizado = await marcarComoFacturado(id, payloadComun())
      setCaso(casoActualizado)
      setMensajeExito('Caso marcado como Facturado con éxito.')
    } catch (err: any) {
      setErrorOperacion(err?.message || 'Error al marcar como facturado.')
    } finally {
      setGuardando(false)
    }
  }

  // Marcar como Cobrado (facturado/reclamo -> cobrado)
  const handleMarcarCobrado = async () => {
    if (!id) return
    setGuardando(true)
    setErrorOperacion(null)
    setMensajeExito(null)
    try {
      const casoActualizado = await marcarComoCobrado(id, payloadComun())
      setCaso(casoActualizado)
      setMensajeExito('Caso marcado como Cobrado y finalizado.')
    } catch (err: any) {
      setErrorOperacion(err?.message || 'Error al marcar como cobrado.')
    } finally {
      setGuardando(false)
    }
  }

  // Iniciar Reclamo a Aseguradora
  const handleConfirmarReclamo = async () => {
    if (!id || !motivoReclamoInput.trim()) return
    setGuardando(true)
    setErrorOperacion(null)
    setMensajeExito(null)
    try {
      const casoActualizado = await iniciarReclamoAseguradora(id, motivoReclamoInput.trim())
      setCaso(casoActualizado)
      setMostrarReclamoForm(false)
      setMensajeExito('Reclamo a la aseguradora iniciado.')
    } catch (err: any) {
      setErrorOperacion(err?.message || 'Error al iniciar el reclamo.')
    } finally {
      setGuardando(false)
    }
  }

  // Resolver Reclamo
  const handleResolverReclamo = async () => {
    if (!id) return
    setGuardando(true)
    setErrorOperacion(null)
    setMensajeExito(null)
    try {
      const casoActualizado = await resolverReclamo(id)
      setCaso(casoActualizado)
      setMensajeExito('Reclamo resuelto. El caso vuelve a estar Facturado.')
    } catch (err: any) {
      setErrorOperacion(err?.message || 'Error al resolver el reclamo.')
    } finally {
      setGuardando(false)
    }
  }

  if (loading) {
    return <div className="p-6 font-mono text-sm text-steel-500">Cargando ficha de facturación...</div>
  }

  if (errorCarga || !caso) {
    return (
      <div className="p-6">
        <div className="bg-red-50 border-2 border-red text-red p-4">
          <p className="font-bold font-mono">No se pudo cargar la información del caso.</p>
          <button
            onClick={() => navigate('/facturacion')}
            className="mt-3 px-3 py-1.5 bg-navy text-white text-xs font-mono uppercase"
          >
            Volver a Facturación
          </button>
        </div>
      </div>
    )
  }

  const esSeguro = caso.canal === 'seguro'
  const estado = caso.estado

  return (
    <div className="p-6 max-w-5xl mx-auto flex flex-col gap-6">
      {/* Botón Volver y Cabecera del Caso */}
      <div className="flex flex-col gap-3">
        <Link
          to="/facturacion"
          className="inline-flex items-center gap-1.5 text-xs font-mono font-bold uppercase text-steel-500 hover:text-navy transition"
        >
          <ArrowLeft size={14} />
          <span>Volver al listado de facturación</span>
        </Link>

        <div className="bg-white border-2 border-graphite p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-3xl font-display font-bold uppercase tracking-tight text-navy">
                {caso.patente}
              </h1>
              <SemaforoBadge estado={estado as CasoEstado} />
            </div>
            <p className="text-sm font-sans text-graphite font-medium mt-1">
              {[caso.marca, caso.modelo, caso.color].filter(Boolean).join(' ') || 'Vehículo sin datos'}
            </p>
            <div className="text-xs font-mono text-steel-500 mt-1 flex flex-wrap gap-4">
              <span>Cliente: <strong>{caso.cliente_nombre}</strong></span>
              <span>Canal: <strong>{esSeguro ? `Seguro (${caso.aseguradora || 'S/A'})` : 'Particular'}</strong></span>
              {caso.numero_siniestro && <span>Siniestro: <strong>{caso.numero_siniestro}</strong></span>}
            </div>
          </div>

          {/* Tarjeta de Diferencial en vivo */}
          <div className="bg-steel-100 border border-steel-300 p-3 min-w-[200px] text-right">
            <span className="text-[11px] font-mono uppercase text-steel-500 block">
              Diferencial / Saldo Pendiente
            </span>
            <span
              data-testid="diferencial-display"
              className={`text-2xl font-display font-bold block mt-0.5 ${
                diferencial > 0 ? 'text-brass' : diferencial === 0 ? 'text-green' : 'text-red'
              }`}
            >
              {formatMoneda(diferencial)}
            </span>
            <span className="text-[10px] font-mono text-steel-400">
              {diferencial > 0 ? 'Saldo por cobrar' : diferencial === 0 ? 'Totalmente saldado' : 'Cobro excede facturación'}
            </span>
          </div>
        </div>
      </div>

      {/* Alertas y Mensajes de Operación */}
      {errorOperacion && (
        <div className="bg-red-50 border-2 border-red text-red p-4 flex items-center gap-3">
          <AlertTriangle size={20} className="shrink-0" />
          <span className="text-sm font-sans">{errorOperacion}</span>
        </div>
      )}

      {mensajeExito && (
        <div className="bg-green-50 border-2 border-green text-green p-4 flex items-center gap-3">
          <CheckCircle2 size={20} className="shrink-0" />
          <span className="text-sm font-sans font-medium">{mensajeExito}</span>
        </div>
      )}

      {/* Banner Especial de Reclamo Activo */}
      {estado === 'reclamo a la compañía' && (
        <div className="bg-red-50 border-2 border-red text-red p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-start gap-3">
            <ShieldAlert size={24} className="shrink-0 mt-0.5" />
            <div>
              <h2 className="font-mono font-bold uppercase text-sm">Caso en Reclamo a la Aseguradora</h2>
              <p className="text-sm font-sans mt-0.5">
                Motivo: <strong>{caso.motivo_reclamo || 'Sin motivo registrado'}</strong>
              </p>
            </div>
          </div>
          <button
            onClick={handleResolverReclamo}
            disabled={guardando}
            className="px-3 py-1.5 bg-navy text-white text-xs font-mono uppercase font-bold hover:bg-blue transition shrink-0"
          >
            Resolver Reclamo y Volver a Facturado
          </button>
        </div>
      )}

      {/* Formulario Principal de Facturación */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Bloque 1: Emisión de Factura */}
        <div className="bg-white border-2 border-graphite p-4 flex flex-col gap-4">
          <div className="flex items-center gap-2 border-b border-steel-200 pb-2 text-navy font-mono font-bold uppercase text-sm">
            <FileText size={18} />
            <span>Datos de Factura</span>
          </div>

          <div>
            <label htmlFor="input-monto-facturado" className="block text-xs font-mono uppercase text-steel-500 mb-1 font-semibold">
              Monto Facturado ($) *
            </label>
            <input
              id="input-monto-facturado"
              type="number"
              min="0"
              step="0.01"
              value={montoFacturado}
              onChange={(e) => setMontoFacturado(e.target.value)}
              placeholder="Ej: 250000"
              className="w-full px-3 py-2 text-sm font-mono border border-steel-300 focus:outline-none focus:border-navy"
            />
          </div>

          <div>
            <label htmlFor="input-numero-factura" className="block text-xs font-mono uppercase text-steel-500 mb-1 font-semibold">
              Número de Factura *
            </label>
            <input
              id="input-numero-factura"
              type="text"
              value={numeroFactura}
              onChange={(e) => setNumeroFactura(e.target.value)}
              placeholder="Ej: FC-0001-00001234"
              className="w-full px-3 py-2 text-sm font-mono border border-steel-300 focus:outline-none focus:border-navy"
            />
          </div>

          <div>
            <label htmlFor="input-fecha-factura" className="block text-xs font-mono uppercase text-steel-500 mb-1 font-semibold">
              Fecha de Emisión
            </label>
            <input
              id="input-fecha-factura"
              type="date"
              value={fechaFactura}
              onChange={(e) => setFechaFactura(e.target.value)}
              className="w-full px-3 py-2 text-sm font-mono border border-steel-300 focus:outline-none focus:border-navy"
            />
          </div>
        </div>

        {/* Bloque 2: Cobranza y Liquidación */}
        <div className="bg-white border-2 border-graphite p-4 flex flex-col gap-4">
          <div className="flex items-center gap-2 border-b border-steel-200 pb-2 text-navy font-mono font-bold uppercase text-sm">
            <DollarSign size={18} />
            <span>Cobranza y Medio de Pago</span>
          </div>

          <div>
            <label htmlFor="input-monto-cobrado" className="block text-xs font-mono uppercase text-steel-500 mb-1 font-semibold">
              Monto Cobrado ($)
            </label>
            <input
              id="input-monto-cobrado"
              type="number"
              min="0"
              step="0.01"
              value={montoCobrado}
              onChange={(e) => setMontoCobrado(e.target.value)}
              placeholder="Ej: 250000"
              className="w-full px-3 py-2 text-sm font-mono border border-steel-300 focus:outline-none focus:border-navy"
            />
          </div>

          <div>
            <label htmlFor="input-fecha-cobro" className="block text-xs font-mono uppercase text-steel-500 mb-1 font-semibold">
              Fecha de Cobro
            </label>
            <input
              id="input-fecha-cobro"
              type="date"
              value={fechaCobro}
              onChange={(e) => setFechaCobro(e.target.value)}
              className="w-full px-3 py-2 text-sm font-mono border border-steel-300 focus:outline-none focus:border-navy"
            />
          </div>

          <div>
            <label htmlFor="select-metodo-pago" className="block text-xs font-mono uppercase text-steel-500 mb-1 font-semibold">
              Método de Pago
            </label>
            <select
              id="select-metodo-pago"
              value={metodoPago}
              onChange={(e) => setMetodoPago(e.target.value as MetodoPago | '')}
              className="w-full px-3 py-2 text-sm font-sans border border-steel-300 bg-white focus:outline-none focus:border-navy"
            >
              <option value="">Seleccionar método</option>
              <option value="transferencia">Transferencia bancaria</option>
              <option value="efectivo">Efectivo</option>
              <option value="cheque">Cheque</option>
              <option value="tarjeta_debito">Tarjeta de débito</option>
              <option value="tarjeta_credito">Tarjeta de crédito</option>
              <option value="otro">Otro</option>
            </select>
          </div>

          <div>
            <label htmlFor="input-notas-cobranza" className="block text-xs font-mono uppercase text-steel-500 mb-1 font-semibold">
              Notas de Cobranza / Comentarios
            </label>
            <textarea
              id="input-notas-cobranza"
              rows={2}
              value={notasCobranza}
              onChange={(e) => setNotasCobranza(e.target.value)}
              placeholder="Detalle de transferencias, cuotas, retenciones..."
              className="w-full px-3 py-2 text-sm font-sans border border-steel-300 focus:outline-none focus:border-navy"
            />
          </div>
        </div>
      </div>

      {/* Formulario Modal de Reclamo a Aseguradora */}
      {mostrarReclamoForm && (
        <div className="bg-red-50 border-2 border-red p-4 flex flex-col gap-3">
          <div className="flex items-center gap-2 text-red font-mono font-bold uppercase text-sm">
            <ShieldAlert size={18} />
            <span>Iniciar Reclamo a la Aseguradora</span>
          </div>
          <p className="text-xs font-sans text-graphite">
            Indique el motivo por el cual el pago se encuentra trabado o demorado por parte de la aseguradora.
          </p>
          <div>
            <label htmlFor="input-motivo-reclamo" className="block text-xs font-mono uppercase text-steel-500 mb-1 font-semibold">
              Motivo del Reclamo *
            </label>
            <textarea
              id="input-motivo-reclamo"
              rows={3}
              value={motivoReclamoInput}
              onChange={(e) => setMotivoReclamoInput(e.target.value)}
              placeholder="Ej: Pago demorado más de 45 días sin liquidación de franquicia..."
              className="w-full px-3 py-2 text-sm font-sans border border-red-300 bg-white focus:outline-none focus:border-red"
            />
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={handleConfirmarReclamo}
              disabled={guardando || !motivoReclamoInput.trim()}
              className="px-4 py-2 bg-red text-white text-xs font-mono uppercase font-bold hover:bg-red-700 transition disabled:opacity-50"
            >
              Confirmar Reclamo
            </button>
            <button
              onClick={() => setMostrarReclamoForm(false)}
              className="px-4 py-2 border border-steel-400 text-xs font-mono uppercase font-bold hover:bg-steel-100 transition"
            >
              Cancelar
            </button>
          </div>
        </div>
      )}

      {/* Barra de Acciones Principales según Estado */}
      <div className="bg-white border-2 border-graphite p-4 flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <button
            onClick={handleGuardarDatos}
            disabled={guardando}
            className="flex items-center gap-2 px-4 py-2 border-2 border-graphite text-xs font-mono uppercase font-bold hover:bg-steel-100 transition disabled:opacity-50"
          >
            <Save size={14} />
            <span>Guardar Datos</span>
          </button>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {/* Si estado es firmado -> Marcar como Facturado */}
          {estado === 'firmado' && (
            <button
              onClick={handleMarcarFacturado}
              disabled={guardando || !montoFacturado || Number(montoFacturado) <= 0 || !numeroFactura.trim()}
              className="flex items-center gap-2 px-4 py-2 bg-blue text-white text-xs font-mono uppercase font-bold hover:bg-navy transition disabled:opacity-50"
            >
              <FileCheck size={16} />
              <span>Marcar como Facturado</span>
            </button>
          )}

          {/* Si estado es facturado o en reclamo -> Confirmar Cobro */}
          {(estado === 'facturado' || estado === 'reclamo a la compañía') && (
            <button
              onClick={handleMarcarCobrado}
              disabled={guardando || !montoCobrado || Number(montoCobrado) <= 0 || !fechaCobro}
              className="flex items-center gap-2 px-4 py-2 bg-green text-white text-xs font-mono uppercase font-bold hover:bg-green-700 transition disabled:opacity-50"
            >
              <CheckCircle2 size={16} />
              <span>Confirmar Cobro y Cerrar Caso</span>
            </button>
          )}

          {/* Si estado es facturado y canal es seguro -> Iniciar Reclamo */}
          {estado === 'facturado' && esSeguro && !mostrarReclamoForm && (
            <button
              onClick={() => setMostrarReclamoForm(true)}
              disabled={guardando}
              className="flex items-center gap-2 px-4 py-2 bg-red-50 border border-red text-red text-xs font-mono uppercase font-bold hover:bg-red hover:text-white transition disabled:opacity-50"
            >
              <ShieldAlert size={14} />
              <span>Iniciar Reclamo a Aseguradora</span>
            </button>
          )}

          {/* Si estado es cobrado -> Notificación de cerrado */}
          {estado === 'cobrado' && (
            <div className="flex items-center gap-2 text-green font-mono font-bold text-xs uppercase">
              <CheckCircle2 size={16} />
              <span>Caso Cobrado y Finalizado</span>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
