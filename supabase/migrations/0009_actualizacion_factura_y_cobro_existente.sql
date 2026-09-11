-- Migración 0009: Actualización de factura y cobro existente en RPCs atómicas
-- Permite que el rol dueño actualice datos de una factura existente (estado 'facturado')
-- o un cobro existente (estado 'cobrado') sin violar precondiciones de estado inicial.

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

  if v_caso.estado not in ('firmado', 'facturado') then
    raise exception 'El caso debe estar en estado firmado o facturado para facturar o actualizar factura (estado actual: %)', v_caso.estado using errcode = '23514';
  end if;

  -- Upsert caso_facturacion (insertar o actualizar factura existente)
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

  -- Si el caso estaba en 'firmado', transiciona a 'facturado'
  if v_caso.estado = 'firmado' then
    update public.casos
    set estado = 'facturado',
        facturado_at = now()
    where id = p_caso_id
    returning * into v_caso;
  end if;

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

  if v_caso.estado not in ('facturado', 'reclamo a la compañía', 'cobrado') then
    raise exception 'El caso debe estar facturado, en reclamo o cobrado para registrar o actualizar cobro (estado actual: %)', v_caso.estado using errcode = '23514';
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

  -- Si no estaba cobrado aún, transiciona a 'cobrado'
  if v_caso.estado in ('facturado', 'reclamo a la compañía') then
    update public.casos
    set estado = 'cobrado',
        cobrado_at = now()
    where id = p_caso_id
    returning * into v_caso;
  end if;

  return v_caso;
end;
$$;

grant execute on function public.facturar_caso_atomic to authenticated;
grant execute on function public.cobrar_caso_atomic to authenticated;
