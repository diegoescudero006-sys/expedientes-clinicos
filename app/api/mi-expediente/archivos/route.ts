import { NextRequest, NextResponse } from 'next/server'
import pool from '@/lib/db'
import { getUsuario } from '@/lib/auth'
import { generarUrlFirmada } from '@/lib/s3'

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

    const archivos = await Promise.all(
      result.rows.map(async (a) => ({
        ...a,
        url: await generarUrlFirmada(a.url),
      }))
    )

    return NextResponse.json({ archivos })
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

    const MAX_SIZE = 10 * 1024 * 1024
    const ALLOWED_TYPES = ['application/pdf', 'image/jpeg', 'image/png']

    if (archivo.size > MAX_SIZE) {
      return NextResponse.json({ error: 'El archivo no puede superar los 10 MB' }, { status: 413 })
    }
    if (!ALLOWED_TYPES.includes(archivo.type)) {
      return NextResponse.json({ error: 'Solo se permiten archivos PDF, JPG o PNG' }, { status: 415 })
    }

    const { PutObjectCommand } = await import('@aws-sdk/client-s3')
    const { s3 } = await import('@/lib/s3')

    const bytes = await archivo.arrayBuffer()
    const buffer = Buffer.from(bytes)
    const nombreUnico = `${paciente_id}/${Date.now()}-${archivo.name}`

    await s3.send(new PutObjectCommand({
      Bucket: process.env.AWS_S3_BUCKET!,
      Key: nombreUnico,
      Body: buffer,
      ContentType: archivo.type,
    }))

    // Guardamos el key de S3, no la URL pública — las URLs se generan firmadas al leer
    const result = await pool.query(
      `INSERT INTO archivos (paciente_id, subido_por, nombre_archivo, url, tipo)
       VALUES ($1, $2, $3, $4, $5) RETURNING *`,
      [paciente_id, usuario.id, archivo.name, nombreUnico, archivo.type]
    )

    return NextResponse.json({ archivo: result.rows[0] }, { status: 201 })
  } catch (error) {
    console.error('Error subiendo archivo:', error)
    return NextResponse.json({ error: 'Error al subir archivo' }, { status: 500 })
  }
}