import { listCasos } from '../casos/api'
import { getResumenFacturacion } from '../facturacion/api'
import type { ResumenMensual } from './types'

const MONTHS = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic']

export async function getResumenMensual(): Promise<ResumenMensual[]> {
  const [casos, facturacion] = await Promise.all([
    listCasos(),
    getResumenFacturacion(),
  ])

  const map = new Map<string, ResumenMensual>()

  const getOrCreateMonth = (mes: string) => {
    if (!map.has(mes)) {
      const [year, month] = mes.split('-')
      const label = `${MONTHS[Number(month) - 1]} ${year}`

      map.set(mes, {
        mes,
        label,
        casosCreados: 0,
        casosCerrados: 0,
        casosSeguro: 0,
        casosParticular: 0,
        montoFacturado: 0,
        montoCobrado: 0,
        diferencial: 0,
        casosEnReclamo: 0,
      })
    }
    return map.get(mes)!
  }

  for (const caso of casos) {
    if (!caso.created_at) continue
    const mes = caso.created_at.substring(0, 7) // YYYY-MM
    const resumen = getOrCreateMonth(mes)
    resumen.casosCreados++
    if (caso.canal === 'seguro') resumen.casosSeguro++
    if (caso.canal === 'particular') resumen.casosParticular++
    if (caso.estado === 'cobrado') resumen.casosCerrados++
    if (caso.estado === 'reclamo a la compañía') resumen.casosEnReclamo++
  }

  for (const fact of facturacion) {
    if (!fact.fecha_factura) continue
    const mes = fact.fecha_factura.substring(0, 7) // YYYY-MM
    const resumen = getOrCreateMonth(mes)
    resumen.montoFacturado += fact.monto_facturado
    resumen.montoCobrado += fact.monto_cobrado
    resumen.diferencial += fact.diferencial
  }

  const result = Array.from(map.values()).sort((a, b) => b.mes.localeCompare(a.mes))
  
  return result.slice(0, 12)
}
