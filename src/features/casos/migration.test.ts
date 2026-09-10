import { describe, expect, it } from 'vitest'
import migration from '../../../supabase/migrations/0004_casos_particulares_y_transiciones.sql?raw'

function migrationSql() {
  return migration
}

describe('migración 0004 de casos particulares', () => {
  it('amplía el canal y agrega el contrato de presupuesto particular', () => {
    const sql = migrationSql()
    expect(sql).toContain("check (canal in ('seguro', 'particular'))")
    expect(sql).not.toMatch(/canal\s*=\s*'compartido'/)
    expect(sql).toContain('presupuesto_monto numeric(14, 2)')
    expect(sql).toContain('presupuesto_respuesta text')
    expect(sql).toContain('modalidad_contacto text')
    expect(sql).toContain('presupuesto_observaciones text')
    expect(sql).toContain('seguimiento_observaciones text')
    expect(sql).toContain('inspeccion_guardada_at timestamptz')
    expect(sql).toContain("presupuesto_respuesta in ('pendiente', 'aceptado', 'rechazado')")
    expect(sql).toContain(
      "modalidad_contacto in ('whatsapp', 'telefono', 'email', 'presencial')"
    )
  })

  it('mantiene obligatorios los datos de seguro y exige presupuesto al particular', () => {
    const sql = migrationSql()
    expect(sql).toContain("canal = 'seguro'")
    expect(sql).toContain('aseguradora is not null')
    expect(sql).toContain('numero_siniestro is not null')
    expect(sql).toContain('denuncia is not null')
    expect(sql).toContain("canal = 'particular'")
    expect(sql).toContain('presupuesto_monto is not null')
  })

  it('valida las cuatro fotos de inspección antes de abandonar borrador', () => {
    const sql = migrationSql()
    expect(sql).toContain('caso_tiene_fotos_inspeccion')
    expect(sql).toContain("'frente.webp'")
    expect(sql).toContain("'atras.webp'")
    expect(sql).toContain("'lateral-izquierdo.webp'")
    expect(sql).toContain("'lateral-derecho.webp'")
    expect(sql).toContain("old.estado = 'borrador'")
  })

  it('valida las cuatro fotos de ingreso al ingresar', () => {
    const sql = migrationSql()
    expect(sql).toContain('caso_tiene_fotos_ingreso')
    expect(sql).toContain("'ingreso-frente.webp'")
    expect(sql).toContain("'ingreso-atras.webp'")
    expect(sql).toContain("'ingreso-lateral-izquierdo.webp'")
    expect(sql).toContain("'ingreso-lateral-derecho.webp'")
  })

  it('instala un trigger con grafo de estados limitado a Fase 3 y sin autorización para taller', () => {
    const sql = migrationSql()
    // Verifica que existe el trigger y la función
    expect(sql).toContain('create function public.validar_transicion_caso()')
    expect(sql).toContain('create trigger casos_validar_transicion')

    // Verifica los roles autorizados (dueno y recepcion, pero NO taller)
    expect(sql).toContain("actor_role in ('dueno', 'recepcion')")
    expect(sql).not.toMatch(/actor_role\s*=\s*'taller'/)

    // Verifica las transiciones permitidas en Fase 3
    expect(sql).toContain("(old.canal = 'seguro' and")
    expect(sql).toContain("(old.estado = 'borrador' and new.estado = 'enviado a la aseguradora')")
    expect(sql).toContain("(old.estado = 'enviado a la aseguradora' and new.estado = 'aprobado')")
    expect(sql).toContain("(old.estado = 'aprobado' and new.estado = 'turno coordinado')")
    expect(sql).toContain("(old.estado = 'turno coordinado' and new.estado = 'ingresado')")

    expect(sql).toContain("(old.canal = 'particular' and")
    expect(sql).toContain("(old.estado = 'borrador' and new.estado = 'aprobado')")
    expect(sql).toContain("(old.estado = 'borrador' and new.estado = 'cancelado')")
    expect(sql).toContain("(old.estado = 'aprobado' and new.estado = 'turno coordinado')")
    expect(sql).toContain("(old.estado = 'turno coordinado' and new.estado = 'ingresado')")

    const graph = sql.slice(
      sql.indexOf('transicion_valida :='),
      sql.indexOf('if not transicion_valida then')
    )
    expect(graph).not.toContain("canal = 'compartido'")
    // Verifica que NO incluye transiciones de Fase 4-5
    expect(graph).not.toMatch(/(?:old|new)\.estado\s*=\s*'(?:esperando repuesto|en reparación|listo para firma|firmado|facturado|cobrado|reclamo a la compañía)'/)
    expect(graph).not.toContain("old.estado = 'ingresado'")

    // Verifica ausencia de policy casos_update_taller
    expect(sql).not.toMatch(/policy\s+casos_update_taller/)
  })

  it('permite a recepción reemplazar una foto existente sin abrir escritura a otros roles', () => {
    const sql = migrationSql()
    expect(sql).toContain('create policy casos_fotos_update_recepcion')
    expect(sql).toContain("for update")
    expect(sql).toContain("public.current_user_role() = 'recepcion'")
    expect(sql).toContain("split_part(name, '/', 3) in")
  })

  it('valida inspeccion_guardada_at al salir de borrador', () => {
    const sql = migrationSql()
    expect(sql).toContain("if old.estado = 'borrador' and new.estado is distinct from old.estado then")
    expect(sql).toMatch(/if new\.inspeccion_guardada_at is null then/i)
    expect(sql).toContain('Al salir de borrador requiere inspeccion_guardada_at')
    expect(sql).toContain("if NOT public.caso_tiene_fotos_inspeccion(old.id) then")
    expect(sql).toContain('El caso requiere las cuatro fotos de inspección al salir de borrador')
  })

  it('valida turno_fecha al coordinar', () => {
    const sql = migrationSql()
    expect(sql).toContain("if new.estado = 'turno coordinado' and old.estado is distinct from new.estado then")
    expect(sql).toContain("if new.turno_fecha IS NULL then")
    expect(sql).toContain('Al coordinar requiere turno_fecha')
  })

  it('valida orden_ingreso_numero, ingresado_at y fotos de ingreso al ingresar', () => {
    const sql = migrationSql()
    expect(sql).toContain("if new.estado = 'ingresado' and old.estado is distinct from new.estado then")
    expect(sql).toContain("if new.orden_ingreso_numero IS NULL OR trim(new.orden_ingreso_numero) = '' then")
    expect(sql).toContain('Al ingresar requiere orden_ingreso_numero no vacía')
    expect(sql).toContain("if new.ingresado_at IS NULL then")
    expect(sql).toContain('Al ingresar requiere ingresado_at')
    expect(sql).toContain("if NOT public.caso_tiene_fotos_ingreso(old.id) then")
    expect(sql).toContain('Al ingresar requiere las cuatro fotos de ingreso')
  })

  it('restringe cambio de campos de identidad durante transición', () => {
    const sql = migrationSql()
    expect(sql).toContain('-- Impedir cambios de identidad, creación, canal y presupuesto inicial')
    expect(sql).toContain('if old.id is distinct from new.id')
    expect(sql).toContain('or old.canal is distinct from new.canal')
    expect(sql).toContain('or old.patente is distinct from new.patente')
    expect(sql).toContain('or old.marca is distinct from new.marca')
    expect(sql).toContain('or old.modelo is distinct from new.modelo')
    expect(sql).toContain('or old.color is distinct from new.color')
    expect(sql).toContain('or old.cliente_nombre is distinct from new.cliente_nombre')
    expect(sql).toContain('or old.cliente_telefono is distinct from new.cliente_telefono')
    expect(sql).toContain('or old.aseguradora is distinct from new.aseguradora')
    expect(sql).toContain('or old.numero_siniestro is distinct from new.numero_siniestro')
    expect(sql).toContain('or old.denuncia is distinct from new.denuncia')
    expect(sql).toContain('or old.productor_nombre is distinct from new.productor_nombre')
    expect(sql).toContain('or old.productor_telefono is distinct from new.productor_telefono')
    expect(sql).toContain('or old.presupuesto_monto is distinct from new.presupuesto_monto')
    expect(sql).toContain('or old.presupuesto_observaciones is distinct from new.presupuesto_observaciones')
    expect(sql).toContain('or old.created_at is distinct from new.created_at')
    expect(sql).toContain('or old.created_by is distinct from new.created_by')
    expect(sql).toContain('No se pueden cambiar campos de identidad, creación, canal o presupuesto inicial')
  })

  it('restringe actualizaciones sin cambio de estado a solo campos permitidos en borrador', () => {
    const sql = migrationSql()
    expect(sql).toContain("array['danos_zonas', 'inspeccion_guardada_at']")
    expect(sql).toMatch(/if cambios_sin_estado and old\.estado <> 'borrador' then/i)
    expect(sql).toContain('Una actualización sin transición solo puede cambiar danos_zonas e inspeccion_guardada_at en borrador')
    expect(sql).toContain("array['updated_at', 'estado_changed_at']")
  })

  it('limita cada transición a sus campos propios', () => {
    const sql = migrationSql()
    expect(sql).toContain("campos_permitidos := array['estado']")
    expect(sql).toContain("array['estado', 'presupuesto_respuesta']")
    expect(sql).toContain("array['estado', 'presupuesto_respuesta', 'modalidad_contacto', 'seguimiento_observaciones']")
    expect(sql).toContain("array['estado', 'turno_fecha']")
    expect(sql).toContain("array['estado', 'orden_ingreso_numero', 'ingresado_at']")
    expect(sql).toContain('La transición intenta cambiar campos no permitidos')
  })

  it('valida todas las actualizaciones y mantiene bypass de mantenimiento', () => {
    const sql = migrationSql()
    expect(sql).toMatch(/create trigger casos_validar_transicion\s+before update on public\.casos/i)
    expect(sql).not.toMatch(/before update of estado/i)
    expect(sql).toContain("session_user in ('postgres', 'supabase_admin')")
    expect(sql).toContain("auth.role() = 'service_role'")
  })

  it('confirma que no se crea policy UPDATE para taller', () => {
    const sql = migrationSql()
    // Verificar que no existe ninguna policy de UPDATE para el rol taller
    expect(sql).not.toMatch(/for update.*public\.current_user_role\(\)\s*=\s*["']taller["']/s)
  })

  it('el constraint particular no admite estados posteriores a Fase 3', () => {
    const sql = migrationSql()
    const channelConstraint = sql.slice(
      sql.indexOf('add constraint casos_datos_por_canal_check'),
      sql.indexOf('validate constraint casos_datos_por_canal_check')
    )
    expect(channelConstraint).not.toMatch(/'(?:esperando repuesto|en reparación|listo para firma|firmado|facturado|cobrado|reclamo a la compañía)'/)
  })
})