---
phase: 260827-rxx-fix-rls-policy-casos-fotos-insert-storag
plan: 01
type: execute
wave: 1
depends_on: []
files_modified: [supabase/migrations/0003_fix_casos_fotos_insert_rls.sql]
autonomous: true
requirements: [QUICK-FIX]
must_haves:
  truths:
    - "The casos_fotos_insert policy no longer relies on storage.foldername(name)[3], which always returns NULL for 3-segment paths"
    - "A recepcion-authenticated upload to casos/{caseId}/frente.webp (and the other 7 valid angle filenames) satisfies the new WITH CHECK clause"
    - "An upload with an invalid/unlisted filename (e.g. casos/{caseId}/foo.webp) is still rejected"
    - "casos_fotos_select and casos_fotos_delete are untouched"
  artifacts:
    - path: "supabase/migrations/0003_fix_casos_fotos_insert_rls.sql"
      provides: "Corrected RLS policy for storage.objects INSERT on casos-fotos bucket"
      contains: "split_part(name, '/', 3)"
  key_links:
    - from: "supabase/migrations/0003_fix_casos_fotos_insert_rls.sql"
      to: "storage.objects casos_fotos_insert policy"
      via: "drop policy + create policy (same name)"
      pattern: "drop policy casos_fotos_insert"
---

<objective>
Fix the broken `casos_fotos_insert` RLS policy on `storage.objects` that blocks 100% of photo uploads in production.

Root cause (already diagnosed and verified live via Chrome DevTools, do not re-diagnose): `storage.foldername(name)` returns only the FOLDER segments of a storage path, excluding the filename. For uploads at `casos/{caseId}/{angulo}.webp` (per `buildFotoPath()` in `src/lib/imageCompression.ts`), `storage.foldername(name)` yields exactly `['casos', '{caseId}']` — a 2-element array. Index `[3]` is always `NULL`, and `NULL IN (...)` evaluates to `NULL`/false in Postgres, so the policy's angle check never passes and every INSERT is rejected with `StorageApiError: new row violates row-level security policy`.

Purpose: Unblock photo uploads for the `recepcion` role in production without touching application code, since `buildFotoPath()` already produces the correct path shape — only the RLS policy's parsing logic was wrong.

Output: `supabase/migrations/0003_fix_casos_fotos_insert_rls.sql` — drops and recreates `casos_fotos_insert` using `split_part(name, '/', 3)` (which includes the file extension) instead of the broken `storage.foldername(name)[3]` (which never included it).
</objective>

<execution_context>
@$HOME/.claude/get-shit-done/workflows/execute-plan.md
@$HOME/.claude/get-shit-done/templates/summary.md
</execution_context>

<context>
@.planning/STATE.md
@supabase/migrations/0002_casos.sql
@src/lib/imageCompression.ts

<interfaces>
Current broken policy (supabase/migrations/0002_casos.sql, lines 126-137):

```sql
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
```

Upload path shape (src/lib/imageCompression.ts, buildFotoPath):
`casos/{caseId}/{angulo}.webp` — e.g. `casos/3f9a.../frente.webp`

`storage.foldername(name)` on this path returns `['casos', '{caseId}']` (2 elements — never includes the filename). `split_part(name, '/', 3)` on this same path returns `'frente.webp'` (the filename WITH extension).

Untouched sibling policies for reference (do not modify, do not repeat in the new migration — they already exist in 0002_casos.sql):
- `casos_fotos_select` — uses `(storage.foldername(name))[2]::uuid` for case_id lookup. Position 2 parsing is correct (folder position, not filename), leave as-is.
- `casos_fotos_delete` — uses `bucket_id` and role check only, no angle parsing. Leave as-is.
</interfaces>
</context>

<tasks>

<task type="auto">
  <name>Task 1: Write corrective migration for casos_fotos_insert RLS policy</name>
  <files>supabase/migrations/0003_fix_casos_fotos_insert_rls.sql</files>
  <action>
Create a new migration file that drops and recreates ONLY `casos_fotos_insert` on `storage.objects`. Preamble comment must explain the bug (storage.foldername(name)[3] is always NULL for 3-segment paths since foldername() excludes the filename) and the fix (split_part(name, '/', 3) returns the filename with extension, so the allowed-values list must include the .webp suffix). Statements required, in order:

1. `drop policy casos_fotos_insert on storage.objects;`
2. `create policy casos_fotos_insert on storage.objects for insert with check (...)` reproducing the exact same three original conditions (`bucket_id = 'casos-fotos'`, `public.current_user_role() = 'recepcion'`, `(storage.foldername(name))[1] = 'casos'`) unchanged, but replacing the fourth condition with `split_part(name, '/', 3) in ('frente.webp', 'atras.webp', 'lateral-izquierdo.webp', 'lateral-derecho.webp', 'ingreso-frente.webp', 'ingreso-atras.webp', 'ingreso-lateral-izquierdo.webp', 'ingreso-lateral-derecho.webp')`.

Do not add, modify, or drop `casos_fotos_select` or `casos_fotos_delete`. Do not touch the `casos` table policies or the bucket definition — this migration's only job is the one policy replacement.
  </action>
  <verify>
    <automated>grep -c "split_part(name, '/', 3)" supabase/migrations/0003_fix_casos_fotos_insert_rls.sql</automated>
  </verify>
  <done>File `supabase/migrations/0003_fix_casos_fotos_insert_rls.sql` exists, contains exactly one `drop policy casos_fotos_insert on storage.objects;` and one `create policy casos_fotos_insert ... for insert with check (...)` using `split_part(name, '/', 3) in (...)` with all 8 `.webp`-suffixed angle values, and does not reference or redefine `casos_fotos_select` or `casos_fotos_delete`.</done>
</task>

<task type="auto">
  <name>Task 2: Static verification of the new policy logic</name>
  <files>supabase/migrations/0003_fix_casos_fotos_insert_rls.sql</files>
  <action>
Re-read the file just written and manually trace two cases against the new WITH CHECK clause to confirm correctness before considering the fix done:
- Valid case: role='recepcion', name='casos/3f9a.../frente.webp' -> bucket_id matches, role matches, foldername(name)[1]='casos' matches, split_part(name,'/',3)='frente.webp' is in the list -> INSERT allowed.
- Invalid case: role='recepcion', name='casos/3f9a.../foo.webp' -> split_part(name,'/',3)='foo.webp' is NOT in the list -> INSERT rejected.
Confirm both traces hold by inspecting the SQL text (no live DB available in this environment). Also confirm the migration filename and header comment do not claim to touch casos_fotos_select/casos_fotos_delete.
  </action>
  <verify>
    <automated>grep -v '^--' supabase/migrations/0003_fix_casos_fotos_insert_rls.sql | grep -c "casos_fotos_select\|casos_fotos_delete"</automated>
  </verify>
  <done>Grep confirms zero non-comment references to casos_fotos_select or casos_fotos_delete in the new migration (count is 0), and both traced cases (valid angle filename allowed, invalid filename rejected) are confirmed correct by manual inspection of the WITH CHECK clause.</done>
</task>

</tasks>

<threat_model>
## Trust Boundaries

| Boundary | Description |
|----------|-------------|
| authenticated client -> storage.objects (casos-fotos bucket) | recepcion-role client uploads photo blobs directly to Supabase Storage; RLS is the only server-side gate on path/role |

## STRIDE Threat Register

| Threat ID | Category | Component | Disposition | Mitigation Plan |
|-----------|----------|-----------|-------------|-----------------|
| T-quick-01 | Tampering | casos_fotos_insert policy | mitigate | Replace broken foldername()[3] check (always NULL, silently blocked everything) with split_part(name,'/',3) allow-list, so only recepcion-role uploads with an exact known angle filename under a casos/{id}/ path are accepted — no path traversal or arbitrary filename write is possible since the list is a closed enum |
| T-quick-02 | Elevation of Privilege | casos_fotos_insert policy | accept | Role check (`current_user_role() = 'recepcion'`) and bucket_id check are unchanged from the original migration — this fix only corrects the filename-parsing predicate, it does not alter the authorization boundary |
</threat_model>

<verification>
Run both task-level grep checks above. Additionally, run `grep -n "casos_fotos_insert" supabase/migrations/0003_fix_casos_fotos_insert_rls.sql` and confirm exactly one `drop policy` and one `create policy` statement appear (no duplicates, no leftover `[3]` foldername reference).

Manual follow-up required outside this plan (not automatable by the executor, needs human-held credentials): push the migration to production Supabase.

```
npx supabase link --project-ref tnwrewghcowayuudvxey
npx supabase db push
```

This requires `SUPABASE_ACCESS_TOKEN` and/or the project DB password, which the executor does not have. Flag this as an explicit next step for the human after this plan completes — the bug remains live in production until the migration is pushed.
</verification>

<success_criteria>
- `supabase/migrations/0003_fix_casos_fotos_insert_rls.sql` exists and is syntactically consistent SQL (drop + create, both targeting `casos_fotos_insert` on `storage.objects`)
- The new WITH CHECK clause uses `split_part(name, '/', 3)` against 8 `.webp`-suffixed filenames, replacing the broken `storage.foldername(name)[3]` check
- `casos_fotos_select` and `casos_fotos_delete` are unmodified (not present in the new migration file at all)
- No application code in `src/` is touched
- Human is informed that `npx supabase link --project-ref tnwrewghcowayuudvxey && npx supabase db push` is still required to actually apply this fix in production
</success_criteria>

<output>
Create `.planning/quick/260827-rxx-fix-rls-policy-casos-fotos-insert-storag/260827-rxx-SUMMARY.md` when done
</output>
