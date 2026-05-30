-- ============================================================
-- Fix: search_path en funciones + RLS para permisionarios
-- ============================================================

-- Fix search_path warnings
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION actualizar_saldo_permisionario()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  IF NEW.tipo = 'credito' THEN
    UPDATE permisionarios
    SET saldo_cuenta_corriente = saldo_cuenta_corriente + NEW.monto
    WHERE id = NEW.id_permisionario;
  ELSIF NEW.tipo = 'debito' THEN
    UPDATE permisionarios
    SET saldo_cuenta_corriente = saldo_cuenta_corriente - NEW.monto
    WHERE id = NEW.id_permisionario;
  END IF;
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION obtener_tarifa_base(p_tipo tipo_vehiculo)
RETURNS NUMERIC(12,2)
LANGUAGE plpgsql IMMUTABLE
SET search_path = public
AS $$
BEGIN
  IF p_tipo = 'auto' THEN RETURN 700.00;
  ELSIF p_tipo = 'moto' THEN RETURN 300.00;
  END IF;
  RETURN 0;
END;
$$;

CREATE OR REPLACE FUNCTION obtener_comision_efectivo(p_tipo tipo_vehiculo)
RETURNS NUMERIC(12,2)
LANGUAGE plpgsql IMMUTABLE
SET search_path = public
AS $$
BEGIN
  IF p_tipo = 'auto' THEN RETURN 140.00;
  ELSIF p_tipo = 'moto' THEN RETURN 60.00;
  END IF;
  RETURN 0;
END;
$$;

CREATE OR REPLACE FUNCTION contar_sesiones_activas(p_zona_id UUID)
RETURNS INT
LANGUAGE sql STABLE
SET search_path = public
AS $$
  SELECT COUNT(*)::INT
  FROM sesiones_estacionamiento
  WHERE id_zona = p_zona_id AND estado = 'activo';
$$;

-- ============================================================
-- RLS: permitir lectura pública de permisionarios (para login por legajo)
-- ============================================================

CREATE POLICY "permisionarios_lectura_publica" ON permisionarios
  FOR SELECT USING (true);

-- ============================================================
-- RLS: permitir que el PWA consulte sesiones y transacciones sin auth
-- (usa service_role key del backend)
-- ============================================================

CREATE POLICY "sesiones_lectura_publica" ON sesiones_estacionamiento
  FOR SELECT USING (true);

CREATE POLICY "sesiones_insert_publica" ON sesiones_estacionamiento
  FOR INSERT WITH CHECK (true);

CREATE POLICY "transacciones_lectura_publica" ON transacciones
  FOR SELECT USING (true);

CREATE POLICY "transacciones_insert_publica" ON transacciones
  FOR INSERT WITH CHECK (true);

CREATE POLICY "cargas_lectura_publica" ON cargas_saldo
  FOR SELECT USING (true);

CREATE POLICY "usuarios_wa_lectura_publica" ON usuarios_wa
  FOR SELECT USING (true);

CREATE POLICY "usuarios_wa_insert_publica" ON usuarios_wa
  FOR INSERT WITH CHECK (true);

CREATE POLICY "permisionarios_insert_publica" ON permisionarios
  FOR INSERT WITH CHECK (true);

CREATE POLICY "permisionarios_update_publica" ON permisionarios
  FOR UPDATE USING (true);