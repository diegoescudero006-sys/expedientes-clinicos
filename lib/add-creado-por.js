const { Pool } = require('pg')
require('dotenv').config({ path: '.env.local' })

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
})

async function run() {
  try {
    await pool.query(`
      ALTER TABLE pacientes
      ADD COLUMN IF NOT EXISTS creado_por UUID REFERENCES usuarios(id)
    `)
    console.log('✅ Columna creado_por agregada correctamente')
    process.exit(0)
  } catch (error) {
    console.error('❌ Error:', error)
    process.exit(1)
  }
}

run()
