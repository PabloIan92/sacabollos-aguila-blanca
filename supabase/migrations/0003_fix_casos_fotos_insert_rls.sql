-- Fix casos_fotos_insert RLS policy on storage.objects.
--
-- Bug: storage.foldername(name) returns ONLY the folder segments of a storage
-- path, excluding the filename. Uploads happen at casos/{caseId}/{angulo}.webp
-- (see buildFotoPath() in src/lib/imageCompression.ts), so
-- storage.foldername(name) yields exactly ['casos', '{caseId}'] — a 2-element
-- array. Index [3] is therefore always NULL, and `NULL in (...)` evaluates to
-- NULL/false in Postgres, so the angle check never passed and every INSERT
-- was rejected with "new row violates row-level security policy".
--
-- Fix: split_part(name, '/', 3) splits the full path on '/' and returns the
-- 3rd segment, which is the filename WITH its extension (e.g.
-- 'frente.webp'). The allowed-values list is updated to include the .webp
-- suffix accordingly.
--
-- Only casos_fotos_insert is touched. casos_fotos_select and
-- casos_fotos_delete are untouched and are not redefined here.

drop policy casos_fotos_insert on storage.objects;

create policy casos_fotos_insert
  on storage.objects
  for insert
  with check (
    bucket_id = 'casos-fotos'
    and public.current_user_role() = 'recepcion'
    and (storage.foldername(name))[1] = 'casos'
    and split_part(name, '/', 3) in (
      'frente.webp', 'atras.webp', 'lateral-izquierdo.webp', 'lateral-derecho.webp',
      'ingreso-frente.webp', 'ingreso-atras.webp', 'ingreso-lateral-izquierdo.webp', 'ingreso-lateral-derecho.webp'
    )
  );
