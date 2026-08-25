import { createBrowserRouter, RouterProvider } from 'react-router'
import { LoginPage } from '../features/login/LoginPage'
import { RequireRole } from '../auth/RequireRole'
import { RedirectIfAuthenticated } from '../auth/RedirectIfAuthenticated'
import { AppShell } from '../layout/AppShell'
import { RoleHome } from './roleHome'

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
        children: [{ index: true, element: <RoleHome /> }],
      },
    ],
  },
])

export function AppRouter() {
  return <RouterProvider router={router} />
}
