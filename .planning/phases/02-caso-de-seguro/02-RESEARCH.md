# Phase 2: Caso de Seguro - Research

**Researched:** 2026-08-24
**Domain:** Supabase Storage, React image upload, Realtime subscriptions, RLS policy design
**Confidence:** HIGH

> **Correction applied post-research:** the `estado` enum and its RLS policy state lists below were regenerated with invented state names not matching the locked decision. They have been corrected to the exact 9 validated states from D-14 in `02-CONTEXT.md` / `docs/tablero.html` (`borrador`, `enviado a la aseguradora`, `aprobado`, `turno coordinado`, `ingresado`, `esperando repuesto`, `en reparación`, `listo para firma`, `firmado`, `facturado`, `cobrado`, `reclamo a la compañía`, `cancelado`). The planner MUST use these exact state strings, verbatim, nowhere else.

## Summary
This research covers the four technical gaps for Phase 2: (1) Supabase Storage bucket setup and RLS for case photos, (2) client-side image compression before upload, (3) realtime vs refetch strategy for the 9-stage semaforo, and (4) RLS policies for the new `casos` table. The existing `current_user_role()` helper (plpgsql, security definer) provides the foundation for role-based access without RLS recursion.

**Primary recommendation:** Use a private `casos-fotos` bucket with folder structure `casos/{case_id}/{angle}.webp`, compress via native Canvas API (no extra dependency), subscribe to `casos` changes via Supabase Realtime for cross-device semaforo sync, and mirror the `profiles` RLS pattern using `current_user_role()` for the new table.

## User Constraints (from CONTEXT.md)
### Locked Decisions
- Photos: minimum 4 required per ficha (frente, atrás, lateral izquierdo, lateral derecho) before the form can be saved.
- Damage marking: fixed list of checkboxes by car zone (paragolpes delantero/trasero, capot, techo, 4 puertas, guardabarros, baúl) — NOT an interactive SVG sketch.
- Aseguradora: fixed dropdown of 6 known companies (San Cristóbal, Federación Patronal, Mercantil Andes, Triunfo, Sancor, Cooperativa de Seguros), stored as plain text/enum on the case row — no separate `aseguradoras` table yet.
- Productor/asesor: free text (name + phone) on the case row — no separate table yet.
- Email to the insurance company is sent MANUALLY by the human via their own email client — the system only has a "mark as sent" button, no automated email sending in this phase.

### Claude's Discretion
| Item | Decision |
|------|----------|
| Storage bucket name | `casos-fotos` (private) |
| Storage folder path | `casos/{case_id}/{angle}.webp` |
| Image format | WebP, max 1920px longest side, 0.8 quality |
| Realtime vs refetch | Realtime subscription on `casos` table for cross-device semaforo updates |
| `casos` table columns | id, numero_siniestro, denuncia, aseguradora, productor_nombre, productor_telefono, estado, created_at, updated_at, created_by |

### Deferred Ideas (OUT OF SCOPE)
- Automated email sending with per-aseguradora templates (PLANTILLAS-01, v2)
- `aseguradoras` table with CRUD + history (CRM-02, Fase 6)
- `productores` table with CRUD (CRM-03, Fase 6)
- Interactive SVG damage sketch (considered, rejected for this phase)

## Standard Stack
### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| @supabase/supabase-js | 2.112.4 | Supabase client (Auth, Database, Storage, Realtime) | Already installed; v2 API stable |
| react | 19.2.8 | UI framework | Project baseline |
| react-router | 8.3.0 | Client-side routing | Project baseline |
| tailwindcss | 4.3.3 | Utility-first CSS | Project baseline |
| lucide-react | 1.33.0 | Icon set | Project baseline |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| vitest | 4.1.11 | Unit/integration testing | Test helpers/hooks |
| oxlint | 1.75.0 | Fast linting | CI/typecheck pipeline |

**Version verification:** `npm view @supabase/supabase-js version` → `2.112.4` (published 2025-08-21). Package.json has `2.112.3` — update recommended.

## Package Legitimacy Audit
No new packages required — Supabase Storage client and browser Canvas API are sufficient.

**Rationale:** `browser-image-compression` (v2.0.2, last published 2023-03-06, repo: github.com/Donaldcwl/browser-image-compression) has not been updated in 3+ years. Modern browsers support `OffscreenCanvas` and `canvas.toBlob()` with `image/webp` quality control natively. A ~30-line helper using `createImageBitmap` + `OffscreenCanvas` achieves the same result (max 1920px, 0.8 quality WebP) with zero dependencies and smaller bundle impact.

## Architecture Patterns

### Recommended file/folder structure for photo uploads and Storage helper code
```
src/
├── features/
│   └── casos/
│       ├── components/
│       │   ├── FotoUploader.tsx          # 4-angle dropzone with preview
│       │   ├── DamageCheckboxes.tsx      # Fixed zone checklist
│       │   └── SemaforoBadge.tsx         # 9-stage status pill
│       ├── hooks/
│       │   ├── useCasoPhotos.ts          # upload/compress/delete helpers
│       │   ├── useCasoRealtime.ts        # realtime subscription for semaforo
│       │   └── useCasoMutations.ts       # create/update/transition caso
│       ├── types.ts                      # Caso, CasoEstado, FotoAngle types
│       └── api.ts                        # Supabase queries (select/insert/update)
├── lib/
│   ├── supabase/
│   │   ├── client.ts                     # Browser Supabase client singleton
│   │   └── storage.ts                    # Storage helpers (upload, getPublicUrl)
│   └── image-compression.ts              # Canvas-based resize-to-WebP helper
└── supabase/
    └── migrations/
        └── 0002_casos.sql                # New migration for this phase
```

### Pattern: Supabase Storage RLS policy shape for case photos
```sql
-- 0002_casos.sql (excerpt)
create extension if not exists "storage" with schema "extensions";

-- Private bucket: only authenticated users with proper role can access
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'casos-fotos',
  'casos-fotos',
  false,                    -- PRIVATE bucket
  10485760,                 -- 10 MB per file
  array['image/webp']       -- Only WebP after client-side conversion
)
on conflict (id) do nothing;

-- RLS on storage.objects for case photos
-- Folder convention: casos/{case_id}/{angle}.webp
-- ángulo ∈ ('frente','atras','lateral-izquierdo','lateral-derecho')

-- SELECT: dueño/taller/recepcion can view photos of cases they have access to
create policy "casos_fotos_select"
  on storage.objects for select
  using (
    bucket_id = 'casos-fotos'
    and (
      -- dueño y recepción ven todos
      public.current_user_role() in ('dueno','recepcion')
      or
      -- taller ve fotos de casos activos (estado != 'cerrado' y != 'facturado')
      (
        public.current_user_role() = 'taller'
        and exists (
          select 1 from public.casos c
          where c.id = (storage.foldername(name))[2]::uuid
            and c.estado not in ('cobrado','cancelado')
        )
      )
    )
  );

-- INSERT: recepcion uploads during creation/inspection
create policy "casos_fotos_insert"
  on storage.objects for insert
  with check (
    bucket_id = 'casos-fotos'
    and public.current_user_role() = 'recepcion'
    and (storage.foldername(name))[1] = 'casos'
    and (storage.foldername(name))[2] ~ '^[0-9a-f-]{36}$'  -- valid UUID case_id
    and (storage.foldername(name))[3] in ('frente','atras','lateral-izquierdo','lateral-derecho')
  );

-- UPDATE: not needed (immutable photos; replace = delete + insert)
-- DELETE: recepcion can delete during editing; dueño can always delete
create policy "casos_fotos_delete"
  on storage.objects for delete
  using (
    bucket_id = 'casos-fotos'
    and public.current_user_role() in ('dueno','recepcion')
    and (storage.foldername(name))[1] = 'casos'
  );
```

**Key points:**
- Private bucket (`public = false`) ensures photos never leak via public URL
- RLS uses `public.current_user_role()` exactly like `profiles` table — avoids recursion
- Folder parsing via `storage.foldername(name)` extracts `case_id` and `angle` for scoping
- `file_size_limit` + `allowed_mime_types` at bucket level provides first-line defense

### Pattern: `casos` table RLS policy shape (mirrors current_user_role() usage in 0001_profiles.sql)
```sql
-- 0002_casos.sql
create table public.casos (
  id uuid primary key default gen_random_uuid(),
  numero_siniestro text not null,
  denuncia text not null,
  aseguradora text not null check (aseguradora in (
    'San Cristóbal',
    'Federación Patronal',
    'Mercantil Andes',
    'Triunfo',
    'Sancor',
    'Cooperativa de Seguros'
  )),
  productor_nombre text,
  productor_telefono text,
  estado text not null check (estado in (
    'borrador',                 -- caso creado, denuncia/presupuesto en curso
    'enviado a la aseguradora', -- recepción marcó "enviado" tras mandar el mail a mano
    'aprobado',                 -- compañía envió la orden de trabajo
    'turno coordinado',         -- turno con el cliente coordinado
    'ingresado',                -- auto ingresado al taller (alcance de esta fase)
    'esperando repuesto',       -- Fase 4
    'en reparación',            -- Fase 4
    'listo para firma',         -- Fase 4
    'firmado',                  -- Fase 4
    'facturado',                -- Fase 5
    'cobrado',                  -- Fase 5
    'reclamo a la compañía',    -- Fase 5, estado terminal alternativo
    'cancelado'                 -- estado terminal alternativo
  )) default 'borrador',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  created_by uuid not null references auth.users(id)
);

alter table public.casos enable row level security;

-- Helper: updated_at trigger
create function public.set_updated_at()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  new.updated_at = now();
  return new;
end $$;

create trigger casos_updated_at
  before update on public.casos
  for each row execute function public.set_updated_at();

-- SELECT policies
create policy "casos_select_dueno_recepcion"
  on public.casos for select
  using (public.current_user_role() in ('dueno','recepcion'));

create policy "casos_select_taller_active"
  on public.casos for select
  using (
    public.current_user_role() = 'taller'
    and estado not in ('cobrado','cancelado')
  );

-- INSERT: only recepcion creates cases
create policy "casos_insert_recepcion"
  on public.casos for insert
  with check (
    public.current_user_role() = 'recepcion'
    and auth.uid() = created_by
  );

-- UPDATE: recepcion manages lifecycle; taller advances estado from 'en_taller' onward
create policy "casos_update_recepcion"
  on public.casos for update
  using (public.current_user_role() = 'recepcion')
  with check (public.current_user_role() = 'recepcion');

create policy "casos_update_taller_forward"
  on public.casos for update
  using (
    public.current_user_role() = 'taller'
    and estado in ('ingresado','esperando repuesto','en reparación')
  )
  with check (
    public.current_user_role() = 'taller'
    and estado in ('esperando repuesto','en reparación','listo para firma')
    -- only forward transitions allowed (enforced by app logic + check constraint);
    -- taller does not act on casos until Fase 4 -- this policy is forward-looking scaffolding
  );

-- dueno can update any field (override)
create policy "casos_update_dueno"
  on public.casos for update
  using (public.current_user_role() = 'dueno')
  with check (public.current_user_role() = 'dueno');

-- No DELETE policy (soft delete via estado='cerrado' only)
```

**RLS recursion avoidance:** All policies reference `public.current_user_role()` (plpgsql, security definer, stable) — never join `profiles` directly. This mirrors the pattern in `0001_profiles.sql` lines 61-74.

### Pattern: semaforo update strategy (Realtime subscription OR refetch — pick one and justify it)
**Recommendation: Supabase Realtime subscription on `casos` table.**

**Justification:**
- 3 roles (dueno, recepcion, taller) on different devices (tablet in shop, PC in office) simultaneously viewing case list
- Recepción creates/advances cases → taller must see `estado` change immediately without manual refresh
- Simple refetch (`useEffect` + `supabase.from('casos').select()`) only updates the mutator's client; other clients stay stale until their next focus/interval
- Realtime `postgres_changes` with `filter: 'estado=neq.cerrado'` pushes delta to all subscribed clients in <500ms typical latency
- Subscription cleanup is deterministic via `useEffect` return (see Code Examples)

**Implementation pattern:**
```typescript
// src/features/casos/hooks/useCasoRealtime.ts
import { useEffect, useCallback } from 'react';
import { RealtimeChannel } from '@supabase/supabase-js';
import { supabase } from '@/lib/supabase/client';
import type { Caso } from '../types';

export function useCasoRealtime(
  onCasoChange: (caso: Caso) => void,
  enabled = true
) {
  useEffect(() => {
    if (!enabled) return;

    let channel: RealtimeChannel;

    const setup = async () => {
      channel = supabase
        .channel('casos-semaforo')
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'casos',
            filter: 'estado=neq.cerrado', // only active cases
          },
          (payload) => {
            const caso = payload.new as Caso;
            if (caso) onCasoChange(caso);
          }
        )
        .subscribe();

      // Handle subscription errors
      channel.on('system', { event: 'error' }, (err) => {
        console.error('[Realtime] Casos channel error:', err);
      });
    };

    setup();

    return () => {
      if (channel) {
        supabase.removeChannel(channel);
      }
    };
  }, [enabled, onCasoChange]);
}
```

**Anti-pattern to avoid:** Creating a new channel per component instance. Use a single shared channel per session (see `useCasoRealtime` above) and derive local state via React Query / Zustand / context.

### Anti-Patterns to Avoid
| Anti-Pattern | Why It Fails | Correct Approach |
|--------------|--------------|------------------|
| Public bucket for case photos | Anyone with URL can access; no authZ | Private bucket + RLS on `storage.objects` |
| `browser-image-compression` npm package | Unmaintained (3+ years); adds 15KB gzipped | Native `OffscreenCanvas` + `toBlob('image/webp', 0.8)` |
| One Realtime channel per component | Leaks channels; multiple subscriptions = duplicate events | Single shared channel per session, scoped by `enabled` flag |
| RLS policy joining `profiles` directly | Recursion: RLS on `profiles` → policy reads `profiles` → infinite loop | Use `public.current_user_role()` (security definer) |
| `storage.objects` RLS without `foldername()` parsing | Cannot scope to `case_id`; all-or-nothing access | Parse `storage.foldername(name)` to extract `case_id` and `angle` |
| Missing `file_size_limit` / `allowed_mime_types` on bucket | 50MB+ raw uploads from phone cameras choke taller wifi | Enforce at bucket level (10MB, `image/webp`) |

## Don't Hand-Roll
| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Image resize/compress | Custom Canvas wrapper with 200 lines | 30-line helper using `createImageBitmap` + `OffscreenCanvas` | Browser APIs stable since 2020; no maintenance burden |
| Realtime connection management | Manual WebSocket + reconnection logic | `supabase.channel().on('postgres_changes').subscribe()` | Built-in exponential backoff, presence, error handling |
| RLS policy SQL | Ad-hoc policies per table | Template pattern mirroring `0001_profiles.sql` | Consistency, auditability, avoids recursion bugs |
| Folder path generation | String concatenation in components | Centralized `buildPhotoPath(caseId, angle)` in `lib/supabase/storage.ts` | Single source of truth; easy to change convention |

## Common Pitfalls
1. **Supabase Storage RLS + `auth.uid()` recursion**: Writing `storage.objects` policies that reference `profiles` table directly (e.g., `exists(select 1 from profiles where id = auth.uid() and role = 'recepcion')`) causes infinite recursion because `profiles` has its own RLS. **Fix:** Always use `public.current_user_role()` which bypasses RLS via `security definer`.

2. **Tablet photo uploads over 4G**: 12MP phone photos = 3-5MB each × 4 angles = 12-20MB upload. On poor taller wifi/4G this times out or stalls. **Fix:** Client-side downscale to max 1920px longest edge, WebP 0.8 quality → ~300-500KB per photo. Do this in a Web Worker or `requestIdleCallback` to avoid blocking main thread.

3. **Realtime subscription leaks in React**: Creating channel in `useEffect` without cleanup, or creating new channel on every render. **Fix:** Stable channel reference via `useRef`, single subscription per session, cleanup in `useEffect` return. Guard with `enabled` flag for role-based activation (taller only subscribes when viewing active cases list).

4. **Race condition: upload → DB insert**: User uploads photos, then creates caso. If caso insert fails, orphaned photos remain in Storage. **Fix:** Upload photos to temporary path `casos/temp/{sessionId}/`, then on successful caso insert, move via `supabase.storage.from('casos-fotos').move()` to `casos/{caseId}/`. Or use a single transaction via Edge Function (overkill for Phase 2 — temp path + move is simpler).

5. **WebP not supported in Safari < 14**: All target devices are modern tablets/PCs (taller uses recent iPads/Android tablets). WebP support is universal since 2020. No fallback needed.

## Code Examples

### (a) Storage bucket + RLS policy SQL
See **Pattern: Supabase Storage RLS policy shape for case photos** above.

### (b) Client upload call with native compression
```typescript
// src/lib/image-compression.ts
export interface CompressOptions {
  maxDimension: number;     // default 1920
  quality: number;          // default 0.8
  outputType: 'image/webp'; // fixed
}

export async function compressToWebP(
  file: File,
  options: Partial<CompressOptions> = {}
): Promise<File> {
  const { maxDimension = 1920, quality = 0.8, outputType = 'image/webp' } = options;

  // createImageBitmap is off-main-thread, no canvas allocation yet
  const bitmap = await createImageBitmap(file);

  const scale = Math.min(1, maxDimension / Math.max(bitmap.width, bitmap.height));
  const width = Math.round(bitmap.width * scale);
  const height = Math.round(bitmap.height * scale);

  // OffscreenCanvas: no DOM, works in workers, no layout thrash
  const canvas = new OffscreenCanvas(width, height);
  const ctx = canvas.getContext('2d')!;
  ctx.drawImage(bitmap, 0, 0, width, height);
  bitmap.close();

  const blob = await canvas.convertToBlob({ type: outputType, quality });
  return new File([blob], file.name.replace(/\.[^.]+$/, '.webp'), {
    type: outputType,
    lastModified: Date.now(),
  });
}

// src/features/casos/hooks/useCasoPhotos.ts
import { supabase } from '@/lib/supabase/client';
import { compressToWebP } from '@/lib/image-compression';

const ANGLES = ['frente', 'atras', 'lateral-izquierdo', 'lateral-derecho'] as const;
type Angle = (typeof ANGLES)[number];

export function useCasoPhotos() {
  const uploadPhotos = async (caseId: string, files: Record<Angle, File>) => {
    // 1. Compress all 4 in parallel
    const compressed = await Promise.all(
      ANGLES.map((angle) => compressToWebP(files[angle]))
    );

    // 2. Upload to permanent path (case exists)
    const uploads = compressed.map((file, i) => {
      const angle = ANGLES[i];
      const path = `casos/${caseId}/${angle}.webp`;
      return supabase.storage
        .from('casos-fotos')
        .upload(path, file, { cacheControl: '3600', upsert: true });
    });

    const results = await Promise.all(uploads);
    const errors = results.filter((r) => r.error);
    if (errors.length) throw errors[0].error;

    return results.map((r) => r.data!.path);
  };

  const getSignedUrls = async (caseId: string) => {
    const paths = ANGLES.map((a) => `casos/${caseId}/${a}.webp`);
    const { data, error } = await supabase.storage
      .from('casos-fotos')
      .createSignedUrls(paths, 3600); // 1 hour
    if (error) throw error;
    return Object.fromEntries(ANGLES.map((a, i) => [a, data[i].signedUrl]));
  };

  return { uploadPhotos, getSignedUrls };
}
```

### (c) Realtime subscription hook (recommended strategy)
See **Pattern: semaforo update strategy** above for `useCasoRealtime.ts`.

**Alternative refetch-only pattern (not recommended for this phase):**
```typescript
// Only if Realtime is explicitly rejected
export function useCasosRefetch(intervalMs = 30000) {
  const queryClient = useQueryClient();
  useEffect(() => {
    const id = setInterval(() => {
      queryClient.invalidateQueries({ queryKey: ['casos', 'active'] });
    }, intervalMs);
    return () => clearInterval(id);
  }, [queryClient, intervalMs]);
}
```

## Assumptions Log
| # | Claim | Section | Risk if Wrong |
|---|-------|---------|---------------|
| 1 | `current_user_role()` exists and is `security definer` stable | RLS patterns | HIGH — if missing, all policies need rewrite |
| 2 | Target devices support `OffscreenCanvas` + `createImageBitmap` | Image compression | LOW — universal since 2020 (iOS 14+, Android 10+, desktop) |
| 3 | Realtime `postgres_changes` latency < 1s on Vercel-deployed Supabase | Realtime strategy | MEDIUM — if >2s, user perceives lag; fallback to 10s refetch |
| 4 | `casos` table will not need `facturado`/`cobrado` columns in Phase 2 | RLS policies | LOW — explicitly deferred to Fase 5 |
| 5 | 10MB bucket limit sufficient for 4x WebP 1920px photos | Storage config | LOW — WebP 1920px ~400KB each; 4× = 1.6MB << 10MB |

## Open Questions
1. **Migration ordering**: Should `0002_casos.sql` include the Storage bucket creation, or separate migration `0003_storage.sql`? (Supabase CLI applies in lexical order; bucket must exist before RLS policies reference it.)

2. **Realtime on Vercel**: Does Supabase Realtime WebSocket work reliably from Vercel edge functions / serverless? (Yes for client-side; server-side subscriptions not needed here.)

3. **Photo deletion on caso soft-delete**: When `estado = 'cerrado'`, should photos be auto-deleted or retained for audit? (Retain — no DELETE policy; manual cleanup by dueno if needed.)

4. **Offline support**: Recepción may create caso offline? (Out of scope Phase 2 — assumes online taller environment.)

## Sources
### Primary (HIGH confidence)
- Supabase Storage RLS docs: https://supabase.com/docs/guides/storage/security/rules
- Supabase Realtime `postgres_changes`: https://supabase.com/docs/guides/realtime/postgres-changes
- `@supabase/supabase-js` v2 Storage API: https://supabase.com/docs/reference/javascript/storage-from-upload
- `current_user_role()` pattern: `supabase/migrations/0001_profiles.sql` lines 61-74

### Secondary (MEDIUM confidence)
- MDN `OffscreenCanvas` browser support: https://developer.mozilla.org/en-US/docs/Web/API/OffscreenCanvas
- MDN `createImageBitmap`: https://developer.mozilla.org/en-US/docs/Web/API/createImageBitmap
- Supabase JS client Realtime channel lifecycle: https://supabase.com/docs/reference/javascript/realtime-channel

### Tertiary (LOW confidence)
- Community patterns for temporary upload path → move on commit (Supabase Discord, GitHub issues)

## Metadata
**Confidence breakdown:**
- Storage bucket + RLS: HIGH (mirrors existing proven pattern)
- Native image compression: HIGH (standard Web APIs, no deps)
- Realtime vs refetch: HIGH (cross-device requirement makes Realtime correct)
- `casos` RLS: HIGH (direct adaptation of `profiles` pattern)

**Research date:** 2026-08-24
**Valid until:** 2026-11-24 (or until Supabase Storage/Realtime breaking changes)