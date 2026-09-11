-- Migración 0010: Reforzar inmutabilidad de casos y evitar bypass en sesiones autenticadas
-- Asegura que las sesiones con rol 'authenticated' (incluso ejecutadas bajo connection pooling o tests)
-- no omitan las guardas de inmutabilidad de identidad ni las restricciones sin transición.

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
  -- Bypass para superusuarios / service_role solo si NO es una sesión autenticada
  if (session_user in ('postgres', 'supabase_admin') and coalesce(auth.role(), '') <> 'authenticated')
      or auth.role() = 'service_role' then
    return new;
  end if;

  -- 1. Guarda estricta: inmutabilidad de identidad, creación, canal o presupuesto inicial
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

  -- 2. Guarda estricta: actualizaciones sin transición de estado
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

  -- 3. Grafo de transiciones válidas de casos
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

  -- 4. Precondiciones operativas por estado
  if new.estado = 'enviado a la aseguradora' then
    if not (old.danos_zonas is not null and old.inspeccion_guardada_at is not null) then
      raise exception 'Inspección debe estar guardada antes de marcar enviado' using errcode = '23514';
    end if;
  elsif old.estado = 'ingresado' and new.estado = 'en reparación' then
    if new.reparacion_iniciada_at is null then
      raise exception 'Al iniciar reparación debe registrar reparacion_iniciada_at' using errcode = '23514';
    end if;
  elsif old.estado = 'en reparación' and new.estado = 'esperando repuesto' then
    if new.repuesto_pendiente is null or trim(new.repuesto_pendiente) = '' then
      raise exception 'Al esperar repuesto debe detallar repuesto_pendiente' using errcode = '23514';
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

  -- 5. Matriz de Autorización por transición exacta
  if old.estado = 'firmado' and new.estado = 'facturado' then
    rol_autorizado := actor_role = 'dueno';
  elsif (old.estado = 'facturado' or old.estado = 'reclamo a la compañía') and new.estado = 'cobrado' then
    rol_autorizado := actor_role = 'dueno';
  elsif old.estado = 'facturado' and new.estado = 'reclamo a la compañía' then
    rol_autorizado := actor_role in ('dueno', 'recepcion');
  elsif old.estado = 'reclamo a la compañía' and new.estado = 'facturado' then
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
