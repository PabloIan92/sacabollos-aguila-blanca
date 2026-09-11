import { describe, expect, it } from 'vitest'
import migration from '../../../supabase/migrations/0004_casos_particulares_y_transiciones.sql?raw'
import repairMigration from '../../../supabase/migrations/0005_reparacion_y_stock.sql?raw'
import billingMigration from '../../../supabase/migrations/0006_facturacion_y_cobros.sql?raw'
import fixBillingMigration from '../../../supabase/migrations/0007_correccion_facturacion_y_transiciones.sql?raw'
import crmMigration from '../../../supabase/migrations/0008_crm_y_equipo.sql?raw'
import updateInvoiceMigration from '../../../supabase/migrations/0009_actualizacion_factura_y_cobro_existente.sql?raw'
import immutableTriggerMigration from '../../../supabase/migrations/0010_reforzar_inmutabilidad_trigger.sql?raw'

function migrationSql() {
  return migration.replace(/\r\n/g, '\n')
}

function updateInvoiceSql() {
  return updateInvoiceMigration.replace(/\r\n/g, '\n')
}

function immutableTriggerSql() {
  return immutableTriggerMigration.replace(/\r\n/g, '\n')
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

describe('migración 0005 de reparación y stock', () => {
  function repairSql() {
    return repairMigration.replace(/\r\n/g, '\n')
  }

  it('crea los daños normalizados y el stock con sus restricciones y RLS', () => {
    const sql = repairSql()

    expect(sql).toContain('create table public.reparacion_danos')
    expect(sql).toContain('caso_id uuid not null references public.casos(id) on delete cascade')
    expect(sql).toContain("check (trim(zona) <> '')")
    expect(sql).toContain('check (x between 0 and 1)')
    expect(sql).toContain('check (y between 0 and 1)')
    expect(sql).toContain('reparado boolean not null default false')
    expect(sql).toContain('origen_inspeccion boolean not null default false')
    expect(sql).toContain('alter table public.reparacion_danos enable row level security')

    expect(sql).toContain('create table public.stock_items')
    expect(sql).toContain("check (trim(nombre) <> '')")
    expect(sql).toContain('cantidad numeric not null default 0 check (cantidad >= 0)')
    expect(sql).toContain("check (trim(unidad) <> '')")
    expect(sql).toContain('updated_by uuid not null references auth.users(id)')
    expect(sql).toContain('alter table public.stock_items enable row level security')
    expect(sql).toContain("public.current_user_role() in ('dueno', 'recepcion', 'taller')")
  })

  it('agrega las columnas de reparación al caso y el RPC atómico de inicio', () => {
    const sql = repairSql()

    expect(sql).toContain('add column repuesto_pendiente text')
    expect(sql).toContain('add column reparacion_iniciada_at timestamptz')
    expect(sql).toContain('add column reparacion_lista_at timestamptz')
    expect(sql).toContain('add column firmado_at timestamptz')
    expect(sql).toContain('create function public.iniciar_reparacion(p_caso_id uuid)')
    expect(sql).toContain('for update')
    expect(sql).toContain('unnest(coalesce(v_caso.danos_zonas, array[]::text[])) with ordinality')
    expect(sql).toContain('on conflict (caso_id, zona) do nothing')
    expect(sql).toContain("estado = 'en reparación'")
    expect(sql).toContain('reparacion_iniciada_at = now()')
    expect(sql).toContain('grant execute on function public.iniciar_reparacion(uuid) to authenticated')
  })

  it('preserva el grafo anterior y agrega las transiciones exactas de reparación', () => {
    const sql = repairSql()

    expect(sql).toContain("old.estado = 'borrador' and new.estado = 'enviado a la aseguradora'")
    expect(sql).toContain("old.estado = 'enviado a la aseguradora' and new.estado = 'aprobado'")
    expect(sql).toContain("old.estado = 'aprobado' and new.estado = 'turno coordinado'")
    expect(sql).toContain("old.estado = 'turno coordinado' and new.estado = 'ingresado'")
    expect(sql).toContain("old.estado = 'borrador' and new.estado = 'cancelado'")
    expect(sql).toContain("old.estado = 'ingresado' and new.estado = 'en reparación'")
    expect(sql).toContain("old.estado = 'en reparación' and new.estado = 'esperando repuesto'")
    expect(sql).toContain("old.estado = 'esperando repuesto' and new.estado = 'en reparación'")
    expect(sql).toContain("old.estado = 'en reparación' and new.estado = 'listo para firma'")
    expect(sql).toContain("old.estado = 'listo para firma' and new.estado = 'firmado'")
    expect(sql).toContain("actor_role in ('dueno', 'taller')")
    expect(sql).toContain('Al iniciar reparación requiere reparacion_iniciada_at')
    expect(sql).toContain('Al esperar repuesto requiere repuesto_pendiente no vacío')
    expect(sql).toContain('Al reanudar reparación debe limpiar repuesto_pendiente')
    expect(sql).toContain('La reparación requiere todos los daños reparados y cuatro fotos finales')
    expect(sql).toContain('El firmado requiere orden-firmada.webp')
  })

  it('limita la escritura de taller y protege daños, fotos finales y helpers', () => {
    const sql = repairSql()

    expect(sql).toContain('create policy casos_update_taller_reparacion')
    expect(sql).toContain("estado in ('ingresado', 'en reparación', 'esperando repuesto', 'listo para firma')")
    expect(sql).toContain('create policy reparacion_danos_taller_dueno_crud')
    expect(sql).toContain('create policy reparacion_danos_recepcion_select')
    expect(sql).toContain('create function public.caso_tiene_fotos_finales(caso_id uuid)')
    expect(sql).toContain('create function public.caso_tiene_orden_firmada(caso_id uuid)')
    expect(sql).toContain('create policy casos_fotos_insert_reparacion')
    expect(sql).toContain('create policy casos_fotos_update_reparacion')
    for (const filename of [
      'final-frente.webp',
      'final-atras.webp',
      'final-lateral-izquierdo.webp',
      'final-lateral-derecho.webp',
      'orden-firmada.webp',
    ]) {
      expect(sql).toContain(`'${filename}'`)
    }
    expect(sql).toContain('revoke all on function public.validar_transicion_caso()')
    expect(sql).toContain('revoke all on function public.caso_tiene_fotos_finales(uuid)')
    expect(sql).toContain('revoke all on function public.caso_tiene_orden_firmada(uuid)')
  })

  it('estampa los cierres en PostgreSQL y no acepta fechas del cliente', () => {
    const sql = repairSql()
    const trigger = sql.slice(
      sql.indexOf('create or replace function public.validar_transicion_caso()'),
      sql.indexOf('create policy casos_update_taller_reparacion')
    )

    expect(trigger).toContain("if old.estado = 'en reparación' and new.estado = 'listo para firma' then")
    expect(trigger).toContain('new.reparacion_lista_at := now();')
    expect(trigger).toContain("elsif old.estado = 'listo para firma' and new.estado = 'firmado' then")
    expect(trigger).toContain('new.firmado_at := now();')
    expect(trigger).not.toContain("array['estado', 'reparacion_lista_at']")
    expect(trigger).not.toContain("array['estado', 'firmado_at']")
    expect(trigger.indexOf('new.reparacion_lista_at := now();')).toBeGreaterThan(
      trigger.indexOf('La transición intenta cambiar campos no permitidos')
    )
  })

  it('exige paths de storage de exactamente tres segmentos', () => {
    const sql = repairSql()
    const finalPhotos = sql.slice(
      sql.indexOf('create function public.caso_tiene_fotos_finales'),
      sql.indexOf('create function public.caso_tiene_orden_firmada')
    )
    const signedOrder = sql.slice(
      sql.indexOf('create function public.caso_tiene_orden_firmada'),
      sql.indexOf('revoke all on function public.caso_tiene_fotos_finales')
    )
    const storagePolicies = sql.slice(sql.indexOf('create policy casos_fotos_insert_reparacion'))

    expect(finalPhotos).toContain("array_length(string_to_array(o.name, '/'), 1) = 3")
    expect(signedOrder).toContain("array_length(string_to_array(o.name, '/'), 1) = 3")
    expect(storagePolicies).toContain("array_length(string_to_array(name, '/'), 1) = 3")
  })

  it('rechaza roles nulos y serializa las escrituras de daños con el caso', () => {
    const sql = repairSql()

    expect(sql).toContain('if rol_autorizado is not true then')
    expect(sql).toContain("if (public.current_user_role() in ('dueno', 'taller')) is not true then")
    expect(sql).toContain('create function public.validar_escritura_reparacion_dano()')
    expect(sql).toContain('create trigger reparacion_danos_validar_escritura')
    expect(sql).toContain('before insert or update or delete on public.reparacion_danos')
    expect(sql).toContain('where id = v_caso_id\n  for update;')
  })

  it('permite sólo el DELETE cascado, inmoviliza caso_id y coordina el cierre sólo por caso', () => {
    const sql = repairSql()
    const damageGuard = sql.slice(
      sql.indexOf('create function public.validar_escritura_reparacion_dano()'),
      sql.indexOf('create policy reparacion_danos_taller_dueno_crud')
    )
    const validationStart = sql.indexOf(
      "if old.estado = 'ingresado' and new.estado = 'en reparación' then\n    if new.reparacion_iniciada_at"
    )
    const repairCloseStart = sql.indexOf(
      "elsif old.estado = 'en reparación' and new.estado = 'listo para firma' then",
      validationStart
    )
    const repairClose = sql.slice(
      repairCloseStart,
      sql.indexOf("elsif old.estado = 'listo para firma' and new.estado = 'firmado' then", repairCloseStart)
    )

    expect(damageGuard).toContain("if tg_op = 'UPDATE' and new.caso_id is distinct from old.caso_id then")
    expect(damageGuard).toContain("raise exception 'No se puede cambiar caso_id de un daño de reparación'")
    expect(damageGuard).toMatch(/if not found then[\s\S]*?if tg_op = 'DELETE' then\s+return old;/)
    expect(damageGuard).toContain("if (v_estado in ('ingresado', 'en reparación', 'esperando repuesto')) is not true then")
    expect(repairClose).toContain('El lock de caso es el único coordinador')
    expect(repairClose).not.toContain('from public.reparacion_danos d\n    where d.caso_id = old.id\n    for update;')
  })
})

describe('migración 0006 de facturación y cobros', () => {
  function billingSql() {
    return billingMigration.replace(/\r\n/g, '\n')
  }

  it('crea la tabla caso_facturacion con RLS exclusivo para dueño', () => {
    const sql = billingSql()

    expect(sql).toContain('create table public.caso_facturacion')
    expect(sql).toContain('caso_id uuid primary key references public.casos(id) on delete cascade')
    expect(sql).toContain('monto_facturado numeric(14, 2) not null check (monto_facturado >= 0)')
    expect(sql).toContain('monto_cobrado numeric(14, 2) not null default 0 check (monto_cobrado >= 0)')
    expect(sql).toContain("check (trim(numero_factura) <> '')")
    expect(sql).toContain('alter table public.caso_facturacion enable row level security')
    expect(sql).toContain('create policy caso_facturacion_dueno_all')
    expect(sql).toContain("public.current_user_role() = 'dueno'")
    expect(sql).not.toContain('create policy caso_facturacion_recepcion')
    expect(sql).not.toContain('create policy caso_facturacion_taller')
  })

  it('agrega columnas de facturación y reclamo a casos', () => {
    const sql = billingSql()

    expect(sql).toContain('add column facturado_at timestamptz')
    expect(sql).toContain('add column cobrado_at timestamptz')
    expect(sql).toContain('add column motivo_reclamo text')
  })

  it('actualiza el check constraint de canal para permitir facturado y cobrado en particulares', () => {
    const sql = billingSql()

    expect(sql).toContain('drop constraint casos_datos_por_canal_check')
    expect(sql).toContain("'listo para firma', 'firmado', 'facturado', 'cobrado'")
  })

  it('valida las transiciones firmado -> facturado -> cobrado y reclamo a compañía', () => {
    const sql = billingSql()

    expect(sql).toContain("old.estado = 'firmado' and new.estado = 'facturado'")
    expect(sql).toContain("old.estado = 'facturado' and new.estado = 'cobrado'")
    expect(sql).toContain("old.estado = 'facturado' and new.estado = 'reclamo a la compañía'")
    expect(sql).toContain("old.estado = 'reclamo a la compañía' and new.estado = 'cobrado'")
    expect(sql).toContain("old.estado = 'reclamo a la compañía' and new.estado = 'facturado'")
    expect(sql).toContain('Solo dueño puede facturar')
    expect(sql).toContain('Solo dueño puede cobrar')
    expect(sql).toContain('Reclamo a la compañía solo permitido en casos de seguro')
    expect(sql).toContain('Al reclamar a la compañía requiere motivo_reclamo')
  })
})

describe('migración 0007 de correcciones de facturación y transiciones', () => {
  function fixSql() {
    return fixBillingMigration.replace(/\r\n/g, '\n')
  }

  it('instala helper set_row_updated_at y reemplaza el trigger de caso_facturacion', () => {
    const sql = fixSql()
    expect(sql).toContain('create or replace function public.set_row_updated_at()')
    expect(sql).toContain('drop trigger if exists caso_facturacion_updated_at on public.caso_facturacion')
    expect(sql).toContain('create trigger caso_facturacion_updated_at')
    expect(sql).toContain('before update on public.caso_facturacion')
    expect(sql).toContain('execute function public.set_row_updated_at()')
    expect(sql).not.toContain('execute function public.set_updated_at()')
  })

  it('restablece las guardas de inmutabilidad y de actualizaciones sin transición', () => {
    const sql = fixSql()
    expect(sql).toContain('No se pueden cambiar campos de identidad, creación, canal o presupuesto inicial')
    expect(sql).toContain('Una actualización sin transición solo puede cambiar danos_zonas e inspeccion_guardada_at en borrador')
    expect(sql).toContain('La transición intenta cambiar campos no permitidos')
  })

  it('permite a recepcion y dueno resolver reclamo volviendo a facturado', () => {
    const sql = fixSql()
    expect(sql).toContain("elsif old.estado = 'reclamo a la compañía' and new.estado = 'facturado' then")
    expect(sql).toContain("rol_autorizado := actor_role in ('dueno', 'recepcion')")
  })

  it('crea RPCs atómicas facturar_caso_atomic y cobrar_caso_atomic con bloqueo y permisos', () => {
    const sql = fixSql()
    expect(sql).toContain('create or replace function public.facturar_caso_atomic')
    expect(sql).toContain('create or replace function public.cobrar_caso_atomic')
    expect(sql).toContain('for update')
    expect(sql).toContain('grant execute on function public.facturar_caso_atomic to authenticated')
    expect(sql).toContain('grant execute on function public.cobrar_caso_atomic to authenticated')
  })
})

describe('migración 0008 de CRM y equipo', () => {
  function crmSql() {
    return crmMigration.replace(/\r\n/g, '\n')
  }

  it('crea las tablas clientes, aseguradoras y productores con sus restricciones y triggers con set_row_updated_at', () => {
    const sql = crmSql()

    expect(sql).toContain('create table public.clientes')
    expect(sql).toContain("check (trim(nombre) <> '')")
    expect(sql).toContain('create trigger clientes_updated_at')
    expect(sql).toContain('before update on public.clientes\n  for each row execute function public.set_row_updated_at()')

    expect(sql).toContain('create table public.aseguradoras')
    expect(sql).toContain('nombre text not null unique check (trim(nombre) <> \'\')')
    expect(sql).toContain('activa boolean not null default true')
    expect(sql).toContain('create trigger aseguradoras_updated_at')
    expect(sql).toContain('before update on public.aseguradoras\n  for each row execute function public.set_row_updated_at()')

    expect(sql).toContain('create table public.productores')
    expect(sql).toContain('create trigger productores_updated_at')
    expect(sql).toContain('before update on public.productores\n  for each row execute function public.set_row_updated_at()')
  })

  it('configura RLS correctamente para dueño, recepción y taller', () => {
    const sql = crmSql()

    expect(sql).toContain('alter table public.clientes enable row level security')
    expect(sql).toContain('alter table public.aseguradoras enable row level security')
    expect(sql).toContain('alter table public.productores enable row level security')

    expect(sql).toContain('create policy clientes_dueno_recepcion_all')
    expect(sql).toContain("using (public.current_user_role() in ('dueno', 'recepcion'))")
    expect(sql).toContain('create policy clientes_taller_select')
    expect(sql).toContain("using (public.current_user_role() = 'taller')")

    expect(sql).toContain('create policy aseguradoras_dueno_recepcion_all')
    expect(sql).toContain('create policy aseguradoras_taller_select')

    expect(sql).toContain('create policy productores_dueno_recepcion_all')
    expect(sql).not.toContain('create policy productores_taller_select')
  })

  it('incluye las semillas iniciales de aseguradoras históricas', () => {
    const sql = crmSql()

    expect(sql).toContain('insert into public.aseguradoras')
    expect(sql).toContain('San Cristóbal')
    expect(sql).toContain('Federación Patronal')
    expect(sql).toContain('Mercantil Andina')
    expect(sql).toContain('Triunfo Seguros')
    expect(sql).toContain('Sancor Seguros')
    expect(sql).toContain('La Segunda')
    expect(sql).toContain('on conflict (nombre) do nothing')
  })
})

describe('migración 0009 de actualización de factura y cobro existente', () => {
  it('permite facturar_caso_atomic sobre casos en estado firmado y facturado', () => {
    const sql = updateInvoiceSql()
    expect(sql).toContain('create or replace function public.facturar_caso_atomic')
    expect(sql).toContain("if v_caso.estado not in ('firmado', 'facturado') then")
    expect(sql).toContain('on conflict (caso_id) do update set')
    expect(sql).toContain("if v_caso.estado = 'firmado' then")
    expect(sql).toContain("set estado = 'facturado'")
  })

  it('permite cobrar_caso_atomic sobre casos en estado facturado, reclamo o cobrado', () => {
    const sql = updateInvoiceSql()
    expect(sql).toContain('create or replace function public.cobrar_caso_atomic')
    expect(sql).toContain("if v_caso.estado not in ('facturado', 'reclamo a la compañía', 'cobrado') then")
    expect(sql).toContain('on conflict (caso_id) do update set')
    expect(sql).toContain("if v_caso.estado in ('facturado', 'reclamo a la compañía') then")
    expect(sql).toContain("set estado = 'cobrado'")
  })
})

describe('migración 0010 de refuerzo de inmutabilidad', () => {
  it('no permite bypass de validación para sesiones autenticadas', () => {
    const sql = immutableTriggerSql()
    expect(sql).toContain('create or replace function public.validar_transicion_caso()')
    expect(sql).toContain("session_user in ('postgres', 'supabase_admin') and coalesce(auth.role(), '') <> 'authenticated'")
    expect(sql).toContain('No se pueden cambiar campos de identidad, creación, canal o presupuesto inicial')
    expect(sql).toContain('Una actualización sin transición solo puede cambiar danos_zonas e inspeccion_guardada_at en borrador')
  })
})
