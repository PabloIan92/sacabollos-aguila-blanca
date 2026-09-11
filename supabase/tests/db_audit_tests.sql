-- ============================================================================
-- SUITE DE PRUEBAS REALES EN POSTGRESQL / SUPABASE
-- Verifica:
-- 1. Actualización de factura existente (upsert en caso_facturacion vía RPC)
-- 2. Rollback transaccional atómico ante fallos de precondición
-- 3. Permisos por rol (dueno vs recepcion vs taller en RPCs y transiciones)
-- 4. Mutaciones prohibidas (inmutabilidad estricta de identidad y datos fuera de borrador)
-- ============================================================================

do $$
declare
  v_test_prefix text := 'TEST_AUDIT_' || substr(md5(random()::text), 1, 6);
  v_dueno_id uuid := gen_random_uuid();
  v_recepcion_id uuid := gen_random_uuid();
  v_taller_id uuid := gen_random_uuid();
  
  v_caso_id uuid;
  v_caso record;
  v_fact record;
  v_error_caught boolean;
  v_error_code text;
  v_error_msg text;
begin
  raise notice '=== INICIANDO PRUEBAS REALES EN SUPABASE (Prefijo: %) ===', v_test_prefix;

  -- --------------------------------------------------------------------------
  -- SETUP: Limpieza previa y creación de usuarios y perfiles temporales
  -- --------------------------------------------------------------------------
  delete from public.casos where patente in ('AUD001', 'AUD002', 'MUTADA999');
  delete from auth.users where email like 'TEST_AUDIT_%';

  insert into auth.users (id, email)
  values 
    (v_dueno_id, v_test_prefix || '_dueno@test.local'),
    (v_recepcion_id, v_test_prefix || '_recepcion@test.local'),
    (v_taller_id, v_test_prefix || '_taller@test.local');

  -- Actualizar roles en profiles (el trigger on_auth_user_created ya crea la fila con rol 'taller')
  insert into public.profiles (id, full_name, role)
  values
    (v_dueno_id, 'Dueño Test Audit', 'dueno'),
    (v_recepcion_id, 'Recepción Test Audit', 'recepcion'),
    (v_taller_id, 'Taller Test Audit', 'taller')
  on conflict (id) do update set role = excluded.role;

  -- ==========================================================================
  -- PRUEBA 1: Permisos por Rol en facturar_caso_atomic y cobrar_caso_atomic
  -- Solo 'dueno' puede facturar y cobrar; 'recepcion' y 'taller' deben recibir 42501
  -- ==========================================================================
  raise notice '-> TEST 1: Validando que roles no-dueño son rechazados con 42501...';
  
  -- Crear un caso de prueba en estado 'firmado'
  insert into public.casos (
    id, canal, estado, patente, marca, modelo, cliente_nombre, cliente_telefono,
    aseguradora, numero_siniestro, denuncia, productor_nombre, productor_telefono,
    created_by
  ) values (
    gen_random_uuid(), 'seguro', 'firmado', 'AUD001', 'Toyota', 'Corolla',
    'Cliente Audit', '1122334455', 'San Cristóbal', 'SIN-001', 'Denuncia OK',
    'Prod Test', '11998877', v_dueno_id
  ) returning id into v_caso_id;

  -- Simular usuario con rol 'recepcion'
  perform set_config('request.jwt.claims', json_build_object('sub', v_recepcion_id, 'role', 'authenticated')::text, true);
  
  v_error_caught := false;
  begin
    perform public.facturar_caso_atomic(v_caso_id, 150000, 'FAC-RECEP', current_date);
  exception when others then
    get stacked diagnostics v_error_code = RETURNED_SQLSTATE, v_error_msg = MESSAGE_TEXT;
    v_error_caught := true;
  end;
  if not v_error_caught or v_error_code <> '42501' then
    raise exception 'TEST 1 FALLÓ: Recepción no fue rechazada con 42501 al facturar (error: % %)', v_error_code, v_error_msg;
  end if;

  -- Simular usuario con rol 'taller'
  perform set_config('request.jwt.claims', json_build_object('sub', v_taller_id, 'role', 'authenticated')::text, true);
  
  v_error_caught := false;
  begin
    perform public.cobrar_caso_atomic(v_caso_id, 150000, current_date, 'transferencia');
  exception when others then
    get stacked diagnostics v_error_code = RETURNED_SQLSTATE, v_error_msg = MESSAGE_TEXT;
    v_error_caught := true;
  end;
  if not v_error_caught or v_error_code <> '42501' then
    raise exception 'TEST 1 FALLÓ: Taller no fue rechazado con 42501 al cobrar (error: % %)', v_error_code, v_error_msg;
  end if;
  raise notice '   [OK] Roles recepcion y taller denegados con 42501 correctamente.';

  -- ==========================================================================
  -- PRUEBA 2: Rollback Transaccional Atómico ante Precondición Inválida
  -- Si el monto es <= 0 o el caso no está en estado válido, nada debe persistir
  -- ==========================================================================
  raise notice '-> TEST 2: Validando rollback atómico de la transacción...';
  
  -- Simular rol 'dueno'
  perform set_config('request.jwt.claims', json_build_object('sub', v_dueno_id, 'role', 'authenticated')::text, true);

  -- 2.1 Intentar facturar con monto <= 0
  v_error_caught := false;
  begin
    perform public.facturar_caso_atomic(v_caso_id, -500, 'FAC-NEGATIVA', current_date);
  exception when others then
    get stacked diagnostics v_error_code = RETURNED_SQLSTATE, v_error_msg = MESSAGE_TEXT;
    v_error_caught := true;
  end;
  if not v_error_caught or v_error_code <> '23514' then
    raise exception 'TEST 2.1 FALLÓ: facturar_caso_atomic no rechazó monto negativo con 23514';
  end if;

  -- Verificar que NO se creó registro en caso_facturacion y caso sigue 'firmado'
  select * into v_caso from public.casos where id = v_caso_id;
  select * into v_fact from public.caso_facturacion where caso_id = v_caso_id;
  if v_caso.estado <> 'firmado' or v_fact.caso_id is not null then
    raise exception 'TEST 2.1 FALLÓ: El estado cambió o caso_facturacion no hizo rollback';
  end if;

  -- 2.2 Intentar facturar caso en estado inválido (ej. 'borrador')
  declare
    v_caso_borrador uuid;
  begin
    insert into public.casos (
      canal, estado, patente, marca, modelo, cliente_nombre, cliente_telefono,
      aseguradora, numero_siniestro, denuncia, productor_nombre, productor_telefono,
      created_by
    ) values (
      'seguro', 'borrador', 'AUD002', 'Ford', 'Focus',
      'Cliente Borrador', '1122334455', 'San Cristóbal', 'SIN-002', 'Denuncia OK',
      'Prod Test', '11998877', v_dueno_id
    ) returning id into v_caso_borrador;

    v_error_caught := false;
    begin
      perform public.facturar_caso_atomic(v_caso_borrador, 200000, 'FAC-BORR', current_date);
    exception when others then
      get stacked diagnostics v_error_code = RETURNED_SQLSTATE, v_error_msg = MESSAGE_TEXT;
      v_error_caught := true;
    end;
    if not v_error_caught or v_error_code <> '23514' then
      raise exception 'TEST 2.2 FALLÓ: Caso en borrador no fue rechazado al facturar';
    end if;

    select estado into v_error_msg from public.casos where id = v_caso_borrador;
    if v_error_msg <> 'borrador' then
      raise exception 'TEST 2.2 FALLÓ: El estado del caso en borrador mutó tras error';
    end if;
    delete from public.casos where id = v_caso_borrador;
  end;
  raise notice '   [OK] Rollback verificado: ninguna tabla muta ante fallo de validación.';

  -- ==========================================================================
  -- PRUEBA 3: Facturación Exitosa y Actualización de Factura Existente (Upsert)
  -- ==========================================================================
  raise notice '-> TEST 3: Facturando caso y validando actualización de factura existente...';
  
  -- Facturación inicial
  perform public.facturar_caso_atomic(
    v_caso_id,
    250000.50,
    'FAC-A-0001',
    '2026-09-10'::date,
    'Primer registro de factura'
  );

  select * into v_caso from public.casos where id = v_caso_id;
  select * into v_fact from public.caso_facturacion where caso_id = v_caso_id;

  if v_caso.estado <> 'facturado' or v_caso.facturado_at is null then
    raise exception 'TEST 3 FALLÓ: El caso no avanzó a facturado (estado: %)', v_caso.estado;
  end if;
  if v_fact.monto_facturado <> 250000.50 or v_fact.numero_factura <> 'FAC-A-0001' then
    raise exception 'TEST 3 FALLÓ: Monto o número de factura incorrectos en caso_facturacion';
  end if;

  -- Actualización de factura existente (upsert on conflict caso_id)
  perform public.facturar_caso_atomic(
    v_caso_id,
    300000.00,
    'FAC-A-0001-RECTIFICADA',
    '2026-09-11'::date,
    'Factura rectificada con ajuste'
  );

  select * into v_fact from public.caso_facturacion where caso_id = v_caso_id;
  if v_fact.monto_facturado <> 300000.00 or v_fact.numero_factura <> 'FAC-A-0001-RECTIFICADA' then
    raise exception 'TEST 3 FALLÓ: La actualización de la factura existente no persistió los nuevos valores';
  end if;
  raise notice '   [OK] Factura inicial y actualización rectificatoria confirmadas.';

  -- ==========================================================================
  -- PRUEBA 4: Cobro Atómico y Validación de Estados
  -- ==========================================================================
  raise notice '-> TEST 4: Validando transición a cobrado vía cobrar_caso_atomic...';
  
  perform public.cobrar_caso_atomic(
    v_caso_id,
    300000.00,
    '2026-09-11'::date,
    'transferencia',
    'Cobrado por transferencia bancaria completa'
  );

  select * into v_caso from public.casos where id = v_caso_id;
  select * into v_fact from public.caso_facturacion where caso_id = v_caso_id;

  if v_caso.estado <> 'cobrado' or v_caso.cobrado_at is null then
    raise exception 'TEST 4 FALLÓ: Caso no transicionó a cobrado (estado: %)', v_caso.estado;
  end if;
  if v_fact.monto_cobrado <> 300000.00 or v_fact.metodo_pago <> 'transferencia' then
    raise exception 'TEST 4 FALLÓ: Datos de cobro no guardados en caso_facturacion';
  end if;
  raise notice '   [OK] Cobro atómico registrado con éxito.';

  -- ==========================================================================
  -- PRUEBA 5: Mutaciones Prohibidas e Inmutabilidad de Identidad
  -- ==========================================================================
  raise notice '-> TEST 5: Verificando rechazo de mutaciones prohibidas e inmutabilidad...';
  
  -- 5.1 Intentar modificar la patente en un caso ya avanzado
  v_error_caught := false;
  begin
    update public.casos set patente = 'MUTADA999' where id = v_caso_id;
  exception when others then
    get stacked diagnostics v_error_code = RETURNED_SQLSTATE, v_error_msg = MESSAGE_TEXT;
    v_error_caught := true;
  end;
  if not v_error_caught or v_error_code <> '23514' then
    raise exception 'TEST 5.1 FALLÓ: Se permitió mutar la patente en caso avanzado';
  end if;

  -- 5.2 Intentar modificar el cliente_nombre
  v_error_caught := false;
  begin
    update public.casos set cliente_nombre = 'Cliente Hackeado' where id = v_caso_id;
  exception when others then
    get stacked diagnostics v_error_code = RETURNED_SQLSTATE, v_error_msg = MESSAGE_TEXT;
    v_error_caught := true;
  end;
  if not v_error_caught or v_error_code <> '23514' then
    raise exception 'TEST 5.2 FALLÓ: Se permitió mutar cliente_nombre en caso avanzado';
  end if;

  -- 5.3 Intentar mutación sin transición de estado fuera de borrador (ej. cambiar repuesto_pendiente cuando el caso ya está cobrado)
  v_error_caught := false;
  v_error_code := null;
  v_error_msg := null;
  begin
    update public.casos set repuesto_pendiente = 'Paragolpes arbitrario' where id = v_caso_id;
  exception when others then
    get stacked diagnostics v_error_code = RETURNED_SQLSTATE, v_error_msg = MESSAGE_TEXT;
    v_error_caught := true;
  end;
  if not v_error_caught or v_error_code <> '23514' then
    raise exception 'TEST 5.3 FALLÓ: caught=%, code=%, msg=%', v_error_caught, v_error_code, v_error_msg;
  end if;
  raise notice '   [OK] Inmutabilidad estricta y protección contra mutaciones prohibidas verificadas.';

  -- --------------------------------------------------------------------------
  -- TEARDOWN: Limpieza de datos de prueba
  -- --------------------------------------------------------------------------
  delete from public.caso_facturacion where caso_id = v_caso_id;
  delete from public.casos where id = v_caso_id;
  delete from public.profiles where id in (v_dueno_id, v_recepcion_id, v_taller_id);
  delete from auth.users where id in (v_dueno_id, v_recepcion_id, v_taller_id);

  raise notice '=== TODAS LAS PRUEBAS REALES POSTGRESQL / SUPABASE PASARON CON ÉXITO ===';
end $$;
