-- Corré esto UNA sola vez, a mano, en Supabase Dashboard -> SQL Editor,
-- después de que `supabase db push` haya aplicado 0001_profiles.sql.
--
-- Por qué: el formulario "Add user" del dashboard no permite setear
-- user_metadata, así que el trigger on_auth_user_created te crea con el rol
-- de menor privilegio ('taller'). Este UPDATE te promueve a 'dueno'.
--
-- A partir del plan 01-04 (invitación de usuarios desde la app) esto no
-- vuelve a hacer falta: los roles se asignan ahí.
--
-- Reemplazá el email de abajo por el del dueño real antes de ejecutar.

update public.profiles
set role = 'dueno'
where id = (select id from auth.users where email = 'REEMPLAZAR@CON.TU.EMAIL');
