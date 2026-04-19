const { Pool } = require('pg')

const pool = new Pool({
  connectionString: 'postgresql://postgres:DNtvfCNJlKchVaESmIltcWWLXvkEExbK@interchange.proxy.rlwy.net:39327/railway',
  ssl: { rejectUnauthorized: false }
})

async function migrar() {
  const columnas = [
    `ALTER TABLE bitacora ADD COLUMN IF NOT EXISTS braden_percepcion INTEGER CHECK (braden_percepcion IS NULL OR (braden_percepcion >= 0 AND braden_percepcion <= 3))`,
    `ALTER TABLE bitacora ADD COLUMN IF NOT EXISTS braden_humedad INTEGER CHECK (braden_humedad IS NULL OR (braden_humedad >= 0 AND braden_humedad <= 3))`,
    `ALTER TABLE bitacora ADD COLUMN IF NOT EXISTS braden_actividad INTEGER CHECK (braden_actividad IS NULL OR (braden_actividad >= 0 AND braden_actividad <= 3))`,
    `ALTER TABLE bitacora ADD COLUMN IF NOT EXISTS braden_movilidad INTEGER CHECK (braden_movilidad IS NULL OR (braden_movilidad >= 0 AND braden_movilidad <= 3))`,
    `ALTER TABLE bitacora ADD COLUMN IF NOT EXISTS braden_nutricion INTEGER CHECK (braden_nutricion IS NULL OR (braden_nutricion >= 0 AND braden_nutricion <= 3))`,
    `ALTER TABLE bitacora ADD COLUMN IF NOT EXISTS braden_lesiones INTEGER CHECK (braden_lesiones IS NULL OR (braden_lesiones >= 0 AND braden_lesiones <= 3))`,
    `ALTER TABLE bitacora ADD COLUMN IF NOT EXISTS braden_total INTEGER`,
    `ALTER TABLE bitacora ADD COLUMN IF NOT EXISTS reporte_enfermeria TEXT`,
    `ALTER TABLE bitacora ADD COLUMN IF NOT EXISTS supervision_enfermero VARCHAR(255)`,
    `ALTER TABLE bitacora ADD COLUMN IF NOT EXISTS supervision_familiar VARCHAR(255)`,
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
