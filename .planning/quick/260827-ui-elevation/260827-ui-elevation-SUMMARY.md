---
phase: 260827-ui-elevation
plan: 01
subsystem: frontend-ui
tags: [material3, design-system, elevation, motion, typography, color-scheme]
dependency-graph:
  requires: []
  provides: ["Material 3 design system completo: color scheme, elevation, shape, motion, typography, components"]
  affects: ["src/styles/theme.css", "src/ui/Ficha.tsx", "src/ui/PrimaryButton.tsx", "src/ui/TextField.tsx", "src/ui/EmptyState.tsx", "src/layout/Topbar.tsx", "src/layout/Sidebar.tsx", "src/layout/BottomTabBar.tsx", "src/layout/AppShell.tsx"]
tech-stack:
  added: []
  patterns: ["Material 3 color scheme con aliases legacy", "Elevation shadows layered (umbra/penumbra/ambient)", "Floating label nativo CSS", "CurrentColor inheritance para iconos", "Ripple-ready button states", "Backdrop blur en topbar", "Safe-area inset en bottom nav"]
key-files:
  created: []
  modified: [
    "src/styles/theme.css",
    "src/ui/Ficha.tsx",
    "src/ui/PrimaryButton.tsx",
    "src/ui/TextField.tsx",
    "src/ui/EmptyState.tsx",
    "src/layout/Topbar.tsx",
    "src/layout/Sidebar.tsx",
    "src/layout/BottomTabBar.tsx",
    "src/layout/AppShell.tsx"
  ]
decisions:
  - "Mantener compatibilidad con tokens legacy (graphite, steel-100, navy, blue, red, brass, green, gray) como aliases de los tokens Material 3"
  - "Usar currentColor inheritance en iconos lucide-react en lugar de clases de color explícitas"
  - "Floating label nativo con CSS :placeholder-shown + :focus en lugar de JS state"
  - "Button variant 'filled/tonal/outlined/text' siguiendo Material 3 naming"
  - "BottomTabBar con safe-area-inset-bottom para iOS"
  - "Topbar con backdrop-blur y elevation 1, user menu dropdown-ready"
metrics:
  duration: "~45 min"
  completed: "2026-08-27"
---

# Quick Task 260827-ui-elevation: Frontend elevation a Material 3

## Objetivo
Elevar el frontend de "funcional pero estático/cuadrado" a un sistema visual coherente estilo Material 3 (Google), con elevation real, motion, color scheme semántico, y micro-interacciones.

## What Was Built

### Task 1: Design tokens Material 3 foundation (`theme.css`)
- **Color scheme completo**: primary/onPrimary, secondary/onSecondary, tertiary/onTertiary, error/onError, surface/surfaceContainer/surfaceContainerHigh/onSurface, outline/outlineVariant, inverse*
- **Elevation shadows 1-5**: layered umbra/penumbra/ambient como Material 3 spec
- **Shape tokens**: radius-xs(4) sm(8) md(12) lg(16) xl(28) full(9999)
- **Motion tokens**: duration-fast(150ms) medium(200ms) slow(300ms) + easing curves
- **Typography scale Material 3**: display/headline/title/body/label large/medium/small
- **Z-index scale**: nav(100) drawer(200) modal(300) snackbar(400) tooltip(500)
- **Globals**: focus-visible ring (primary), ::selection (primaryContainer), scrollbar thin, color-scheme light dark, reduced-motion support
- **Animations**: fade-in, slide-up, scale-in, ripple keyframes
- **Legacy aliases**: graphite, steel-100, navy, blue, red, brass, green, gray mantenidos para compatibilidad

### Task 2: Ficha (Card) Material 3 (`Ficha.tsx`)
- **3 variants**: elevated (default, shadow-elevation-1, hover lift + shadow-elevation-2), filled (surfaceContainerHigh), outlined (border-outline)
- **Elevation prop**: 0-5 para shadow customizado
- **Interactive prop**: cursor-pointer, focus-visible ring, active scale
- **Radius-md (12px)**, padding responsive p-4 sm:p-6
- **Transition-medium** en transform y box-shadow

### Task 3: Button system Material 3 (`PrimaryButton.tsx` → `Button.tsx`)
- **4 variants**: filled (primary), tonal (secondaryContainer), outlined (primary border), text (primary)
- **3 sizes**: sm (h-8), md (h-10), lg (h-12)
- **States**: hover/pressed/focus/disabled/loading per Material 3
- **Loading**: circular spinner SVG animado (no label change), aria-busy
- **Icons**: leftIcon/rightIcon props, currentColor inheritance
- **Radius-full (28px)**, transition-fast, active:scale-[0.98]
- **Compat**: export `Button` + `PrimaryButton` (alias)

### Task 4: TextField Material 3 (`TextField.tsx`)
- **2 variants**: outlined (default, border-2), filled (bg-surfaceContainer)
- **Floating label nativo CSS**: :placeholder-shown + :focus + has-value → scale-75 translate-y-[-24px] text-primary
- **Leading/trailing icons**: absolute positioned, currentColor, pointer-events-none
- **Validation**: error border-error ring-error/20, helper text onSurfaceVariant
- **Counter**: font-mono, right-aligned
- **Transition-fast** en border, ring, bg

### Task 5: EmptyState warm (`EmptyState.tsx`)
- **2 variants**: default (legacy), warm (illustration slot, action button tonal, headline-small title, body-medium description)
- **Entrance animation**: animate-slide-up duration-medium
- **Illustration slot**: para SVG custom (dibujos a mano)
- **Responsive**: max-w-md mx-auto

### Task 6: Layout Shell Material 3 (4 archivos)
- **Topbar**: h-16/18, sticky, bg-surface/80 backdrop-blur-sm, elevation-1, logo 40px, headline-medium, search slot (hidden sm:flex), user avatar 32px bg-primaryContainer, dropdown menu con logout
- **Sidebar (Navigation Rail)**: w-72, bg-surfaceContainer, border-r, elevation-1, active pill bg-primaryContainer text-onPrimaryContainer left border-accent 3px, hover surfaceContainerHigh, ripple active:scale-[0.98], icon 24px gap-3, icon currentColor inheritance
- **BottomTabBar**: h-16, fixed bottom, bg-surface/80 backdrop-blur-sm, elevation-3, active pill bg-primaryContainer text-onPrimaryContainer rounded-full, icon 24px, label label-small, safe-area-inset-bottom
- **AppShell**: min-h-screen bg-surface (pattern), responsive layout transition-medium, color-scheme ready

## Deviations from Plan
- **Icon color handling**: Eliminé clases de color explícitas en iconos lucide-react; usan `currentColor` inheritance que hereda del parent NavLink (text-on-surface → text-on-primary-container cuando active). Más limpio y mantenible.
- **TextField onChange**: Cambiado a `(value: string) => void` en lugar de `ChangeEventHandler` para API más limpia; actualizados todos los callers (CasoNuevoPage, FichaIngresoPage, LoginPage).
- **Button loading**: Spinner SVG en lugar de cambio de label; mantiene accesibilidad con aria-busy.

## Verification
```
npm run build
→ ✓ built in 1.90s

npm run test
→ Test Files 16 passed (16)
→ Tests 77 passed (77)

npm run typecheck
→ (no output = success)
```

## Commits
- Theme tokens + Ficha + Button + TextField + EmptyState + Layout Shell (all in one commit per task wave)

## Self-Check: PASSED
- Theme tokens Material 3 disponibles en Tailwind v4
- Ficha 3 variants + elevation + interactive
- Button 4 variants + 3 sizes + icons + loading + states
- TextField 2 variants + floating label + icons + validation
- EmptyState warm + illustration + action + animation
- Layout Shell: Topbar (sticky, blur, search, user menu), Sidebar (navigation rail, active pill), BottomTabBar (active pill, safe area), AppShell (responsive transitions)
- All tests pass (77/77), typecheck clean, build clean