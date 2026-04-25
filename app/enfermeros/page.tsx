'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'

interface Enfermero {
  id: string
  nombre: string
  email: string
  created_at: string
}

export default function EnfermerosPage() {
  const router = useRouter()
  const [enfermeros, setEnfermeros] = useState<Enfermero[]>([])
  const [loading, setLoading] = useState(true)
  const [eliminando, setEliminando] = useState<string | null>(null)
  const [mensaje, setMensaje] = useState('')

  const [cambiandoId, setCambiandoId] = useState<string | null>(null)
  const [nuevaPassword, setNuevaPassword] = useState('')
  const [guardando, setGuardando] = useState(false)
  const [errorPassword, setErrorPassword] = useState('')

  useEffect(() => {
    cargarEnfermeros()
  }, [])

  async function cargarEnfermeros() {
    try {
      const res = await fetch('/api/enfermeros')
      if (res.status === 401) { router.push('/login'); return }
      const data = await res.json()
      if (res.ok) setEnfermeros(data.enfermeros)
    } catch {
      // ignore
    } finally {
      setLoading(false)
    }
  }

  async function eliminarEnfermero(id: string, nombre: string) {
    if (!confirm(`¿Seguro que deseas eliminar a ${nombre}? Esta acción no se puede deshacer.`)) return
    setEliminando(id)
    try {
      const res = await fetch(`/api/enfermeros/${id}`, { method: 'DELETE' })
      const data = await res.json()
      setMensaje(res.ok ? `✅ ${nombre} eliminado correctamente` : `❌ ${data.error}`)
      if (res.ok) cargarEnfermeros()
    } catch {
      setMensaje('❌ Error de conexión')
    } finally {
      setEliminando(null)
      setTimeout(() => setMensaje(''), 4000)
    }
  }

  function abrirCambioPassword(id: string) {
    setCambiandoId(id)
    setNuevaPassword('')
    setErrorPassword('')
  }

  function cancelarCambio() {
    setCambiandoId(null)
    setNuevaPassword('')
    setErrorPassword('')
  }

  async function guardarPassword(e: React.FormEvent, enfermero: Enfermero) {
    e.preventDefault()
    if (nuevaPassword.length < 6) {
      setErrorPassword('Mínimo 6 caracteres')
      return
    }
    setGuardando(true)
    setErrorPassword('')
    try {
      const res = await fetch(`/api/usuarios/${enfermero.id}/cambiar-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password: nuevaPassword }),
      })
      const data = await res.json()
      if (!res.ok) {
        setErrorPassword(data.error || 'Error al cambiar contraseña')
      } else {
        cancelarCambio()
        setMensaje(`✅ Contraseña de ${enfermero.nombre} actualizada`)
        setTimeout(() => setMensaje(''), 4000)
      }
    } catch {
      setErrorPassword('Error de conexión')
    } finally {
      setGuardando(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white shadow-sm border-b">
        <div className="max-w-6xl mx-auto px-4 py-4 flex justify-between items-center">
          <h1 className="text-xl font-bold text-blue-700">Ángel De Los Abuelos</h1>
          <button
            onClick={() => router.push('/dashboard')}
            className="text-sm text-gray-500 hover:text-blue-500 transition"
          >
            ← Volver
          </button>
        </div>
      </nav>

      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-gray-800">Enfermeros registrados</h2>
          <button
            onClick={() => router.push('/usuarios/nuevo')}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium transition"
          >
            + Nuevo enfermero
          </button>
        </div>

        {mensaje && (
          <div className={`mb-4 px-4 py-3 rounded-lg text-sm border ${
            mensaje.includes('❌') ? 'bg-red-50 border-red-200 text-red-600' : 'bg-green-50 border-green-200 text-green-700'
          }`}>
            {mensaje}
          </div>
        )}

        {loading ? (
          <div className="text-center text-gray-400 py-12">Cargando enfermeros...</div>
        ) : enfermeros.length === 0 ? (
          <div className="bg-white rounded-2xl shadow-sm border p-8 text-center text-gray-400">
            No hay enfermeros registrados.
          </div>
        ) : (
          <div className="space-y-3">
            {enfermeros.map(e => (
              <div key={e.id} className="bg-white rounded-2xl shadow-sm border overflow-hidden">
                <div className="p-6 flex justify-between items-center">
                  <div>
                    <p className="font-semibold text-gray-800">{e.nombre}</p>
                    <p className="text-sm text-gray-500 mt-1">{e.email}</p>
                    <p className="text-xs text-gray-400 mt-1">
                      Registrado: {new Date(e.created_at).toLocaleDateString('es-MX')}
                    </p>
                  </div>
                  <div className="flex gap-2 shrink-0">
                    <button
                      onClick={() => cambiandoId === e.id ? cancelarCambio() : abrirCambioPassword(e.id)}
                      className={`text-sm px-3 py-1.5 rounded-lg border transition font-medium ${
                        cambiandoId === e.id
                          ? 'bg-gray-100 text-gray-600 border-gray-300'
                          : 'text-blue-600 border-blue-200 hover:bg-blue-50'
                      }`}
                    >
                      {cambiandoId === e.id ? 'Cancelar' : 'Cambiar contraseña'}
                    </button>
                    <button
                      onClick={() => eliminarEnfermero(e.id, e.nombre)}
                      disabled={eliminando === e.id}
                      className="text-sm text-red-500 hover:text-red-700 border border-red-200 px-3 py-1.5 rounded-lg transition hover:bg-red-50 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {eliminando === e.id ? 'Eliminando...' : 'Eliminar'}
                    </button>
                  </div>
                </div>

                {cambiandoId === e.id && (
                  <form
                    onSubmit={ev => guardarPassword(ev, e)}
                    className="border-t border-gray-100 bg-gray-50 px-6 py-4"
                  >
                    <p className="text-sm font-medium text-gray-700 mb-3">
                      Nueva contraseña para {e.nombre}
                    </p>
                    <div className="flex gap-3 items-start">
                      <div className="flex-1">
                        <input
                          type="text"
                          value={nuevaPassword}
                          onChange={ev => { setNuevaPassword(ev.target.value); setErrorPassword('') }}
                          placeholder="Mínimo 6 caracteres"
                          className="w-full border border-gray-300 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                          autoFocus
                        />
                        {errorPassword && (
                          <p className="text-xs text-red-600 mt-1">{errorPassword}</p>
                        )}
                      </div>
                      <button
                        type="submit"
                        disabled={guardando || !nuevaPassword}
                        className="shrink-0 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2.5 rounded-xl text-sm font-medium transition disabled:opacity-50"
                      >
                        {guardando ? 'Guardando...' : 'Guardar'}
                      </button>
                    </div>
                  </form>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
