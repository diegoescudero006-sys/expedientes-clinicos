import { NextRequest, NextResponse } from 'next/server'
import pool from '@/lib/db'
import { getUsuario } from '@/lib/auth'

export async function DELETE(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const usuario = getUsuario(req)
  if (!usuario || (usuario.rol !== 'enfermero' && usuario.rol !== 'admin')) {
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

    const client = await pool.connect()
    try {
      await client.query('BEGIN')
      await client.query('DELETE FROM enfermeros_pacientes WHERE enfermero_id = $1', [id])
      await client.query('DELETE FROM usuarios WHERE id = $1', [id])
      await client.query('COMMIT')
    } catch (err) {
      await client.query('ROLLBACK')
      throw err
    } finally {
      client.release()
    }

    return NextResponse.json({ ok: true })
  } catch (error) {
    return NextResponse.json({ error: 'Error al eliminar enfermero' }, { status: 500 })
  }
}