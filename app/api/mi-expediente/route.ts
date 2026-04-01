import { NextRequest, NextResponse } from 'next/server'
import { getUsuario } from '@/lib/auth'
import { findPacienteByUsuarioId } from '@/lib/paciente-del-usuario'

export async function GET(req: NextRequest) {
  const usuario = getUsuario(req)
  if (!usuario) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
  }
  if (usuario.rol !== 'paciente') {
    return NextResponse.json({ error: 'No autorizado' }, { status: 403 })
  }

  try {
    const paciente = await findPacienteByUsuarioId(usuario.id)
    if (!paciente) {
      return NextResponse.json(
        { error: 'No se encontró expediente asociado a tu cuenta' },
        { status: 404 }
      )
    }
    return NextResponse.json({ paciente })
  } catch (error) {
    console.error('Error en mi-expediente GET:', error)
    return NextResponse.json(
      { error: 'Error al obtener expediente' },
      { status: 500 }
    )
  }
}
