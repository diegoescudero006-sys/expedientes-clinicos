import { NextRequest, NextResponse } from 'next/server'
import pool from '@/lib/db'
import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import { AUTH_COOKIE_NAME } from '@/lib/auth'

// Rate limiting en memoria: máx 5 intentos por IP por minuto
const loginAttempts = new Map<string, { count: number; resetAt: number }>()
const MAX_ATTEMPTS = 5
const WINDOW_MS = 60_000

function getClientIp(req: NextRequest): string {
  return req.headers.get('x-forwarded-for')?.split(',')[0].trim() ?? 'unknown'
}

function isRateLimited(ip: string): boolean {
  const now = Date.now()
  const entry = loginAttempts.get(ip)
  if (!entry || now > entry.resetAt) {
    loginAttempts.set(ip, { count: 1, resetAt: now + WINDOW_MS })
    return false
  }
  if (entry.count >= MAX_ATTEMPTS) return true
  entry.count++
  return false
}

function resetAttempts(ip: string) {
  loginAttempts.delete(ip)
}

export async function POST(req: NextRequest) {
  const ip = getClientIp(req)
  if (isRateLimited(ip)) {
    return NextResponse.json(
      { error: 'Demasiados intentos. Espera 1 minuto e inténtalo de nuevo.' },
      { status: 429 }
    )
  }

  try {
    const { email, password } = await req.json()

    if (!email || !password) {
      return NextResponse.json(
        { error: 'Email y contraseña requeridos' },
        { status: 400 }
      )
    }

    const result = await pool.query(
      'SELECT * FROM usuarios WHERE email = $1',
      [email]
    )

    if (result.rows.length === 0) {
      return NextResponse.json(
        { error: 'Credenciales incorrectas' },
        { status: 401 }
      )
    }

    const usuario = result.rows[0]
    const passwordValido = await bcrypt.compare(password, usuario.password)

    if (!passwordValido) {
      return NextResponse.json(
        { error: 'Credenciales incorrectas' },
        { status: 401 }
      )
    }

    const token = jwt.sign(
      {
        id: usuario.id,
        email: usuario.email,
        rol: usuario.rol,
        nombre: usuario.nombre
      },
      process.env.JWT_SECRET!,
      { expiresIn: '8h' }
    )

    const response = NextResponse.json({
      ok: true,
      usuario: {
        id: usuario.id,
        nombre: usuario.nombre,
        email: usuario.email,
        rol: usuario.rol
      }
    })

    
    resetAttempts(ip)

    response.cookies.set('token', token, {
        httpOnly: true,
        secure: true,
        sameSite: 'lax',
        maxAge: 60 * 60 * 8,
        path: '/'
    })

    return response

  } catch (error) {
    console.error('Error en login:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}