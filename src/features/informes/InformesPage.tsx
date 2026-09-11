import { useEffect, useState, useCallback } from 'react'
import { AlertTriangle, BarChart2, CheckCircle2, Clock, DollarSign, RefreshCw, Users } from 'lucide-react'
import { getResumenMensual } from './api'
import type { ResumenMensual } from './types'

function formatMoneda(value: number): string {
  return `$ ${new Intl.NumberFormat('es-AR', {
    minimumFractionDigits: value % 1 === 0 ? 0 : 2,
    maximumFractionDigits: 2,
  }).format(value)}`
}

export function InformesPage() {
  const [data, setData] = useState<ResumenMensual[] | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const result = await getResumenMensual()
      setData(result)
    } catch (err: any) {
      setError(err?.message || 'Error al cargar los informes')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    load()
  }, [load])

  if (loading) {
    return (
      <div className="p-6">
        <div className="flex items-center gap-3 text-steel-500 py-12 justify-center">
          <RefreshCw className="animate-spin" size={24} />
          <span data-testid="loading-spinner" aria-label="cargando" className="font-mono text-sm">
            Cargando informes...
          </span>
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
            <span>Error al cargar los informes</span>
          </div>
          <p className="text-sm font-sans">{error}</p>
          <div>
            <button
              onClick={load}
              className="px-3 py-1.5 bg-red text-white text-xs font-mono font-bold uppercase hover:bg-red-700 transition"
            >
              Reintentar
            </button>
          </div>
        </div>
      </div>
    )
  }

  if (!data || data.length === 0) {
    return (
      <div className="p-6 max-w-7xl mx-auto">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 border-b-2 border-graphite pb-4 mb-6">
          <div>
            <h1 className="text-2xl font-display font-bold uppercase tracking-tight text-navy">Informes</h1>
            <p className="text-xs font-mono text-steel-500 uppercase mt-0.5">Resumen mensual de productividad y finanzas</p>
          </div>
        </div>
        <p className="text-center font-mono text-sm text-steel-500 py-12">
          No se encontraron datos para los informes.
        </p>
      </div>
    )
  }

  const totalCasos = data.reduce((acc, m) => acc + m.casosCreados, 0)
  const totalFacturado = data.reduce((acc, m) => acc + m.montoFacturado, 0)
  const totalCobrado = data.reduce((acc, m) => acc + m.montoCobrado, 0)
  const totalDiferencial = data.reduce((acc, m) => acc + m.diferencial, 0)

  return (
    <div className="p-6 max-w-7xl mx-auto flex flex-col gap-6">
      {/* Encabezado */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 border-b-2 border-graphite pb-4">
        <div>
          <h1 className="text-2xl font-display font-bold uppercase tracking-tight text-navy">Informes</h1>
          <p className="text-xs font-mono text-steel-500 uppercase mt-0.5">Resumen mensual de productividad y finanzas</p>
        </div>
        <button
          onClick={load}
          className="self-start sm:self-auto flex items-center gap-2 px-3 py-1.5 text-xs font-mono border border-graphite hover:bg-steel-100 transition"
          title="Actualizar datos"
        >
          <RefreshCw size={14} />
          <span>Actualizar</span>
        </button>
      </div>

      {/* KPIs totales */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white border-2 border-graphite p-4 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between text-steel-500 mb-1">
            <span className="text-xs font-mono uppercase font-semibold">Total Casos</span>
            <Users size={18} className="text-navy" />
          </div>
          <div data-testid="kpi-total-casos" className="text-2xl font-display font-bold text-navy">
            {totalCasos}
          </div>
          <span className="text-[11px] font-mono text-steel-400 mt-1">Últimos {data.length} mes{data.length !== 1 ? 'es' : ''}</span>
        </div>

        <div className="bg-white border-2 border-graphite p-4 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between text-steel-500 mb-1">
            <span className="text-xs font-mono uppercase font-semibold">Total Facturado</span>
            <DollarSign size={18} className="text-navy" />
          </div>
          <div data-testid="kpi-total-facturado" className="text-2xl font-display font-bold text-navy">
            {formatMoneda(totalFacturado)}
          </div>
          <span className="text-[11px] font-mono text-steel-400 mt-1">Facturas emitidas</span>
        </div>

        <div className="bg-white border-2 border-graphite p-4 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between text-steel-500 mb-1">
            <span className="text-xs font-mono uppercase font-semibold">Total Cobrado</span>
            <CheckCircle2 size={18} className="text-green" />
          </div>
          <div data-testid="kpi-total-cobrado" className="text-2xl font-display font-bold text-green">
            {formatMoneda(totalCobrado)}
          </div>
          <span className="text-[11px] font-mono text-steel-400 mt-1">Fondos ingresados</span>
        </div>

        <div className="bg-white border-2 border-graphite p-4 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between text-steel-500 mb-1">
            <span className="text-xs font-mono uppercase font-semibold">Diferencial</span>
            <Clock size={18} className="text-brass" />
          </div>
          <div
            data-testid="kpi-diferencial"
            className={`text-2xl font-display font-bold ${totalDiferencial > 0 ? 'text-brass' : 'text-steel-400'}`}
          >
            {formatMoneda(totalDiferencial)}
          </div>
          <span className="text-[11px] font-mono text-steel-400 mt-1">Facturado vs. cobrado</span>
        </div>
      </div>

      {/* Tabla mensual */}
      <div className="bg-white border-2 border-graphite overflow-x-auto">
        <div className="flex items-center gap-2 p-3 border-b border-steel-200">
          <BarChart2 size={16} className="text-navy" />
          <span className="text-xs font-mono font-semibold uppercase text-navy">Desglose por mes</span>
        </div>
        <table className="w-full text-left text-sm font-sans border-collapse">
          <thead>
            <tr className="bg-steel-100 border-b-2 border-graphite text-xs font-mono uppercase text-navy">
              <th className="p-3">Mes</th>
              <th className="p-3 text-right">Casos nuevos</th>
              <th className="p-3 text-right">Cerrados</th>
              <th className="p-3 text-right">Seguro</th>
              <th className="p-3 text-right">Particular</th>
              <th className="p-3 text-right">Facturado</th>
              <th className="p-3 text-right">Cobrado</th>
              <th className="p-3 text-right">Diferencial</th>
              <th className="p-3 text-right">En reclamo</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-steel-200">
            {data.map((m, i) => (
              <tr
                key={m.mes}
                className={`hover:bg-steel-50 transition ${i === 0 ? 'border-l-4 border-blue bg-blue/5' : ''}`}
              >
                <td className="p-3 font-mono font-semibold text-navy">{m.label}</td>
                <td className="p-3 text-right font-mono">{m.casosCreados}</td>
                <td className="p-3 text-right font-mono text-green font-semibold">{m.casosCerrados}</td>
                <td className="p-3 text-right font-mono text-steel-500">{m.casosSeguro}</td>
                <td className="p-3 text-right font-mono text-steel-500">{m.casosParticular}</td>
                <td className="p-3 text-right font-mono font-semibold text-navy">{formatMoneda(m.montoFacturado)}</td>
                <td className="p-3 text-right font-mono font-semibold text-green">{formatMoneda(m.montoCobrado)}</td>
                <td className={`p-3 text-right font-mono font-bold ${m.diferencial > 0 ? 'text-brass' : 'text-steel-400'}`}>
                  {formatMoneda(m.diferencial)}
                </td>
                <td className="p-3 text-right font-mono">
                  {m.casosEnReclamo > 0 ? (
                    <span className="text-red font-bold">{m.casosEnReclamo}</span>
                  ) : (
                    <span className="text-steel-400">—</span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
