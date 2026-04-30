// Migración: agrega columnas para 3 tomas de signos vitales + nota de glucosa
// Ejecutar: export $(grep -v '^#' .env.local | xargs) && node lib/agregar-vitales-multiples.js
const { Pool } = require('pg')
const pool = new Pool({ connectionString: process.env.DATABASE_URL, ssl: { rejectUnauthorized: false } })

async function main() {
  const client = await pool.connect()
  try {
    console.log('Agregando columnas de signos vitales múltiples...')
    await client.query(`
      ALTER TABLE bitacora ADD COLUMN IF NOT EXISTS sv1_hora VARCHAR(10);
      ALTER TABLE bitacora ADD COLUMN IF NOT EXISTS glucosa_nota VARCHAR(150);
      ALTER TABLE bitacora ADD COLUMN IF NOT EXISTS sv2_hora VARCHAR(10);
      ALTER TABLE bitacora ADD COLUMN IF NOT EXISTS sv2_ta VARCHAR(50);
      ALTER TABLE bitacora ADD COLUMN IF NOT EXISTS sv2_fc INTEGER;
      ALTER TABLE bitacora ADD COLUMN IF NOT EXISTS sv2_fr INTEGER;
      ALTER TABLE bitacora ADD COLUMN IF NOT EXISTS sv2_temp NUMERIC;
      ALTER TABLE bitacora ADD COLUMN IF NOT EXISTS sv2_spo2 INTEGER;
      ALTER TABLE bitacora ADD COLUMN IF NOT EXISTS sv2_glucosa INTEGER;
      ALTER TABLE bitacora ADD COLUMN IF NOT EXISTS sv2_glucosa_nota VARCHAR(150);
      ALTER TABLE bitacora ADD COLUMN IF NOT EXISTS sv3_hora VARCHAR(10);
      ALTER TABLE bitacora ADD COLUMN IF NOT EXISTS sv3_ta VARCHAR(50);
      ALTER TABLE bitacora ADD COLUMN IF NOT EXISTS sv3_fc INTEGER;
      ALTER TABLE bitacora ADD COLUMN IF NOT EXISTS sv3_fr INTEGER;
      ALTER TABLE bitacora ADD COLUMN IF NOT EXISTS sv3_temp NUMERIC;
      ALTER TABLE bitacora ADD COLUMN IF NOT EXISTS sv3_spo2 INTEGER;
      ALTER TABLE bitacora ADD COLUMN IF NOT EXISTS sv3_glucosa INTEGER;
      ALTER TABLE bitacora ADD COLUMN IF NOT EXISTS sv3_glucosa_nota VARCHAR(150);
    `)
    console.log('✅ Columnas agregadas correctamente')
  } finally {
    client.release()
    await pool.end()
  }
}

main().catch(e => { console.error('❌ Error:', e.message); process.exit(1) })
