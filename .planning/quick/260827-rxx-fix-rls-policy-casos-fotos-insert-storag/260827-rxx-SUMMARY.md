---
phase: 260827-rxx-fix-rls-policy-casos-fotos-insert-storag
plan: 01
subsystem: supabase-storage-rls
tags: [rls, storage, bugfix, supabase]
dependency-graph:
  requires: []
  provides: ["corrected casos_fotos_insert RLS policy (not yet applied to production)"]
  affects: ["storage.objects INSERT for casos-fotos bucket"]
tech-stack:
  added: []
  patterns: ["split_part(name, '/', n) for parsing storage.objects path segments including filename, instead of storage.foldername(name)[n] which excludes the filename"]
key-files:
  created: ["supabase/migrations/0003_fix_casos_fotos_insert_rls.sql"]
  modified: []
decisions: []
metrics:
  duration: "~10 min"
  completed: "2026-08-27"
---

# Quick Task 260827-rxx: Fix RLS policy for casos_fotos INSERT storage Summary

Replaced the broken `storage.foldername(name)[3]` angle-name check in the `casos_fotos_insert` RLS policy with `split_part(name, '/', 3)`, since `foldername()` excludes the filename entirely and always returned `NULL` for the 3-segment upload paths used by `buildFotoPath()`, silently blocking 100% of photo uploads in production.

## What Was Built

**Task 1: Corrective migration** (`supabase/migrations/0003_fix_casos_fotos_insert_rls.sql`)
- Drops the existing `casos_fotos_insert` policy on `storage.objects`.
- Recreates it with the same `bucket_id = 'casos-fotos'`, `public.current_user_role() = 'recepcion'`, and `(storage.foldername(name))[1] = 'casos'` conditions unchanged.
- Replaces the broken `(storage.foldername(name))[3] in (...)` clause (angle names without extension) with `split_part(name, '/', 3) in (...)`, where the allow-list now includes the 8 angle values with the `.webp` extension (`frente.webp`, `atras.webp`, `lateral-izquierdo.webp`, `lateral-derecho.webp`, `ingreso-frente.webp`, `ingreso-atras.webp`, `ingreso-lateral-izquierdo.webp`, `ingreso-lateral-derecho.webp`).
- Header comment documents both the root cause and the fix.
- `casos_fotos_select` and `casos_fotos_delete` are not referenced or redefined anywhere in the file.

**Task 2: Static verification**
- Traced the valid case (`casos/{caseId}/frente.webp`, role `recepcion`): all four conditions hold, INSERT allowed.
- Traced the invalid case (`casos/{caseId}/foo.webp`, role `recepcion`): `split_part(name, '/', 3) = 'foo.webp'` is not in the allow-list, INSERT rejected.
- Confirmed via `grep -v '^--' ... | grep -c "casos_fotos_select\|casos_fotos_delete"` → `0` non-comment references to the sibling policies.
- Confirmed via `grep -n "casos_fotos_insert" ...` → exactly one `drop policy` line and one `create policy` line, no duplicates.

## Deviations from Plan

None — plan executed exactly as written. Task 2 required no file changes (verification-only), so it produced no separate commit.

## Verification

```
grep -c "split_part(name, '/', 3)" supabase/migrations/0003_fix_casos_fotos_insert_rls.sql
→ 2 (one in header comment, one in the WITH CHECK clause)

grep -v '^--' supabase/migrations/0003_fix_casos_fotos_insert_rls.sql | grep -c "casos_fotos_select\|casos_fotos_delete"
→ 0

grep -n "casos_fotos_insert" supabase/migrations/0003_fix_casos_fotos_insert_rls.sql
→ line 19: drop policy casos_fotos_insert on storage.objects;
→ line 21: create policy casos_fotos_insert
(exactly one drop, one create)
```

## Commits

- `e5927d6` — fix(260827-rxx): correct casos_fotos_insert RLS to use split_part instead of foldername[3]

## Manual Follow-up Required (outside this plan)

The migration file exists locally but has **not** been pushed to production Supabase — the executor has no database credentials. The bug remains live in production until a human runs:

```
npx supabase link --project-ref tnwrewghcowayuudvxey
npx supabase db push
```

This requires `SUPABASE_ACCESS_TOKEN` and/or the project DB password.

## Self-Check: PASSED

- FOUND: supabase/migrations/0003_fix_casos_fotos_insert_rls.sql
- FOUND: commit e5927d6 in `git log --oneline --all`
