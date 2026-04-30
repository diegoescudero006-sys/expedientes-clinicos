const { Pool } = require('pg')
const fs = require('fs')
const path = require('path')
require('dotenv').config({ path: '.env.local' })

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
})

async function run() {
  try {
    const sql = fs.readFileSync(path.join(__dirname, 'add-indexes.sql'), 'utf8')
    await pool.query(sql)
    console.log('✅ Índices creados correctamente')
    process.exit(0)
  } catch (error) {
    console.error('❌ Error:', error)
    process.exit(1)
  }
}

run()
