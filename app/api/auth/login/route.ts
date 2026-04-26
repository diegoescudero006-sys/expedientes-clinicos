import { NextRequest, NextResponse } from 'next/server'
import pool from '@/lib/db'
import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import { AUTH_COOKIE_NAME } from '@/lib/auth'

const MAX_ATTEMPTS = 5

function getClientIp(req: NextRequest): string {
  return req.headers.get('x-forwarded-for')?.split(',')[0].trim() ?? 'unknown'
}

async function isRateLimited(ip: string): Promise<boolean> {
  const result = await pool.query(
    `INSERT INTO login_rate_limits (ip, count, reset_at)
     VALUES ($1, 1, NOW() + INTERVAL '1 minute')
     ON CONFLICT (ip) DO UPDATE SET
       count = CASE
         WHEN login_rate_limits.reset_at <= NOW() THEN 1
         ELSE login_rate_limits.count + 1
       END,
       reset_at = CASE
         WHEN login_rate_limits.reset_at <= NOW() THEN NOW() + INTERVAL '1 minute'
         ELSE login_rate_limits.reset_at
       END
     RETURNING count`,
    [ip]
  )

  return Number(result.rows[0]?.count ?? 0) > MAX_ATTEMPTS
}

async function resetAttempts(ip: string) {
  await pool.query('DELETE FROM login_rate_limits WHERE ip = $1', [ip])
}

export async function POST(req: NextRequest) {
  try {
    const ip = getClientIp(req)
    if (await isRateLimited(ip)) {
      return NextResponse.json(
        { error: 'Demasiados intentos. Espera 1 minuto e intentalo de nuevo.' },
        { status: 429 }
      )
    }

    const { email, password } = await req.json()

    if (!email || !password) {
      return NextResponse.json(
        { error: 'Email y contrasena requeridos' },
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

    await resetAttempts(ip)

    response.cookies.set(AUTH_COOKIE_NAME, token, {
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
