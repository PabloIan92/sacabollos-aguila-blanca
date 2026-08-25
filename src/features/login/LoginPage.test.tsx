import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { LoginPage } from './LoginPage'

const signInWithPassword = vi.fn()

vi.mock('../../lib/supabaseClient', () => ({
  supabase: {
    auth: {
      signInWithPassword: (...args: unknown[]) => signInWithPassword(...args),
    },
  },
}))

function fillForm(email: string, password: string) {
  fireEvent.change(screen.getByLabelText('Email'), { target: { value: email } })
  fireEvent.change(screen.getByLabelText('Contraseña'), { target: { value: password } })
}

describe('LoginPage', () => {
  beforeEach(() => {
    signInWithPassword.mockReset()
  })

  it('deshabilita el submit hasta que el email y la contraseña son válidos', () => {
    render(<LoginPage />)
    const submit = screen.getByRole('button', { name: 'Ingresar' })

    expect(submit).toBeDisabled()

    fillForm('no-es-un-email', 'secreta123')
    expect(submit).toBeDisabled()

    fillForm('dueno@aguilablanca.com', 'secreta123')
    expect(submit).not.toBeDisabled()
  })

  it('llama a signInWithPassword una sola vez con credenciales válidas', async () => {
    signInWithPassword.mockResolvedValue({ error: null })
    render(<LoginPage />)

    fillForm('dueno@aguilablanca.com', 'secreta123')
    fireEvent.click(screen.getByRole('button', { name: 'Ingresar' }))

    await waitFor(() => expect(signInWithPassword).toHaveBeenCalledTimes(1))
    expect(signInWithPassword).toHaveBeenCalledWith({
      email: 'dueno@aguilablanca.com',
      password: 'secreta123',
    })
  })

  it('muestra la copy fija de error con credenciales inválidas y conserva el email', async () => {
    signInWithPassword.mockResolvedValue({ error: { message: 'Invalid login credentials' } })
    render(<LoginPage />)

    fillForm('dueno@aguilablanca.com', 'incorrecta')
    fireEvent.click(screen.getByRole('button', { name: 'Ingresar' }))

    expect(await screen.findByText('No pudimos iniciar sesión')).toBeInTheDocument()
    expect(screen.getByText('Revisá el email y la contraseña e intentá de nuevo.')).toBeInTheDocument()
    expect(screen.getByLabelText('Email')).toHaveValue('dueno@aguilablanca.com')
  })

  it('muestra "Ingresando…" y deshabilita el botón mientras el pedido está en curso, sin doble submit', async () => {
    let resolveSignIn: (value: { error: null }) => void = () => {}
    signInWithPassword.mockImplementation(
      () => new Promise((resolve) => { resolveSignIn = resolve })
    )
    render(<LoginPage />)

    fillForm('dueno@aguilablanca.com', 'secreta123')
    const submit = screen.getByRole('button', { name: 'Ingresar' })
    fireEvent.click(submit)

    expect(await screen.findByRole('button', { name: 'Ingresando…' })).toBeDisabled()
    fireEvent.click(submit)

    resolveSignIn({ error: null })
    await waitFor(() => expect(signInWithPassword).toHaveBeenCalledTimes(1))
  })

  it('nunca renderiza el mensaje crudo devuelto por Supabase', async () => {
    signInWithPassword.mockResolvedValue({ error: { message: 'Invalid login credentials' } })
    render(<LoginPage />)

    fillForm('dueno@aguilablanca.com', 'incorrecta')
    fireEvent.click(screen.getByRole('button', { name: 'Ingresar' }))

    await screen.findByText('No pudimos iniciar sesión')
    expect(screen.queryByText('Invalid login credentials')).not.toBeInTheDocument()
  })
})
