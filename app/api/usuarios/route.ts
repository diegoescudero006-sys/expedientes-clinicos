import { NextRequest, NextResponse } from 'next/server'
import pool from '@/lib/db'
import bcrypt from 'bcryptjs'
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

export async function POST(req: NextRequest) {
  const usuario = getUsuario(req)
  if (!usuario || usuario.rol !== 'enfermero') {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
  }

  try {
    const { nombre, email, password, rol } = await req.json()

    if (!nombre || !email || !password || !rol) {
      return NextResponse.json({ error: 'Todos los campos son requeridos' }, { status: 400 })
    }

    const existe = await pool.query('SELECT id FROM usuarios WHERE email = $1', [email])
    if (existe.rows.length > 0) {
      return NextResponse.json({ error: 'Ya existe un usuario con ese correo' }, { status: 400 })
    }

    const hash = bcrypt.hashSync(password, 10)
    const result = await pool.query(
      `INSERT INTO usuarios (nombre, email, password, rol)
       VALUES ($1, $2, $3, $4) RETURNING id, nombre, email, rol`,
      [nombre, email, hash, rol]
    )

    return NextResponse.json({ usuario: result.rows[0] }, { status: 201 })
  } catch (error) {
    return NextResponse.json({ error: 'Error al crear usuario' }, { status: 500 })
  }
}