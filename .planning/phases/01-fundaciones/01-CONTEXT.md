# Phase 1: Fundaciones - Context

**Gathered:** 2026-08-20
**Status:** Ready for planning

<domain>
## Phase Boundary

Los 3 roles (dueño, recepción, taller) pueden entrar al sistema, cada uno ve solo lo que le corresponde, y la app es cómoda de usar tanto en tablet (10-12", uso en el taller) como en PC/notebook (oficina). Incluye la creación del proyecto Supabase (separado de Lemmon Internet), el modelo de auth+roles, el shell de navegación responsive, y las pantallas de inicio por rol. No incluye ningún flujo de negocio (casos, fichas, facturación) — eso es fases siguientes.

</domain>

<decisions>
## Implementation Decisions

### Auth y creación de usuarios
- **D-01:** Los usuarios se crean vía una pantalla de invitación dentro de la app (no alta manual en el panel de Supabase) — **Reversibility:** reversible — es una pantalla más, no cambia el modelo de datos
- **D-02:** Pueden invitar usuarios tanto Dueño como Recepción. Solo Dueño puede asignar el rol "Dueño" a alguien
- **D-03:** Login con email + contraseña estándar (Supabase Auth), sin PIN ni mecanismo custom

### Roles y permisos
- **D-04:** El rol se guarda en una tabla `profiles` propia en Supabase (vinculada al usuario de Auth por `id`), no en `user_metadata` — **Reversibility:** costly — migrar de metadata a tabla más adelante implicaría reescribir políticas RLS y todo el código que lee el rol
- **D-05:** Esta tabla `profiles` es la base para Row Level Security en fases futuras (ej. ocultar facturado/cobrado a recepción y taller en Fase 5)

### Pantalla de inicio por rol
- **D-06:** Dueño → tablero de casos (mismo listado con semáforo de estado que ven los demás roles), con acceso adicional a facturación desde ahí
- **D-07:** Recepción → agenda de turnos del día, con acceso rápido para crear un caso nuevo
- **D-08:** Taller → tablero de casos activos (en reparación / esperando repuesto), filtrado a lo que le toca al taller

### Navegación responsive
- **D-09:** En PC/notebook: sidebar lateral fijo. En tablet: el mismo menú se convierte en barra de navegación inferior (patrón app móvil), pensado para uso táctil con el pulgar
- **D-10:** Tablet de referencia: tamaño grande (10-12", tipo iPad estándar) — no hace falta optimizar para tablets chicas de 7-8"

### Stack técnico
- **D-11:** Supabase nuevo (proyecto separado de Lemmon Internet) para Auth + base de datos — decisión ya tomada a nivel proyecto (ver PROJECT.md)
- **D-12:** Frontend: React + Vite, SPA que se conecta directo a Supabase client-side — encaja con la demo ya construida en `docs/index.html`
- **D-13:** Hosting del frontend: Vercel, deploy automático desde GitHub — separado de la infraestructura de Lemmon

### Claude's Discretion
- Estructura exacta de la tabla `profiles` (columnas además de `role`), nombres de rutas/componentes, librería de routing (React Router u otra) y de UI base (Tailwind, etc.) — dentro de lo que ya fija el brief de diseño existente

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Diseño de marca (ya construido, reusar)
- `docs/index.html` — demo clickeable con mock data: login por rol, tablero de casos con "sello de estado", detalle con bosquejo SVG del auto y fotos placeholder, facturación visible solo si rol=dueño. Es la referencia visual y de flujo para el shell real
- `docs/proyecto.html` — página de estado/roadmap del proyecto (no es parte de la app)

### Contexto de negocio y alcance
- `.planning/PROJECT.md` — visión completa, constraints (infra separada de Lemmon, tablet+PC, facturado/cobrado solo dueño)
- `.planning/REQUIREMENTS.md` — AUTH-01, DISPOSITIVO-01 son los requisitos que cubre esta fase
- `.planning/ROADMAP.md` §Phase 1 — success criteria y plan breakdown (3 plans: proyecto Supabase, shell responsive, login+inicio por rol)
- `docs/flujos-originales/TRANSCRIPCION.md` — transcripción de los flujos a mano originales del dueño (contexto de negocio completo, no específico de esta fase pero útil como referencia de dominio)

No hay ADRs ni specs externos adicionales — decisiones capturadas arriba.

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `docs/index.html`: paleta de colores, tipografías (Oswald/IBM Plex Sans/IBM Plex Mono) y motivo visual ("ficha de taller con sello de estado rotado") ya validados con el dueño — reusar tal cual en la app real, no rediseñar
- `docs/assets/logo-aguila-blanca.jpg`: logo oficial del taller

### Established Patterns
- Paleta fija: `--graphite:#1b1d21 --steel-100:#eef1f3 --steel-300:#d3d9de --navy:#123a6b --blue:#1c4f8c --red:#c0272d --brass:#b3792f --green:#3f7d4f`
- Evitar: fondo crema/beige, badges pill genéricos, gradientes tipo SaaS

### Integration Points
- El shell real (React+Vite) reemplaza `docs/index.html` como demo mock — pero mantiene su lenguaje visual. `docs/index.html` queda como demo pública en GitHub Pages, no se toca en esta fase.

</code_context>

<specifics>
## Specific Ideas

Ninguna referencia puntual adicional más allá de lo ya capturado en decisiones y en la demo existente.

</specifics>

<deferred>
## Deferred Ideas

Ninguna — la discusión se mantuvo dentro del alcance de la fase (auth, roles, navegación, stack).

</deferred>

---

*Phase: 1-Fundaciones*
*Context gathered: 2026-08-20*
