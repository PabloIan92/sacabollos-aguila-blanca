import { Ficha } from './ui/Ficha'
import { TextField } from './ui/TextField'
import { PrimaryButton } from './ui/PrimaryButton'

export default function App() {
  return (
    <div style={{ padding: '2rem', minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <Ficha style={{ width: '100%', maxWidth: '400px' }}>
        <h1 style={{ fontFamily: 'var(--font-display)', fontSize: '1.5rem', fontWeight: 700, textTransform: 'uppercase', textAlign: 'center', marginBottom: '1.5rem' }}>
          INICIAR SESIÓN
        </h1>
        <TextField label="Email" type="email" placeholder="tu@email.com" />
        <TextField label="Contraseña" type="password" placeholder="••••••••" />
        <PrimaryButton style={{ width: '100%', marginTop: '1rem' }}>
          Ingresar
        </PrimaryButton>
      </Ficha>
    </div>
  )
}