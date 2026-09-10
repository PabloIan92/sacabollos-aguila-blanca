import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router'
import {
  AlertTriangle,
  ArrowRight,
  CheckCircle2,
  Clock,
  DollarSign,
  FileText,
  RefreshCw,
  Search,
} from 'lucide-react'
import { getResumenFacturacion } from './api'
import type { ResumenFacturacionItem } from './types'
import { SemaforoBadge } from '../casos/components/SemaforoBadge'
import type { CasoEstado } from '../casos/types'

function formatMoneda(monto: number): string {
  return `$ ${new Intl.NumberFormat('es-AR', {
    minimumFractionDigits: monto % 1 === 0 ? 0 : 2,
    maximumFractionDigits: 2,
  }).format(monto)}`
}

export function FacturacionPage() {
  const [items, setItems] = useState<ResumenFacturacionItem[] | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [filtroTexto, setFiltroTexto] = useState('')
  const [filtroEstado, setFiltroEstado] = useState<string>('todos')
  const [filtroCanal, setFiltroCanal] = useState<string>('todos')

  const cargarDatos = async () => {
    setLoading(true)
    setError(null)
    try {
      const data = await getResumenFacturacion()
      setItems(data)
    } catch (err: any) {
      setError(err?.message || 'Error al cargar el resumen de facturación')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    cargarDatos()
  }, [])

  // Métricas KPI globales (calculadas sobre todos los datos)
  const kpis = useMemo(() => {
    if (!items) {
      return {
        totalFacturado: 0,
        totalCobrado: 0,
        pendienteCobro: 0,
        enReclamoCount: 0,
      }
    }

    let facturado = 0
    let cobrado = 0
    let pendiente = 0
    let enReclamo = 0

    for (const item of items) {
      facturado += item.monto_facturado
      cobrado += item.monto_cobrado
      if (item.diferencial > 0) {
        pendiente += item.diferencial
      }
      if (item.estado === 'reclamo a la compañía') {
        enReclamo += 1
      }
    }

    return {
      totalFacturado: facturado,
      totalCobrado: cobrado,
      pendienteCobro: pendiente,
      enReclamoCount: enReclamo,
    }
  }, [items])

  // Filtrado de la lista
  const itemsFiltrados = useMemo(() => {
    if (!items) return []

    const q = filtroTexto.trim().toLowerCase()

    return items.filter((item) => {
      // Filtro texto
      if (q) {
        const matchesPatente = item.patente.toLowerCase().includes(q)
        const matchesCliente = item.cliente_nombre.toLowerCase().includes(q)
        const matchesVehiculo = item.vehiculo.toLowerCase().includes(q)
        const matchesFactura = item.numero_factura.toLowerCase().includes(q)
        const matchesAseguradora = item.aseguradora?.toLowerCase().includes(q) ?? false

        if (!matchesPatente && !matchesCliente && !matchesVehiculo && !matchesFactura && !matchesAseguradora) {
          return false
        }
      }

      // Filtro estado
      if (filtroEstado !== 'todos' && item.estado !== filtroEstado) {
        return false
      }

      // Filtro canal
      if (filtroCanal !== 'todos' && item.canal !== filtroCanal) {
        return false
      }

      return true
    })
  }, [items, filtroTexto, filtroEstado, filtroCanal])

  if (loading) {
    return (
      <div className="p-6">
        <div className="flex items-center gap-3 text-steel-500 py-12 justify-center">
          <RefreshCw className="animate-spin" size={24} />
          <span className="font-mono text-sm">Cargando facturación...</span>
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
            <span>Error al cargar el resumen de facturación</span>
          </div>
          <p className="text-sm font-sans">{error}</p>
          <div>
            <button
              onClick={cargarDatos}
              className="px-3 py-1.5 bg-red text-white text-xs font-mono font-bold uppercase hover:bg-red-700 transition"
            >
              Reintentar
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="p-6 max-w-7xl mx-auto flex flex-col gap-6">
      {/* Encabezado */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 border-b-2 border-graphite pb-4">
        <div>
          <h1 className="text-2xl font-display font-bold uppercase tracking-tight text-navy">
            Facturación y Cobranza
          </h1>
          <p className="text-xs font-mono text-steel-500 uppercase mt-0.5">
            Panel exclusivo de control financiero y seguimiento de cobros
          </p>
        </div>
        <button
          onClick={cargarDatos}
          className="self-start sm:self-auto flex items-center gap-2 px-3 py-1.5 text-xs font-mono border border-graphite hover:bg-steel-100 transition"
          title="Actualizar datos"
        >
          <RefreshCw size={14} />
          <span>Actualizar</span>
        </button>
      </div>

      {/* Tarjetas KPI */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white border-2 border-graphite p-4 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between text-steel-500 mb-1">
            <span className="text-xs font-mono uppercase font-semibold">Total Facturado</span>
            <DollarSign size={18} className="text-navy" />
          </div>
          <div
            data-testid="kpi-total-facturado"
            className="text-2xl font-display font-bold text-navy"
          >
            {formatMoneda(kpis.totalFacturado)}
          </div>
          <span className="text-[11px] font-mono text-steel-400 mt-1">Facturas emitidas</span>
        </div>

        <div className="bg-white border-2 border-graphite p-4 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between text-steel-500 mb-1">
            <span className="text-xs font-mono uppercase font-semibold">Total Cobrado</span>
            <CheckCircle2 size={18} className="text-green" />
          </div>
          <div
            data-testid="kpi-total-cobrado"
            className="text-2xl font-display font-bold text-green"
          >
            {formatMoneda(kpis.totalCobrado)}
          </div>
          <span className="text-[11px] font-mono text-steel-400 mt-1">Fondos ingresados</span>
        </div>

        <div className="bg-white border-2 border-graphite p-4 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between text-steel-500 mb-1">
            <span className="text-xs font-mono uppercase font-semibold">Pendiente de Cobro</span>
            <Clock size={18} className="text-brass" />
          </div>
          <div
            data-testid="kpi-pendiente-cobro"
            className="text-2xl font-display font-bold text-brass"
          >
            {formatMoneda(kpis.pendienteCobro)}
          </div>
          <span className="text-[11px] font-mono text-steel-400 mt-1">Diferencial por cobrar</span>
        </div>

        <div className="bg-white border-2 border-graphite p-4 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between text-steel-500 mb-1">
            <span className="text-xs font-mono uppercase font-semibold">En Reclamo</span>
            <AlertTriangle size={18} className="text-red" />
          </div>
          <div
            data-testid="kpi-en-reclamo"
            className="text-2xl font-display font-bold text-red"
          >
            {kpis.enReclamoCount}
          </div>
          <span className="text-[11px] font-mono text-steel-400 mt-1">Casos con aseguradora en disputa</span>
        </div>
      </div>

      {/* Barra de Filtros */}
      <div className="bg-white border-2 border-graphite p-4 flex flex-col md:flex-row gap-3 items-stretch md:items-center justify-between">
        <div className="relative flex-1">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-steel-400" />
          <input
            type="text"
            value={filtroTexto}
            onChange={(e) => setFiltroTexto(e.target.value)}
            placeholder="Buscar por patente, cliente, factura..."
            className="w-full pl-9 pr-3 py-2 text-sm font-sans border border-steel-300 focus:outline-none focus:border-navy"
          />
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2">
            <label htmlFor="filtro-estado" className="text-xs font-mono uppercase text-steel-500">
              Estado:
            </label>
            <select
              id="filtro-estado"
              aria-label="Estado"
              value={filtroEstado}
              onChange={(e) => setFiltroEstado(e.target.value)}
              className="text-sm font-sans border border-steel-300 py-1.5 px-2 bg-white focus:outline-none focus:border-navy"
            >
              <option value="todos">Todos los estados</option>
              <option value="firmado">Firmado (Listo para facturar)</option>
              <option value="facturado">Facturado (Pendiente cobro)</option>
              <option value="reclamo a la compañía">En Reclamo Aseguradora</option>
              <option value="cobrado">Cobrado (Cerrado)</option>
            </select>
          </div>

          <div className="flex items-center gap-2">
            <label htmlFor="filtro-canal" className="text-xs font-mono uppercase text-steel-500">
              Canal:
            </label>
            <select
              id="filtro-canal"
              aria-label="Canal"
              value={filtroCanal}
              onChange={(e) => setFiltroCanal(e.target.value)}
              className="text-sm font-sans border border-steel-300 py-1.5 px-2 bg-white focus:outline-none focus:border-navy"
            >
              <option value="todos">Todos los canales</option>
              <option value="seguro">Seguro</option>
              <option value="particular">Particular</option>
            </select>
          </div>
        </div>
      </div>

      {/* Tabla de Casos */}
      <div className="bg-white border-2 border-graphite overflow-x-auto">
        <table className="w-full text-left text-sm font-sans border-collapse">
          <thead>
            <tr className="bg-steel-100 border-b-2 border-graphite text-xs font-mono uppercase text-navy">
              <th className="p-3">Patente / Vehículo</th>
              <th className="p-3">Cliente / Canal</th>
              <th className="p-3">Factura</th>
              <th className="p-3 text-right">Facturado</th>
              <th className="p-3 text-right">Cobrado</th>
              <th className="p-3 text-right">Diferencial</th>
              <th className="p-3 text-center">Estado</th>
              <th className="p-3 text-center">Acción</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-steel-200">
            {itemsFiltrados.length === 0 ? (
              <tr>
                <td colSpan={8} className="p-8 text-center text-steel-500 font-mono text-sm">
                  No se encontraron casos de facturación para los filtros seleccionados.
                </td>
              </tr>
            ) : (
              itemsFiltrados.map((item) => {
                const tieneDiferencial = item.diferencial > 0
                return (
                  <tr key={item.caso_id} className="hover:bg-steel-50 transition">
                    <td className="p-3">
                      <Link
                        to={`/casos/${item.caso_id}/facturacion`}
                        className="font-mono font-bold text-blue hover:underline text-base block"
                      >
                        {item.patente}
                      </Link>
                      <span className="text-xs text-steel-500">{item.vehiculo}</span>
                    </td>
                    <td className="p-3">
                      <div className="font-medium text-navy">{item.cliente_nombre}</div>
                      <div className="text-xs text-steel-500">
                        {item.canal === 'seguro' ? `Seguro (${item.aseguradora || 'S/A'})` : 'Particular'}
                      </div>
                    </td>
                    <td className="p-3">
                      {item.numero_factura ? (
                        <div className="flex items-center gap-1.5 font-mono text-xs">
                          <FileText size={14} className="text-steel-400" />
                          <span>{item.numero_factura}</span>
                        </div>
                      ) : (
                        <span className="text-xs font-mono text-steel-400 italic">Sin emitir</span>
                      )}
                      {item.fecha_factura && (
                        <span className="text-[11px] text-steel-400 font-mono block">
                          {item.fecha_factura}
                        </span>
                      )}
                    </td>
                    <td className="p-3 text-right font-mono font-semibold text-navy">
                      {formatMoneda(item.monto_facturado)}
                    </td>
                    <td className="p-3 text-right font-mono font-semibold text-green">
                      {formatMoneda(item.monto_cobrado)}
                    </td>
                    <td
                      className={`p-3 text-right font-mono font-bold ${
                        tieneDiferencial ? 'text-brass' : 'text-steel-400'
                      }`}
                    >
                      {formatMoneda(item.diferencial)}
                    </td>
                    <td className="p-3 text-center">
                      <div className="flex flex-col items-center gap-1">
                        <SemaforoBadge estado={item.estado as CasoEstado} />
                        {item.estado === 'reclamo a la compañía' && item.motivo_reclamo && (
                          <span
                            className="text-[10px] text-red font-mono max-w-[150px] truncate"
                            title={item.motivo_reclamo}
                          >
                            ⚠ {item.motivo_reclamo}
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="p-3 text-center">
                      <Link
                        to={`/casos/${item.caso_id}/facturacion`}
                        className="inline-flex items-center gap-1 px-2.5 py-1.5 bg-navy text-white text-xs font-mono uppercase font-bold hover:bg-blue transition"
                      >
                        <span>Gestionar</span>
                        <ArrowRight size={12} />
                      </Link>
                    </td>
                  </tr>
                )
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
