---
phase: 260827-ui-elevation
plan: 01
type: execute
wave: 1
depends_on: []
files_modified: [
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
autonomous: true
requirements: [UI-ELEVATION]
must_haves:
  truths:
    - "Theme tokens expandidos: colores semanticos Material 3 (surface, surfaceContainer, surfaceContainerHigh, onSurface, primary, onPrimary, secondary, onSecondary, tertiary, error, outline, outlineVariant), sombras escalonadas (elevation 1-5), radius consistente (4/8/12/16/28), transiciones estandarizadas (fast 150ms, medium 200ms, slow 300ms), z-index scale"
    - "Ficha: 3 niveles elevation (flat=level0, elevated=level1, tonal=level2), esquinas 12px, sombras Material 3, hover lift + shadow shift, transition-medium"
    - "Button: 4 variantes (filled, tonal, outlined, text), 3 tamaños, icon support, loading spinner circular, ripple-ready, states: hover/pressed/focus/disabled per Material 3"
    - "TextField: 3 variantes (filled, outlined, standard), floating label nativo CSS, leading/trailing icons, helper/error text, character counter, states per Material 3"
    - "EmptyState: warm illustration slot, typography scale, action button (tonal), fade-in + slide-up entrance"
    - "Topbar: elevation 1, surfaceContainer, sticky, logo 40px, search slot, user avatar (32px) con menu dropdown placeholder, responsive collapse"
    - "Sidebar: elevation 1, surfaceContainer, 280px, navigation rail pattern, active indicator pill (primaryContainer), hover surfaceContainerHigh, ripple, icon 24px"
    - "BottomTabBar: elevation 3, surfaceContainer, 64px, active pill primaryContainer, labels text-label-small, icons 24px, safe-area inset"
    - "AppShell: background surface (subtle pattern), min-h-screen, layout transitions, color-scheme light dark ready"
  artifacts:
    - path: "src/styles/theme.css"
      provides: "Design tokens completos Material 3: color scheme, elevation shadows, shape tokens, motion tokens, typography scale, z-index"
    - path: "src/ui/Ficha.tsx"
      provides: "Card component con 3 elevation levels Material 3"
    - path: "src/ui/PrimaryButton.tsx"
      provides: "Button system Material 3: filled/tonal/outlined/text, sizes, icons, states"
    - path: "src/ui/TextField.tsx"
      provides: "TextField Material 3: filled/outlined, floating label, icons, validation"
    - path: "src/ui/EmptyState.tsx"
      provides: "EmptyState warm con illustration, action, entrance animation"
    - path: "src/layout/Topbar.tsx"
      provides: "Topbar Material 3: sticky, elevation, search, user avatar"
    - path: "src/layout/Sidebar.tsx"
      provides: "Navigation Rail Material 3: active pill, hover states, ripple"
    - path: "src/layout/BottomTabBar.tsx"
      provides: "Bottom Navigation Bar Material 3: active pill, safe area"
    - path: "src/layout/AppShell.tsx"
      provides: "Shell con responsive layout, transitions, theme-ready"
tasks:
  - name: "Task 1: Design tokens Material 3 foundation"
    type: "auto"
    tdd: false
    files: ["src/styles/theme.css"]
    behavior:
      - "Expandir @theme con esquema de color Material 3 completo: primary/onPrimary, secondary/onSecondary, tertiary/onTertiary, error/onError, surface/surfaceContainer/surfaceContainerHigh/onSurface, outline/outlineVariant, inverseSurface/inverseOnSurface, inversePrimary"
      - "Sombras elevation 1-5 usando layered shadows (umbra/penumbra/ambient) como Material 3"
      - "Shape tokens: --radius-xs: 4px, --radius-sm: 8px, --radius-md: 12px, --radius-lg: 16px, --radius-xl: 28px, --radius-full: 9999px"
      - "Motion tokens: --duration-fast: 150ms, --duration-medium: 200ms, --duration-slow: 300ms, --easing-standard: cubic-bezier(0.2, 0, 0, 1), --easing-emphasized: cubic-bezier(0.2, 0, 0, 1), --easing-decelerated: cubic-bezier(0, 0, 0.2, 1)"
      - "Typography scale Material 3: display-large/medium/small, headline-large/medium/small, title-large/medium/small, body-large/medium/small, label-large/medium/small"
      - "Z-index: --z-nav: 100, --z-drawer: 200, --z-modal: 300, --z-snackbar: 400, --z-tooltip: 500"
      - "Globals: focus-visible ring (primary), ::selection (primaryContainer), scrollbar thin, color-scheme light dark"
    action: "Reescribir theme.css completamente con sistema Material 3 tokens. Mantener compatibilidad tokens legacy (graphite, steel-100, navy, blue, red, brass, green, gray) como aliases."
    verify:
      automated: "npm run build && npm run typecheck"
    done: "theme.css compila sin errores, tokens Material 3 disponibles en Tailwind v4"

  - name: "Task 2: Card (Ficha) Material 3 elevation"
    type: "auto"
    tdd: false
    files: ["src/ui/Ficha.tsx"]
    behavior:
      - "Props: variant: 'elevated' (default) | 'filled' | 'outlined', elevation?: 0-5, interactive?: boolean, children"
      - "Elevated: bg-surface, shadow-elevation-1, hover: shadow-elevation-2 + translate-y-[-2px], transition-medium"
      - "Filled: bg-surfaceContainerHigh, border-none, hover: bg-surfaceContainerHighest"
      - "Outlined: bg-surface, border-outline, hover: bg-surfaceContainer"
      - "Radius-md (12px), padding: p-4 sm:p-6"
      - "Interactive: cursor-pointer, focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
      - "forwardRef mantenido, className merge"
    action: "Refactor Ficha.tsx con Material 3 card variants, elevation prop, hover/tap states"
    verify:
      automated: "npm run build"
    done: "Ficha.tsx con 3 variants Material 3, elevation 0-5, interactive states"

  - name: "Task 3: Button system Material 3"
    type: "auto"
    tdd: false
    files: ["src/ui/PrimaryButton.tsx"]
    behavior:
      - "Props: variant: 'filled' | 'tonal' | 'outlined' | 'text', size: 'sm' | 'md' | 'lg', loading?, disabled?, leftIcon?, rightIcon?, fullWidth?, onClick, children"
      - "Filled: bg-primary text-onPrimary, hover: bg-primary/90, pressed: bg-primary/80, focus: ring-primary/30, disabled: opacity-38"
      - "Tonal: bg-secondaryContainer text-onSecondaryContainer, hover: bg-secondaryContainer/90, pressed: bg-secondaryContainer/80"
      - "Outlined: bg-transparent text-primary border-primary, hover: bg-primary/10, pressed: bg-primary/20"
      - "Text: bg-transparent text-primary, hover: bg-primary/10, pressed: bg-primary/20"
      - "Sizes: sm (height 32px, px-3 text-label-large), md (height 40px, px-4 text-label-large), lg (height 48px, px-6 text-label-large)"
      - "Radius-full (28px), transition-fast, ripple-ready (CSS active:scale-[0.98])"
      - "Loading: circular spinner 20px, aria-busy, disabled"
      - "Export Button + PrimaryButton (alias compat)"
    action: "Reescribir PrimaryButton.tsx como sistema Button Material 3 completo, mantener export PrimaryButton para compat"
    verify:
      automated: "npm run build"
    done: "Button.tsx con 4 variants, 3 sizes, icons, loading, states Material 3"

  - name: "Task 4: TextField Material 3"
    type: "auto"
    tdd: false
    files: ["src/ui/TextField.tsx"]
    behavior:
      - "Props: label, error?, helperText?, leadingIcon?, trailingIcon?, variant: 'filled' | 'outlined' (default), floatingLabel?: boolean, maxLength?, counter?, disabled?, required?, type?, onChange, value"
      - "Outlined: bg-surface border-outline, hover: border-outlineVariant, focus: border-primary ring-2 ring-primary/20, error: border-error ring-error/20, disabled: opacity-38"
      - "Filled: bg-surfaceContainer border-none, hover: bg-surfaceContainerHigh, focus: ring-2 ring-primary/20 bg-surface, error: ring-error/20"
      - "Floating label nativo: label absolut, transform-origin left, transition-medium, has-value/focus -> scale-75 translate-y-[-24px] text-primary"
      - "Leading/trailing icons: absolute, pointer-events-none, text-onSurfaceVariant, size 20px"
      - "Helper/error: text-body-small, error=text-error, helper=text-onSurfaceVariant, mt-1.5"
      - "Counter: text-label-small text-onSurfaceVariant, right-aligned"
      - "Transition-fast en border, ring, bg"
    action: "Refactor TextField.tsx con Material 3 variants, floating label CSS, icons, validation states"
    verify:
      automated: "npm run build"
    done: "TextField.tsx Material 3: filled/outlined, floating label, icons, helper/error/counter"

  - name: "Task 5: EmptyState warm Material 3"
    type: "auto"
    tdd: false
    files: ["src/ui/EmptyState.tsx"]
    behavior:
      - "Props: icon (LucideIcon), title, description?, action?: {label, onClick, variant}, illustration?: ReactNode, variant: 'default' | 'warm'"
      - "Default: mantiene comportamiento actual"
      - "Warm: container bg-surface radius-xl p-8 sm:p-12, icon 48px text-onSurfaceVariant, title headline-small text-onSurface, description body-medium text-onSurfaceVariant, action Button tonal, illustration slot centered mt-4"
      - "Entrance: animate-in fade-in slide-up-from-bottom-4 duration-medium easing-standard"
      - "Responsive: max-w-md mx-auto"
    action: "Extender EmptyState.tsx con warm variant, action slot, illustration slot, entrance animation CSS"
    verify:
      automated: "npm run build"
    done: "EmptyState.tsx warm variant con illustration, action, entrance animation"

  - name: "Task 6: Layout Shell Material 3"
    type: "auto"
    tdd: false
    files: ["src/layout/Topbar.tsx", "src/layout/Sidebar.tsx", "src/layout/BottomTabBar.tsx", "src/layout/AppShell.tsx"]
    behavior:
      - "Topbar: h-16 (64px) sm:h-18 (72px), sticky top-0 z-nav, bg-surface/80 backdrop-blur-sm border-b border-outline, elevation-1, logo 40px, h1 headline-medium, search slot (hidden sm:flex), user avatar 32px bg-primaryContainer text-onPrimaryContainer, dropdown placeholder (popover-ready)"
      - "Sidebar: w-72 (288px), min-h-[calc(100vh-64px)], bg-surfaceContainer border-r border-outline, elevation-1, nav items: px-3 py-2.5 rounded-md, active: bg-primaryContainer text-onPrimaryContainer font-medium, hover: bg-surfaceContainerHigh, icon 24px gap-3, ripple active:scale-[0.98], transition-fast"
      - "BottomTabBar: h-16 (64px), fixed bottom-0 z-nav, bg-surface/80 backdrop-blur-sm border-t border-outline, elevation-3, items flex-1 py-1.5, active: bg-primaryContainer text-onPrimaryContainer rounded-full px-4, icon 24px, label label-small, safe-area-inset-bottom pb-safe"
      - "AppShell: min-h-screen bg-surface, grid/flex layout responsive, transition-medium en sidebar collapse, color-scheme ready"
      - "Tablet breakpoint: 820px (mantener)"
    action: "Refactor 4 archivos layout con Material 3 tokens, elevation, motion, responsive"
    verify:
      automated: "npm run build && npm run test -- --run src/layout/AppShell.test.tsx 2>/dev/null || npm run build"
    done: "Layout shell Material 3: Topbar sticky blur, Navigation Rail active pill, Bottom Nav Bar, Shell responsive"
</tasks>
</content>