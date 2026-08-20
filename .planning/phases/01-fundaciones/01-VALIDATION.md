---
phase: 1
slug: fundaciones
status: validated
nyquist_compliant: true
wave_0_complete: true
created: 2026-08-20
---

# Phase 1 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | Vitest 4.1.11 + @testing-library/react 16.3.2 (none installed yet — greenfield repo) |
| **Config file** | none yet — Wave 0 installs |
| **Quick run command** | `npx vitest run` |
| **Full suite command** | `npx vitest run --coverage` |
| **Estimated runtime** | ~10 seconds |

---

## Sampling Rate

- **After every task commit:** Run `npx vitest run`
- **After every plan wave:** Run `npx vitest run --coverage`
- **Before `/gsd-verify-work`:** Full suite must be green, plus the manual login/invite checklist below
- **Max feedback latency:** 15 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Threat Ref | Secure Behavior | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|------------|-----------------|-----------|-------------------|-------------|--------|
| 1-01-XX | 01 | 1 | AUTH-01 | T-1-01 | Self-role-escalation blocked via column-level GRANT (never grant UPDATE on `role` to authenticated) | manual-only | — (RLS/grant verified via Supabase SQL editor, not unit test) | ❌ W0 | ⬜ pending |
| 1-02-XX | 02 | 1 | AUTH-01 | — | `RequireRole` redirects unauthenticated user to `/login` | unit | `npx vitest run src/auth/RequireRole.test.tsx` | ❌ W0 | ⬜ pending |
| 1-02-XX | 02 | 1 | AUTH-01 | — | `RequireRole` redirects wrong-role user to their own home instead of rendering child route | unit | `npx vitest run src/auth/RequireRole.test.tsx` | ❌ W0 | ⬜ pending |
| 1-02-XX | 02 | 1 | AUTH-01 | — | Nav items rendered match current role's allowed subset | unit | `npx vitest run src/app/routes.test.ts` | ❌ W0 | ⬜ pending |
| 1-02-XX | 02 | 1 | DISPOSITIVO-01 | — | `AppShell` renders `Sidebar` above breakpoint and `BottomTabBar` below it | unit (jsdom + matchMedia mock) | `npx vitest run src/layout/AppShell.test.tsx` | ❌ W0 | ⬜ pending |
| 1-03-XX | 03 | 2 | AUTH-01 | T-1-02 | Edge Function `invite-user` re-validates caller's actual role server-side, rejects client-supplied role escalation | manual-only | — (requires live Supabase project; covered by manual QA checklist) | ❌ W0 | ⬜ pending |
| 1-03-XX | 03 | 2 | AUTH-01 | — | Real login against Supabase (email+password) succeeds and redirects to role home | manual-only | — (requires live Supabase project + seeded test users) | ❌ W0 | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [ ] `npm install -D vitest @testing-library/react @testing-library/jest-dom jsdom` — framework install, none exists yet
- [ ] `vitest.config.ts` (or Vite `test` block) — test runner config
- [ ] `src/test/setup.ts` — jest-dom matchers + `matchMedia` mock for breakpoint tests
- [ ] `src/auth/RequireRole.test.tsx` — covers AUTH-01 route guard
- [ ] `src/app/routes.test.ts` — covers AUTH-01 nav filtering
- [ ] `src/layout/AppShell.test.tsx` — covers DISPOSITIVO-01 responsive layout

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Self-role-escalation blocked at the DB grant level | AUTH-01 | Requires inspecting live Supabase RLS/grants, not a unit-testable code path | In Supabase SQL editor, confirm `authenticated` role has no `UPDATE` grant on `profiles.role` column |
| Edge Function `invite-user` rejects a forged/elevated role from a non-owner caller | AUTH-01 | Requires a live Supabase project + deployed Edge Function | As recepción, attempt to invite a user with role=dueño via the invite screen — must be rejected. As dueño, invite with role=dueño — must succeed |
| Real login flow (email+password) for each of the 3 roles | AUTH-01 | Requires live Supabase Auth, not worth mocking for a 3-plan phase | Log in as dueño, recepción and taller; confirm each lands on their own home screen and sees only their own menu items |
| Responsive layout on a real tablet | DISPOSITIVO-01 | jsdom breakpoint tests confirm the logic, not the real touch/visual experience | Open the app on an actual 10-12" tablet, confirm bottom tab bar is comfortably tappable with a thumb |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 15s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** approved 2026-08-20 (gsd-plan-checker: 12/12 dimensions PASS, 1 non-blocking warning on CLAUDE.md stack version — resolved by updating CLAUDE.md)
