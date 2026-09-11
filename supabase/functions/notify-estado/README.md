# Deploy notify-estado function

Instrucciones de deploy:
```bash
supabase functions deploy notify-estado --project-ref tnwrewghcowayuudvxey
supabase secrets set RESEND_API_KEY=re_... DUENO_EMAIL=dueno@ejemplo.com --project-ref tnwrewghcowayuudvxey
# Luego en Supabase Dashboard > Database > Webhooks:
# Tabla: casos, Evento: UPDATE, URL: https://tnwrewghcowayuudvxey.supabase.co/functions/v1/notify-estado
```
