const { Pool } = require('pg')
const bcrypt = require('bcryptjs')

const pool = new Pool({
  connectionString: 'postgresql://postgres:DNtvfCNJlKchVaESmIltcWWLXvkEExbK@interchange.proxy.rlwy.net:39327/railway',
  ssl: { rejectUnauthorized: false }
})

async function crearAdmin() {
  try {
    const hash = bcrypt.hashSync('Admin1234!', 10)
    await pool.query(
      'INSERT INTO usuarios (nombre, email, password, rol) VALUES ($1, $2, $3, $4) ON CONFLICT (email) DO NOTHING',
      ['Enfermero Admin', 'admin@clinica.com', hash, 'enfermero']
    )
    console.log('✅ Usuario creado')
    console.log('Email: admin@clinica.com')
    console.log('Password: Admin1234!')
    process.exit(0)
  } catch (error) {
    console.error('❌ Error:', error.message)
    process.exit(1)
  }
}

crearAdmin()
