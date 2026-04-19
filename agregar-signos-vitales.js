const { Pool } = require('pg')

const pool = new Pool({
  connectionString: 'postgresql://postgres:DNtvfCNJlKchVaESmIltcWWLXvkEExbK@interchange.proxy.rlwy.net:39327/railway',
  ssl: { rejectUnauthorized: false }
})

async function migrar() {
  const columnas = [
    `ALTER TABLE bitacora ADD COLUMN IF NOT EXISTS tension_arterial VARCHAR(20)`,
    `ALTER TABLE bitacora ADD COLUMN IF NOT EXISTS frecuencia_cardiaca INTEGER`,
    `ALTER TABLE bitacora ADD COLUMN IF NOT EXISTS frecuencia_respiratoria INTEGER`,
    `ALTER TABLE bitacora ADD COLUMN IF NOT EXISTS temperatura DECIMAL(4,1)`,
    `ALTER TABLE bitacora ADD COLUMN IF NOT EXISTS saturacion_oxigeno INTEGER`,
    `ALTER TABLE bitacora ADD COLUMN IF NOT EXISTS glucosa INTEGER`,
    `ALTER TABLE bitacora ADD COLUMN IF NOT EXISTS uresis VARCHAR(50)`,
    `ALTER TABLE bitacora ADD COLUMN IF NOT EXISTS evacuaciones VARCHAR(50)`,
    `ALTER TABLE bitacora ADD COLUMN IF NOT EXISTS ingresos_liquidos VARCHAR(50)`,
    `ALTER TABLE bitacora ADD COLUMN IF NOT EXISTS egresos_liquidos VARCHAR(50)`,
    `ALTER TABLE bitacora ADD COLUMN IF NOT EXISTS balance_liquidos VARCHAR(50)`,
    `ALTER TABLE bitacora ADD COLUMN IF NOT EXISTS medicacion_turno TEXT`,
    `ALTER TABLE bitacora ADD COLUMN IF NOT EXISTS soluciones TEXT`,
    `ALTER TABLE bitacora ADD COLUMN IF NOT EXISTS dieta TEXT`,
    `ALTER TABLE bitacora ADD COLUMN IF NOT EXISTS escala_dolor INTEGER CHECK (escala_dolor IS NULL OR (escala_dolor >= 0 AND escala_dolor <= 10))`,
    `ALTER TABLE bitacora ADD COLUMN IF NOT EXISTS turno VARCHAR(20)`,
  ]

  for (const sql of columnas) {
    try {
      await pool.query(sql)
      const col = sql.match(/ADD COLUMN IF NOT EXISTS (\w+)/)[1]
      console.log(`✅ ${col}`)
    } catch (err) {
      console.error(`❌ Error:`, err.message)
    }
  }

  process.exit(0)
}

migrar()
