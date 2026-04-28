import { NextRequest, NextResponse } from 'next/server'
import pool from '@/lib/db'
import { getUsuario } from '@/lib/auth'
import { requirePacienteAccess } from '@/lib/authz'

export async function GET(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const usuario = getUsuario(req)
  if (!usuario) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

  const { id } = await context.params
  const denied = await requirePacienteAccess(usuario, id)
  if (denied) return denied

  const result = await pool.query(
    `SELECT a.id, a.titulo, a.fecha, a.hora, a.lugar, a.descripcion,
            a.tipo, a.completado, a.created_at,
            u.nombre AS creado_por_nombre
     FROM agenda a
     LEFT JOIN usuarios u ON u.id = a.creado_por
     WHERE a.paciente_id = $1
     ORDER BY a.fecha ASC, a.hora ASC NULLS LAST`,
    [id]
  )

  return NextResponse.json({ eventos: result.rows })
}

export async function POST(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const usuario = getUsuario(req)
  if (!usuario || (usuario.rol !== 'enfermero' && usuario.rol !== 'admin')) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
  }

  const { id } = await context.params
  const denied = await requirePacienteAccess(usuario, id)
  if (denied) return denied

  const { titulo, fecha, hora, lugar, descripcion, tipo } = await req.json()

  if (!titulo || !fecha) {
    return NextResponse.json({ error: 'Título y fecha son requeridos' }, { status: 400 })
  }

  const TIPOS_VALIDOS = ['cita', 'estudio', 'laboratorio', 'medicamento', 'general']
  const tipoFinal = TIPOS_VALIDOS.includes(tipo) ? tipo : 'general'

  const result = await pool.query(
    `INSERT INTO agenda (paciente_id, creado_por, titulo, fecha, hora, lugar, descripcion, tipo)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
     RETURNING id, titulo, fecha, hora, lugar, descripcion, tipo, completado, created_at`,
    [id, usuario.id, titulo, fecha, hora || null, lugar || null, descripcion || null, tipoFinal]
  )

  const evento = result.rows[0]
  const u = await pool.query('SELECT nombre FROM usuarios WHERE id = $1', [usuario.id])
  evento.creado_por_nombre = u.rows[0]?.nombre ?? null

  return NextResponse.json({ evento }, { status: 201 })
}
