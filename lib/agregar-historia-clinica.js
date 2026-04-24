// Migration: add Historia Clínica columns to pacientes table
// Run with: node lib/agregar-historia-clinica.js
require('dotenv').config({ path: '.env.local' })
const { Pool } = require('pg')

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
})

async function migrar() {
  const client = await pool.connect()
  try {
    console.log('Iniciando migración: Historia Clínica...')

    await client.query(`
      ALTER TABLE pacientes
        ADD COLUMN IF NOT EXISTS estado_civil VARCHAR(50),
        ADD COLUMN IF NOT EXISTS escolaridad VARCHAR(100),
        ADD COLUMN IF NOT EXISTS religion VARCHAR(100),
        ADD COLUMN IF NOT EXISTS telefono_local VARCHAR(20),
        ADD COLUMN IF NOT EXISTS familiar_responsable VARCHAR(255),
        ADD COLUMN IF NOT EXISTS familiar_tel_local VARCHAR(20),
        ADD COLUMN IF NOT EXISTS familiar_tel_cel VARCHAR(20),
        ADD COLUMN IF NOT EXISTS segundo_numero_emergencia VARCHAR(20),
        ADD COLUMN IF NOT EXISTS tiene_servicio_medico BOOLEAN DEFAULT false,
        ADD COLUMN IF NOT EXISTS cual_servicio_medico VARCHAR(100),
        ADD COLUMN IF NOT EXISTS afiliacion VARCHAR(100),
        ADD COLUMN IF NOT EXISTS medicos_tratantes TEXT,
        ADD COLUMN IF NOT EXISTS motivo_atencion_domiciliaria TEXT,
        ADD COLUMN IF NOT EXISTS enfermedades_cronicas TEXT,
        ADD COLUMN IF NOT EXISTS ultima_hospitalizacion TEXT,
        ADD COLUMN IF NOT EXISTS cirugias TEXT,
        ADD COLUMN IF NOT EXISTS traumatismos TEXT,
        ADD COLUMN IF NOT EXISTS inmunizaciones TEXT,
        ADD COLUMN IF NOT EXISTS dispositivos_drenaje TEXT,
        ADD COLUMN IF NOT EXISTS estado_cognitivo TEXT,
        ADD COLUMN IF NOT EXISTS mini_mental_resultado TEXT,
        ADD COLUMN IF NOT EXISTS mini_mental_fecha DATE,
        ADD COLUMN IF NOT EXISTS abvd_bano VARCHAR(50),
        ADD COLUMN IF NOT EXISTS abvd_vestido VARCHAR(50),
        ADD COLUMN IF NOT EXISTS abvd_alimentacion VARCHAR(50),
        ADD COLUMN IF NOT EXISTS abvd_continencia VARCHAR(50),
        ADD COLUMN IF NOT EXISTS abvd_movilidad VARCHAR(50),
        ADD COLUMN IF NOT EXISTS downton_caidas_previas INTEGER DEFAULT 0,
        ADD COLUMN IF NOT EXISTS downton_medicamentos INTEGER DEFAULT 0,
        ADD COLUMN IF NOT EXISTS downton_deficit_sensorial INTEGER DEFAULT 0,
        ADD COLUMN IF NOT EXISTS downton_estado_mental INTEGER DEFAULT 0,
        ADD COLUMN IF NOT EXISTS downton_deambulacion INTEGER DEFAULT 0,
        ADD COLUMN IF NOT EXISTS downton_edad INTEGER DEFAULT 0,
        ADD COLUMN IF NOT EXISTS downton_total INTEGER,
        ADD COLUMN IF NOT EXISTS vf_fecha DATE,
        ADD COLUMN IF NOT EXISTS vf_ta VARCHAR(20),
        ADD COLUMN IF NOT EXISTS vf_fc INTEGER,
        ADD COLUMN IF NOT EXISTS vf_fr INTEGER,
        ADD COLUMN IF NOT EXISTS vf_temp DECIMAL(4,1),
        ADD COLUMN IF NOT EXISTS vf_spo2 INTEGER,
        ADD COLUMN IF NOT EXISTS vf_glucosa INTEGER,
        ADD COLUMN IF NOT EXISTS vf_cabeza_cuello TEXT,
        ADD COLUMN IF NOT EXISTS vf_cardiopulmonar TEXT,
        ADD COLUMN IF NOT EXISTS vf_abdomen TEXT,
        ADD COLUMN IF NOT EXISTS vf_extremidades TEXT,
        ADD COLUMN IF NOT EXISTS vf_neurologico TEXT,
        ADD COLUMN IF NOT EXISTS vf_piel TEXT,
        ADD COLUMN IF NOT EXISTS vf_profesional VARCHAR(255),
        ADD COLUMN IF NOT EXISTS vf_fecha_evaluacion DATE
    `)

    console.log('✅ Migración completada exitosamente')
    console.log('\nColumnas agregadas a pacientes:')
    console.log('  Identificación: estado_civil, escolaridad, religion, telefono_local')
    console.log('  Familiar responsable: familiar_responsable, familiar_tel_local, familiar_tel_cel, segundo_numero_emergencia')
    console.log('  Servicio médico: tiene_servicio_medico, cual_servicio_medico, afiliacion')
    console.log('  Médicos: medicos_tratantes')
    console.log('  Atención: motivo_atencion_domiciliaria')
    console.log('  Antecedentes: enfermedades_cronicas, ultima_hospitalizacion, cirugias, traumatismos')
    console.log('  Inmunizaciones: inmunizaciones')
    console.log('  Dispositivos: dispositivos_drenaje')
    console.log('  Valoración geriátrica: estado_cognitivo, mini_mental_resultado, mini_mental_fecha')
    console.log('  ABVD: abvd_bano, abvd_vestido, abvd_alimentacion, abvd_continencia, abvd_movilidad')
    console.log('  Downton: downton_caidas_previas, downton_medicamentos, downton_deficit_sensorial,')
    console.log('           downton_estado_mental, downton_deambulacion, downton_edad, downton_total')
    console.log('  Val. física: vf_fecha, vf_ta, vf_fc, vf_fr, vf_temp, vf_spo2, vf_glucosa,')
    console.log('               vf_cabeza_cuello, vf_cardiopulmonar, vf_abdomen, vf_extremidades,')
    console.log('               vf_neurologico, vf_piel, vf_profesional, vf_fecha_evaluacion')
  } catch (error) {
    console.error('❌ Error en migración:', error)
    process.exit(1)
  } finally {
    client.release()
    await pool.end()
  }
}

migrar()
