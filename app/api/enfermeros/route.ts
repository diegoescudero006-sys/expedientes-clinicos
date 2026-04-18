import { NextRequest, NextResponse } from 'next/server'
import pool from '@/lib/db'
import { getUsuario } from '@/lib/auth'

export async function GET(req: NextRequest) {
  const usuario = getUsuario(req)
  if (!usuario || (usuario.rol !== 'enfermero' && usuario.rol !== 'admin')) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
  }

  try {
    const result = await pool.query(
      `SELECT id, nombre, email, created_at 
       FROM usuarios 
       WHERE rol = 'enfermero' 
       ORDER BY created_at ASC`
    )
    return NextResponse.json({ enfermeros: result.rows })
  } catch (error) {
    return NextResponse.json({ error: 'Error al obtener enfermeros' }, { status: 500 })
  }
}