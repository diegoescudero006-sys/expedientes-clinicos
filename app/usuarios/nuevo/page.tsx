'use client'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'

export default function NuevoUsuarioPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [rolActual, setRolActual] = useState<string | null>(null)
  const [form, setForm] = useState({
    nombre: '',
    email: '',
    password: '',
    rol: 'paciente'
  })

  useEffect(() => {
    fetch('/api/me', { credentials: 'same-origin' })
      .then(r => r.json())
      .then(d => setRolActual(d.rol ?? null))
      .catch(() => setRolActual(null))
  }, [])

  function handleChange(e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) {
    setForm({ ...form, [e.target.name]: e.target.value })
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      const res = await fetch('/api/usuarios', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form)
      })

      const data = await res.json()

      if (!res.ok) {
        setError(data.error || 'Error al crear usuario')
        return
      }

      if (form.rol === 'paciente') {
        router.push(`/pacientes/nuevo?usuario_id=${data.usuario.id}&nombre=${encodeURIComponent(form.nombre)}`)
      } else {
        router.push('/dashboard')
      }
    } catch {
      setError('Error de conexión')
    } finally {
      setLoading(false)
    }
  }

  const descripcion = form.rol === 'paciente'
    ? 'Después de crear las credenciales, crearás el expediente del paciente.'
    : form.rol === 'admin'
      ? 'El administrador tendrá acceso total al sistema y podrá gestionar asignaciones.'
      : 'El enfermero solo verá los pacientes que le sean asignados.'

  const labelBoton = loading ? 'Creando...' : form.rol === 'paciente' ? 'Crear y agregar expediente →' : 'Crear usuario'

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-6xl mx-auto px-4 py-4 flex justify-between items-center">
          <h1 className="text-xl font-bold text-blue-800">Ángel De Los Abuelos</h1>
          <button
            onClick={() => router.push('/dashboard')}
            className="text-sm text-gray-500 hover:text-blue-600 transition font-medium"
          >
            ← Volver
          </button>
        </div>
      </nav>

      <div className="max-w-2xl mx-auto px-4 py-8">
        <h2 className="text-2xl font-bold text-gray-800 mb-2">Crear usuario</h2>
        <p className="text-gray-500 mb-6">{descripcion}</p>

        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Rol</label>
              <select
                name="rol"
                value={form.rol}
                onChange={handleChange}
                className="w-full border border-gray-300 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
              >
                <option value="paciente">Paciente</option>
                <option value="enfermero">Enfermero</option>
                {rolActual === 'admin' && (
                  <option value="admin">Administrador</option>
                )}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Nombre completo</label>
              <input
                name="nombre"
                value={form.nombre}
                onChange={handleChange}
                className="w-full border border-gray-300 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Nombre completo"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Correo electrónico</label>
              <input
                name="email"
                type="email"
                value={form.email}
                onChange={handleChange}
                className="w-full border border-gray-300 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="correo@ejemplo.com"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Contraseña temporal</label>
              <input
                name="password"
                type="text"
                value={form.password}
                onChange={handleChange}
                className="w-full border border-gray-300 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Contraseña que le darás al usuario"
                required
              />
            </div>

            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl text-sm">
                {error}
              </div>
            )}

            <div className="flex gap-3 pt-2">
              <button
                type="button"
                onClick={() => router.push('/dashboard')}
                className="flex-1 border border-gray-300 text-gray-700 py-3 rounded-xl font-medium hover:bg-gray-50 transition"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={loading}
                className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-3 rounded-xl font-medium transition disabled:opacity-50"
              >
                {labelBoton}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}
