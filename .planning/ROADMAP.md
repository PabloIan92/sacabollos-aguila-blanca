# Roadmap: Sistema de Gestión — Sacabollos Aguila Blanca

## Overview

El proyecto se construye como una serie de rebanadas verticales (MVP): cada fase entrega algo end-to-end que se puede probar de verdad, no una capa técnica aislada. Se arranca por las fundaciones de acceso (login + roles + que la app funcione bien en tablet y PC), después se resuelve el flujo más largo y completo (un caso de Seguro de punta a punta hasta que el auto entra al taller), luego el flujo más corto que reutiliza esa base (caso Particular), después la reparación en el taller con repuestos y stock, luego facturación y cobros (con el control de acceso al diferencial facturado/cobrado), y se cierra con el CRM que se apoya en el historial de casos ya generado por las fases anteriores.

## Phases

**Phase Numbering:**
- Integer phases (1, 2, 3): Planned milestone work
- Decimal phases (2.1, 2.2): Urgent insertions (marked with INSERTED)

- [ ] **Phase 1: Fundaciones** - Login con roles y app usable en tablet y PC
- [ ] **Phase 2: Caso de Seguro** - Flujo completo desde denuncia hasta ingreso del auto al taller
- [ ] **Phase 3: Caso Particular** - Presupuesto y turno para clientes particulares
- [ ] **Phase 4: Reparación y Stock** - Ficha de trabajo, repuestos faltantes y listado de materiales
- [ ] **Phase 5: Facturación y Cobros** - Facturado vs. cobrado (solo dueño) y reclamo a la aseguradora
- [ ] **Phase 6: CRM** - Clientes, aseguradoras y productores con historial de casos

## Phase Details

### Phase 1: Fundaciones
**Goal**: Los 3 roles pueden entrar al sistema y usarlo cómodamente en tablet y en PC
**Mode:** mvp
**Depends on**: Nothing (first phase)
**Requirements**: AUTH-01, DISPOSITIVO-01
**Success Criteria** (what must be TRUE):
  1. Dueño, recepción y taller inician sesión cada uno con su propio usuario
  2. Cada rol ve solo las secciones de menú que le corresponden
  3. La app se ve y se usa bien tanto en una tablet como en una PC/notebook
**Plans**: 3 plans

Plans:
- [ ] 01-01: Proyecto Supabase nuevo (separado de Lemmon Internet) con Auth y roles
- [ ] 01-02: Shell de la app — routing por rol y layout responsive
- [ ] 01-03: Login y pantallas de inicio por rol

### Phase 2: Caso de Seguro
**Goal**: Un caso de seguro se puede seguir de punta a punta, desde la denuncia hasta que el auto ingresa al taller
**Mode:** mvp
**Depends on**: Phase 1
**Requirements**: CASOS-01, CASOS-02, CASOS-04, CASOS-05, FICHAS-01, FICHAS-02, FICHAS-04
**Success Criteria** (what must be TRUE):
  1. Recepción crea un caso de canal Seguro con denuncia, número de siniestro y datos del productor
  2. Usuario completa la ficha de inspección pre-ingreso con fotos y bosquejo del auto, y no puede guardarla sin los campos obligatorios
  3. El caso muestra un semáforo de estado que avanza mientras el caso progresa (denuncia → orden de trabajo → turno → ingreso)
  4. Recepción coordina el turno y registra el ingreso del auto con la ficha de ingreso (Ficha 2)
**Plans**: 4 plans

Plans:
- [ ] 02-01: Modelo de datos y máquina de estados del caso (canal seguro)
- [ ] 02-02: Ficha de inspección pre-ingreso (formulario + fotos + bosquejo interactivo)
- [ ] 02-03: Turno y ficha de ingreso al taller
- [ ] 02-04: Semáforo de estado visual en el listado de casos

### Phase 3: Caso Particular
**Goal**: Un cliente particular puede recibir presupuesto y pasar a turno sin depender del flujo de seguro
**Mode:** mvp
**Depends on**: Phase 2
**Requirements**: CASOS-03
**Success Criteria** (what must be TRUE):
  1. Recepción crea un caso de canal Particular con presupuesto y fotos
  2. Si el cliente acepta, el caso pasa a turno reutilizando la coordinación de turno ya construida en la Fase 2
  3. Si el cliente no acepta, se guarda la modalidad de contacto para seguimiento futuro
**Plans**: 2 plans

Plans:
- [ ] 03-01: Flujo de presupuesto particular (aceptar / no aceptar)
- [ ] 03-02: Registro de modalidad de contacto cuando no acepta

### Phase 4: Reparación y Stock
**Goal**: El taller puede documentar la reparación completa, incluyendo repuestos faltantes y materiales
**Mode:** mvp
**Depends on**: Phase 2
**Requirements**: FICHAS-03, REPARACION-01, REPARACION-02, STOCK-01
**Success Criteria** (what must be TRUE):
  1. Taller completa la ficha de trabajo de reparación con daños marcados y patente
  2. Taller marca un caso como "esperando repuesto" indicando cuál falta, y esto se ve en el semáforo
  3. Taller firma la orden de trabajo con fotos al terminar la reparación
  4. Cualquier usuario puede ver y actualizar el listado simple de materiales/repuestos
**Plans**: 3 plans

Plans:
- [ ] 04-01: Ficha de trabajo de reparación
- [ ] 04-02: Estado "esperando repuesto" reflejado en el semáforo
- [ ] 04-03: Firma de orden de trabajo con fotos + listado de stock

### Phase 5: Facturación y Cobros
**Goal**: El dueño puede controlar qué se facturó formalmente y qué se cobró realmente por cada caso, sin que otros roles accedan a ese diferencial
**Mode:** mvp
**Depends on**: Phase 4
**Requirements**: FACTURACION-01, FACTURACION-02, AUTH-02
**Success Criteria** (what must be TRUE):
  1. Dueño registra el monto facturado y el total cobrado por caso, y ve el diferencial
  2. Recepción y taller no pueden ver el diferencial facturado/cobrado bajo ninguna pantalla ni pedido directo a la base
  3. Usuario puede marcar un caso como "reclamo a la compañía" cuando la aseguradora no paga
**Plans**: 3 plans

Plans:
- [ ] 05-01: Modelo de facturación (facturado vs. cobrado) con permisos por rol a nivel de base de datos
- [ ] 05-02: Pantalla de facturación (solo dueño)
- [ ] 05-03: Reclamo a la compañía

### Phase 6: CRM
**Goal**: Dueño y recepción tienen una vista de cliente/aseguradora con todo su historial de casos
**Mode:** mvp
**Depends on**: Phase 2, Phase 3
**Requirements**: CRM-01, CRM-02, CRM-03
**Success Criteria** (what must be TRUE):
  1. Usuario ve y edita la ficha de un cliente particular con su historial de casos
  2. Usuario ve y edita la ficha de una compañía de seguro (San Cristóbal, Federación Patronal, Mercantil Andes, Triunfo, Sancor, Cooperativa de Seguros) con su historial de casos
  3. Usuario registra los datos de un productor/asesor asociado a un caso
**Plans**: 2 plans

Plans:
- [ ] 06-01: CRM de clientes particulares y aseguradoras (con historial de casos)
- [ ] 06-02: Productores/asesores asociados a un caso

## Progress

**Execution Order:**
Phases execute in numeric order: 1 → 2 → 3 → 4 → 5 → 6

| Phase | Plans Complete | Status | Completed |
|-------|-----------------|--------|-----------|
| 1. Fundaciones | 0/3 | Not started | - |
| 2. Caso de Seguro | 0/4 | Not started | - |
| 3. Caso Particular | 0/2 | Not started | - |
| 4. Reparación y Stock | 0/3 | Not started | - |
| 5. Facturación y Cobros | 0/3 | Not started | - |
| 6. CRM | 0/2 | Not started | - |
