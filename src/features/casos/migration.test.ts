import { describe, expect, it } from 'vitest'
import sql from '../../../supabase/migrations/0004_casos_particulares.sql?raw'

describe('migration 0004_casos_particulares.sql', () => {
  const executableSql = sql
    .replace(/--.*$/gm, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .toLowerCase()

  function constraint(name: string) {
    const match = executableSql.match(
      new RegExp(`add constraint ${name} check \\(.*?\\)(?=, add constraint|;)`)
    )
    expect(match, `No se encontro el constraint ${name}`).not.toBeNull()
    return match![0]
  }

  const transitionFunction = executableSql.match(
    /create function public\.validar_transicion_caso\(\).*?\$\$;/
  )?.[0]

  it('agrega exactamente los seis campos aprobados con sus tipos', () => {
    expect(executableSql).toMatch(/add column presupuesto_monto numeric\(12,2\)/)
    expect(executableSql).toMatch(/add column presupuesto_observaciones text/)
    expect(executableSql).toMatch(/add column respuesta_particular text/)
    expect(executableSql).toMatch(/add column modalidad_contacto text/)
    expect(executableSql).toMatch(/add column seguimiento_observaciones text/)
    expect(executableSql).toMatch(/add column inspeccion_guardada_at timestamptz/)
    expect(executableSql).not.toMatch(/add column presupuesto\s/)
  })

  it('es compatible con filas de seguro existentes', () => {
    expect(executableSql).toContain('alter column aseguradora drop not null')
    expect(executableSql).toContain('alter column numero_siniestro drop not null')
    expect(executableSql).toContain('alter column denuncia drop not null')

    for (const column of [
      'presupuesto_monto',
      'presupuesto_observaciones',
      'respuesta_particular',
      'modalidad_contacto',
      'seguimiento_observaciones',
      'inspeccion_guardada_at',
    ]) {
      expect(executableSql).not.toMatch(new RegExp(`add column ${column} [^,;]*not null`))
    }
  })

  it('limita canal, respuesta y modalidad a sus valores de contrato', () => {
    expect(constraint('casos_canal_check')).toContain("canal in ('seguro', 'particular')")
    expect(constraint('casos_respuesta_particular_valor_check')).toContain(
      "respuesta_particular in ('pendiente', 'aceptado', 'rechazado')"
    )
    expect(constraint('casos_modalidad_contacto_valor_check')).toContain(
      "modalidad_contacto in ('whatsapp', 'telefono', 'email', 'presencial')"
    )
  })

  it('exige datos de seguro y los prohibe para particulares', () => {
    const check = constraint('casos_datos_por_canal_check')

    expect(check).toMatch(
      /canal = 'seguro'.*aseguradora is not null.*numero_siniestro is not null.*denuncia is not null/
    )
    expect(check).toMatch(
      /canal = 'particular'.*aseguradora is null.*numero_siniestro is null.*denuncia is null.*productor_nombre is null.*productor_telefono is null/
    )
  })

  it('exige presupuesto positivo y respuesta para particulares, pero los prohibe en seguro', () => {
    const check = constraint('casos_datos_por_canal_check')

    expect(check).toMatch(
      /canal = 'seguro'.*presupuesto_monto is null.*presupuesto_observaciones is null.*respuesta_particular is null/
    )
    expect(check).toMatch(
      /canal = 'particular'.*presupuesto_monto is not null.*presupuesto_monto > 0.*respuesta_particular is not null/
    )
  })

  it('requiere contacto solo al rechazar y reserva el seguimiento para ese rechazo', () => {
    const check = constraint('casos_contacto_rechazo_check')

    expect(check).toMatch(
      /respuesta_particular = 'rechazado'.*modalidad_contacto is not null/
    )
    expect(check).toMatch(
      /respuesta_particular in \('pendiente', 'aceptado'\).*modalidad_contacto is null.*seguimiento_observaciones is null/
    )
  })

  it('mantiene respuesta y estado consistentes incluso sin transicion', () => {
    const check = constraint('casos_respuesta_estado_check')

    expect(check).toMatch(
      /respuesta_particular = 'pendiente'.*estado = 'borrador'/
    )
    expect(check).toMatch(
      /respuesta_particular = 'aceptado'.*estado not in \('borrador', 'enviado a la aseguradora', 'cancelado'\).*inspeccion_guardada_at is not null/
    )
    expect(check).toMatch(
      /respuesta_particular = 'rechazado'.*estado = 'cancelado'.*inspeccion_guardada_at is not null/
    )
  })

  it('instala un trigger before update que ejecuta la validacion real', () => {
    expect(transitionFunction).toBeDefined()
    expect(executableSql).toMatch(
      /create trigger casos_validar_transicion before update on public\.casos for each row execute function public\.validar_transicion_caso\(\)/
    )
  })

  it('permite escrituras sin cambio de estado e impide cambiar el canal', () => {
    expect(transitionFunction).toMatch(/new\.canal is distinct from old\.canal.*raise exception/)
    expect(transitionFunction).toMatch(
      /new\.estado is not distinct from old\.estado then return new/
    )
  })

  it('valida rol y todas las transiciones aprobadas por canal', () => {
    expect(transitionFunction).toContain(
      "rol_actual is null or rol_actual not in ('dueno', 'recepcion')"
    )
    expect(transitionFunction).toMatch(
      /new\.canal = 'seguro'.*old\.estado = 'borrador'.*new\.estado = 'enviado a la aseguradora'.*old\.estado = 'enviado a la aseguradora'.*new\.estado = 'aprobado'/
    )
    expect(transitionFunction).toMatch(
      /new\.canal = 'particular'.*old\.estado = 'borrador'.*new\.estado = 'aprobado'.*new\.respuesta_particular = 'aceptado'.*old\.estado = 'borrador'.*new\.estado = 'cancelado'.*new\.respuesta_particular = 'rechazado'/
    )
    expect(transitionFunction).toMatch(
      /old\.estado = 'aprobado'.*new\.estado = 'turno coordinado'.*new\.turno_fecha is null/
    )
    expect(transitionFunction).toMatch(
      /old\.estado = 'turno coordinado'.*new\.estado = 'ingresado'.*new\.orden_ingreso_numero.*new\.ingresado_at is null/
    )
  })

  it('exige inspeccion guardada para decidir o enviar', () => {
    const requirements = transitionFunction?.match(/new\.inspeccion_guardada_at is not null/g)
    expect(requirements).toHaveLength(3)
  })

  it('no crea permisos ni politicas de escritura para taller', () => {
    expect(executableSql).not.toMatch(/grant (insert|update|delete).*\btaller\b/)
    expect(executableSql).not.toMatch(
      /create policy .* for (insert|update|delete).*current_user_role\(\).*'taller'/
    )
  })
})
