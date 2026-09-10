-- Migración 0007: Correcciones de auditoría para Facturación, Cobros y Transiciones de Estado
-- Corrige incompatibilidad de trigger updated_at en caso_facturacion
-- Restablece guardas de inmutabilidad e integridad de Fase 4/5 en validar_transicion_caso
-- Corrige autorización de recepción al resolver reclamo de compañía
-- Agrega RPCs transaccionales atómicas para facturación y cobranza

-- 1. Helper genérico de updated_at para tablas auxiliares sin columna estado
create or replace function public.set_row_updated_at()
returns trigger
language plpgsql
security definer
set search_path = public, pg_temp
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- 2. Reemplazar trigger incompatible en caso_facturacion
drop trigger if exists caso_facturacion_updated_at on public.caso_facturacion;

create trigger caso_facturacion_updated_at
  before update on public.caso_facturacion
  for each row execute function public.set_row_updated_at();

-- 3. Reconstruir validar_transicion_caso() con todas las guardas estrictas
create or replace function public.validar_transicion_caso()
returns trigger
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  actor_role text;
  transicion_valida boolean := false;
  rol_autorizado boolean := false;
  cambios_sin_estado boolean := false;
  campos_permitidos text[] := array[]::text[];
begin
  -- Bypass para superusuarios / service_role
  if session_user in ('postgres', 'supabase_admin')
      or auth.role() = 'service_role' then
    return new;
  end if;

  -- Guarda estricta: inmutabilidad de identidad, creación, canal o presupuesto inicial
  if old.id is distinct from new.id
     or old.canal is distinct from new.canal
     or old.patente is distinct from new.patente
     or old.marca is distinct from new.marca
     or old.modelo is distinct from new.modelo
     or old.color is distinct from new.color
     or old.cliente_nombre is distinct from new.cliente_nombre
     or old.cliente_telefono is distinct from new.cliente_telefono
     or old.aseguradora is distinct from new.aseguradora
     or old.numero_siniestro is distinct from new.numero_siniestro
     or old.denuncia is distinct from new.denuncia
     or old.productor_nombre is distinct from new.productor_nombre
     or old.productor_telefono is distinct from new.productor_telefono
     or old.presupuesto_monto is distinct from new.presupuesto_monto
     or old.presupuesto_observaciones is distinct from new.presupuesto_observaciones
     or old.created_at is distinct from new.created_at
     or old.created_by is distinct from new.created_by then
    raise exception
      'No se pueden cambiar campos de identidad, creación, canal o presupuesto inicial'
      using errcode = '23514';
  end if;

  -- Guarda estricta: actualizaciones sin transición de estado
  if new.estado is not distinct from old.estado then
    campos_permitidos := array['danos_zonas', 'inspeccion_guardada_at'];
    if (to_jsonb(old) - (campos_permitidos || array['updated_at', 'estado_changed_at']))
        is distinct from
       (to_jsonb(new) - (campos_permitidos || array['updated_at', 'estado_changed_at'])) then
      raise exception
        'Una actualización sin transición solo puede cambiar danos_zonas e inspeccion_guardada_at en borrador'
        using errcode = '23514';
    end if;

    cambios_sin_estado :=
      old.danos_zonas is distinct from new.danos_zonas
      or old.inspeccion_guardada_at is distinct from new.inspeccion_guardada_at;

    if cambios_sin_estado and old.estado <> 'borrador' then
      raise exception
        'Una actualización sin transición solo puede cambiar danos_zonas e inspeccion_guardada_at en borrador'
        using errcode = '23514';
    end if;

    return new;
  end if;

  actor_role := public.current_user_role();

  -- Grafo de transiciones válidas de casos
  transicion_valida :=
    (old.estado is null and new.estado = 'borrador')
    or
    (
      (old.canal = 'seguro' and
       (
         (old.estado = 'borrador' and new.estado = 'enviado a la aseguradora')
         or (old.estado = 'enviado a la aseguradora' and new.estado = 'aprobado')
         or (old.estado = 'aprobado' and new.estado = 'turno coordinado')
         or (old.estado = 'turno coordinado' and new.estado = 'ingresado')
         or (old.estado = 'facturado' and new.estado = 'reclamo a la compañía')
         or (old.estado = 'reclamo a la compañía' and new.estado = 'facturado')
         or (old.estado = 'reclamo a la compañía' and new.estado = 'cobrado')
       )
      )
      or
      (old.canal = 'particular' and
       (
         (old.estado = 'borrador' and new.estado = 'aprobado')
         or (old.estado = 'borrador' and new.estado = 'cancelado')
         or (old.estado = 'aprobado' and new.estado = 'turno coordinado')
         or (old.estado = 'turno coordinado' and new.estado = 'ingresado')
       )
      )
      or (old.estado = 'ingresado' and new.estado = 'en reparación')
      or (old.estado = 'en reparación' and new.estado = 'esperando repuesto')
      or (old.estado = 'esperando repuesto' and new.estado = 'en reparación')
      or (old.estado = 'en reparación' and new.estado = 'listo para firma')
      or (old.estado = 'listo para firma' and new.estado = 'firmado')
      or (old.estado = 'firmado' and new.estado = 'facturado')
      or (old.estado = 'facturado' and new.estado = 'cobrado')
    );

  if not transicion_valida then
    raise exception
      'Transición de caso inválida: % -> %', old.estado, new.estado
      using errcode = '23514';
  end if;

  -- Campos permitidos por transición
  campos_permitidos := array['estado'];
  if old.canal = 'particular'
      and old.estado = 'borrador'
      and new.estado = 'aprobado' then
    campos_permitidos := array['estado', 'presupuesto_respuesta'];
  elsif old.canal = 'particular'
      and old.estado = 'borrador'
      and new.estado = 'cancelado' then
    campos_permitidos := array['estado', 'presupuesto_respuesta', 'modalidad_contacto', 'seguimiento_observaciones'];
  elsif new.estado = 'turno coordinado' then
    campos_permitidos := array['estado', 'turno_fecha'];
  elsif new.estado = 'ingresado' then
    campos_permitidos := array['estado', 'orden_ingreso_numero', 'ingresado_at'];
  elsif old.estado = 'ingresado' and new.estado = 'en reparación' then
    campos_permitidos := array['estado', 'reparacion_iniciada_at'];
  elsif old.estado = 'en reparación' and new.estado = 'esperando repuesto' then
    campos_permitidos := array['estado', 'repuesto_pendiente'];
  elsif old.estado = 'esperando repuesto' and new.estado = 'en reparación' then
    campos_permitidos := array['estado', 'repuesto_pendiente'];
  elsif old.estado = 'en reparación' and new.estado = 'listo para firma' then
    campos_permitidos := array['estado'];
  elsif old.estado = 'listo para firma' and new.estado = 'firmado' then
    campos_permitidos := array['estado'];
  elsif old.estado = 'firmado' and new.estado = 'facturado' then
    campos_permitidos := array['estado', 'facturado_at'];
  elsif old.estado = 'facturado' and new.estado = 'cobrado' then
    campos_permitidos := array['estado', 'cobrado_at'];
  elsif old.estado = 'facturado' and new.estado = 'reclamo a la compañía' then
    campos_permitidos := array['estado', 'motivo_reclamo'];
  elsif old.estado = 'reclamo a la compañía' and new.estado = 'cobrado' then
    campos_permitidos := array['estado', 'cobrado_at'];
  elsif old.estado = 'reclamo a la compañía' and new.estado = 'facturado' then
    campos_permitidos := array['estado', 'motivo_reclamo'];
  end if;

  if (to_jsonb(old) - (campos_permitidos || array['updated_at', 'estado_changed_at']))
      is distinct from
     (to_jsonb(new) - (campos_permitidos || array['updated_at', 'estado_changed_at'])) then
    raise exception
      'La transición intenta cambiar campos no permitidos'
      using errcode = '23514';
  end if;

  -- Timestamps automáticos gestionados por el servidor
  if old.estado = 'en reparación' and new.estado = 'listo para firma' then
    new.reparacion_lista_at := now();
  elsif old.estado = 'listo para firma' and new.estado = 'firmado' then
    new.firmado_at := now();
  elsif old.estado = 'firmado' and new.estado = 'facturado' then
    new.facturado_at := coalesce(new.facturado_at, now());
  elsif (old.estado = 'facturado' or old.estado = 'reclamo a la compañía') and new.estado = 'cobrado' then
    new.cobrado_at := coalesce(new.cobrado_at, now());
  end if;

  -- Precondiciones de negocio por estado
  if old.estado = 'borrador' and new.estado is distinct from old.estado then
    if new.inspeccion_guardada_at is null then
      raise exception 'Al salir de borrador requiere inspeccion_guardada_at' using errcode = '23514';
    end if;
    if not public.caso_tiene_fotos_inspeccion(old.id) then
      raise exception 'El caso requiere las cuatro fotos de inspección al salir de borrador' using errcode = '23514';
    end if;
  end if;

  if new.estado = 'turno coordinado' and old.estado is distinct from new.estado then
    if new.turno_fecha is null then
      raise exception 'Al coordinar requiere turno_fecha' using errcode = '23514';
    end if;
  end if;

  if new.estado = 'ingresado' and old.estado is distinct from new.estado then
    if new.orden_ingreso_numero is null or trim(new.orden_ingreso_numero) = '' then
      raise exception 'Al ingresar requiere orden_ingreso_numero no vacía' using errcode = '23514';
    end if;
    if new.ingresado_at is null then
      raise exception 'Al ingresar requiere ingresado_at' using errcode = '23514';
    end if;
    if not public.caso_tiene_fotos_ingreso(old.id) then
      raise exception 'Al ingresar requiere las cuatro fotos de ingreso' using errcode = '23514';
    end if;
  end if;

  if old.estado = 'ingresado' and new.estado = 'en reparación' then
    if new.reparacion_iniciada_at is null then
      raise exception 'Al iniciar reparación requiere reparacion_iniciada_at' using errcode = '23514';
    end if;
  elsif old.estado = 'en reparación' and new.estado = 'esperando repuesto' then
    if new.repuesto_pendiente is null or trim(new.repuesto_pendiente) = '' then
      raise exception 'Al esperar repuesto requiere repuesto_pendiente no vacío' using errcode = '23514';
    end if;
  elsif old.estado = 'esperando repuesto' and new.estado = 'en reparación' then
    if new.repuesto_pendiente is not null then
      raise exception 'Al reanudar reparación debe limpiar repuesto_pendiente' using errcode = '23514';
    end if;
  elsif old.estado = 'en reparación' and new.estado = 'listo para firma' then
    if exists (
      select 1 from public.reparacion_danos d
      where d.caso_id = old.id and not d.reparado
    ) or not public.caso_tiene_fotos_finales(old.id) then
      raise exception 'La reparación requiere todos los daños reparados y cuatro fotos finales' using errcode = '23514';
    end if;
  elsif old.estado = 'listo para firma' and new.estado = 'firmado' then
    if not public.caso_tiene_orden_firmada(old.id) then
      raise exception 'El firmado requiere orden-firmada.webp' using errcode = '23514';
    end if;
  elsif old.estado = 'firmado' and new.estado = 'facturado' then
    if not exists (
      select 1 from public.caso_facturacion f
      where f.caso_id = old.id
        and f.monto_facturado > 0
        and trim(f.numero_factura) <> ''
    ) then
      raise exception 'Al facturar requiere registro en caso_facturacion con monto_facturado > 0 y numero_factura' using errcode = '23514';
    end if;
  elsif (old.estado = 'facturado' or old.estado = 'reclamo a la compañía') and new.estado = 'cobrado' then
    if not exists (
      select 1 from public.caso_facturacion f
      where f.caso_id = old.id
        and f.monto_cobrado > 0
        and f.fecha_cobro is not null
    ) then
      raise exception 'Al cobrar requiere monto_cobrado > 0 y fecha_cobro' using errcode = '23514';
    end if;
  elsif old.estado = 'facturado' and new.estado = 'reclamo a la compañía' then
    if old.canal <> 'seguro' then
      raise exception 'Reclamo a la compañía solo permitido en casos de seguro' using errcode = '23514';
    end if;
    if new.motivo_reclamo is null or trim(new.motivo_reclamo) = '' then
      raise exception 'Al reclamar a la compañía requiere motivo_reclamo' using errcode = '23514';
    end if;
  end if;

  -- 4. Matriz de Autorización por transición exacta (corrige exclusividad indebida en reclamo -> facturado)
  if old.estado = 'firmado' and new.estado = 'facturado' then
    rol_autorizado := actor_role = 'dueno';
  elsif (old.estado = 'facturado' or old.estado = 'reclamo a la compañía') and new.estado = 'cobrado' then
    rol_autorizado := actor_role = 'dueno';
  elsif old.estado = 'facturado' and new.estado = 'reclamo a la compañía' then
    rol_autorizado := actor_role in ('dueno', 'recepcion');
  elsif old.estado = 'reclamo a la compañía' and new.estado = 'facturado' then
    -- Recepción Y Dueño pueden resolver el reclamo y devolverlo a facturado
    rol_autorizado := actor_role in ('dueno', 'recepcion');
  elsif old.estado in ('ingresado', 'en reparación', 'esperando repuesto', 'listo para firma') then
    rol_autorizado := actor_role in ('dueno', 'taller');
  else
    rol_autorizado := actor_role in ('dueno', 'recepcion');
  end if;

  if rol_autorizado is not true then
    raise exception
      'El rol % no puede realizar la transición % -> %',
      coalesce(actor_role, 'sin rol'), old.estado, new.estado
      using errcode = '42501';
  end if;

  return new;
end;
$$;

revoke all on function public.validar_transicion_caso()
  from public, anon, authenticated;

-- 5. RPCs atómicas para facturar y cobrar
create or replace function public.facturar_caso_atomic(
  p_caso_id uuid,
  p_monto_facturado numeric,
  p_numero_factura text,
  p_fecha_factura date default current_date,
  p_notas_cobranza text default null
)
returns public.casos
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_caso public.casos;
  v_role text;
begin
  v_role := public.current_user_role();
  if v_role <> 'dueno' then
    raise exception 'Solo dueño puede facturar un caso' using errcode = '42501';
  end if;

  if p_monto_facturado is null or p_monto_facturado <= 0 then
    raise exception 'Para facturar, el monto facturado debe ser mayor a 0' using errcode = '23514';
  end if;

  if p_numero_factura is null or trim(p_numero_factura) = '' then
    raise exception 'Para facturar, el número de factura no puede estar vacío' using errcode = '23514';
  end if;

  -- Bloquear caso para concurrencia
  select * into v_caso
  from public.casos
  where id = p_caso_id
  for update;

  if not found then
    raise exception 'Caso no encontrado' using errcode = '23503';
  end if;

  if v_caso.estado <> 'firmado' then
    raise exception 'El caso debe estar en estado firmado para facturar (estado actual: %)', v_caso.estado using errcode = '23514';
  end if;

  -- Upsert caso_facturacion
  insert into public.caso_facturacion (
    caso_id,
    monto_facturado,
    numero_factura,
    fecha_factura,
    notas_cobranza
  )
  values (
    p_caso_id,
    p_monto_facturado,
    trim(p_numero_factura),
    coalesce(p_fecha_factura, current_date),
    p_notas_cobranza
  )
  on conflict (caso_id) do update set
    monto_facturado = excluded.monto_facturado,
    numero_factura = excluded.numero_factura,
    fecha_factura = excluded.fecha_factura,
    notas_cobranza = coalesce(excluded.notas_cobranza, public.caso_facturacion.notas_cobranza),
    updated_at = now();

  -- Actualizar casos (dispara validar_transicion_caso)
  update public.casos
  set estado = 'facturado',
      facturado_at = now()
  where id = p_caso_id
  returning * into v_caso;

  return v_caso;
end;
$$;

create or replace function public.cobrar_caso_atomic(
  p_caso_id uuid,
  p_monto_cobrado numeric,
  p_fecha_cobro date,
  p_metodo_pago text,
  p_notas_cobranza text default null
)
returns public.casos
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_caso public.casos;
  v_role text;
begin
  v_role := public.current_user_role();
  if v_role <> 'dueno' then
    raise exception 'Solo dueño puede registrar cobro' using errcode = '42501';
  end if;

  if p_monto_cobrado is null or p_monto_cobrado <= 0 then
    raise exception 'Para marcar como cobrado, el monto cobrado debe ser mayor a 0' using errcode = '23514';
  end if;

  if p_fecha_cobro is null then
    raise exception 'Para marcar como cobrado, debe indicar la fecha de cobro' using errcode = '23514';
  end if;

  if p_metodo_pago is null or p_metodo_pago not in ('transferencia', 'efectivo', 'cheque', 'tarjeta_debito', 'tarjeta_credito', 'otro') then
    raise exception 'Método de pago inválido' using errcode = '23514';
  end if;

  -- Bloquear caso para concurrencia
  select * into v_caso
  from public.casos
  where id = p_caso_id
  for update;

  if not found then
    raise exception 'Caso no encontrado' using errcode = '23503';
  end if;

  if v_caso.estado not in ('facturado', 'reclamo a la compañía') then
    raise exception 'El caso debe estar facturado o en reclamo para cobrar (estado actual: %)', v_caso.estado using errcode = '23514';
  end if;

  -- Actualizar o crear registro de caso_facturacion
  insert into public.caso_facturacion (
    caso_id,
    monto_facturado,
    monto_cobrado,
    numero_factura,
    fecha_cobro,
    metodo_pago,
    notas_cobranza
  )
  values (
    p_caso_id,
    0,
    p_monto_cobrado,
    'S/N',
    p_fecha_cobro,
    p_metodo_pago,
    p_notas_cobranza
  )
  on conflict (caso_id) do update set
    monto_cobrado = excluded.monto_cobrado,
    fecha_cobro = excluded.fecha_cobro,
    metodo_pago = excluded.metodo_pago,
    notas_cobranza = coalesce(excluded.notas_cobranza, public.caso_facturacion.notas_cobranza),
    updated_at = now();

  -- Actualizar casos (dispara validar_transicion_caso)
  update public.casos
  set estado = 'cobrado',
      cobrado_at = now()
  where id = p_caso_id
  returning * into v_caso;

  return v_caso;
end;
$$;

grant execute on function public.facturar_caso_atomic to authenticated;
grant execute on function public.cobrar_caso_atomic to authenticated;
