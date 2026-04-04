import { NextRequest, NextResponse } from 'next/server'
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3'
import pool from '@/lib/db'
import jwt from 'jsonwebtoken'

const s3 = new S3Client({
  region: process.env.AWS_REGION!,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!
  }
})

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

    const bytes = await archivo.arrayBuffer()
    const buffer = Buffer.from(bytes)

    const extension = archivo.name.split('.').pop()
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