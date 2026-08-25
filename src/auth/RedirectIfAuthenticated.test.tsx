import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MemoryRouter, Routes, Route } from 'react-router'
import { RedirectIfAuthenticated } from './RedirectIfAuthenticated'
import { useAuth } from './useAuth'

vi.mock('./useAuth')

const mockedUseAuth = vi.mocked(useAuth)

function renderAtLogin() {
  return render(
    <MemoryRouter initialEntries={['/login']}>
      <Routes>
        <Route path="/" element={<div>HOME</div>} />
        <Route
          path="/login"
          element={
            <RedirectIfAuthenticated>
              <div>LOGIN</div>
            </RedirectIfAuthenticated>
          }
        />
      </Routes>
    </MemoryRouter>
  )
}

describe('RedirectIfAuthenticated', () => {
  it('sin sesión, renderiza el login', () => {
    mockedUseAuth.mockReturnValue({ session: null, loading: false } as ReturnType<typeof useAuth>)
    renderAtLogin()
    expect(screen.getByText('LOGIN')).toBeInTheDocument()
  })

  it('con sesión, redirige a / y no renderiza el login', () => {
    mockedUseAuth.mockReturnValue({ session: {}, loading: false } as unknown as ReturnType<typeof useAuth>)
    renderAtLogin()
    expect(screen.getByText('HOME')).toBeInTheDocument()
    expect(screen.queryByText('LOGIN')).not.toBeInTheDocument()
  })

  it('mientras loading es true, no redirige ni renderiza el login', () => {
    mockedUseAuth.mockReturnValue({ session: null, loading: true } as ReturnType<typeof useAuth>)
    renderAtLogin()
    expect(screen.queryByText('LOGIN')).not.toBeInTheDocument()
    expect(screen.queryByText('HOME')).not.toBeInTheDocument()
  })
})
