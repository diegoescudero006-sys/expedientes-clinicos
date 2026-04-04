const { Pool } = require('pg')

const pool = new Pool({
  connectionString: 'postgresql://postgres:DNtvfCNJlKchVaESmIltcWWLXvkEExbK@interchange.proxy.rlwy.net:39327/railway',
  ssl: { rejectUnauthorized: false }
})

async function agregar() {
  try {
    await pool.query(`
      ALTER TABLE pacientes
      ADD COLUMN IF NOT EXISTS sexo VARCHAR(20),
      ADD COLUMN IF NOT EXISTS fecha_nacimiento DATE,
      ADD COLUMN IF NOT EXISTS altura DECIMAL(5,2),
      ADD COLUMN IF NOT EXISTS peso DECIMAL(5,2),
      ADD COLUMN IF NOT EXISTS telefono VARCHAR(20),
      ADD COLUMN IF NOT EXISTS motivo_consulta TEXT,
      ADD COLUMN IF NOT EXISTS padecimiento_actual TEXT,
      ADD COLUMN IF NOT EXISTS antecedentes_heredofamiliares TEXT,
      ADD COLUMN IF NOT EXISTS antecedentes_patologicos TEXT,
      ADD COLUMN IF NOT EXISTS antecedentes_no_patologicos TEXT,
      ADD COLUMN IF NOT EXISTS alergias TEXT,
      ADD COLUMN IF NOT EXISTS antecedentes_medicos TEXT
    `)
    console.log('✅ Columnas agregadas correctamente')
    process.exit(0)
  } catch (error) {
    console.error('❌ Error:', error.message)
    process.exit(1)
  }
}

agregar()