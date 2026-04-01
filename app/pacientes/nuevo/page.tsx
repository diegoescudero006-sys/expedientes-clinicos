'use client'
import { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Suspense } from 'react'

function NuevoPacienteForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const usuario_id = searchParams.get('usuario_id') || ''
  const nombreInicial = searchParams.get('nombre') || ''

  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [form, setForm] = useState({
    nombre: nombreInicial,
    edad: '',
    diagnostico: '',
    contacto: '',
    doctor_encargado: '',
    usuario_id: usuario_id
  })

  useEffect(() => {
    setForm(f => ({ ...f, nombre: nombreInicial, usuario_id }))
  }, [nombreInicial, usuario_id])

  function handleChange(e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) {
    setForm({ ...form, [e.target.name]: e.target.value })
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      const res = await fetch('/api/pacientes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form)
      })

      const data = await res.json()

      if (!res.ok) {
        setError(data.error || 'Error al crear paciente')
        return
      }

      router.push('/dashboard')
    } catch (err) {
      setError('Error de conexión')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white shadow-sm border-b">
        <div className="max-w-6xl mx-auto px-4 py-4 flex justify-between items-center">
          <h1 className="text-xl font-bold text-blue-700">Expedientes Clínicos</h1>
          <button onClick={() => router.push('/dashboard')} className="text-sm text-gray-500 hover:text-blue-500 transition">
            ← Volver
          </button>
        </div>
      </nav>

      <div className="max-w-2xl mx-auto px-4 py-8">
        <h2 className="text-2xl font-bold text-gray-800 mb-2">
          {usuario_id ? `Expediente de ${nombreInicial}` : 'Nuevo paciente'}
        </h2>
        {usuario_id && (
          <p className="text-gray-500 mb-6">Completa los datos médicos del paciente para terminar el registro.</p>
        )}

        <div className="bg-white rounded-2xl shadow-sm border p-6">
          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Nombre completo</label>
              <input
                name="nombre"
                value={form.nombre}
                onChange={handleChange}
                className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Nombre del paciente"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Edad</label>
              <input
                name="edad"
                type="number"
                value={form.edad}
                onChange={handleChange}
                className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Edad en años"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Diagnóstico</label>
              <textarea
                name="diagnostico"
                value={form.diagnostico}
                onChange={handleChange}
                className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Diagnóstico principal"
                rows={3}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Contacto de emergencia</label>
              <input
                name="contacto"
                value={form.contacto}
                onChange={handleChange}
                className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Nombre y teléfono"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Doctor encargado</label>
              <input
                name="doctor_encargado"
                value={form.doctor_encargado}
                onChange={handleChange}
                className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Nombre del doctor"
              />
            </div>

            {error && (
              <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-lg text-sm">
                {error}
              </div>
            )}

            <div className="flex gap-3 pt-2">
              <button
                type="button"
                onClick={() => router.push('/dashboard')}
                className="flex-1 border border-gray-300 text-gray-700 py-3 rounded-lg font-medium hover:bg-gray-50 transition"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={loading}
                className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-3 rounded-lg font-medium transition disabled:opacity-50"
              >
                {loading ? 'Guardando...' : 'Crear expediente'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}

export default function NuevoPacientePage() {
  return (
    <Suspense>
      <NuevoPacienteForm />
    </Suspense>
  )
}