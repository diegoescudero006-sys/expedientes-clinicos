const { Pool } = require('pg')

const pool = new Pool({
  connectionString: 'postgresql://postgres:DNtvfCNJlKchVaESmIltcWWLXvkEExbK@interchange.proxy.rlwy.net:39327/railway',
  ssl: { rejectUnauthorized: false }
})

async function migrar() {
  try {
    await pool.query(`
      ALTER TABLE medicamentos
      ADD COLUMN IF NOT EXISTS alto_riesgo BOOLEAN NOT NULL DEFAULT false
    `)
    console.log('✅ Columna alto_riesgo agregada a medicamentos')
    process.exit(0)
  } catch (error) {
    console.error('❌ Error:', error.message)
    process.exit(1)
  }
}

migrar()
