import { createBrowserRouter, RouterProvider } from 'react-router'
import { LoginPage } from '../features/login/LoginPage'
import { RequireRole } from '../auth/RequireRole'
import { RedirectIfAuthenticated } from '../auth/RedirectIfAuthenticated'
import { AppShell } from '../layout/AppShell'
import { RoleHome } from './roleHome'
import { CasosListPage } from '../features/casos/CasosListPage'
import { CasoNuevoPage } from '../features/casos/CasoNuevoPage'
import { FichaInspeccionPage } from '../features/casos/FichaInspeccionPage'

const router = createBrowserRouter([
  {
    path: '/login',
    element: (
      <RedirectIfAuthenticated>
        <LoginPage />
      </RedirectIfAuthenticated>
    ),
  },
  {
    element: <RequireRole roles={['dueno', 'recepcion', 'taller']} />,
    children: [
      {
        element: <AppShell />,
        children: [
          { index: true, element: <RoleHome /> },
          {
            element: <RequireRole roles={['recepcion']} />,
            children: [
              { path: '/casos', element: <CasosListPage /> },
              { path: '/casos/nuevo', element: <CasoNuevoPage /> },
              { path: '/casos/:id/ficha-inspeccion', element: <FichaInspeccionPage /> },
            ],
          },
        ],
      },
    ],
  },
])

export function AppRouter() {
  return <RouterProvider router={router} />
}
