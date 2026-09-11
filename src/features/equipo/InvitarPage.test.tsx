import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { InvitarPage } from './InvitarPage'
import * as api from './api'

vi.mock('./api', () => ({
  listColaboradores: vi.fn(),
  invitarColaborador: vi.fn(),
}))

const mockList = vi.mocked(api.listColaboradores)
const mockInvitar = vi.mocked(api.invitarColaborador)

const sampleTeam = [
  { id: 'u-1', full_name: 'Ana Dueña', role: 'dueno' as const },
  { id: 'u-2', full_name: 'Lucas Recepción', role: 'recepcion' as const },
  { id: 'u-3', full_name: 'Pablo Chapista', role: 'taller' as const },
]

describe('InvitarPage', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockList.mockResolvedValue(sampleTeam)
  })

  it('renderiza la lista de colaboradores existentes', async () => {
    render(<InvitarPage />)

    expect(await screen.findByText('Ana Dueña')).toBeInTheDocument()
    expect(screen.getByText('Lucas Recepción')).toBeInTheDocument()
    expect(screen.getByText('Pablo Chapista')).toBeInTheDocument()
    expect(screen.getByText('Dueño')).toBeInTheDocument()
    expect(screen.getByText('Recepción')).toBeInTheDocument()
    expect(screen.getByText('Taller')).toBeInTheDocument()
  })

  it('valida campos obligatorios antes de enviar', async () => {
    render(<InvitarPage />)
    await screen.findByText('Ana Dueña')

    fireEvent.click(screen.getByRole('button', { name: /enviar invitación/i }))

    expect(await screen.findByText(/ingrese el nombre del colaborador/i)).toBeInTheDocument()
    expect(mockInvitar).not.toHaveBeenCalled()
  })

  it('envía invitación exitosamente y limpia el formulario', async () => {
    mockInvitar.mockResolvedValue({
      success: true,
      message: 'Invitación enviada a nuevo@taller.com',
    })

    render(<InvitarPage />)
    await screen.findByText('Ana Dueña')

    fireEvent.change(screen.getByLabelText(/nombre completo/i), {
      target: { value: 'Nuevo Colaborador' },
    })
    fireEvent.change(screen.getByLabelText(/correo electrónico/i), {
      target: { value: 'nuevo@taller.com' },
    })
    fireEvent.change(screen.getByLabelText(/rol en el sistema/i), {
      target: { value: 'recepcion' },
    })

    fireEvent.click(screen.getByRole('button', { name: /enviar invitación/i }))

    await waitFor(() => {
      expect(mockInvitar).toHaveBeenCalledWith({
        full_name: 'Nuevo Colaborador',
        email: 'nuevo@taller.com',
        role: 'recepcion',
      })
    })

    expect(await screen.findByText(/invitación enviada a nuevo@taller.com/i)).toBeInTheDocument()
  })

  it('muestra mensaje de error si falla la API', async () => {
    mockInvitar.mockRejectedValue(new Error('Error de conexión con el servicio'))

    render(<InvitarPage />)
    await screen.findByText('Ana Dueña')

    fireEvent.change(screen.getByLabelText(/nombre completo/i), {
      target: { value: 'Colaborador Fallido' },
    })
    fireEvent.change(screen.getByLabelText(/correo electrónico/i), {
      target: { value: 'fallo@taller.com' },
    })

    fireEvent.click(screen.getByRole('button', { name: /enviar invitación/i }))

    expect(await screen.findByText(/error de conexión con el servicio/i)).toBeInTheDocument()
  })
})
