const { Pool } = require('pg')
const fs = require('fs')
const path = require('path')
require('dotenv').config({ path: '.env.local' })

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
})

async function initDB() {
  try {
    const schema = fs.readFileSync(
      path.join(process.cwd(), 'lib', 'schema.sql'),
      'utf8'
    )
    await pool.query(schema)
    console.log('✅ Base de datos inicializada correctamente')
    process.exit(0)
  } catch (error) {
    console.error('❌ Error:', error)
    process.exit(1)
  }
}

initDB()