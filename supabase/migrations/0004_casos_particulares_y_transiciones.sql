-- Canal Particular, presupuesto y máquina de estados segura.
-- Es compatible con las filas Seguro creadas por 0002/0003.

alter table public.casos
  drop constraint casos_canal_check;

alter table public.casos
  add constraint casos_canal_check
  check (canal in ('seguro', 'particular'));

alter table public.casos
  alter column aseguradora drop not null,
  alter column numero_siniestro drop not null,
  alter column denuncia drop not null;

alter table public.casos
  add column presupuesto_monto numeric(14, 2),
  add column presupuesto_respuesta text,
  add column presupuesto_observaciones text,
  add column modalidad_contacto text,
  add column seguimiento_observaciones text,
  add column inspeccion_guardada_at timestamptz;

alter table public.casos
  add constraint casos_presupuesto_monto_check
    check (presupuesto_monto is null or presupuesto_monto > 0),
  add constraint casos_presupuesto_respuesta_check
    check (
      presupuesto_respuesta is null
      or presupuesto_respuesta in ('pendiente', 'aceptado', 'rechazado')
    ),
  add constraint casos_modalidad_contacto_check
    check (
      modalidad_contacto is null
      or modalidad_contacto in ('whatsapp', 'telefono', 'email', 'presencial')
    );

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
        (
          presupuesto_respuesta = 'pendiente'
          and estado = 'borrador'
          and modalidad_contacto is null

        )
        or
        (
          presupuesto_respuesta = 'aceptado'
          and estado in ('aprobado', 'turno coordinado', 'ingresado')
        )
        or
        (
          presupuesto_respuesta = 'rechazado'
          and estado = 'cancelado'
          and modalidad_contacto is not null

        )
      )
    )
  ) not valid;

alter table public.casos
  validate constraint casos_datos_por_canal_check;

create function public.caso_tiene_fotos_inspeccion(caso_id uuid)
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
      'frente.webp',
      'atras.webp',
      'lateral-izquierdo.webp',
      'lateral-derecho.webp'
    );
$$;

create function public.caso_tiene_fotos_ingreso(caso_id uuid)
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
      'ingreso-frente.webp',
      'ingreso-atras.webp',
      'ingreso-lateral-izquierdo.webp',
      'ingreso-lateral-derecho.webp'
    );
$$;

revoke all on function public.caso_tiene_fotos_inspeccion(uuid)
  from public, anon, authenticated;

revoke all on function public.caso_tiene_fotos_ingreso(uuid)
  from public, anon, authenticated;

create function public.validar_transicion_caso()
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
  -- Permite mantenimiento mediante SQL y futuras Edge Functions service-role.
  if session_user in ('postgres', 'supabase_admin')
      or auth.role() = 'service_role' then
    return new;
  end if;

  -- Impedir cambios de identidad, creación, canal y presupuesto inicial.
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

  -- Sin transición sólo pueden cambiar estos dos campos, y únicamente en borrador.
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
      -- Seguro: borrador -> enviado a la aseguradora -> aprobado -> turno coordinado -> ingresado
      (old.canal = 'seguro' and
       (
         (old.estado = 'borrador' and new.estado = 'enviado a la aseguradora')
         or (old.estado = 'enviado a la aseguradora' and new.estado = 'aprobado')
         or (old.estado = 'aprobado' and new.estado = 'turno coordinado')
         or (old.estado = 'turno coordinado' and new.estado = 'ingresado')
       )
      )
      or
      -- Particular: borrador -> aprobado o cancelado
      (old.canal = 'particular' and
       (
         (old.estado = 'borrador' and new.estado = 'aprobado')
         or (old.estado = 'borrador' and new.estado = 'cancelado')
         or (old.estado = 'aprobado' and new.estado = 'turno coordinado')
         or (old.estado = 'turno coordinado' and new.estado = 'ingresado')
       )
      )
    );

  if not transicion_valida then
    raise exception
      'Transición de caso inválida: % -> %', old.estado, new.estado
      using errcode = '23514';
  end if;

  -- Cada transición puede escribir únicamente sus propios datos de etapa.
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
  end if;

  if (to_jsonb(old) - (campos_permitidos || array['updated_at', 'estado_changed_at']))
      is distinct from
     (to_jsonb(new) - (campos_permitidos || array['updated_at', 'estado_changed_at'])) then
    raise exception
      'La transición intenta cambiar campos no permitidos'
      using errcode = '23514';
  end if;

  -- Validaciones específicas por transición
  -- Al salir de borrador: requiere inspeccion_guardada_at y cuatro fotos de inspección
  if old.estado = 'borrador' and new.estado is distinct from old.estado then
    if new.inspeccion_guardada_at is null then
      raise exception
        'Al salir de borrador requiere inspeccion_guardada_at'
        using errcode = '23514';
    end if;
    if NOT public.caso_tiene_fotos_inspeccion(old.id) then
      raise exception
        'El caso requiere las cuatro fotos de inspección al salir de borrador'
        using errcode = '23514';
    end if;
  end if;

  -- Al coordinar (llegar a turno coordinado): requiere turno_fecha
  if new.estado = 'turno coordinado' and old.estado is distinct from new.estado then
    if new.turno_fecha IS NULL then
      raise exception
        'Al coordinar requiere turno_fecha'
        using errcode = '23514';
    end if;
  end if;

  -- Al ingresar (llegar a ingresado): requiere orden_ingreso_numero no vacía, ingresado_at y cuatro fotos de ingreso
  if new.estado = 'ingresado' and old.estado is distinct from new.estado then
    if new.orden_ingreso_numero IS NULL OR trim(new.orden_ingreso_numero) = '' then
      raise exception
        'Al ingresar requiere orden_ingreso_numero no vacía'
        using errcode = '23514';
    end if;
    if new.ingresado_at IS NULL then
      raise exception
        'Al ingresar requiere ingresado_at'
        using errcode = '23514';
    end if;
    if NOT public.caso_tiene_fotos_ingreso(old.id) then
      raise exception
        'Al ingresar requiere las cuatro fotos de ingreso'
        using errcode = '23514';
    end if;
  end if;

  rol_autorizado := actor_role in ('dueno', 'recepcion');

  if not rol_autorizado then
    raise exception
      'El rol % no puede realizar la transición % -> %',
      coalesce(actor_role, 'sin rol'),
      old.estado,
      new.estado
      using errcode = '42501';
  end if;

  return new;
end;
$$;

revoke all on function public.validar_transicion_caso()
  from public, anon, authenticated;

create trigger casos_validar_transicion
  before update on public.casos
  for each row execute function public.validar_transicion_caso();

-- `upload(..., upsert: true)` ejecuta UPDATE cuando la foto ya existe.
-- 0002/0003 solo cubrían INSERT, por lo que volver a sacar una foto fallaba.
create policy casos_fotos_update_recepcion
  on storage.objects
  for update
  using (
    bucket_id = 'casos-fotos'
    and public.current_user_role() = 'recepcion'
    and (storage.foldername(name))[1] = 'casos'
    and split_part(name, '/', 3) in (
      'frente.webp', 'atras.webp', 'lateral-izquierdo.webp', 'lateral-derecho.webp',
      'ingreso-frente.webp', 'ingreso-atras.webp',
      'ingreso-lateral-izquierdo.webp', 'ingreso-lateral-derecho.webp'
    )
  )
  with check (
    bucket_id = 'casos-fotos'
    and public.current_user_role() = 'recepcion'
    and (storage.foldername(name))[1] = 'casos'
    and split_part(name, '/', 3) in (
      'frente.webp', 'atras.webp', 'lateral-izquierdo.webp', 'lateral-derecho.webp',
      'ingreso-frente.webp', 'ingreso-atras.webp',
      'ingreso-lateral-izquierdo.webp', 'ingreso-lateral-derecho.webp'
    )
  );
