import { NextRequest, NextResponse } from 'next/server'
import pool from '@/lib/db'
import bcrypt from 'bcryptjs'
import { getUsuario } from '@/lib/auth'

export async function POST(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const auth = getUsuario(req)
  if (!auth || (auth.rol !== 'enfermero' && auth.rol !== 'admin')) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
  }

  try {
    const { id } = await context.params
    const { password } = await req.json()

    if (!password || typeof password !== 'string') {
      return NextResponse.json({ error: 'Contraseña requerida' }, { status: 400 })
    }

    if (password.length < 6) {
      return NextResponse.json(
        { error: 'La contraseña debe tener al menos 6 caracteres' },
        { status: 400 }
      )
    }

    const check = await pool.query('SELECT id, rol FROM usuarios WHERE id = $1', [id])
    if (check.rows.length === 0) {
      return NextResponse.json({ error: 'Usuario no encontrado' }, { status: 404 })
    }

    const rolObjetivo = check.rows[0].rol as string
    if (auth.rol === 'admin') {
      if (rolObjetivo !== 'paciente' && rolObjetivo !== 'enfermero') {
        return NextResponse.json({ error: 'No se puede cambiar la contraseña de este usuario' }, { status: 403 })
      }
    } else {
      if (rolObjetivo !== 'paciente') {
        return NextResponse.json({ error: 'Solo se puede cambiar la contraseña de cuentas de paciente' }, { status: 403 })
      }
    }

    const hash = await bcrypt.hash(password, 10)
    await pool.query('UPDATE usuarios SET password = $1 WHERE id = $2', [hash, id])

    return NextResponse.json({ ok: true })
  } catch (error) {
    console.error('Error en cambiar-password:', error)
    return NextResponse.json({ error: 'Error al actualizar contraseña' }, { status: 500 })
  }
}
