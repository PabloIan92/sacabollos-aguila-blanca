import { describe, it, expect, vi, afterEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import { RoleHome } from './roleHome'
import { useAuth } from '../auth/useAuth'

vi.mock('../auth/useAuth')

const mockedUseAuth = vi.mocked(useAuth)

function mockProfile(role: 'dueno' | 'recepcion' | 'taller') {
  mockedUseAuth.mockReturnValue({
    session: {},
    profile: { id: '1', full_name: 'Test', role },
    loading: false,
    profileError: false,
    retryProfile: vi.fn(),
  } as unknown as ReturnType<typeof useAuth>)
}

afterEach(() => {
  vi.clearAllMocks()
})

describe('RoleHome', () => {
  it('con rol dueno, renderiza DuenoHome y ninguna otra', () => {
    mockProfile('dueno')
    render(<RoleHome />)
    expect(screen.getByText('Todavía no hay casos cargados')).toBeInTheDocument()
    expect(screen.queryByText('No hay turnos para hoy')).not.toBeInTheDocument()
    expect(screen.queryByText('No hay casos en el taller todavía')).not.toBeInTheDocument()
  })

  it('con rol recepcion, renderiza RecepcionHome y ninguna otra', () => {
    mockProfile('recepcion')
    render(<RoleHome />)
    expect(screen.getByText('No hay turnos para hoy')).toBeInTheDocument()
    expect(screen.queryByText('Todavía no hay casos cargados')).not.toBeInTheDocument()
    expect(screen.queryByText('No hay casos en el taller todavía')).not.toBeInTheDocument()
  })

  it('con rol taller, renderiza TallerHome y ninguna otra', () => {
    mockProfile('taller')
    render(<RoleHome />)
    expect(screen.getByText('No hay casos en el taller todavía')).toBeInTheDocument()
    expect(screen.queryByText('Todavía no hay casos cargados')).not.toBeInTheDocument()
    expect(screen.queryByText('No hay turnos para hoy')).not.toBeInTheDocument()
  })

  it('el acceso a caso nuevo de recepción está deshabilitado y no es navegable', () => {
    mockProfile('recepcion')
    render(<RoleHome />)
    const boton = screen.getByRole('button', { name: 'Nuevo caso' })
    expect(boton).toBeDisabled()
    expect(boton.closest('a')).toBeNull()
  })
})
