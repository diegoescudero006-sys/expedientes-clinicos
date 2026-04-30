const { Pool } = require('pg')
const bcrypt = require('bcryptjs')

const pool = new Pool({
  connectionString: 'postgresql://postgres:DNtvfCNJlKchVaESmIltcWWLXvkEExbK@interchange.proxy.rlwy.net:39327/railway',
  ssl: { rejectUnauthorized: false }
})

const admins = [
  { nombre: 'Sam',   email: 'sam@angeldelosabuelos.com',   password: 'Sam2024!'   },
  { nombre: 'Admin', email: 'admin@angeldelosabuelos.com', password: 'Admin2024!' },
]

async function crearAdmins() {
  for (const admin of admins) {
    try {
      const hash = bcrypt.hashSync(admin.password, 10)
      await pool.query(
        `INSERT INTO usuarios (nombre, email, password, rol)
         VALUES ($1, $2, $3, 'admin')
         ON CONFLICT (email) DO UPDATE SET nombre = $1, password = $3, rol = 'admin'`,
        [admin.nombre, admin.email, hash]
      )
      console.log(`✅ ${admin.nombre} (${admin.email}) — listo`)
    } catch (err) {
      console.error(`❌ Error con ${admin.email}:`, err.message)
    }
  }
  process.exit(0)
}

crearAdmins()
