import { createBrowserRouter, RouterProvider } from 'react-router'
import { LoginPage } from '../features/login/LoginPage'
import { RequireRole } from '../auth/RequireRole'
import { RedirectIfAuthenticated } from '../auth/RedirectIfAuthenticated'
import { AppShell } from '../layout/AppShell'
import { RoleHome } from './roleHome'
import { CasosListPage } from '../features/casos/CasosListPage'
import { CasoNuevoPage } from '../features/casos/CasoNuevoPage'
import { FichaInspeccionPage } from '../features/casos/FichaInspeccionPage'
import { CasoDetailPage } from '../features/casos/CasoDetailPage'
import { FichaIngresoPage } from '../features/casos/FichaIngresoPage'
import { FichaTrabajoPage } from '../features/casos/FichaTrabajoPage'
import { CierreReparacionPage } from '../features/casos/CierreReparacionPage'
import { StockPage } from '../features/stock/StockPage'

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
          { path: '/stock', element: <StockPage /> },
          {
            element: <RequireRole roles={['recepcion']} />,
            children: [
              { path: '/casos', element: <CasosListPage /> },
              { path: '/casos/nuevo', element: <CasoNuevoPage /> },
              { path: '/casos/:id', element: <CasoDetailPage /> },
              { path: '/casos/:id/ficha-inspeccion', element: <FichaInspeccionPage /> },
              { path: '/casos/:id/ficha-ingreso', element: <FichaIngresoPage /> },
            ],
          },
          {
            element: <RequireRole roles={['taller', 'dueno']} />,
            children: [
              { path: '/casos/:id/ficha-trabajo', element: <FichaTrabajoPage /> },
              { path: '/casos/:id/cierre-reparacion', element: <CierreReparacionPage /> },
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
