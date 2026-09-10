-- Migración 0007: CRM (Clientes, Aseguradoras y Productores) y Gestión de Equipo

-- 1. Tabla de Clientes
create table public.clientes (
  id uuid primary key default gen_random_uuid(),
  nombre text not null check (trim(nombre) <> ''),
  telefono text,
  email text,
  direccion text,
  notas text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger clientes_updated_at
  before update on public.clientes
  for each row execute function public.set_updated_at();

alter table public.clientes enable row level security;

create policy clientes_dueno_recepcion_all
  on public.clientes
  for all
  to authenticated
  using (public.current_user_role() in ('dueno', 'recepcion'))
  with check (public.current_user_role() in ('dueno', 'recepcion'));

create policy clientes_taller_select
  on public.clientes
  for select
  to authenticated
  using (public.current_user_role() = 'taller');

-- 2. Tabla de Aseguradoras
create table public.aseguradoras (
  id uuid primary key default gen_random_uuid(),
  nombre text not null unique check (trim(nombre) <> ''),
  email_siniestros text,
  telefono_contacto text,
  contacto_nombre text,
  notas text,
  activa boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger aseguradoras_updated_at
  before update on public.aseguradoras
  for each row execute function public.set_updated_at();

alter table public.aseguradoras enable row level security;

create policy aseguradoras_dueno_recepcion_all
  on public.aseguradoras
  for all
  to authenticated
  using (public.current_user_role() in ('dueno', 'recepcion'))
  with check (public.current_user_role() in ('dueno', 'recepcion'));

create policy aseguradoras_taller_select
  on public.aseguradoras
  for select
  to authenticated
  using (public.current_user_role() = 'taller');

-- 3. Tabla de Productores
create table public.productores (
  id uuid primary key default gen_random_uuid(),
  nombre text not null check (trim(nombre) <> ''),
  telefono text,
  email text,
  aseguradora text,
  notas text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger productores_updated_at
  before update on public.productores
  for each row execute function public.set_updated_at();

alter table public.productores enable row level security;

create policy productores_dueno_recepcion_all
  on public.productores
  for all
  to authenticated
  using (public.current_user_role() in ('dueno', 'recepcion'))
  with check (public.current_user_role() in ('dueno', 'recepcion'));

-- 4. Semillas de Aseguradoras históricas de Águila Blanca
insert into public.aseguradoras (nombre, email_siniestros, notas)
values
  ('San Cristóbal', 'siniestros@sancristobal.com.ar', 'Compañía aliada histórica del taller'),
  ('Federación Patronal', 'siniestros@fedpat.com.ar', 'Convenio de taller homologado'),
  ('Mercantil Andina', 'siniestros@mercantilandina.com.ar', 'Inspección con fotos digitales'),
  ('Triunfo Seguros', 'siniestros@triunfoseguros.com', 'Gestión rápida de órdenes'),
  ('Sancor Seguros', 'siniestros@sancorseguros.com.ar', 'Auditoría digital en línea'),
  ('La Segunda', 'siniestros@lasegunda.com.ar', 'Liquidación ágil de presupuestos'),
  ('Rivadavia', 'siniestros@segurosrivadavia.com', 'Convenio directo de derivación'),
  ('Zurich', 'siniestros@zurich.com.ar', 'Red oficial de sacabollos')
on conflict (nombre) do nothing;
