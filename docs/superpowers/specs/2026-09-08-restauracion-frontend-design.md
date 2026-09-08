# Restauración del frontend de Aguila Blanca

## Objetivo

Recuperar la identidad visual de taller aprobada antes de los commits de Material 3, sin modificar rutas, autenticación, permisos, datos ni la máquina de estados de los casos.

## Enfoques considerados

1. **Restauración selectiva al último estado aprobado (elegido).** Recuperar desde `afdb1e0` los componentes y consumidores modificados por los dos rediseños posteriores. Es la opción de menor riesgo y devuelve una interfaz coherente ya validada.
2. **Conservar el rediseño actual y corregirlo.** Exigiría redefinir tokens, componentes y pantallas sobre una base que perdió la identidad aprobada. Tiene más riesgo y mayor superficie de cambios.
3. **Rediseñar desde cero.** Podría producir una estética nueva, pero no aporta valor al flujo operativo y eleva innecesariamente el riesgo funcional.

## Diseño elegido

La referencia será el estado de `main` en `afdb1e0`, inmediatamente anterior a `8ac99fe` y `4583d2a`. Se restaurarán solamente los archivos de aplicación alterados por esos dos rediseños: tema, primitivas UI, shell, pantallas consumidoras y pruebas asociadas. No se reescribirá el proyecto ni se revertirá el historial de Git.

La interfaz volverá a usar la paleta graphite/steel/navy/blue/red/brass/green, tipografías Oswald, IBM Plex Sans e IBM Plex Mono, fichas con borde marcado y sombra desplazada, y navegación responsive con sidebar en escritorio y barra inferior en tablet.

## Comportamiento y datos

No cambia el flujo de datos. React Router, Supabase Auth, RLS, Realtime, carga de fotos y transiciones de estado conservarán sus contratos actuales. La restauración afecta presentación y las adaptaciones de props introducidas exclusivamente por el rediseño.

## Accesibilidad y estados

Se conservarán etiquetas accesibles, foco visible, estados de carga, error y vacío, y áreas táctiles existentes en la versión aprobada. Se verificará que no queden imports ni variantes de componentes pertenecientes al sistema Material 3 retirado.

## Verificación

La aceptación requiere:

- diff limitado a archivos afectados por el rediseño y esta documentación;
- typecheck sin errores;
- build de producción exitoso;
- suite Vitest completa con variables públicas de Supabase de prueba;
- lint sin errores nuevos;
- búsqueda de tokens o variantes Material 3 huérfanos.

No se desplegará ni se modificará Supabase como parte de este arreglo.
