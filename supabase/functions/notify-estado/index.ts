import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

interface Caso {
  id: string
  patente: string
  estado: string
  cliente_nombre: string
}

interface WebhookPayload {
  type: 'INSERT' | 'UPDATE' | 'DELETE'
  table: string
  record: Caso
  schema: string
  old_record: Caso
}

serve(async (req) => {
  try {
    const payload: WebhookPayload = await req.json()
    
    if (payload.type === 'UPDATE') {
      const oldCaso = payload.old_record
      const newCaso = payload.record

      if (oldCaso && newCaso && oldCaso.estado !== newCaso.estado) {
        const resendApiKey = Deno.env.get('RESEND_API_KEY')
        const duenoEmail = Deno.env.get('DUENO_EMAIL')

        if (!resendApiKey || !duenoEmail) {
          throw new Error('Missing environment variables')
        }

        const res = await fetch('https://api.resend.com/emails', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${resendApiKey}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            from: 'Aguila Blanca Notificaciones <onboarding@resend.dev>',
            to: duenoEmail,
            subject: `[Aguila Blanca] ${newCaso.patente} → ${newCaso.estado}`,
            html: `
              <h2>Actualización de Estado</h2>
              <p>El caso <strong>${newCaso.patente}</strong> (${newCaso.cliente_nombre}) ha cambiado su estado.</p>
              <ul>
                <li><strong>Estado anterior:</strong> ${oldCaso.estado}</li>
                <li><strong>Nuevo estado:</strong> ${newCaso.estado}</li>
              </ul>
            `
          })
        })

        if (!res.ok) {
          const errorText = await res.text()
          throw new Error(`Error de Resend: ${errorText}`)
        }
      }
    }

    return new Response(JSON.stringify({ success: true }), {
      headers: { 'Content-Type': 'application/json' },
      status: 200,
    })
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { 'Content-Type': 'application/json' },
      status: 500,
    })
  }
})
