-- Índices para acelerar queries frecuentes
-- Ejecutar una sola vez: npm run db:indexes

CREATE INDEX IF NOT EXISTS idx_pacientes_usuario_id        ON pacientes(usuario_id);
CREATE INDEX IF NOT EXISTS idx_pacientes_archivado         ON pacientes(archivado);
CREATE INDEX IF NOT EXISTS idx_bitacora_paciente_id        ON bitacora(paciente_id);
CREATE INDEX IF NOT EXISTS idx_medicamentos_paciente_id    ON medicamentos(paciente_id);
CREATE INDEX IF NOT EXISTS idx_archivos_paciente_id        ON archivos(paciente_id);
CREATE INDEX IF NOT EXISTS idx_ep_enfermero_id             ON enfermeros_pacientes(enfermero_id);
CREATE INDEX IF NOT EXISTS idx_ep_paciente_id              ON enfermeros_pacientes(paciente_id);
