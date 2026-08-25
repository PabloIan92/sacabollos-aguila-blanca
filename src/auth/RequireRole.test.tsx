import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MemoryRouter, Routes, Route } from 'react-router'
import { RequireRole } from './RequireRole'
import { useAuth } from './useAuth'

vi.mock('./useAuth')

const mockedUseAuth = vi.mocked(useAuth)

function renderAtInvitar() {
  return render(
    <MemoryRouter initialEntries={['/invitar']}>
      <Routes>
        <Route path="/login" element={<div>LOGIN</div>} />
        <Route path="/" element={<div>HOME</div>} />
        <Route element={<RequireRole roles={['dueno']} />}>
          <Route path="/invitar" element={<div>INVITAR</div>} />
        </Route>
      </Routes>
    </MemoryRouter>
  )
}

describe('RequireRole', () => {
  it('sin sesión, redirige a /login', () => {
    mockedUseAuth.mockReturnValue({ session: null, profile: null, loading: false } as ReturnType<typeof useAuth>)
    renderAtInvitar()
    expect(screen.getByText('LOGIN')).toBeInTheDocument()
  })

  it('con sesión y rol taller, redirige a / y no renderiza el hijo', () => {
    mockedUseAuth.mockReturnValue({
      session: { user: { id: '1' } },
      profile: { id: '1', full_name: 'Juan', role: 'taller' },
      loading: false,
    } as unknown as ReturnType<typeof useAuth>)
    renderAtInvitar()
    expect(screen.getByText('HOME')).toBeInTheDocument()
    expect(screen.queryByText('INVITAR')).not.toBeInTheDocument()
  })

  it('con sesión y rol dueno, renderiza el hijo', () => {
    mockedUseAuth.mockReturnValue({
      session: { user: { id: '1' } },
      profile: { id: '1', full_name: 'Juan', role: 'dueno' },
      loading: false,
    } as unknown as ReturnType<typeof useAuth>)
    renderAtInvitar()
    expect(screen.getByText('INVITAR')).toBeInTheDocument()
  })

  it('mientras loading es true, no redirige ni renderiza el hijo', () => {
    mockedUseAuth.mockReturnValue({ session: null, profile: null, loading: true } as ReturnType<typeof useAuth>)
    renderAtInvitar()
    expect(screen.queryByText('LOGIN')).not.toBeInTheDocument()
    expect(screen.queryByText('INVITAR')).not.toBeInTheDocument()
    expect(screen.getByTestId('auth-loading')).toBeInTheDocument()
  })
})
