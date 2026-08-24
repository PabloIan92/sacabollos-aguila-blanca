-- Tabla de perfiles: el rol vive acá, en public.profiles, no en auth.users.raw_user_meta_data (D-04).
-- RLS se habilita en la misma migración que crea la tabla: nunca queda una ventana con la tabla abierta.

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text not null,
  role text not null check (role in ('dueno', 'recepcion', 'taller')),
  created_at timestamptz not null default now()
);

alter table public.profiles enable row level security;

-- Crea la fila de profiles cuando se crea el usuario en auth.users.
-- Si el rol pedido en la metadata no viene o no es uno de los 3 valores válidos,
-- el usuario queda en 'taller' (el de menor privilegio): nunca se asigna 'dueno' sin
-- que alguien autorizado lo haya pedido explícitamente.
create function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  requested_role text := new.raw_user_meta_data ->> 'role';
begin
  insert into public.profiles (id, full_name, role)
  values (
    new.id,
    coalesce(new.raw_user_meta_data ->> 'full_name', new.email),
    case
      when requested_role in ('dueno', 'recepcion', 'taller') then requested_role
      else 'taller'
    end
  )
  on conflict (id) do nothing;

  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- Backfill idempotente: si ya existían usuarios en Auth antes de esta migración,
-- les crea la fila de profiles con rol 'taller'. Así el orden entre "crear el
-- primer usuario en el dashboard" y "correr el push" deja de importar.
insert into public.profiles (id, full_name, role)
select
  u.id,
  coalesce(u.raw_user_meta_data ->> 'full_name', u.email),
  'taller'
from auth.users u
on conflict (id) do nothing;

-- Helper para leer el rol propio sin recursión de RLS. Tiene que ser plpgsql y no sql:
-- una función sql puede ser inlineada por el planificador de Postgres, y al inlinearse
-- pierde silenciosamente el bypass de security definer, reintroduciendo la evaluación
-- recursiva de RLS sobre profiles. La Fase 5 reutiliza este helper para ocultar
-- facturado/cobrado.
create function public.current_user_role()
returns text
language plpgsql
security definer
stable
set search_path = public
as $$
declare
  result text;
begin
  select role into result from public.profiles where id = auth.uid();
  return result;
end;
$$;

create policy profiles_select_own
  on public.profiles
  for select
  using (auth.uid() = id);

create policy profiles_update_own
  on public.profiles
  for update
  using (auth.uid() = id);

create policy profiles_select_all_for_admins
  on public.profiles
  for select
  using (public.current_user_role() in ('dueno', 'recepcion'));

-- El rol nunca recibe GRANT de escritura para authenticated: sin esto, auth.uid() = id
-- por sí solo habilitaría un PATCH directo contra PostgREST donde el usuario se
-- cambia su propio rol. El único camino para escribir el rol es el cliente
-- service-role dentro de la Edge Function de invitación (plan 01-04).
grant select on public.profiles to authenticated;
grant update (full_name) on public.profiles to authenticated;
