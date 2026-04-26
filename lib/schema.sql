CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- Usuarios (enfermeros y pacientes)
CREATE TABLE IF NOT EXISTS usuarios (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nombre VARCHAR(255) NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  password VARCHAR(255) NOT NULL,
  rol VARCHAR(20) NOT NULL CHECK (rol IN ('enfermero', 'paciente', 'admin')),
  created_at TIMESTAMP DEFAULT NOW()
);

-- Pacientes
CREATE TABLE IF NOT EXISTS pacientes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nombre VARCHAR(255) NOT NULL,
  edad INTEGER NOT NULL,
  diagnostico TEXT,
  contacto VARCHAR(255),
  doctor_encargado VARCHAR(255),
  usuario_id UUID REFERENCES usuarios(id),
  -- archivado: NULL o false = activo en listados; true = archivado (ver queries en app/api/pacientes)
  archivado BOOLEAN DEFAULT NULL,
  archivado_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Enfermeros asignados a pacientes
CREATE TABLE IF NOT EXISTS enfermeros_pacientes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  enfermero_id UUID REFERENCES usuarios(id),
  paciente_id UUID REFERENCES pacientes(id),
  activo BOOLEAN NOT NULL DEFAULT true,
  assigned_at TIMESTAMP DEFAULT NOW()
);

-- Bitácora
CREATE TABLE IF NOT EXISTS bitacora (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  paciente_id UUID REFERENCES pacientes(id),
  enfermero_id UUID REFERENCES usuarios(id),
  observaciones TEXT NOT NULL,
  estado_paciente VARCHAR(255) NOT NULL,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Medicamentos (columnas alineadas con app/api/pacientes/[id]/medicamentos y suspender-medicamento)
CREATE TABLE IF NOT EXISTS medicamentos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  paciente_id UUID REFERENCES pacientes(id),
  nombre VARCHAR(255) NOT NULL,
  dosis VARCHAR(255) NOT NULL,
  horario VARCHAR(255) NOT NULL,
  fecha_inicio DATE NOT NULL,
  fecha_fin DATE,
  indeterminado BOOLEAN NOT NULL DEFAULT false,
  alto_riesgo BOOLEAN NOT NULL DEFAULT false,
  activo BOOLEAN NOT NULL DEFAULT true,
  suspendido_at TIMESTAMP,
  actualizado_por UUID REFERENCES usuarios(id),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Archivos
CREATE TABLE IF NOT EXISTS archivos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  paciente_id UUID REFERENCES pacientes(id),
  subido_por UUID REFERENCES usuarios(id),
  nombre_archivo VARCHAR(255) NOT NULL,
  url VARCHAR(500) NOT NULL,
  tipo VARCHAR(100),
  created_at TIMESTAMP DEFAULT NOW()
);

-- Campos clinicos usados por las rutas actuales. Se dejan como ALTER
-- idempotentes para que el archivo sirva tanto en DB nueva como existente.
ALTER TABLE pacientes ADD COLUMN IF NOT EXISTS sexo VARCHAR(50);
ALTER TABLE pacientes ADD COLUMN IF NOT EXISTS fecha_nacimiento DATE;
ALTER TABLE pacientes ADD COLUMN IF NOT EXISTS telefono VARCHAR(50);
ALTER TABLE pacientes ADD COLUMN IF NOT EXISTS direccion TEXT;
ALTER TABLE pacientes ADD COLUMN IF NOT EXISTS tipo_sangre VARCHAR(20);
ALTER TABLE pacientes ADD COLUMN IF NOT EXISTS peso VARCHAR(50);
ALTER TABLE pacientes ADD COLUMN IF NOT EXISTS altura VARCHAR(50);
ALTER TABLE pacientes ADD COLUMN IF NOT EXISTS primera_visita DATE;
ALTER TABLE pacientes ADD COLUMN IF NOT EXISTS motivo_consulta TEXT;
ALTER TABLE pacientes ADD COLUMN IF NOT EXISTS padecimiento_actual TEXT;
ALTER TABLE pacientes ADD COLUMN IF NOT EXISTS alergias TEXT;
ALTER TABLE pacientes ADD COLUMN IF NOT EXISTS antecedentes_medicos TEXT;
ALTER TABLE pacientes ADD COLUMN IF NOT EXISTS antecedentes_heredofamiliares TEXT;
ALTER TABLE pacientes ADD COLUMN IF NOT EXISTS antecedentes_patologicos TEXT;
ALTER TABLE pacientes ADD COLUMN IF NOT EXISTS antecedentes_no_patologicos TEXT;
ALTER TABLE pacientes ADD COLUMN IF NOT EXISTS creado_por UUID REFERENCES usuarios(id);
ALTER TABLE pacientes ADD COLUMN IF NOT EXISTS estado_civil VARCHAR(100);
ALTER TABLE pacientes ADD COLUMN IF NOT EXISTS escolaridad VARCHAR(100);
ALTER TABLE pacientes ADD COLUMN IF NOT EXISTS religion VARCHAR(100);
ALTER TABLE pacientes ADD COLUMN IF NOT EXISTS telefono_local VARCHAR(50);
ALTER TABLE pacientes ADD COLUMN IF NOT EXISTS familiar_responsable VARCHAR(255);
ALTER TABLE pacientes ADD COLUMN IF NOT EXISTS familiar_tel_local VARCHAR(50);
ALTER TABLE pacientes ADD COLUMN IF NOT EXISTS familiar_tel_cel VARCHAR(50);
ALTER TABLE pacientes ADD COLUMN IF NOT EXISTS segundo_numero_emergencia VARCHAR(50);
ALTER TABLE pacientes ADD COLUMN IF NOT EXISTS tiene_servicio_medico BOOLEAN;
ALTER TABLE pacientes ADD COLUMN IF NOT EXISTS cual_servicio_medico VARCHAR(255);
ALTER TABLE pacientes ADD COLUMN IF NOT EXISTS afiliacion VARCHAR(255);
ALTER TABLE pacientes ADD COLUMN IF NOT EXISTS medicos_tratantes TEXT;
ALTER TABLE pacientes ADD COLUMN IF NOT EXISTS motivo_atencion_domiciliaria TEXT;
ALTER TABLE pacientes ADD COLUMN IF NOT EXISTS enfermedades_cronicas TEXT;
ALTER TABLE pacientes ADD COLUMN IF NOT EXISTS ultima_hospitalizacion TEXT;
ALTER TABLE pacientes ADD COLUMN IF NOT EXISTS cirugias TEXT;
ALTER TABLE pacientes ADD COLUMN IF NOT EXISTS traumatismos TEXT;
ALTER TABLE pacientes ADD COLUMN IF NOT EXISTS inmunizaciones TEXT;
ALTER TABLE pacientes ADD COLUMN IF NOT EXISTS dispositivos_drenaje TEXT;
ALTER TABLE pacientes ADD COLUMN IF NOT EXISTS estado_cognitivo TEXT;
ALTER TABLE pacientes ADD COLUMN IF NOT EXISTS mini_mental_resultado VARCHAR(100);
ALTER TABLE pacientes ADD COLUMN IF NOT EXISTS mini_mental_fecha DATE;
ALTER TABLE pacientes ADD COLUMN IF NOT EXISTS abvd_bano VARCHAR(100);
ALTER TABLE pacientes ADD COLUMN IF NOT EXISTS abvd_vestido VARCHAR(100);
ALTER TABLE pacientes ADD COLUMN IF NOT EXISTS abvd_alimentacion VARCHAR(100);
ALTER TABLE pacientes ADD COLUMN IF NOT EXISTS abvd_continencia VARCHAR(100);
ALTER TABLE pacientes ADD COLUMN IF NOT EXISTS abvd_movilidad VARCHAR(100);
ALTER TABLE pacientes ADD COLUMN IF NOT EXISTS downton_caidas_previas INTEGER;
ALTER TABLE pacientes ADD COLUMN IF NOT EXISTS downton_medicamentos INTEGER;
ALTER TABLE pacientes ADD COLUMN IF NOT EXISTS downton_deficit_sensorial INTEGER;
ALTER TABLE pacientes ADD COLUMN IF NOT EXISTS downton_estado_mental INTEGER;
ALTER TABLE pacientes ADD COLUMN IF NOT EXISTS downton_deambulacion INTEGER;
ALTER TABLE pacientes ADD COLUMN IF NOT EXISTS downton_edad INTEGER;
ALTER TABLE pacientes ADD COLUMN IF NOT EXISTS downton_total INTEGER;
ALTER TABLE pacientes ADD COLUMN IF NOT EXISTS vf_fecha DATE;
ALTER TABLE pacientes ADD COLUMN IF NOT EXISTS vf_ta VARCHAR(50);
ALTER TABLE pacientes ADD COLUMN IF NOT EXISTS vf_fc INTEGER;
ALTER TABLE pacientes ADD COLUMN IF NOT EXISTS vf_fr INTEGER;
ALTER TABLE pacientes ADD COLUMN IF NOT EXISTS vf_temp NUMERIC;
ALTER TABLE pacientes ADD COLUMN IF NOT EXISTS vf_spo2 INTEGER;
ALTER TABLE pacientes ADD COLUMN IF NOT EXISTS vf_glucosa INTEGER;
ALTER TABLE pacientes ADD COLUMN IF NOT EXISTS vf_cabeza_cuello TEXT;
ALTER TABLE pacientes ADD COLUMN IF NOT EXISTS vf_cardiopulmonar TEXT;
ALTER TABLE pacientes ADD COLUMN IF NOT EXISTS vf_abdomen TEXT;
ALTER TABLE pacientes ADD COLUMN IF NOT EXISTS vf_extremidades TEXT;
ALTER TABLE pacientes ADD COLUMN IF NOT EXISTS vf_neurologico TEXT;
ALTER TABLE pacientes ADD COLUMN IF NOT EXISTS vf_piel TEXT;
ALTER TABLE pacientes ADD COLUMN IF NOT EXISTS vf_profesional VARCHAR(255);
ALTER TABLE pacientes ADD COLUMN IF NOT EXISTS vf_fecha_evaluacion DATE;
ALTER TABLE pacientes ADD COLUMN IF NOT EXISTS braden_percepcion INTEGER;
ALTER TABLE pacientes ADD COLUMN IF NOT EXISTS braden_humedad INTEGER;
ALTER TABLE pacientes ADD COLUMN IF NOT EXISTS braden_actividad INTEGER;
ALTER TABLE pacientes ADD COLUMN IF NOT EXISTS braden_movilidad INTEGER;
ALTER TABLE pacientes ADD COLUMN IF NOT EXISTS braden_nutricion INTEGER;
ALTER TABLE pacientes ADD COLUMN IF NOT EXISTS braden_friccion INTEGER;
ALTER TABLE pacientes ADD COLUMN IF NOT EXISTS braden_total INTEGER;
ALTER TABLE pacientes ADD COLUMN IF NOT EXISTS braden_fecha DATE;

ALTER TABLE bitacora ADD COLUMN IF NOT EXISTS tension_arterial VARCHAR(50);
ALTER TABLE bitacora ADD COLUMN IF NOT EXISTS frecuencia_cardiaca INTEGER;
ALTER TABLE bitacora ADD COLUMN IF NOT EXISTS frecuencia_respiratoria INTEGER;
ALTER TABLE bitacora ADD COLUMN IF NOT EXISTS temperatura NUMERIC;
ALTER TABLE bitacora ADD COLUMN IF NOT EXISTS saturacion_oxigeno INTEGER;
ALTER TABLE bitacora ADD COLUMN IF NOT EXISTS glucosa INTEGER;
ALTER TABLE bitacora ADD COLUMN IF NOT EXISTS uresis TEXT;
ALTER TABLE bitacora ADD COLUMN IF NOT EXISTS evacuaciones TEXT;
ALTER TABLE bitacora ADD COLUMN IF NOT EXISTS ingresos_liquidos TEXT;
ALTER TABLE bitacora ADD COLUMN IF NOT EXISTS egresos_liquidos TEXT;
ALTER TABLE bitacora ADD COLUMN IF NOT EXISTS balance_liquidos TEXT;
ALTER TABLE bitacora ADD COLUMN IF NOT EXISTS medicacion_turno TEXT;
ALTER TABLE bitacora ADD COLUMN IF NOT EXISTS soluciones TEXT;
ALTER TABLE bitacora ADD COLUMN IF NOT EXISTS dieta TEXT;
ALTER TABLE bitacora ADD COLUMN IF NOT EXISTS escala_dolor INTEGER;
ALTER TABLE bitacora ADD COLUMN IF NOT EXISTS turno VARCHAR(50);
ALTER TABLE bitacora ADD COLUMN IF NOT EXISTS braden_percepcion INTEGER;
ALTER TABLE bitacora ADD COLUMN IF NOT EXISTS braden_humedad INTEGER;
ALTER TABLE bitacora ADD COLUMN IF NOT EXISTS braden_actividad INTEGER;
ALTER TABLE bitacora ADD COLUMN IF NOT EXISTS braden_movilidad INTEGER;
ALTER TABLE bitacora ADD COLUMN IF NOT EXISTS braden_nutricion INTEGER;
ALTER TABLE bitacora ADD COLUMN IF NOT EXISTS braden_lesiones INTEGER;
ALTER TABLE bitacora ADD COLUMN IF NOT EXISTS braden_total INTEGER;
ALTER TABLE bitacora ADD COLUMN IF NOT EXISTS reporte_enfermeria TEXT;
ALTER TABLE bitacora ADD COLUMN IF NOT EXISTS supervision_enfermero TEXT;
ALTER TABLE bitacora ADD COLUMN IF NOT EXISTS supervision_familiar TEXT;

CREATE TABLE IF NOT EXISTS login_rate_limits (
  ip VARCHAR(255) PRIMARY KEY,
  count INTEGER NOT NULL DEFAULT 0,
  reset_at TIMESTAMPTZ NOT NULL
);

CREATE TABLE IF NOT EXISTS expediente_auditoria (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  paciente_id UUID REFERENCES pacientes(id),
  usuario_id UUID REFERENCES usuarios(id),
  accion VARCHAR(50) NOT NULL,
  tabla VARCHAR(100) NOT NULL,
  registro_id UUID,
  antes JSONB,
  despues JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_pacientes_usuario_id        ON pacientes(usuario_id);
CREATE INDEX IF NOT EXISTS idx_pacientes_archivado         ON pacientes(archivado);
CREATE INDEX IF NOT EXISTS idx_pacientes_created_at        ON pacientes(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_bitacora_paciente_id        ON bitacora(paciente_id);
CREATE INDEX IF NOT EXISTS idx_bitacora_paciente_created   ON bitacora(paciente_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_medicamentos_paciente_id    ON medicamentos(paciente_id);
CREATE INDEX IF NOT EXISTS idx_archivos_paciente_id        ON archivos(paciente_id);
CREATE INDEX IF NOT EXISTS idx_archivos_paciente_created   ON archivos(paciente_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_ep_enfermero_id             ON enfermeros_pacientes(enfermero_id);
CREATE INDEX IF NOT EXISTS idx_ep_paciente_id              ON enfermeros_pacientes(paciente_id);
CREATE INDEX IF NOT EXISTS idx_ep_enfermero_paciente       ON enfermeros_pacientes(enfermero_id, paciente_id);
CREATE INDEX IF NOT EXISTS idx_auditoria_paciente_created  ON expediente_auditoria(paciente_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_login_rate_limits_reset_at  ON login_rate_limits(reset_at);
