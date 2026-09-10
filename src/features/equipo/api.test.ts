import { beforeEach, describe, expect, it, vi } from 'vitest'
import { listColaboradores, invitarColaborador } from './api'
import { supabase } from '../../lib/supabaseClient'

vi.mock('../../lib/supabaseClient', () => ({
  supabase: {
    from: vi.fn(),
    functions: {
      invoke: vi.fn(),
    },
  },
}))

describe('equipo api', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('lista los colaboradores activos ordenados', async () => {
    const mockProfiles = [
      { id: 'u-1', full_name: 'Ana Dueña', role: 'dueno' },
      { id: 'u-2', full_name: 'Carlos Taller', role: 'taller' },
    ]
    const mockOrder = vi.fn().mockResolvedValue({ data: mockProfiles, error: null })
    const mockSelect = vi.fn().mockReturnValue({ order: mockOrder })
    vi.mocked(supabase.from).mockReturnValue({ select: mockSelect } as any)

    const result = await listColaboradores()
    expect(result).toHaveLength(2)
    expect(result[0].full_name).toBe('Ana Dueña')
    expect(supabase.from).toHaveBeenCalledWith('profiles')
  })

  it('rechaza invitaciones con datos incompletos o rol inválido', async () => {
    await expect(
      invitarColaborador({ full_name: '', email: 'test@taller.com', role: 'taller' })
    ).rejects.toThrow('El nombre del colaborador es obligatorio')

    await expect(
      invitarColaborador({ full_name: 'Juan', email: '   ', role: 'taller' })
    ).rejects.toThrow('El email del colaborador es obligatorio')

    await expect(
      invitarColaborador({ full_name: 'Juan', email: 'juan@taller.com', role: 'dueno' as any })
    ).rejects.toThrow('El rol asignado debe ser recepción o taller')
  })

  it('envía invitación exitosamente con edge function', async () => {
    vi.mocked(supabase.functions.invoke).mockResolvedValue({
      data: { message: 'Invitación enviada por email' },
      error: null,
    } as any)

    const res = await invitarColaborador({
      full_name: 'Martín Recepción',
      email: 'martin@aguilablanca.com',
      role: 'recepcion',
    })

    expect(res.success).toBe(true)
    expect(res.message).toBe('Invitación enviada por email')
    expect(supabase.functions.invoke).toHaveBeenCalledWith('invitar-colaborador', {
      body: {
        full_name: 'Martín Recepción',
        email: 'martin@aguilablanca.com',
        role: 'recepcion',
      },
    })
  })

  it('usa fallback si la edge function no responde o falla', async () => {
    vi.mocked(supabase.functions.invoke).mockRejectedValue(new Error('Network error'))

    const res = await invitarColaborador({
      full_name: 'Pedro Taller',
      email: 'pedro@aguilablanca.com',
      role: 'taller',
    })

    expect(res.success).toBe(true)
    expect(res.message).toContain('Pedro Taller (taller)')
  })
})
