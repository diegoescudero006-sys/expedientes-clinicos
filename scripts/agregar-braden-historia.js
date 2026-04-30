// Migration: add Braden Scale (baseline) columns to pacientes table
// Run with: node lib/agregar-braden-historia.js
require('dotenv').config({ path: '.env.local' })
const { Pool } = require('pg')

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
})

async function migrar() {
  const client = await pool.connect()
  try {
    console.log('Iniciando migración: Escala de Braden en Historia Clínica...')

    await client.query(`
      ALTER TABLE pacientes
        ADD COLUMN IF NOT EXISTS braden_percepcion INTEGER,
        ADD COLUMN IF NOT EXISTS braden_humedad INTEGER,
        ADD COLUMN IF NOT EXISTS braden_actividad INTEGER,
        ADD COLUMN IF NOT EXISTS braden_movilidad INTEGER,
        ADD COLUMN IF NOT EXISTS braden_nutricion INTEGER,
        ADD COLUMN IF NOT EXISTS braden_friccion INTEGER,
        ADD COLUMN IF NOT EXISTS braden_total INTEGER,
        ADD COLUMN IF NOT EXISTS braden_fecha DATE
    `)

    console.log('✅ Migración completada exitosamente')
    console.log('Columnas agregadas a pacientes:')
    console.log('  braden_percepcion  INTEGER  -- 1-4')
    console.log('  braden_humedad     INTEGER  -- 1-4')
    console.log('  braden_actividad   INTEGER  -- 1-4')
    console.log('  braden_movilidad   INTEGER  -- 1-4')
    console.log('  braden_nutricion   INTEGER  -- 1-4')
    console.log('  braden_friccion    INTEGER  -- 1-3')
    console.log('  braden_total       INTEGER  -- calculado (6-23)')
    console.log('  braden_fecha       DATE     -- fecha de valoración')
  } catch (error) {
    console.error('❌ Error en migración:', error)
    process.exit(1)
  } finally {
    client.release()
    await pool.end()
  }
}

migrar()
