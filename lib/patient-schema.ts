import pool from '@/lib/db'

let patientDowntonItemsColumnsPromise: Promise<void> | null = null

export async function ensurePatientDowntonItemsColumns() {
  if (!patientDowntonItemsColumnsPromise) {
    patientDowntonItemsColumnsPromise = pool.query(`
      ALTER TABLE pacientes
        ADD COLUMN IF NOT EXISTS downton_medicamentos_items TEXT[],
        ADD COLUMN IF NOT EXISTS downton_deficit_sensorial_items TEXT[]
    `).then(() => undefined)
      .catch((error) => {
        patientDowntonItemsColumnsPromise = null
        throw error
      })
  }

  return patientDowntonItemsColumnsPromise
}
