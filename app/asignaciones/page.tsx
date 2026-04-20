'use client'
import { useEffect, useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'

interface Asignacion {
  id: string
  activo: boolean
  assigned_at: string
  enfermero_id: string
  enfermero_nombre: string
  enfermero_email: string
  paciente_id: string
  paciente_nombre: string
  paciente_edad: number
}

interface Enfermero {
  id: string
  nombre: string
  email: string
}

interface Paciente {
  id: string
  nombre: string
  edad: number
}

export default function AsignacionesPage() {
  const router = useRouter()
  const [asignaciones, setAsignaciones] = useState<Asignacion[]>([])
  const [enfermeros, setEnfermeros] = useState<Enfermero[]>([])
  const [pacientes, setPacientes] = useState<Paciente[]>([])
  const [loading, setLoading] = useState(true)
  const [guardando, setGuardando] = useState(false)
  const [mensaje, setMensaje] = useState<{ texto: string; tipo: 'ok' | 'error' } | null>(null)
  const [enfermeroSel, setEnfermeroSel] = useState('')
  const [pacienteSel, setPacienteSel] = useState('')
  const [cerrandoSesion, setCerrandoSesion] = useState(false)

  const mostrarMensaje = (texto: string, tipo: 'ok' | 'error') => {
    setMensaje({ texto, tipo })
    setTimeout(() => setMensaje(null), 4000)
  }

  const cargar = useCallback(async () => {
    setLoading(true)
    try {
      const [asigRes, enfRes, pacRes] = await Promise.all([
        fetch('/api/asignaciones', { credentials: 'same-origin' }),
        fetch('/api/enfermeros', { credentials: 'same-origin' }),
        fetch('/api/pacientes?archivados=false&page=1', { credentials: 'same-origin' }),
      ])

      if (asigRes.status === 401 || asigRes.status === 403) {
        router.push('/dashboard')
        return
      }

      const [asigData, enfData, pacData] = await Promise.all([
        asigRes.json(),
        enfRes.json(),
        pacRes.json(),
      ])

      setAsignaciones(Array.isArray(asigData.asignaciones) ? asigData.asignaciones : [])
      setEnfermeros(Array.isArray(enfData.enfermeros) ? enfData.enfermeros : [])
      setPacientes(Array.isArray(pacData.pacientes) ? pacData.pacientes : [])
    } catch {
      mostrarMensaje('Error al cargar los datos', 'error')
    } finally {
      setLoading(false)
    }
  }, [router])

  useEffect(() => { cargar() }, [cargar])

  async function asignar(e: React.FormEvent) {
    e.preventDefault()
    if (!enfermeroSel || !pacienteSel) return
    setGuardando(true)
    try {
      const res = await fetch('/api/asignaciones', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'same-origin',
        body: JSON.stringify({ enfermero_id: enfermeroSel, paciente_id: pacienteSel }),
      })
      const data = await res.json()
      if (!res.ok) {
        mostrarMensaje(data.error || 'Error al asignar', 'error')
      } else {
        mostrarMensaje('Asignación creada correctamente', 'ok')
        setEnfermeroSel('')
        setPacienteSel('')
        cargar()
      }
    } catch {
      mostrarMensaje('Error de conexión', 'error')
    } finally {
      setGuardando(false)
    }
  }

  async function revocar(id: string, nombre: string) {
    if (!confirm(`¿Revocar acceso del enfermero a ${nombre}? El historial se conserva.`)) return
    try {
      const res = await fetch(`/api/asignaciones/${id}`, {
        method: 'PATCH',
        credentials: 'same-origin',
      })
      if (res.ok) {
        mostrarMensaje('Acceso revocado', 'ok')
        cargar()
      } else {
        mostrarMensaje('Error al revocar acceso', 'error')
      }
    } catch {
      mostrarMensaje('Error de conexión', 'error')
    }
  }

  // Agrupar asignaciones por enfermero
  const porEnfermero = asignaciones.reduce<Record<string, { nombre: string; email: string; items: Asignacion[] }>>((acc, a) => {
    if (!acc[a.enfermero_id]) {
      acc[a.enfermero_id] = { nombre: a.enfermero_nombre, email: a.enfermero_email, items: [] }
    }
    acc[a.enfermero_id].items.push(a)
    return acc
  }, {})

  const selectCls = 'w-full border border-gray-300 rounded-xl px-4 py-3 text-base focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white'

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <nav className="bg-white shadow-sm border-b border-gray-200 shrink-0">
        <div className="max-w-4xl mx-auto px-4 py-4 flex justify-between items-center gap-3">
          <h1 className="text-xl font-bold text-blue-800">Ángel De Los Abuelos</h1>
          <button
            type="button"
            disabled={cerrandoSesion}
            onClick={async () => {
              setCerrandoSesion(true)
              try {
                await fetch('/api/auth/logout', { method: 'POST', credentials: 'same-origin' })
                router.push('/login')
              } catch {
                setCerrandoSesion(false)
              }
            }}
            className="min-h-[44px] px-4 text-base font-medium text-gray-700 hover:text-red-700 border border-gray-200 rounded-xl hover:bg-red-50 transition disabled:opacity-50"
          >
            {cerrandoSesion ? 'Cerrando…' : 'Cerrar sesión'}
          </button>
        </div>
      </nav>

      <div className="max-w-4xl w-full mx-auto px-4 py-6 sm:py-8 flex-1 space-y-6">
        <div className="flex items-center gap-3">
          <button
            onClick={() => router.push('/dashboard')}
            className="text-blue-600 hover:text-blue-800 text-sm font-medium transition"
          >
            ← Volver al dashboard
          </button>
        </div>

        <div>
          <h2 className="text-2xl sm:text-3xl font-bold text-gray-800">Gestionar asignaciones</h2>
          <p className="text-gray-500 mt-1">Asigna enfermeros a pacientes y administra el acceso.</p>
        </div>

        {mensaje && (
          <div className={`px-4 py-3 rounded-xl text-sm font-medium border ${
            mensaje.tipo === 'ok'
              ? 'bg-green-50 text-green-800 border-green-200'
              : 'bg-red-50 text-red-800 border-red-200'
          }`}>
            {mensaje.texto}
          </div>
        )}

        {/* Formulario nueva asignación */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
          <h3 className="font-semibold text-gray-800 text-lg mb-4">Nueva asignación</h3>
          <form onSubmit={asignar} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Enfermero</label>
                <select
                  value={enfermeroSel}
                  onChange={e => setEnfermeroSel(e.target.value)}
                  className={selectCls}
                  required
                >
                  <option value="">Seleccionar enfermero…</option>
                  {enfermeros.map(e => (
                    <option key={e.id} value={e.id}>{e.nombre}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Paciente</label>
                <select
                  value={pacienteSel}
                  onChange={e => setPacienteSel(e.target.value)}
                  className={selectCls}
                  required
                >
                  <option value="">Seleccionar paciente…</option>
                  {pacientes.map(p => (
                    <option key={p.id} value={p.id}>{p.nombre} ({p.edad} años)</option>
                  ))}
                </select>
              </div>
            </div>
            <div className="flex justify-end">
              <button
                type="submit"
                disabled={guardando || !enfermeroSel || !pacienteSel}
                className="min-h-[44px] bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-xl font-medium transition disabled:opacity-50"
              >
                {guardando ? 'Asignando…' : 'Asignar paciente'}
              </button>
            </div>
          </form>
        </div>

        {/* Lista de asignaciones */}
        {loading ? (
          <div className="bg-white rounded-2xl border border-gray-200 p-10 text-center text-gray-500">
            Cargando asignaciones…
          </div>
        ) : Object.keys(porEnfermero).length === 0 ? (
          <div className="bg-white rounded-2xl border border-gray-200 p-10 text-center text-gray-400">
            No hay asignaciones activas. Usa el formulario de arriba para crear una.
          </div>
        ) : (
          <div className="space-y-4">
            {Object.entries(porEnfermero).map(([enfId, grupo]) => (
              <div key={enfId} className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
                <div className="bg-blue-50 border-b border-blue-100 px-6 py-4">
                  <p className="font-semibold text-blue-900 text-base">{grupo.nombre}</p>
                  <p className="text-sm text-blue-600">{grupo.email}</p>
                </div>
                {grupo.items.length === 0 ? (
                  <p className="px-6 py-4 text-sm text-gray-400">Sin pacientes asignados</p>
                ) : (
                  <ul className="divide-y divide-gray-100">
                    {grupo.items.map(a => (
                      <li key={a.id} className="flex items-center justify-between px-6 py-4 gap-4">
                        <div>
                          <p className="font-medium text-gray-800">{a.paciente_nombre}</p>
                          <p className="text-sm text-gray-500">{a.paciente_edad} años</p>
                        </div>
                        <button
                          onClick={() => revocar(a.id, a.paciente_nombre)}
                          className="shrink-0 text-sm text-red-500 hover:text-red-700 border border-red-200 hover:border-red-400 px-3 py-1.5 rounded-lg transition font-medium"
                        >
                          Revocar acceso
                        </button>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Enfermeros sin asignaciones activas */}
        {!loading && enfermeros.filter(e => !porEnfermero[e.id]).length > 0 && (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
            <h3 className="font-semibold text-gray-700 mb-3 text-sm uppercase tracking-wide">Sin pacientes asignados</h3>
            <ul className="space-y-2">
              {enfermeros.filter(e => !porEnfermero[e.id]).map(e => (
                <li key={e.id} className="flex items-center gap-3 text-gray-500">
                  <span className="w-2 h-2 rounded-full bg-gray-300 shrink-0" />
                  <span className="text-sm">{e.nombre} — {e.email}</span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </div>
  )
}
