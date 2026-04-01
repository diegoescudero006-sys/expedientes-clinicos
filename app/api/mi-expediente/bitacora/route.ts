import { NextRequest, NextResponse } from 'next/server'
import pool from '@/lib/db'
import { getUsuario } from '@/lib/auth'
import { findPacienteByUsuarioId } from '@/lib/paciente-del-usuario'

export async function GET(req: NextRequest) {
  const usuario = getUsuario(req)
  if (!usuario) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
  }
  if (usuario.rol !== 'paciente') {
    return NextResponse.json({ error: 'No autorizado' }, { status: 403 })
  }

  try {
    const paciente = await findPacienteByUsuarioId(usuario.id)
    if (!paciente) {
      return NextResponse.json(
        { error: 'No se encontró expediente asociado a tu cuenta' },
        { status: 404 }
      )
    }

    const result = await pool.query(
      `SELECT b.*, u.nombre as enfermero_nombre
       FROM bitacora b
       LEFT JOIN usuarios u ON b.enfermero_id = u.id
       WHERE b.paciente_id = $1
       ORDER BY b.created_at DESC`,
      [paciente.id]
    )
    return NextResponse.json({ bitacoras: result.rows })
  } catch (error) {
    console.error('Error en mi-expediente/bitacora GET:', error)
    return NextResponse.json(
      { error: 'Error al obtener bitácora' },
      { status: 500 }
    )
  }
}
