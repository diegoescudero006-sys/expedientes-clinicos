const { Pool } = require('pg')

const pool = new Pool({
  connectionString: 'postgresql://postgres:DNtvfCNJlKchVaESmIltcWWLXvkEExbK@interchange.proxy.rlwy.net:39327/railway',
  ssl: { rejectUnauthorized: false }
})

async function agregarColumnas() {
  try {
    await pool.query(`
      ALTER TABLE pacientes 
      ADD COLUMN IF NOT EXISTS direccion VARCHAR(500),
      ADD COLUMN IF NOT EXISTS tipo_sangre VARCHAR(10),
      ADD COLUMN IF NOT EXISTS primera_visita DATE DEFAULT CURRENT_DATE
    `)
    console.log('✅ Columnas agregadas')
    process.exit(0)
  } catch (error) {
    console.error('❌ Error:', error.message)
    process.exit(1)
  }
}

agregarColumnas()