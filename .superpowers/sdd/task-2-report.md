# Task 2 — Domain types and Supabase APIs

## Scope delivered

- Extended `Caso` with the repair/closing timestamp and pending-part fields.
- Added repair damage types, final-photo and signed-order angle constants, and the repair workflow APIs.
- Added stock item types plus listing, CRUD, normalization, client validation, and error propagation APIs.
- Added focused Supabase-mock tests for tables, payloads, order, returns, client validation, and every API error path.

## RED

Before production code, I added the repair API contracts to `src/features/casos/api.test.ts` and created `src/features/stock/api.test.ts`, then ran:

```text
npm test -- src/features/casos/api.test.ts src/features/stock/api.test.ts
```

The RED run failed as expected: `src/features/stock/api.test.ts` could not resolve `./api`; repair exports such as `startRepair` and `listRepairDamages` were not functions; and the photo constants were `undefined`. Result: `Test Files 2 failed`, with `20 failed | 12 passed` tests in the loaded suite.

## GREEN

Implemented the minimum types and APIs to satisfy those contracts. The first GREEN run exposed three test-double/async-contract issues and one implementation ordering issue:

- Update/delete mock chains did not record the `eq` spy, so the mocks were made to record their real chain arguments.
- `waitForPart` threw synchronously; it is now async, so a client-side blank part is a rejected promise.
- Stock normalization occurred after `supabase.from`; normalization now happens before any Supabase call, which ensures invalid values are rejected client-side without database access.
- During self-review, the new repair declarations were found inside the `CreateCasoInput` union, making `UpdateReparacionDanoInput` accidentally include the particular-case branch. The declarations were moved after the completed union and fresh verification was run.

## Commands and results

```text
npm test -- src/features/casos/api.test.ts src/features/stock/api.test.ts
```

- RED: expected missing module/exports/constants failures.
- Final GREEN: `Test Files 2 passed`, `Tests 48 passed`.

```text
npm run typecheck
```

- Passed with exit code 0.

```text
git diff --check
```

- Passed without whitespace errors. Git emitted only the existing Windows LF/CRLF conversion warnings.

## Auto-review

Checked that all repair operations use `reparacion_danos`, scope mutations by damage `id`, and preserve the required insert defaults. Case state methods send only the specified state/timestamp payloads. Stock API calls use `stock_items`, sort by `nombre` ascending, accept only the typed patch fields, trim `nombre`/`unidad`, and reject blank, negative, and non-finite quantities before Supabase access.

## Commit

- `feat: add repair and stock APIs`

## Concerns

- Supabase calls are covered with project-local mocks and typechecking. This worktree has no configured live Supabase test environment, so RLS/database behavior is not exercised here.
