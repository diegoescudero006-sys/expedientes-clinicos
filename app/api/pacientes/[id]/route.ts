import { NextRequest, NextResponse } from 'next/server'
import pool from '@/lib/db'
import { getUsuario } from '@/lib/auth'
import { requirePacienteAccess } from '@/lib/authz'

export async function PUT(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const usuario = getUsuario(req)
  if (!usuario) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
  if (usuario.rol !== 'enfermero') return NextResponse.json({ error: 'Prohibido' }, { status: 403 })

  try {
    const { id } = await context.params
    const body = await req.json() as Record<string, unknown>

    const {
      nombre, edad, sexo, fecha_nacimiento, telefono,
      diagnostico, contacto, doctor_encargado, direccion,
      tipo_sangre, peso, altura, primera_visita,
      motivo_consulta, padecimiento_actual,
      alergias, antecedentes_medicos, antecedentes_heredofamiliares,
      antecedentes_patologicos, antecedentes_no_patologicos,
    } = body

    if (!nombre || !edad) {
      return NextResponse.json({ error: 'Nombre y edad son obligatorios' }, { status: 400 })
    }

    const result = await pool.query(
      `UPDATE pacientes SET
        nombre = $1, edad = $2, sexo = $3, fecha_nacimiento = $4, telefono = $5,
        diagnostico = $6, contacto = $7, doctor_encargado = $8, direccion = $9,
        tipo_sangre = $10, peso = $11, altura = $12, primera_visita = $13,
        motivo_consulta = $14, padecimiento_actual = $15,
        alergias = $16, antecedentes_medicos = $17, antecedentes_heredofamiliares = $18,
        antecedentes_patologicos = $19, antecedentes_no_patologicos = $20
       WHERE id = $21
       RETURNING *`,
      [
        nombre, Number(edad),
        sexo || null, fecha_nacimiento || null, telefono || null,
        diagnostico || null, contacto || null, doctor_encargado || null, direccion || null,
        tipo_sangre || null, peso || null, altura || null, primera_visita || null,
        motivo_consulta || null, padecimiento_actual || null,
        alergias || null, antecedentes_medicos || null, antecedentes_heredofamiliares || null,
        antecedentes_patologicos || null, antecedentes_no_patologicos || null,
        id,
      ]
    )

    if (result.rows.length === 0) {
      return NextResponse.json({ error: 'Paciente no encontrado' }, { status: 404 })
    }

    return NextResponse.json({ paciente: result.rows[0] })
  } catch {
    return NextResponse.json({ error: 'Error al actualizar paciente' }, { status: 500 })
  }
}

export async function GET(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const usuario = getUsuario(req)
  if (!usuario) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
  }

  try {
    const { id } = await context.params
    const denied = await requirePacienteAccess(usuario, id)
    if (denied) return denied

    const result = await pool.query(
      `SELECT p.*, u.email AS usuario_email, uc.nombre AS creado_por_nombre
       FROM pacientes p
       LEFT JOIN usuarios u ON u.id = p.usuario_id
       LEFT JOIN usuarios uc ON uc.id = p.creado_por
       WHERE p.id = $1`,
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
