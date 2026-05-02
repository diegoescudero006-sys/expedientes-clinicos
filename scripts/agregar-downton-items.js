// Migration: add TEXT[] columns to store selected Downton items (multi-select)
// Run: export $(grep -v '^#' .env.local | xargs) && node scripts/agregar-downton-items.js
const { Pool } = require('pg')

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
})

async function run() {
  const client = await pool.connect()
  try {
    await client.query(`
      ALTER TABLE pacientes
        ADD COLUMN IF NOT EXISTS downton_medicamentos_items TEXT[],
        ADD COLUMN IF NOT EXISTS downton_deficit_sensorial_items TEXT[];
    `)
    console.log('✅ Columnas downton_medicamentos_items y downton_deficit_sensorial_items agregadas.')
  } finally {
    client.release()
    await pool.end()
  }
}

run().catch(err => { console.error('❌ Error:', err.message); process.exit(1) })
