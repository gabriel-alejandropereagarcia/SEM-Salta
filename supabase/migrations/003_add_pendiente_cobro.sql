-- Agregar estado 'pendiente_cobro' al enum estado_sesion
-- Permite que el conductor estacione sin saldo (efectivo) y el permisionario confirme el cobro

ALTER TYPE estado_sesion ADD VALUE IF NOT EXISTS 'pendiente_cobro' AFTER 'activo';

-- Politica RLS: permisionarios pueden confirmar cobro (update sesiones en su zona)
-- Ya existe sesiones_actualizar_permisionario, pero la extendemos para incluir pendiente_cobro
CREATE POLICY "sesiones_update_permisionario_cobro" ON sesiones_estacionamiento
  FOR UPDATE USING (
    estado = 'pendiente_cobro'
    AND EXISTS (
      SELECT 1 FROM permisionarios WHERE id = auth.uid() AND id_zona_actual = sesiones_estacionamiento.id_zona
    )
  );