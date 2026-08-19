# Sacabollos Águila Blanca — Sistema de Gestión

Web app de gestión y control para el taller de reparación de bollos (PDR) **Águila Blanca**, que hoy trabaja 100% en papel. Reemplaza fichas, agenda y control de facturación por un sistema único, usable desde tablet (taller) y PC (oficina), con 3 roles: dueño, recepción y taller.

Proyecto gestionado con [GSD](https://github.com/opengsd/gsd-core) (get-shit-done). Infraestructura y base de datos **totalmente separadas** de Lemmon Internet por decisión explícita del dueño.

## Cómo continuar desde otra PC

1. Cloná este repo: `gh repo clone PabloIan92/sacabollos-aguila-blanca`
2. Instalá GSD si no lo tenés: `npx @opengsd/gsd-core@latest --claude --global`
3. Revisá el estado actual: `.planning/STATE.md` (o corré `/gsd-progress` / `/gsd-next` en Claude Code)
4. Documentos clave:
   - `.planning/PROJECT.md` — contexto y alcance del proyecto
   - `.planning/REQUIREMENTS.md` — requisitos v1 (cuando exista)
   - `.planning/ROADMAP.md` — fases del proyecto (cuando exista)
   - `docs/flujos-originales/TRANSCRIPCION.md` — transcripción de las anotaciones a mano originales del dueño (fotos también en esa carpeta)
   - `assets/logo-aguila-blanca.jpg` — logo de la empresa

## Contexto rápido

- Dos canales de trabajo: **Seguro** (denuncia → presupuesto → orden de trabajo de la aseguradora → reparación → factura → cobro) y **Particular** (presupuesto → turno)
- 3 fichas digitales con fotos: inspección pre-ingreso, inspección de ingreso, ficha de trabajo/reparación
- Facturación: diferencia formal vs. total cobrado (visible solo para el rol dueño)
- Bot de atención por WhatsApp queda **fuera de alcance** de este milestone — requiere un servidor propio nuevo, separado del de Lemmon Internet
