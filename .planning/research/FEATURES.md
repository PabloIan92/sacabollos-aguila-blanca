# Feature Research

**Domain:** Gestión de taller de reparación de bollos (PDR) con integración de seguros y clientes particulares
**Researched:** 2026-08-19
**Confidence:** HIGH

## Feature Landscape

### Table Stakes (Users Expect These)

| Feature | Why Expected | Complexity | Notes |
|---------|---------------|------------|-------|
| Gestión de casos (Seguro y Particular) | Necesario para diferenciar flujos de trabajo (denuncia, presupuesto, autorización, facturación) | MEDIUM | Incluye estados como "en espera de repuesto", "reparación en curso" |
| Fichas digitales (3 tipos) | Reemplazan el sistema de papel; incluyen fotos y esquema del auto para marcar daños | MEDIUM | Ficha pre-ingreso, ficha de ingreso, ficha de trabajo |
| Semáforo de estado visual | Permite ver rápidamente el estado de cada caso | LOW | Colores/iconos en el listado de casos |
| CRM básico | Gestión de clientes, aseguradoras y productores con historial de casos | LOW | Incluye compañías como Sancor, San Cristóbal, etc. |
| Control de stock simple | Listado de repuestos disponibles | LOW | Sin ciclo de compras, solo actualización manual |
| Roles y permisos | Dueño, recepción, taller con acceso restringido | MEDIUM | Dueño ve facturación completa; taller solo reparación |
| Compatibilidad multi-dispositivo | Funciona en tablet (carga de fotos) y PC | LOW | Diseño responsive |

### Differentiators (Competitive Advantage)

| Feature | Value Proposition | Complexity | Notes |
|---------|--------------------|------------|-------|
| Doble registro de facturación (facturado vs. cobrado) | Transparencia financiera para el dueño | LOW | Mostrar el diferencial solo en vistas del rol "dueño" |
| Esquema del auto con marcación de daños | Mejora la precisión en la documentación | MEDIUM | Canvas/dibujo vectorial en frontend |
| Adaptación a flujos con aseguradoras argentinas | Reduce trabajo manual al enviar presupuestos | HIGH | Plantillas de mail por aseguradora (San Cristóbal, Federación Patronal, Mercantil Andes, Triunfo, Sancor, Coop. Seguros) |
| Historial de casos por cliente/aseguradora | Facilita seguimiento y fidelización | LOW | Listado cronológico en el CRM |

### Anti-Features (Commonly Requested, Often Problematic)

| Feature | Why Requested | Why Problematic | Alternative |
|---------|-----------------|-------------------|--------------|
| Bot de WhatsApp automático | Atención rápida a clientes | Complejidad de integración; requiere servidor propio nuevo, ya fuera de alcance de v1 por decisión del dueño | Planificar en milestone futuro, con infraestructura separada de Lemmon |
| Colaboración en tiempo real (edición simultánea de fichas) | Parece más "moderno" | Riesgo de conflictos y sobrecarga para un taller chico con 3 roles | Ediciones secuenciales con registro de quién cambió qué |
| Analítica avanzada de datos | Métricas de rendimiento | Excesivo para la escala actual (decenas de casos/mes) | Informes básicos: casos por mes, facturado vs. cobrado |

## Feature Dependencies

```
Gestión de Casos
  ├── Fichas Digitales (3 tipos)
  └── Semáforo de Estado
Seguimiento de Reparación
  ├── Ficha de Trabajo
  └── Control de Stock
CRM
  └── Gestión de Casos (historial)
Roles y Permisos
  └── Todas las features (capa transversal)
```

### Dependency Notes

- **Semáforo de Estado requiere Gestión de Casos:** el semáforo es una vista derivada del estado del caso, no una feature independiente
- **CRM se apoya en Gestión de Casos:** el historial de cliente/aseguradora se arma a partir de los casos ya cargados
- **Roles y Permisos atraviesa todo:** debe definirse antes de construir cualquier pantalla, no agregarse al final

## MVP Definition

### Launch With (v1)

- [ ] Gestión de casos (Seguro y Particular)
- [ ] Fichas digitales (3 tipos) con fotos y esquema del auto
- [ ] Semáforo de estado visual
- [ ] CRM básico (clientes, aseguradoras, productores)
- [ ] Control de stock simple
- [ ] Roles y permisos (dueño, recepción, taller)
- [ ] Compatibilidad tablet + PC

### Add After Validation (v1.x)

- [ ] Doble registro de facturación (facturado vs. cobrado) con mayor detalle si hace falta
- [ ] Plantillas de mail personalizadas por aseguradora
- [ ] Informes básicos (casos por mes, facturado vs. cobrado)

### Future Consideration (v2+)

- [ ] Bot de atención por WhatsApp (requiere servidor propio nuevo)
- [ ] App móvil nativa (la PWA cubre el uso en tablet por ahora)
- [ ] Integración con proveedores de repuestos

## Feature Prioritization Matrix

| Feature | User Value | Implementation Cost | Priority |
|---------|------------|----------------------|----------|
| Gestión de Casos | HIGH | MEDIUM | P1 |
| Fichas Digitales | HIGH | MEDIUM | P1 |
| Semáforo de Estado | MEDIUM | LOW | P1 |
| Roles y Permisos | HIGH | MEDIUM | P1 |
| CRM Básico | MEDIUM | LOW | P1 |
| Stock Simple | LOW | LOW | P1 |
| Doble Facturación | MEDIUM | LOW | P1 (pedido explícito del dueño, bajo costo) |
| Plantillas por Aseguradora | HIGH | HIGH | P2 |
| Informes Básicos | LOW | LOW | P2 |

**Priority key:**
- P1: Debe estar en v1
- P2: Se agrega apenas se pueda, no bloquea el lanzamiento

## Competitor Feature Analysis

| Feature | Sistemas genéricos de "body shop management" (EE.UU./Europa) | Soluciones locales (Argentina) | Nuestro enfoque |
|---------|---------------------------------------------------------------|----------------------------------|-------------------|
| Integración con aseguradoras | Integrada a aseguradoras norteamericanas, no aplica localmente | Generalmente ausente o manual | Plantillas de mail + datos estructurados por aseguradora argentina |
| Esquema visual de daños | A veces presente, con más complejidad de la necesaria | Raramente digital (se hace en papel) | Bosquejo simple enfocado en PDR, no en toda la carrocería |
| Escala | Pensados para redes de talleres grandes | Pensados para talleres chicos, pero genéricos | A medida para un solo taller con 3 roles concretos |

## Sources

- Contexto provisto por el usuario (flujos a mano transcriptos)
- Conocimiento general de sistemas de gestión de talleres (body shop management / collision repair software)
- Investigación de dominio delegada a modelo NVIDIA NIM (meta/llama-3.1-70b-instruct y nvidia/llama-3.3-nemotron-super-49b-v1.5)

---
*Feature research for: gestión de taller PDR con casos de seguro y particulares*
*Researched: 2026-08-19*
