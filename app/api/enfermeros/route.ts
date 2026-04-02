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

export async function GET(req: NextRequest) {
  const usuario = getUsuario(req)
  if (!usuario || usuario.rol !== 'enfermero') {
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