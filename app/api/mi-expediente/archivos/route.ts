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
  if (!usuario || usuario.rol !== 'paciente') {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
  }

  try {
    const pacienteRes = await pool.query(
      'SELECT id FROM pacientes WHERE usuario_id = $1',
      [usuario.id]
    )

    if (pacienteRes.rows.length === 0) {
      return NextResponse.json({ error: 'Paciente no encontrado' }, { status: 404 })
    }

    const paciente_id = pacienteRes.rows[0].id

    const result = await pool.query(
      `SELECT a.*, u.nombre as subido_por_nombre
       FROM archivos a
       LEFT JOIN usuarios u ON a.subido_por = u.id
       WHERE a.paciente_id = $1
       ORDER BY a.created_at DESC`,
      [paciente_id]
    )

    return NextResponse.json({ archivos: result.rows })
  } catch (error) {
    return NextResponse.json({ error: 'Error al obtener archivos' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  const usuario = getUsuario(req)
  if (!usuario || usuario.rol !== 'paciente') {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
  }

  try {
    const pacienteRes = await pool.query(
      'SELECT id FROM pacientes WHERE usuario_id = $1',
      [usuario.id]
    )

    if (pacienteRes.rows.length === 0) {
      return NextResponse.json({ error: 'Paciente no encontrado' }, { status: 404 })
    }

    const paciente_id = pacienteRes.rows[0].id

    const formData = await req.formData()
    const archivo = formData.get('archivo') as File

    if (!archivo) {
      return NextResponse.json({ error: 'Archivo requerido' }, { status: 400 })
    }

    const { S3Client, PutObjectCommand } = await import('@aws-sdk/client-s3')
    const s3 = new S3Client({
      region: process.env.AWS_REGION!,
      credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!
      }
    })

    const bytes = await archivo.arrayBuffer()
    const buffer = Buffer.from(bytes)
    const nombreUnico = `${paciente_id}/${Date.now()}-${archivo.name}`

    await s3.send(new PutObjectCommand({
      Bucket: process.env.AWS_S3_BUCKET!,
      Key: nombreUnico,
      Body: buffer,
      ContentType: archivo.type
    }))

    const url = `https://${process.env.AWS_S3_BUCKET}.s3.${process.env.AWS_REGION}.amazonaws.com/${nombreUnico}`

    const result = await pool.query(
      `INSERT INTO archivos (paciente_id, subido_por, nombre_archivo, url, tipo)
       VALUES ($1, $2, $3, $4, $5) RETURNING *`,
      [paciente_id, usuario.id, archivo.name, url, archivo.type]
    )

    return NextResponse.json({ archivo: result.rows[0] }, { status: 201 })
  } catch (error) {
    console.error('Error subiendo archivo:', error)
    return NextResponse.json({ error: 'Error al subir archivo' }, { status: 500 })
  }
}