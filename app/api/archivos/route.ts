import { NextRequest, NextResponse } from 'next/server'
import { PutObjectCommand } from '@aws-sdk/client-s3'
import pool from '@/lib/db'
import { getUsuario } from '@/lib/auth'
import { s3 } from '@/lib/s3'

export async function POST(req: NextRequest) {
  const usuario = getUsuario(req)
  if (!usuario) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
  }

  try {
    const formData = await req.formData()
    const archivo = formData.get('archivo') as File
    const paciente_id = formData.get('paciente_id') as string

    if (!archivo || !paciente_id) {
      return NextResponse.json({ error: 'Archivo y paciente requeridos' }, { status: 400 })
    }

    if (usuario.rol === 'paciente') {
      const check = await pool.query(
        'SELECT id FROM pacientes WHERE id = $1 AND usuario_id = $2',
        [paciente_id, usuario.id]
      )
      if (check.rows.length === 0) {
        return NextResponse.json({ error: 'No autorizado' }, { status: 403 })
      }
    }

    const MAX_SIZE = 10 * 1024 * 1024
    const ALLOWED_TYPES = ['application/pdf', 'image/jpeg', 'image/png']

    if (archivo.size > MAX_SIZE) {
      return NextResponse.json({ error: 'El archivo no puede superar los 10 MB' }, { status: 413 })
    }
    if (!ALLOWED_TYPES.includes(archivo.type)) {
      return NextResponse.json({ error: 'Solo se permiten archivos PDF, JPG o PNG' }, { status: 415 })
    }

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