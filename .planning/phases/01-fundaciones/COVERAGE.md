# API Coverage — Supabase Auth Admin API (`supabase.auth.admin.*`)

> Full coverage by default. Opt-outs are explicit, reasoned decisions.

**Phase:** 1 — Fundaciones
**Integration surface:** the Supabase Auth Admin API, reached only from inside the `invite-user` Edge Function (the sole holder of the service-role key). Client code never touches this surface.
**Client library:** `@supabase/supabase-js` 2.112.3
**Reference:** `01-RESEARCH.md` §Architecture Patterns (system diagram), §Code Examples (invite-user Edge Function), §Alternatives Considered (`createUser` vs `inviteUserByEmail`), Assumption A5.

## Coverage Matrix

| capability | decision | reason |
|---|---|---|
| create_user (`admin.createUser`) | INTEGRATE | Es el mecanismo de alta elegido para D-01/D-02: crea el usuario con contraseña temporal y `user_metadata.role`, que el trigger `handle_new_user()` copia a `profiles`. Único llamado privilegiado de la fase. |
| invite_user_by_email (`admin.inviteUserByEmail`) | OPT-OUT | Requiere configurar SMTP/entregabilidad para cero beneficio en un equipo de 3 personas que se ven en persona; RESEARCH.md A5 eligió contraseña temporal comunicada de viva voz. Cambiar a este camino más adelante no toca `profiles` ni las políticas RLS. |
| generate_link (`admin.generateLink`) | OPT-OUT | No hay flujo de magic link, confirmación por email ni recuperación de contraseña en esta fase — `01-UI-SPEC.md` §Login declara explícitamente que no se agrega "olvidé mi contraseña". |
| list_users (`admin.listUsers`) | OPT-OUT | El listado de usuarios se lee de `public.profiles` con el JWT del propio usuario bajo la política `profiles_select_all_for_admins`, no con la service-role key. Usar el Admin API acá agrandaría sin necesidad la superficie privilegiada. |
| get_user_by_id (`admin.getUserById`) | OPT-OUT | Igual que `list_users`: el perfil propio se lee de `profiles` bajo `profiles_select_own`. Ningún requisito de la fase pide leer un usuario de Auth por id. |
| update_user_by_id (`admin.updateUserById`) | OPT-OUT | En esta fase nadie edita el email, la contraseña ni el rol de otro usuario ya creado. Cuando aparezca ese requisito, es el llamado que hay que agregar (y el único camino legítimo para cambiar `profiles.role`, porque el `GRANT` de columna se lo niega a `authenticated`). |
| delete_user (`admin.deleteUser`) | OPT-OUT | Baja o desactivación de usuarios no está en el alcance de la Fase 1; ningún requisito (AUTH-01, DISPOSITIVO-01) la pide. |
| sign_out (`admin.signOut`) | OPT-OUT | El logout lo ejecuta el propio usuario con `auth.signOut()` client-side; no hay caso de uso de revocar la sesión de un tercero. Se revisa si en el futuro se decide acortar la vida de sesión en la tablet compartida (RESEARCH.md Pitfall 4). |
| update_user_by_id — app_metadata | OPT-OUT | El rol vive en `profiles` por decisión D-04, no en `app_metadata`; escribir metadata de autorización sería mantener dos fuentes de verdad del mismo dato. |
| mfa.list_factors (`admin.mfa.listFactors`) | OPT-OUT | MFA no está en el alcance: D-03 fija login con email + contraseña estándar, sin mecanismo adicional. |
| mfa.delete_factor (`admin.mfa.deleteFactor`) | OPT-OUT | Idem — no hay factores MFA que administrar porque no se habilita MFA en esta fase. |

## Notes

- Toda fila `OPT-OUT` es una decisión tomada, no un hueco: ninguna de estas capacidades tiene un requisito de la Fase 1 que la reclame, y cada una queda registrada acá para que una fase futura arranque desde esta línea de base en vez de desde cero.
- El principio que gobierna la matriz: **cada capacidad que se integra amplía la superficie que corre con la service-role key**. `create_user` se integra porque D-01/D-02 lo exigen; el resto se lee con el JWT del usuario y RLS, que es un límite de seguridad más angosto.
