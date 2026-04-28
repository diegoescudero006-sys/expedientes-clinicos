import { NextRequest, NextResponse } from 'next/server'
import pool from '@/lib/db'
import { getUsuario } from '@/lib/auth'

export async function GET(req: NextRequest) {
  const usuario = getUsuario(req)
  if (!usuario || usuario.rol !== 'admin') {
    return NextResponse.json({ error: 'Solo administradores' }, { status: 403 })
  }

  const result = await pool.query(
    `SELECT a.id, a.titulo, a.fecha, a.hora, a.lugar, a.tipo, a.completado,
            p.nombre AS paciente_nombre,
            u.nombre AS creado_por_nombre
     FROM agenda a
     JOIN pacientes p ON a.paciente_id = p.id
     LEFT JOIN usuarios u ON a.creado_por = u.id
     WHERE a.fecha BETWEEN CURRENT_DATE AND CURRENT_DATE + INTERVAL '7 days'
       AND a.completado = false
     ORDER BY a.fecha ASC, a.hora ASC NULLS LAST`
  )

  return NextResponse.json({ eventos: result.rows })
}
