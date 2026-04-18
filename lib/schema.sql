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
