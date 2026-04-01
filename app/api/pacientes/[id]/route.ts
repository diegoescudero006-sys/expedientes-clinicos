import { NextRequest, NextResponse } from 'next/server'
import pool from '@/lib/db'
import jwt from 'jsonwebtoken'

function getUsuario(req: NextRequest) {
  const token = req.cookies.get('token')?.value
  if (!token) return null
  try {
    return jwt.verify(token, process.env.JWT_SECRET!) as any
  } catch {
    return null
  }
}

export async function GET(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const usuario = getUsuario(req)
  if (!usuario) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

  try {
    const { id } = await context.params
    const result = await pool.query(
      'SELECT * FROM pacientes WHERE id = $1',
      [id]
    )
    if (result.rows.length === 0) {
      return NextResponse.json({ error: 'Paciente no encontrado' }, { status: 404 })
    }
    return NextResponse.json({ paciente: result.rows[0] })
  } catch (error) {
    return NextResponse.json({ error: 'Error al obtener paciente' }, { status: 500 })
  }
}