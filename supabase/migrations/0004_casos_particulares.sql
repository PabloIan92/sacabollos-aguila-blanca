-- Amplia casos con el canal particular sin invalidar las filas de seguro existentes.

alter table public.casos
  drop constraint casos_canal_check,
  alter column aseguradora drop not null,
  alter column numero_siniestro drop not null,
  alter column denuncia drop not null,
  add column presupuesto_monto numeric(12,2),
  add column presupuesto_observaciones text,
  add column respuesta_particular text,
  add column modalidad_contacto text,
  add column seguimiento_observaciones text,
  add column inspeccion_guardada_at timestamptz;

alter table public.casos
  add constraint casos_canal_check
    check (canal in ('seguro', 'particular')),
  add constraint casos_respuesta_particular_valor_check
    check (
      respuesta_particular is null
      or respuesta_particular in ('pendiente', 'aceptado', 'rechazado')
    ),
  add constraint casos_modalidad_contacto_valor_check
    check (
      modalidad_contacto is null
      or modalidad_contacto in ('whatsapp', 'telefono', 'email', 'presencial')
    ),
  add constraint casos_datos_por_canal_check
    check (
      (
        canal = 'seguro'
        and aseguradora is not null
        and numero_siniestro is not null
        and denuncia is not null
        and presupuesto_monto is null
        and presupuesto_observaciones is null
        and respuesta_particular is null
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
        and presupuesto_monto > 0
        and respuesta_particular is not null
      )
    ),
  add constraint casos_contacto_rechazo_check
    check (
      canal = 'seguro'
      or (
        respuesta_particular = 'rechazado'
        and modalidad_contacto is not null
      )
      or (
        respuesta_particular in ('pendiente', 'aceptado')
        and modalidad_contacto is null
        and seguimiento_observaciones is null
      )
    ),
  add constraint casos_respuesta_estado_check
    check (
      canal = 'seguro'
      or (
        respuesta_particular = 'pendiente'
        and estado = 'borrador'
      )
      or (
        respuesta_particular = 'aceptado'
        and estado not in ('borrador', 'enviado a la aseguradora', 'cancelado')
        and inspeccion_guardada_at is not null
      )
      or (
        respuesta_particular = 'rechazado'
        and estado = 'cancelado'
        and inspeccion_guardada_at is not null
      )
    );

create function public.validar_transicion_caso()
returns trigger
language plpgsql
set search_path = public
as $$
declare
  rol_actual text := public.current_user_role();
begin
  if new.canal is distinct from old.canal then
    raise exception 'El canal del caso no se puede modificar';
  end if;

  if new.estado is not distinct from old.estado then
    return new;
  end if;

  if rol_actual is null or rol_actual not in ('dueno', 'recepcion') then
    raise exception 'El rol % no puede cambiar el estado de un caso', coalesce(rol_actual, 'sin rol');
  end if;

  if old.estado = 'aprobado' and new.estado = 'turno coordinado' then
    if new.turno_fecha is null then
      raise exception 'Coordinar un turno requiere turno_fecha';
    end if;
  elsif old.estado = 'turno coordinado' and new.estado = 'ingresado' then
    if nullif(btrim(new.orden_ingreso_numero), '') is null or new.ingresado_at is null then
      raise exception 'Registrar el ingreso requiere orden_ingreso_numero e ingresado_at';
    end if;
  elsif new.canal = 'seguro' then
    if not (
      old.estado = 'borrador'
      and new.estado = 'enviado a la aseguradora'
      and new.inspeccion_guardada_at is not null
    ) and not (
      old.estado = 'enviado a la aseguradora'
      and new.estado = 'aprobado'
    ) then
      raise exception 'Transicion de seguro no permitida: % -> %', old.estado, new.estado;
    end if;
  elsif new.canal = 'particular' then
    if not (
      old.estado = 'borrador'
      and new.estado = 'aprobado'
      and new.respuesta_particular = 'aceptado'
      and new.inspeccion_guardada_at is not null
    ) and not (
      old.estado = 'borrador'
      and new.estado = 'cancelado'
      and new.respuesta_particular = 'rechazado'
      and new.modalidad_contacto is not null
      and new.inspeccion_guardada_at is not null
    ) then
      raise exception 'Transicion de particular no permitida: % -> %', old.estado, new.estado;
    end if;
  else
    raise exception 'Canal de caso no soportado: %', new.canal;
  end if;

  return new;
end;
$$;

create trigger casos_validar_transicion
  before update on public.casos
  for each row execute function public.validar_transicion_caso();
