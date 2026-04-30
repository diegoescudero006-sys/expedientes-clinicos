const { Pool } = require('pg')

const pool = new Pool({
  connectionString: 'postgresql://postgres:DNtvfCNJlKchVaESmIltcWWLXvkEExbK@interchange.proxy.rlwy.net:39327/railway',
  ssl: { rejectUnauthorized: false }
})

async function migrar() {
  const client = await pool.connect()
  try {
    await client.query('BEGIN')

    await client.query(`
      ALTER TABLE enfermeros_pacientes
      ADD COLUMN IF NOT EXISTS activo BOOLEAN NOT NULL DEFAULT true
    `)

    await client.query(`ALTER TABLE usuarios DROP CONSTRAINT IF EXISTS usuarios_rol_check`)
    await client.query(`
      ALTER TABLE usuarios
      ADD CONSTRAINT usuarios_rol_check
      CHECK (rol IN ('enfermero', 'paciente', 'admin'))
    `)

    await client.query('COMMIT')
    console.log('✅ Migración completada:')
    console.log('   - Columna activo agregada a enfermeros_pacientes')
    console.log('   - Rol admin habilitado en tabla usuarios')
    process.exit(0)
  } catch (err) {
    await client.query('ROLLBACK')
    console.error('❌ Error:', err.message)
    process.exit(1)
  } finally {
    client.release()
  }
}

migrar()
