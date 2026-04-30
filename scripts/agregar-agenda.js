const { Pool } = require('pg')

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
})

async function main() {
  console.log('Creando tabla agenda...')
  await pool.query(`
    CREATE TABLE IF NOT EXISTS agenda (
      id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      paciente_id  UUID REFERENCES pacientes(id),
      creado_por   UUID REFERENCES usuarios(id),
      titulo       VARCHAR(255) NOT NULL,
      fecha        DATE NOT NULL,
      hora         TIME,
      lugar        VARCHAR(255),
      descripcion  TEXT,
      tipo         VARCHAR(50) DEFAULT 'general',
      completado   BOOLEAN DEFAULT false,
      created_at   TIMESTAMP DEFAULT NOW()
    )
  `)

  await pool.query(`
    CREATE INDEX IF NOT EXISTS idx_agenda_paciente_fecha
      ON agenda (paciente_id, fecha ASC, hora ASC NULLS LAST)
  `)

  console.log('✅ Tabla agenda creada correctamente.')
  await pool.end()
}

main().catch(err => { console.error('❌ Error:', err.message); process.exit(1) })
