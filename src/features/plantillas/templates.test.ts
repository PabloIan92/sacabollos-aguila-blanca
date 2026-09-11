import { describe, it, expect } from 'vitest'
import { generarEmail } from './templates'
import type { TemplateVars } from './types'

describe('generarEmail', () => {
  const vars: TemplateVars = {
    aseguradora_nombre: 'San Cristobal',
    aseguradora_email: 'siniestros@sancristobal.com.ar',
    aseguradora_contacto: 'Juan Perez',
    patente: 'AB123CD',
    marca_modelo: 'Toyota Corolla',
    color: 'Gris',
    cliente_nombre: 'Carlos Gardel',
    cliente_telefono: '1122334455',
    numero_siniestro: 'SIN-999',
    productor_nombre: 'Jorge Productor',
    presupuesto_monto: '$ 150.000,00',
    fecha_hoy: '11/09/2026',
    taller_nombre: 'Aguila Blanca',
  }

  it('generarEmail(\'inicio_tramite\') tiene el asunto correcto y no deja placeholders', () => {
    const email = generarEmail('inicio_tramite', vars)
    expect(email.asunto).toBe('Nuevo siniestro - Patente AB123CD - SIN-999')
    expect(email.cuerpo).toContain('AB123CD')
    expect(email.cuerpo).toContain('Toyota Corolla')
    expect(email.cuerpo).toContain('Gris')
    expect(email.cuerpo).toContain('SIN-999')
    expect(email.cuerpo).toContain('Carlos Gardel')
    expect(email.cuerpo).toContain('1122334455')
    expect(email.cuerpo).toContain('Jorge Productor')
    expect(email.cuerpo).toContain('Aguila Blanca')
    expect(email.cuerpo).not.toContain('undefined')
    expect(email.cuerpo).not.toContain('null')
    expect(email.cuerpo).not.toContain('[')
    expect(email.destinatario).toBe('siniestros@sancristobal.com.ar')
  })

  it('generarEmail(\'presupuesto\') incluye el monto formateado', () => {
    const email = generarEmail('presupuesto', vars)
    expect(email.asunto).toBe('Presupuesto PDR - AB123CD - Siniestro SIN-999')
    expect(email.cuerpo).toContain('$ 150.000,00')
    expect(email.cuerpo).not.toContain('undefined')
    expect(email.cuerpo).not.toContain('null')
    expect(email.cuerpo).not.toContain('[')
  })

  it('generarEmail(\'reclamo\') incluye número de siniestro', () => {
    const email = generarEmail('reclamo', vars)
    expect(email.asunto).toBe('Reclamo pendiente de resolución - AB123CD - Siniestro SIN-999')
    expect(email.cuerpo).toContain('SIN-999')
    expect(email.cuerpo).toContain('11/09/2026')
    expect(email.cuerpo).not.toContain('undefined')
    expect(email.cuerpo).not.toContain('null')
    expect(email.cuerpo).not.toContain('[')
  })

  it('generarEmail(\'cierre\') incluye patente y cliente', () => {
    const email = generarEmail('cierre', vars)
    expect(email.asunto).toBe('Cierre de expediente - AB123CD - Siniestro SIN-999')
    expect(email.cuerpo).toContain('AB123CD')
    expect(email.cuerpo).toContain('Carlos Gardel')
    expect(email.cuerpo).not.toContain('undefined')
    expect(email.cuerpo).not.toContain('null')
    expect(email.cuerpo).not.toContain('[')
  })
})
