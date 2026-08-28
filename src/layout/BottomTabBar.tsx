import { NavLink } from 'react-router'
import { navItemsForRole } from '../app/routes'
import type { Profile } from '../auth/AuthProvider'

export function BottomTabBar({ role }: { role: Profile['role'] }) {
  const items = navItemsForRole(role)

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-nav h-16 bg-surface/80 backdrop-blur-sm border-t border-outline shadow-elevation-3 flex items-stretch"
      style={{ height: '64px' }}
      aria-label="Navegación principal"
    >
      <div className="flex w-full items-center justify-around px-2 pb-safe">
        {items.map((item) => {
          const Icon = item.icon
          const isDisabled = !item.available

          if (isDisabled) {
            return (
              <span
                key={item.label}
                className="flex flex-col items-center justify-center gap-1 flex-1 min-w-0 text-label-small font-medium text-on-surface-variant opacity-50 cursor-not-allowed"
                style={{ minHeight: '44px', minWidth: '44px' }}
                title="Disponible en la próxima entrega"
              >
                <Icon size={24} strokeWidth={2} />
                {item.label}
              </span>
            )
          }

          return (
            <NavLink
              key={item.label}
              to={item.to}
              end={item.to === '/'}
              className={({ isActive }) => `
                flex flex-col items-center justify-center gap-1 flex-1 min-w-0 text-label-small font-medium rounded-full px-3 py-1.5
                transition-all duration-fast easing-standard
                ${isActive
                  ? 'bg-primary-container text-on-primary-container'
                  : 'text-on-surface-variant hover:bg-surface-container-high'}
                focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2
              `}
              style={{ minHeight: '44px', minWidth: '44px' }}
            >
              <Icon size={24} strokeWidth={2} />
              {item.label}
            </NavLink>
          )
        })}
      </div>
    </nav>
  )
}