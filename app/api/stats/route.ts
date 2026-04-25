import { NextRequest, NextResponse } from 'next/server'
import pool from '@/lib/db'
import { getUsuario } from '@/lib/auth'

export async function GET(req: NextRequest) {
  const usuario = getUsuario(req)
  if (!usuario || usuario.rol !== 'admin') {
    return NextResponse.json({ error: 'No autorizado' }, { status: 403 })
  }

  const result = await pool.query(`
    SELECT
      (SELECT COUNT(*)                        FROM pacientes)               AS pacientes_total,
      (SELECT COUNT(*) FROM pacientes         WHERE archivado = false)      AS pacientes_activos,
      (SELECT COUNT(*) FROM pacientes         WHERE archivado = true)       AS pacientes_archivados,
      (SELECT COUNT(*) FROM usuarios          WHERE rol = 'enfermero')      AS enfermeros_total,
      (SELECT COUNT(*) FROM usuarios          WHERE rol = 'admin')          AS admins_total,
      (SELECT COUNT(*)                        FROM usuarios)                AS usuarios_total
  `)

  const row = result.rows[0]
  return NextResponse.json({
    pacientes_total:     Number(row.pacientes_total),
    pacientes_activos:   Number(row.pacientes_activos),
    pacientes_archivados:Number(row.pacientes_archivados),
    enfermeros_total:    Number(row.enfermeros_total),
    admins_total:        Number(row.admins_total),
    usuarios_total:      Number(row.usuarios_total),
  })
}
