-- Reparación, cierre documentado y stock compartido.

alter table public.casos
  add column repuesto_pendiente text,
  add column reparacion_iniciada_at timestamptz,
  add column reparacion_lista_at timestamptz,
  add column firmado_at timestamptz;

-- El presupuesto particular aceptado puede continuar por el flujo operativo.
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
          'esperando repuesto', 'listo para firma', 'firmado'
        ))
        or
        (presupuesto_respuesta = 'rechazado' and estado = 'cancelado' and modalidad_contacto is not null)
      )
    )
  );

create table public.reparacion_danos (
  id uuid primary key default gen_random_uuid(),
  caso_id uuid not null references public.casos(id) on delete cascade,
  zona text not null check (trim(zona) <> ''),
  x numeric not null check (x between 0 and 1),
  y numeric not null check (y between 0 and 1),
  descripcion text,
  reparado boolean not null default false,
  origen_inspeccion boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (caso_id, zona)
);

alter table public.reparacion_danos enable row level security;

create function public.set_reparacion_danos_updated_at()
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

create trigger reparacion_danos_updated_at
  before update on public.reparacion_danos
  for each row execute function public.set_reparacion_danos_updated_at();

revoke all on function public.set_reparacion_danos_updated_at()
  from public, anon, authenticated;

create policy reparacion_danos_taller_dueno_crud
  on public.reparacion_danos
  for all
  using (
    public.current_user_role() in ('dueno', 'taller')
    and exists (
      select 1 from public.casos c
      where c.id = reparacion_danos.caso_id
        and c.estado not in ('cobrado', 'cancelado')
    )
  )
  with check (
    public.current_user_role() in ('dueno', 'taller')
    and exists (
      select 1 from public.casos c
      where c.id = reparacion_danos.caso_id
        and c.estado not in ('cobrado', 'cancelado')
    )
  );

create policy reparacion_danos_recepcion_select
  on public.reparacion_danos
  for select
  using (public.current_user_role() = 'recepcion');

create table public.stock_items (
  id uuid primary key default gen_random_uuid(),
  nombre text not null check (trim(nombre) <> ''),
  cantidad numeric not null default 0 check (cantidad >= 0),
  unidad text not null check (trim(unidad) <> ''),
  observaciones text,
  updated_at timestamptz not null default now(),
  updated_by uuid not null references auth.users(id) default auth.uid()
);

alter table public.stock_items enable row level security;

create function public.set_stock_item_audit()
returns trigger
language plpgsql
security definer
set search_path = public, pg_temp
as $$
begin
  new.updated_at = now();
  new.updated_by = auth.uid();
  return new;
end;
$$;

create trigger stock_items_audit
  before update on public.stock_items
  for each row execute function public.set_stock_item_audit();

revoke all on function public.set_stock_item_audit()
  from public, anon, authenticated;

create policy stock_items_authenticated_crud
  on public.stock_items
  for all
  using (public.current_user_role() in ('dueno', 'recepcion', 'taller'))
  with check (public.current_user_role() in ('dueno', 'recepcion', 'taller'));

create function public.caso_tiene_fotos_finales(caso_id uuid)
returns boolean
language sql
security definer
stable
set search_path = public, storage, pg_temp
as $$
  select count(distinct split_part(o.name, '/', 3)) = 4
  from storage.objects o
  where o.bucket_id = 'casos-fotos'
    and split_part(o.name, '/', 1) = 'casos'
    and split_part(o.name, '/', 2) = caso_id::text
    and split_part(o.name, '/', 3) in (
      'final-frente.webp',
      'final-atras.webp',
      'final-lateral-izquierdo.webp',
      'final-lateral-derecho.webp'
    );
$$;

create function public.caso_tiene_orden_firmada(caso_id uuid)
returns boolean
language sql
security definer
stable
set search_path = public, storage, pg_temp
as $$
  select exists (
    select 1
    from storage.objects o
    where o.bucket_id = 'casos-fotos'
      and split_part(o.name, '/', 1) = 'casos'
      and split_part(o.name, '/', 2) = caso_id::text
      and split_part(o.name, '/', 3) = 'orden-firmada.webp'
  );
$$;

revoke all on function public.caso_tiene_fotos_finales(uuid)
  from public, anon, authenticated;

revoke all on function public.caso_tiene_orden_firmada(uuid)
  from public, anon, authenticated;

-- Reemplaza el trigger de 0004 sin perder ninguno de sus caminos ni guardas.
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
  if session_user in ('postgres', 'supabase_admin')
      or auth.role() = 'service_role' then
    return new;
  end if;

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

  transicion_valida :=
    (
      (old.canal = 'seguro' and
       (
         (old.estado = 'borrador' and new.estado = 'enviado a la aseguradora')
         or (old.estado = 'enviado a la aseguradora' and new.estado = 'aprobado')
         or (old.estado = 'aprobado' and new.estado = 'turno coordinado')
         or (old.estado = 'turno coordinado' and new.estado = 'ingresado')
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
    campos_permitidos := array['estado', 'reparacion_lista_at'];
  elsif old.estado = 'listo para firma' and new.estado = 'firmado' then
    campos_permitidos := array['estado', 'firmado_at'];
  end if;

  if (to_jsonb(old) - (campos_permitidos || array['updated_at', 'estado_changed_at']))
      is distinct from
     (to_jsonb(new) - (campos_permitidos || array['updated_at', 'estado_changed_at'])) then
    raise exception
      'La transición intenta cambiar campos no permitidos'
      using errcode = '23514';
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
    if new.reparacion_lista_at is null then
      raise exception 'Al cerrar reparación requiere reparacion_lista_at' using errcode = '23514';
    end if;
    if exists (
      select 1 from public.reparacion_danos d
      where d.caso_id = old.id and not d.reparado
    ) or not public.caso_tiene_fotos_finales(old.id) then
      raise exception 'La reparación requiere todos los daños reparados y cuatro fotos finales' using errcode = '23514';
    end if;
  elsif old.estado = 'listo para firma' and new.estado = 'firmado' then
    if new.firmado_at is null then
      raise exception 'Al firmar requiere firmado_at' using errcode = '23514';
    end if;
    if not public.caso_tiene_orden_firmada(old.id) then
      raise exception 'El firmado requiere orden-firmada.webp' using errcode = '23514';
    end if;
  end if;

  if old.estado in ('ingresado', 'en reparación', 'esperando repuesto', 'listo para firma') then
    rol_autorizado := actor_role in ('dueno', 'taller');
  else
    rol_autorizado := actor_role in ('dueno', 'recepcion');
  end if;

  if not rol_autorizado then
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

create policy casos_update_taller_reparacion
  on public.casos
  for update
  using (
    public.current_user_role() = 'taller'
    and estado in ('ingresado', 'en reparación', 'esperando repuesto', 'listo para firma')
  )
  with check (
    public.current_user_role() = 'taller'
    and estado in ('en reparación', 'esperando repuesto', 'listo para firma', 'firmado')
  );

create function public.iniciar_reparacion(p_caso_id uuid)
returns public.casos
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_caso public.casos;
begin
  if public.current_user_role() not in ('dueno', 'taller') then
    raise exception 'Solo dueño o taller puede iniciar reparación' using errcode = '42501';
  end if;

  select * into v_caso
  from public.casos
  where id = p_caso_id
  for update;

  if not found then
    raise exception 'Caso no encontrado' using errcode = 'P0002';
  end if;

  if v_caso.estado <> 'ingresado' then
    raise exception 'Solo se puede iniciar reparación desde ingresado' using errcode = '23514';
  end if;

  insert into public.reparacion_danos (caso_id, zona, x, y, origen_inspeccion)
  select
    v_caso.id,
    dano.zona,
    (mod(dano.ordinalidad * 37, 100)::numeric / 100),
    (mod(dano.ordinalidad * 73, 100)::numeric / 100),
    true
  from unnest(coalesce(v_caso.danos_zonas, array[]::text[])) with ordinality as dano(zona, ordinalidad)
  on conflict (caso_id, zona) do nothing;

  update public.casos
  set estado = 'en reparación', reparacion_iniciada_at = now()
  where id = v_caso.id
  returning * into v_caso;

  return v_caso;
end;
$$;

revoke all on function public.iniciar_reparacion(uuid)
  from public, anon, authenticated;

grant execute on function public.iniciar_reparacion(uuid) to authenticated;

create policy casos_fotos_insert_reparacion
  on storage.objects
  for insert
  with check (
    bucket_id = 'casos-fotos'
    and public.current_user_role() in ('dueno', 'taller')
    and (storage.foldername(name))[1] = 'casos'
    and split_part(name, '/', 3) in (
      'final-frente.webp', 'final-atras.webp',
      'final-lateral-izquierdo.webp', 'final-lateral-derecho.webp',
      'orden-firmada.webp'
    )
    and exists (
      select 1 from public.casos c
      where c.id = (storage.foldername(name))[2]::uuid
        and c.estado not in ('cobrado', 'cancelado')
    )
  );

create policy casos_fotos_update_reparacion
  on storage.objects
  for update
  using (
    bucket_id = 'casos-fotos'
    and public.current_user_role() in ('dueno', 'taller')
    and (storage.foldername(name))[1] = 'casos'
    and split_part(name, '/', 3) in (
      'final-frente.webp', 'final-atras.webp',
      'final-lateral-izquierdo.webp', 'final-lateral-derecho.webp',
      'orden-firmada.webp'
    )
  )
  with check (
    bucket_id = 'casos-fotos'
    and public.current_user_role() in ('dueno', 'taller')
    and (storage.foldername(name))[1] = 'casos'
    and split_part(name, '/', 3) in (
      'final-frente.webp', 'final-atras.webp',
      'final-lateral-izquierdo.webp', 'final-lateral-derecho.webp',
      'orden-firmada.webp'
    )
    and exists (
      select 1 from public.casos c
      where c.id = (storage.foldername(name))[2]::uuid
        and c.estado not in ('cobrado', 'cancelado')
    )
  );
