-- ============================================================
-- SEM Salta - Esquema Inicial
-- Ordenanza 12.170 - Sistema de Estacionamiento Medido
-- PunaTech 2026
-- ============================================================

-- Tipos enumerados
CREATE TYPE tipo_vehiculo AS ENUM ('auto', 'moto');
CREATE TYPE estado_sesion AS ENUM ('activo', 'finalizado', 'anulado');
CREATE TYPE metodo_pago AS ENUM ('digital', 'efectivo');
CREATE TYPE tipo_transaccion AS ENUM ('credito', 'debito');
CREATE TYPE estado_carga AS ENUM ('pendiente', 'aprobado', 'rechazado');

-- ============================================================
-- TABLAS
-- ============================================================

CREATE TABLE zonas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  cuc VARCHAR(10) UNIQUE NOT NULL,
  nombre_calle VARCHAR(255) NOT NULL,
  numero_desde INT,
  numero_hasta INT,
  capacidad INT NOT NULL DEFAULT 20,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE permisionarios (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  legajo VARCHAR(20) UNIQUE NOT NULL,
  nombre VARCHAR(255) NOT NULL,
  id_zona_actual UUID NOT NULL REFERENCES zonas(id) ON DELETE RESTRICT,
  saldo_cuenta_corriente NUMERIC(12,2) NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE usuarios_wa (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  numero_telefono VARCHAR(20) UNIQUE NOT NULL,
  nombre VARCHAR(255),
  saldo_billetera NUMERIC(12,2) NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT saldo_billetera_positivo CHECK (saldo_billetera >= 0)
);

CREATE TABLE sesiones_estacionamiento (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  patente VARCHAR(10) NOT NULL,
  id_zona UUID NOT NULL REFERENCES zonas(id) ON DELETE RESTRICT,
  id_usuario_wa UUID REFERENCES usuarios_wa(id) ON DELETE SET NULL,
  id_permisionario UUID REFERENCES permisionarios(id) ON DELETE SET NULL,
  tipo_vehiculo tipo_vehiculo NOT NULL,
  hora_inicio TIMESTAMPTZ NOT NULL DEFAULT now(),
  hora_fin TIMESTAMPTZ,
  costo_total NUMERIC(12,2),
  estado estado_sesion NOT NULL DEFAULT 'activo',
  metodo_pago metodo_pago NOT NULL DEFAULT 'digital',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE transacciones (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  id_permisionario UUID NOT NULL REFERENCES permisionarios(id) ON DELETE RESTRICT,
  id_sesion UUID REFERENCES sesiones_estacionamiento(id) ON DELETE SET NULL,
  tipo tipo_transaccion NOT NULL,
  monto NUMERIC(12,2) NOT NULL CHECK (monto > 0),
  descripcion VARCHAR(500) NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE cargas_saldo (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  id_usuario_wa UUID NOT NULL REFERENCES usuarios_wa(id) ON DELETE RESTRICT,
  monto NUMERIC(12,2) NOT NULL CHECK (monto > 0),
  mp_preference_id VARCHAR(100),
  mp_payment_id VARCHAR(100),
  estado estado_carga NOT NULL DEFAULT 'pendiente',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ============================================================
-- ÍNDICES
-- ============================================================

CREATE INDEX idx_sesiones_zona_estado ON sesiones_estacionamiento(id_zona, estado);
CREATE INDEX idx_sesiones_usuario ON sesiones_estacionamiento(id_usuario_wa);
CREATE INDEX idx_sesiones_estado ON sesiones_estacionamiento(estado);
CREATE INDEX idx_sesiones_permisionario ON sesiones_estacionamiento(id_permisionario);
CREATE INDEX idx_transacciones_permisionario ON transacciones(id_permisionario);
CREATE INDEX idx_transacciones_sesion ON transacciones(id_sesion);
CREATE INDEX idx_cargas_usuario ON cargas_saldo(id_usuario_wa);
CREATE INDEX idx_cargas_estado ON cargas_saldo(estado);
CREATE INDEX idx_cargas_mp_payment ON cargas_saldo(mp_payment_id);
CREATE INDEX idx_zonas_cuc ON zonas(cuc);
CREATE INDEX idx_usuarios_telefono ON usuarios_wa(numero_telefono);
CREATE INDEX idx_permisionarios_zona ON permisionarios(id_zona_actual);

-- ============================================================
-- FUNCIONES Y TRIGGERS
-- ============================================================

-- Auto-update updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_sesiones_updated_at
  BEFORE UPDATE ON sesiones_estacionamiento
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Trigger: actualizar saldo_cuenta_corriente al insertar transacción
CREATE OR REPLACE FUNCTION actualizar_saldo_permisionario()
RETURNS TRIGGER AS $$
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
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_transacciones_saldo
  AFTER INSERT ON transacciones
  FOR EACH ROW EXECUTE FUNCTION actualizar_saldo_permisionario();

-- Función helper: obtener tarifa con descuento digital
CREATE OR REPLACE FUNCTION obtener_tarifa_digital(p_tipo tipo_vehiculo)
RETURNS NUMERIC(12,2) AS $$
BEGIN
  IF p_tipo = 'auto' THEN
    RETURN 560.00; -- 80% de 700 (descuento 20%)
  ELSIF p_tipo = 'moto' THEN
    RETURN 240.00; -- 80% de 300 (descuento 20%)
  END IF;
  RETURN 0;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Función helper: obtener tarifa base
CREATE OR REPLACE FUNCTION obtener_tarifa_base(p_tipo tipo_vehiculo)
RETURNS NUMERIC(12,2) AS $$
BEGIN
  IF p_tipo = 'auto' THEN
    RETURN 700.00;
  ELSIF p_tipo = 'moto' THEN
    RETURN 300.00;
  END IF;
  RETURN 0;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Función helper: comisión municipal (20% de tarifa base)
CREATE OR REPLACE FUNCTION obtener_comision_municipal(p_tipo tipo_vehiculo)
RETURNS NUMERIC(12,2) AS $$
BEGIN
  IF p_tipo = 'auto' THEN
    RETURN 140.00; -- 20% de 700
  ELSIF p_tipo = 'moto' THEN
    RETURN 60.00; -- 20% de 300
  END IF;
  RETURN 0;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Función helper: contar sesiones activas en una zona
CREATE OR REPLACE FUNCTION contar_sesiones_activas(p_zona_id UUID)
RETURNS INT AS $$
  SELECT COUNT(*)::INT
  FROM sesiones_estacionamiento
  WHERE id_zona = p_zona_id AND estado = 'activo';
$$ LANGUAGE sql STABLE;

-- ============================================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================================

ALTER TABLE zonas ENABLE ROW LEVEL SECURITY;
ALTER TABLE permisionarios ENABLE ROW LEVEL SECURITY;
ALTER TABLE usuarios_wa ENABLE ROW LEVEL SECURITY;
ALTER TABLE sesiones_estacionamiento ENABLE ROW LEVEL SECURITY;
ALTER TABLE transacciones ENABLE ROW LEVEL SECURITY;
ALTER TABLE cargas_saldo ENABLE ROW LEVEL SECURITY;

-- Zonas: lectura pública
CREATE POLICY "zonas_lectura_publica" ON zonas
  FOR SELECT USING (true);

-- Permisionarios: solo ven sus propios datos
CREATE POLICY "permisionarios_ver_propio" ON permisionarios
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "permisionarios_actualizar_propio" ON permisionarios
  FOR UPDATE USING (auth.uid() = id);

-- Usuarios WA: solo ven sus propios datos
CREATE POLICY "usuarios_wa_ver_propio" ON usuarios_wa
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "usuarios_wa_actualizar_propio" ON usuarios_wa
  FOR UPDATE USING (auth.uid() = id);

-- Sesiones: usuarios ven las suyas, permisionarios ven las de su zona
CREATE POLICY "sesiones_usuario_ver_propias" ON sesiones_estacionamiento
  FOR SELECT USING (
    id_usuario_wa = auth.uid()
    OR EXISTS (
      SELECT 1 FROM permisionarios WHERE id = auth.uid() AND id_zona_actual = sesiones_estacionamiento.id_zona
    )
  );

CREATE POLICY "sesiones_insertar_usuario" ON sesiones_estacionamiento
  FOR INSERT WITH CHECK (
    id_usuario_wa = auth.uid()
    OR EXISTS (
      SELECT 1 FROM permisionarios WHERE id = auth.uid()
    )
  );

CREATE POLICY "sesiones_actualizar_permisionario" ON sesiones_estacionamiento
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM permisionarios WHERE id = auth.uid() AND id_zona_actual = sesiones_estacionamiento.id_zona
    )
  );

-- Transacciones: permisionarios ven las propias
CREATE POLICY "transacciones_ver_propio" ON transacciones
  FOR SELECT USING (
    id_permisionario = auth.uid()
  );

-- Cargas saldo: usuarios ven las propias
CREATE POLICY "cargas_ver_propio" ON cargas_saldo
  FOR SELECT USING (
    id_usuario_wa = auth.uid()
  );

-- Política service_role: acceso total (usada por el backend)
CREATE POLICY "service_role_acceso_total" ON permisionarios
  FOR ALL USING (auth.role() = 'service_role');

CREATE POLICY "service_role_acceso_total_usuarios" ON usuarios_wa
  FOR ALL USING (auth.role() = 'service_role');

CREATE POLICY "service_role_acceso_total_sesiones" ON sesiones_estacionamiento
  FOR ALL USING (auth.role() = 'service_role');

CREATE POLICY "service_role_acceso_total_transacciones" ON transacciones
  FOR ALL USING (auth.role() = 'service_role');

CREATE POLICY "service_role_acceso_total_cargas" ON cargas_saldo
  FOR ALL USING (auth.role() = 'service_role');

-- ============================================================
-- REALTIME - Habilitar para sesiones_estacionamiento
-- ============================================================

ALTER PUBLICATION supabase_realtime ADD TABLE sesiones_estacionamiento;

-- ============================================================
-- DATOS SEMILLA (zonas de ejemplo)
-- ============================================================

INSERT INTO zonas (cuc, nombre_calle, numero_desde, numero_hasta, capacidad) VALUES
  ('A01', 'Calle Florida - 100 al 199', 100, 199, 15),
  ('A02', 'Calle Florida - 200 al 299', 200, 299, 18),
  ('A03', 'Calle Caseros - 100 al 199', 100, 199, 12),
  ('A04', 'Calle Caseros - 200 al 299', 200, 299, 14),
  ('A05', 'Calle Mitre - 100 al 199', 100, 199, 20),
  ('A06', 'Calle Mitre - 200 al 299', 200, 299, 16),
  ('A07', 'Calle España - 100 al 199', 100, 199, 18),
  ('A08', 'Calle España - 200 al 299', 200, 299, 15),
  ('A09', 'Calle Balcarce - 100 al 199', 100, 199, 12),
  ('A10', 'Calle Balcarce - 200 al 299', 200, 299, 14),
  ('A11', 'Calle Peatonal Tucumán - 100 al 199', 100, 199, 10),
  ('A12', 'Calle Peatonal Tucumán - 200 al 299', 200, 299, 12);