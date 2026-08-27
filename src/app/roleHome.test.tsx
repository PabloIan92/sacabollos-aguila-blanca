import { describe, it, expect, vi, afterEach, beforeEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { MemoryRouter, Routes, Route } from 'react-router'
import { RoleHome } from './roleHome'
import { useAuth } from '../auth/useAuth'
import { listCasos } from '../features/casos/api'

vi.mock('../auth/useAuth')
vi.mock('../features/casos/api')

const mockedUseAuth = vi.mocked(useAuth)
const mockedListCasos = vi.mocked(listCasos)

function mockProfile(role: 'dueno' | 'recepcion' | 'taller') {
  mockedUseAuth.mockReturnValue({
    session: {},
    profile: { id: '1', full_name: 'Test', role },
    loading: false,
    profileError: false,
    retryProfile: vi.fn(),
  } as unknown as ReturnType<typeof useAuth>)
}

function renderRoleHome() {
  return render(
    <MemoryRouter initialEntries={['/']}>
      <Routes>
        <Route path="/" element={<RoleHome />} />
        <Route path="/casos/nuevo" element={<div>NUEVO CASO</div>} />
      </Routes>
    </MemoryRouter>
  )
}

beforeEach(() => {
  mockedListCasos.mockResolvedValue([])
})

afterEach(() => {
  vi.clearAllMocks()
})

describe('RoleHome', () => {
  it('con rol dueno, renderiza DuenoHome y ninguna otra', () => {
    mockProfile('dueno')
    renderRoleHome()
    expect(screen.getByText('Todavía no hay casos cargados')).toBeInTheDocument()
    expect(screen.queryByText('No hay turnos para hoy')).not.toBeInTheDocument()
    expect(screen.queryByText('No hay casos en el taller todavía')).not.toBeInTheDocument()
  })

  it('con rol recepcion, renderiza RecepcionHome y ninguna otra', async () => {
    mockProfile('recepcion')
    renderRoleHome()
    expect(await screen.findByText('No hay turnos para hoy')).toBeInTheDocument()
    expect(screen.queryByText('Todavía no hay casos cargados')).not.toBeInTheDocument()
    expect(screen.queryByText('No hay casos en el taller todavía')).not.toBeInTheDocument()
  })

  it('con rol taller, renderiza TallerHome y ninguna otra', () => {
    mockProfile('taller')
    renderRoleHome()
    expect(screen.getByText('No hay casos en el taller todavía')).toBeInTheDocument()
    expect(screen.queryByText('Todavía no hay casos cargados')).not.toBeInTheDocument()
    expect(screen.queryByText('No hay turnos para hoy')).not.toBeInTheDocument()
  })

  it('el acceso a caso nuevo de recepción ya está habilitado y navega a /casos/nuevo', async () => {
    mockProfile('recepcion')
    renderRoleHome()
    const boton = await screen.findByRole('button', { name: 'Nuevo caso' })
    expect(boton).not.toBeDisabled()

    fireEvent.click(boton)
    expect(screen.getByText('NUEVO CASO')).toBeInTheDocument()
  })
})
