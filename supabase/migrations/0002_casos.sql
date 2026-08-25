-- Tabla de casos (canal Seguro). RLS habilitada en la misma migración.
-- Los 13 valores de `estado` son exactos, verificados contra docs/tablero.html
-- y la nota de correccion de 02-RESEARCH.md -- no reformular ni reordenar.
-- Dos valores viejos de docs/tablero.html quedaron descartados a proposito
-- (ver 02-RESEARCH.md); no reintroducirlos.

create table public.casos (
  id uuid primary key default gen_random_uuid(),
  canal text not null default 'seguro' check (canal in ('seguro')),
  patente text not null,
  marca text,
  modelo text,
  color text,
  cliente_nombre text not null,
  cliente_telefono text not null,
  aseguradora text not null check (aseguradora in (
    'San Cristóbal',
    'Federación Patronal',
    'Mercantil Andes',
    'Triunfo',
    'Sancor',
    'Cooperativa de Seguros'
  )),
  numero_siniestro text not null,
  denuncia text not null,
  productor_nombre text,
  productor_telefono text,
  danos_zonas text[] not null default '{}',
  turno_fecha timestamptz,
  orden_ingreso_numero text,
  ingresado_at timestamptz,
  estado text not null default 'borrador' check (estado in (
    'borrador',
    'enviado a la aseguradora',
    'aprobado',
    'turno coordinado',
    'ingresado',
    'esperando repuesto',
    'en reparación',
    'listo para firma',
    'firmado',
    'facturado',
    'cobrado',
    'reclamo a la compañía',
    'cancelado'
  )),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  estado_changed_at timestamptz not null default now(),
  created_by uuid not null references auth.users(id)
);

alter table public.casos enable row level security;

create function public.set_updated_at()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  new.updated_at = now();
  if new.estado is distinct from old.estado then
    new.estado_changed_at = now();
  end if;
  return new;
end;
$$;

create trigger casos_updated_at
  before update on public.casos
  for each row execute function public.set_updated_at();

create policy casos_select_dueno_recepcion
  on public.casos
  for select
  using (public.current_user_role() in ('dueno', 'recepcion'));

create policy casos_select_taller_activos
  on public.casos
  for select
  using (public.current_user_role() = 'taller' and estado not in ('cobrado', 'cancelado'));

create policy casos_insert_recepcion
  on public.casos
  for insert
  with check (public.current_user_role() = 'recepcion' and auth.uid() = created_by);

create policy casos_update_recepcion
  on public.casos
  for update
  using (public.current_user_role() = 'recepcion')
  with check (public.current_user_role() = 'recepcion');

create policy casos_update_dueno
  on public.casos
  for update
  using (public.current_user_role() = 'dueno')
  with check (public.current_user_role() = 'dueno');

-- Bucket privado para fotos de casos.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('casos-fotos', 'casos-fotos', false, 10485760, array['image/webp'])
on conflict (id) do nothing;

-- RLS de storage.objects, parseando storage.foldername(name):
-- posicion 1 = 'casos', posicion 2 = case_id, posicion 3 = angulo.
create policy casos_fotos_select
  on storage.objects
  for select
  using (
    bucket_id = 'casos-fotos'
    and (
      public.current_user_role() in ('dueno', 'recepcion')
      or (
        public.current_user_role() = 'taller'
        and exists (
          select 1 from public.casos c
          where c.id = (storage.foldername(name))[2]::uuid
            and c.estado not in ('cobrado', 'cancelado')
        )
      )
    )
  );

create policy casos_fotos_insert
  on storage.objects
  for insert
  with check (
    bucket_id = 'casos-fotos'
    and public.current_user_role() = 'recepcion'
    and (storage.foldername(name))[1] = 'casos'
    and (storage.foldername(name))[3] in (
      'frente', 'atras', 'lateral-izquierdo', 'lateral-derecho',
      'ingreso-frente', 'ingreso-atras', 'ingreso-lateral-izquierdo', 'ingreso-lateral-derecho'
    )
  );

create policy casos_fotos_delete
  on storage.objects
  for delete
  using (
    bucket_id = 'casos-fotos'
    and public.current_user_role() in ('dueno', 'recepcion')
  );

-- Realtime para el semaforo (idempotente).
do $$
begin
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime'
      and schemaname = 'public'
      and tablename = 'casos'
  ) then
    alter publication supabase_realtime add table public.casos;
  end if;
end $$;
