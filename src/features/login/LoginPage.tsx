import { useState, type FormEvent } from 'react'
import { Ficha } from '../../ui/Ficha'
import { TextField } from '../../ui/TextField'
import { PrimaryButton } from '../../ui/PrimaryButton'
import { supabase } from '../../lib/supabaseClient'

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

export function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(false)

  const canSubmit = email.length > 0 && password.length > 0 && EMAIL_PATTERN.test(email)

  async function handleSubmit(event: FormEvent) {
    event.preventDefault()
    if (!canSubmit || loading) return

    setLoading(true)
    setError(false)

    const { error: signInError } = await supabase.auth.signInWithPassword({ email, password })

    setLoading(false)
    if (signInError) {
      setError(true)
    }
  }

  return (
    <div style={{ padding: '2rem', minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ width: '100%', maxWidth: '400px' }}>
        <p className="font-mono text-xs uppercase tracking-wide text-red text-center mb-2">
          Acceso al sistema
        </p>
        <h1 className="font-display text-2xl font-bold uppercase text-center mb-6">
          Iniciar sesión
        </h1>
        <Ficha>
          <form onSubmit={handleSubmit}>
            <TextField
              label="Email"
              type="email"
              autoComplete="username"
              value={email}
              onChange={setEmail}
              className="mb-4"
            />
            <TextField
              label="Contraseña"
              type="password"
              autoComplete="current-password"
              value={password}
              onChange={setPassword}
              className="mb-4"
            />
            {error && (
              <div role="alert" className="mb-4 text-sm text-red">
                <p className="font-semibold">No pudimos iniciar sesión</p>
                <p>Revisá el email y la contraseña e intentá de nuevo.</p>
              </div>
            )}
            <PrimaryButton type="submit" disabled={!canSubmit} loading={loading} style={{ width: '100%' }}>
              Ingresar
            </PrimaryButton>
          </form>
        </Ficha>
      </div>
    </div>
  )
}
