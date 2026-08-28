import { describe, it, expect, vi, afterEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { MemoryRouter, Routes, Route } from 'react-router'
import { AppShell } from './AppShell'
import { useAuth } from '../auth/useAuth'

vi.mock('../auth/useAuth')
vi.mock('../lib/supabaseClient', () => ({
  supabase: { auth: { signOut: vi.fn() } },
}))

const mockedUseAuth = vi.mocked(useAuth)

function mockMatchMedia(matches: boolean) {
  Object.defineProperty(window, 'matchMedia', {
    writable: true,
    value: (query: string) => ({
      matches,
      media: query,
      onchange: null,
      addListener: () => {},
      removeListener: () => {},
      addEventListener: () => {},
      removeEventListener: () => {},
      dispatchEvent: () => true,
    }),
  })
}

function renderShell() {
  return render(
    <MemoryRouter initialEntries={['/']}>
      <Routes>
        <Route element={<AppShell />}>
          <Route path="/" element={<div>CONTENIDO</div>} />
        </Route>
      </Routes>
    </MemoryRouter>
  )
}

const duenoProfile = { id: '1', full_name: 'Ana Dueña', role: 'dueno' as const }

afterEach(() => {
  vi.clearAllMocks()
})

describe('AppShell', () => {
  it('con ancho mayor a 820px, monta Sidebar y no BottomTabBar', () => {
    mockMatchMedia(false)
    mockedUseAuth.mockReturnValue({
      session: {},
      profile: duenoProfile,
      loading: false,
      profileError: false,
      retryProfile: vi.fn(),
    } as unknown as ReturnType<typeof useAuth>)

    renderShell()

    expect(screen.getByLabelText('Navegación principal')).toBeInTheDocument()
    expect(screen.getByText('Facturación')).toBeInTheDocument()
    expect(screen.queryByTestId('shell-loading')).not.toBeInTheDocument()
  })

  it('con 820px o menos, monta BottomTabBar y no Sidebar', () => {
    mockMatchMedia(true)
    mockedUseAuth.mockReturnValue({
      session: {},
      profile: duenoProfile,
      loading: false,
      profileError: false,
      retryProfile: vi.fn(),
    } as unknown as ReturnType<typeof useAuth>)

    const { container } = renderShell()

    expect(screen.getByLabelText('Navegación principal')).toBeInTheDocument()
    expect(container.querySelector('nav[style*="220px"]')).not.toBeInTheDocument()
  })

  it('mientras loading es true, no monta ninguna navegación', () => {
    mockMatchMedia(false)
    mockedUseAuth.mockReturnValue({
      session: null,
      profile: null,
      loading: true,
      profileError: false,
      retryProfile: vi.fn(),
    } as unknown as ReturnType<typeof useAuth>)

    renderShell()

    expect(screen.getByTestId('shell-loading')).toBeInTheDocument()
    expect(screen.queryByLabelText('Navegación principal')).not.toBeInTheDocument()
  })

  it('un item no disponible se renderiza deshabilitado y no navegable', () => {
    mockMatchMedia(false)
    mockedUseAuth.mockReturnValue({
      session: {},
      profile: duenoProfile,
      loading: false,
      profileError: false,
      retryProfile: vi.fn(),
    } as unknown as ReturnType<typeof useAuth>)

    renderShell()

    const facturacion = screen.getByText('Facturación')
    expect(facturacion.closest('a')).toBeNull()
  })

  it('Topbar renderiza nombre, chip de rol y menú de usuario con cerrar sesión', async () => {
    mockMatchMedia(false)
    mockedUseAuth.mockReturnValue({
      session: {},
      profile: duenoProfile,
      loading: false,
      profileError: false,
      retryProfile: vi.fn(),
    } as unknown as ReturnType<typeof useAuth>)

    renderShell()

    expect(screen.getByText('Dueño')).toBeInTheDocument()
    // Abrir menú de usuario
    const userButton = screen.getByLabelText('Menú de usuario')
    fireEvent.click(userButton)
    expect(screen.getByText('Cerrar sesión')).toBeInTheDocument()
  })

  it('con estado de error de perfil, renderiza FullScreenError y no monta navegación', () => {
    mockMatchMedia(false)
    mockedUseAuth.mockReturnValue({
      session: {},
      profile: null,
      loading: false,
      profileError: true,
      retryProfile: vi.fn(),
    } as unknown as ReturnType<typeof useAuth>)

    renderShell()

    expect(screen.getByText('No pudimos cargar tu perfil')).toBeInTheDocument()
    expect(screen.queryByLabelText('Navegación principal')).not.toBeInTheDocument()
  })
})
