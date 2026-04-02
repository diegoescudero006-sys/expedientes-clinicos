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

export async function DELETE(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const usuario = getUsuario(req)
  if (!usuario || usuario.rol !== 'enfermero') {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
  }

  try {
    const { id } = await context.params

    if (id === usuario.id) {
      return NextResponse.json({ error: 'No puedes eliminarte a ti mismo' }, { status: 400 })
    }

    const check = await pool.query(
      `SELECT rol FROM usuarios WHERE id = $1`,
      [id]
    )

    if (check.rows.length === 0) {
      return NextResponse.json({ error: 'Usuario no encontrado' }, { status: 404 })
    }

    if (check.rows[0].rol !== 'enfermero') {
      return NextResponse.json({ error: 'Solo se pueden eliminar enfermeros' }, { status: 400 })
    }

    await pool.query('DELETE FROM usuarios WHERE id = $1', [id])

    return NextResponse.json({ ok: true })
  } catch (error) {
    return NextResponse.json({ error: 'Error al eliminar enfermero' }, { status: 500 })
  }
}