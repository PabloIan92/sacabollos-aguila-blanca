-- Facturación, Cobranzas y Reclamos a Aseguradoras.

-- 1. Columnas de auditoría y reclamo en casos
alter table public.casos
  add column facturado_at timestamptz,
  add column cobrado_at timestamptz,
  add column motivo_reclamo text;

-- 2. Permitir facturado y cobrado en casos particulares aceptados
alter table public.casos
  drop constraint casos_datos_por_canal_check;

alter table public.casos
  add constraint casos_datos_por_canal_check
  check (
    (
      canal = 'seguro'
      and aseguradora is not null
      and numero_siniestro is not null
      and denuncia is not null
      and presupuesto_monto is null
      and presupuesto_respuesta is null
      and presupuesto_observaciones is null
      and modalidad_contacto is null
      and seguimiento_observaciones is null
    )
    or
    (
      canal = 'particular'
      and aseguradora is null
      and numero_siniestro is null
      and denuncia is null
      and productor_nombre is null
      and productor_telefono is null
      and presupuesto_monto is not null
      and (
        (presupuesto_respuesta = 'pendiente' and estado = 'borrador' and modalidad_contacto is null)
        or
        (presupuesto_respuesta = 'aceptado' and estado in (
          'aprobado', 'turno coordinado', 'ingresado', 'en reparación',
          'esperando repuesto', 'listo para firma', 'firmado', 'facturado', 'cobrado'
        ))
        or
        (presupuesto_respuesta = 'rechazado' and estado = 'cancelado' and modalidad_contacto is not null)
      )
    )
  );

-- 3. Tabla caso_facturacion (restringida exclusivamente a dueño por AUTH-02)
create table public.caso_facturacion (
  caso_id uuid primary key references public.casos(id) on delete cascade,
  monto_facturado numeric(14, 2) not null check (monto_facturado >= 0),
  monto_cobrado numeric(14, 2) not null default 0 check (monto_cobrado >= 0),
  numero_factura text not null check (trim(numero_factura) <> ''),
  fecha_factura date not null default current_date,
  fecha_cobro date,
  metodo_pago text check (
    metodo_pago in ('transferencia', 'efectivo', 'cheque', 'tarjeta_debito', 'tarjeta_credito', 'otro')
  ),
  notas_cobranza text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger caso_facturacion_updated_at
  before update on public.caso_facturacion
  for each row execute function public.set_updated_at();

alter table public.caso_facturacion enable row level security;

create policy caso_facturacion_dueno_all
  on public.caso_facturacion
  for all
  to authenticated
  using (public.current_user_role() = 'dueno')
  with check (public.current_user_role() = 'dueno');

-- 4. Ampliación de máquina de estados para Facturación, Cobro y Reclamos
create or replace function public.validar_transicion_caso()
returns trigger
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  actor_role text;
  rol_autorizado boolean := false;
  transicion_valida boolean := false;
  campos_permitidos text[];
begin
  if new.estado is not distinct from old.estado then
    return new;
  end if;

  actor_role := public.current_user_role();

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
    campos_permitidos := array['estado'];
  end if;

  if (to_jsonb(old) - (campos_permitidos || array['updated_at', 'estado_changed_at']))
      is distinct from
     (to_jsonb(new) - (campos_permitidos || array['updated_at', 'estado_changed_at'])) then
    raise exception
      'La transición intenta cambiar campos no permitidos'
      using errcode = '23514';
  end if;

  if old.estado = 'en reparación' and new.estado = 'listo para firma' then
    new.reparacion_lista_at := now();
  elsif old.estado = 'listo para firma' and new.estado = 'firmado' then
    new.firmado_at := now();
  elsif old.estado = 'firmado' and new.estado = 'facturado' then
    new.facturado_at := coalesce(new.facturado_at, now());
  elsif (old.estado = 'facturado' or old.estado = 'reclamo a la compañía') and new.estado = 'cobrado' then
    new.cobrado_at := coalesce(new.cobrado_at, now());
  end if;

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
    if actor_role <> 'dueno' then
      raise exception 'Solo dueño puede facturar' using errcode = '42501';
    end if;
    if not exists (
      select 1 from public.caso_facturacion f
      where f.caso_id = old.id
        and f.monto_facturado > 0
        and trim(f.numero_factura) <> ''
    ) then
      raise exception 'Al facturar requiere registro en caso_facturacion con monto_facturado > 0 y numero_factura' using errcode = '23514';
    end if;
  elsif (old.estado = 'facturado' or old.estado = 'reclamo a la compañía') and new.estado = 'cobrado' then
    if actor_role <> 'dueno' then
      raise exception 'Solo dueño puede cobrar' using errcode = '42501';
    end if;
    if not exists (
      select 1 from public.caso_facturacion f
      where f.caso_id = old.id
        and f.monto_cobrado > 0
        and f.fecha_cobro is not null
    ) then
      raise exception 'Al cobrar requiere monto_cobrado > 0 y fecha_cobro' using errcode = '23514';
    end if;
  elsif old.estado = 'facturado' and new.estado = 'reclamo a la compañía' then
    if actor_role not in ('dueno', 'recepcion') then
      raise exception 'Solo dueño o recepción pueden iniciar reclamo' using errcode = '42501';
    end if;
    if old.canal <> 'seguro' then
      raise exception 'Reclamo a la compañía solo permitido en casos de seguro' using errcode = '23514';
    end if;
    if new.motivo_reclamo is null or trim(new.motivo_reclamo) = '' then
      raise exception 'Al reclamar a la compañía requiere motivo_reclamo' using errcode = '23514';
    end if;
  elsif old.estado = 'reclamo a la compañía' and new.estado = 'facturado' then
    if actor_role not in ('dueno', 'recepcion') then
      raise exception 'Solo dueño o recepción pueden revertir reclamo' using errcode = '42501';
    end if;
  end if;

  if old.estado in ('ingresado', 'en reparación', 'esperando repuesto', 'listo para firma') then
    rol_autorizado := actor_role in ('dueno', 'taller');
  elsif old.estado in ('firmado', 'facturado', 'reclamo a la compañía') then
    if new.estado in ('facturado', 'cobrado') then
      rol_autorizado := actor_role = 'dueno';
    elsif new.estado in ('reclamo a la compañía', 'facturado') then
      rol_autorizado := actor_role in ('dueno', 'recepcion');
    end if;
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
