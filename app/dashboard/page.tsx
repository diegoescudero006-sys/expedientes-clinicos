'use client'
import { useEffect, useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'

interface Paciente {
  id: string
  nombre: string
  edad: number
  diagnostico: string
  contacto: string
  doctor_encargado: string
  archivado: boolean
}

export default function DashboardPage() {
  const router = useRouter()
  const [pacientes, setPacientes] = useState<Paciente[]>([])
  const [loading, setLoading] = useState(true)
  const [verArchivados, setVerArchivados] = useState(false)
  const [search, setSearch] = useState('')
  const [debouncedSearch, setDebouncedSearch] = useState('')
  const [page, setPage] = useState(1)
  const [total, setTotal] = useState(0)
  const LIMIT = 20
  const [error, setError] = useState('')
  const [cerrandoSesion, setCerrandoSesion] = useState(false)
  const [rol, setRol] = useState<string | null>(null)
  const [nombreUsuario, setNombreUsuario] = useState('')

  useEffect(() => {
    fetch('/api/me', { credentials: 'same-origin' })
      .then(r => r.json())
      .then(d => { setRol(d.rol ?? null); setNombreUsuario(d.nombre ?? '') })
      .catch(() => setRol(null))
  }, [])

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search.trim())
      setPage(1)
    }, 500)
    return () => clearTimeout(timer)
  }, [search])

  const cargarPacientes = useCallback(async () => {
    setError('')
    setLoading(true)
    try {
      const params = new URLSearchParams({
        archivados: String(verArchivados),
        page: String(page),
      })
      if (debouncedSearch) params.set('search', debouncedSearch)

      const res = await fetch(`/api/pacientes?${params.toString()}`, { credentials: 'same-origin' })

      if (res.status === 401) { router.push('/login'); return }

      const data = await res.json().catch(() => ({}))

      if (!res.ok) {
        setError(typeof data.error === 'string' ? data.error : 'No pudimos cargar los pacientes. Intenta de nuevo.')
        setPacientes([])
        return
      }

      setPacientes(Array.isArray(data.pacientes) ? data.pacientes : [])
      setTotal(typeof data.total === 'number' ? data.total : 0)
    } catch {
      setError('No pudimos conectar. Comprueba tu internet e intenta otra vez.')
      setPacientes([])
    } finally {
      setLoading(false)
    }
  }, [router, verArchivados, debouncedSearch, page])

  useEffect(() => {
    cargarPacientes()
  }, [cargarPacientes])

  const esAdmin = rol === 'admin'

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <nav className="bg-white shadow-sm border-b border-gray-200 shrink-0">
        <div className="max-w-6xl mx-auto px-4 py-4 flex flex-wrap justify-between items-center gap-3">
          <div>
            <img src="/logo.jpeg" alt="Ángel De Los Abuelos" className="h-12 w-auto object-contain" />
            {nombreUsuario && (
              <p className="text-sm text-gray-500 mt-0.5">
                {esAdmin ? 'Administrador' : 'Enfermero'}: {nombreUsuario}
              </p>
            )}
          </div>
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
            {cerrandoSesion ? 'Cerrando sesión…' : 'Cerrar sesión'}
          </button>
        </div>
      </nav>

      <div className="max-w-6xl w-full mx-auto px-4 py-6 sm:py-8 flex-1">
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 mb-6">
          <div className="flex flex-wrap items-center gap-3">
            <h2 className="text-2xl sm:text-3xl font-bold text-gray-800">
              {verArchivados ? 'Pacientes archivados' : esAdmin ? 'Todos los pacientes' : 'Mis pacientes'}
            </h2>
            {!verArchivados && (
              <button
                type="button"
                disabled={loading}
                onClick={() => { setVerArchivados(true); setPage(1) }}
                className="min-h-[44px] px-4 py-2 text-base rounded-xl border transition font-medium bg-white text-gray-700 border-gray-300 hover:bg-gray-50 disabled:opacity-50"
              >
                Ver archivados
              </button>
            )}
            {verArchivados && (
              <button
                type="button"
                disabled={loading}
                onClick={() => { setVerArchivados(false); setPage(1) }}
                className="min-h-[44px] px-4 py-2 text-base rounded-xl border transition font-medium bg-gray-200 text-gray-800 border-gray-300 disabled:opacity-50"
              >
                Ver activos
              </button>
            )}
          </div>

          {!verArchivados && (
            <div className="flex flex-wrap gap-3">
              {esAdmin && (
                <button
                  onClick={() => router.push('/asignaciones')}
                  className="min-h-[44px] bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium transition"
                >
                  Gestionar asignaciones
                </button>
              )}
              <button
                onClick={() => router.push('/enfermeros')}
                className="min-h-[44px] border border-gray-300 text-gray-600 hover:bg-gray-50 px-4 py-2 rounded-lg font-medium transition"
              >
                Enfermeros
              </button>
              <button
                onClick={() => router.push('/usuarios/nuevo')}
                className="min-h-[44px] bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium transition"
              >
                + Nuevo usuario
              </button>
            </div>
          )}
        </div>

        <div className="mb-6">
          <label htmlFor="dashboard-search" className="sr-only">Buscar paciente</label>
          <input
            id="dashboard-search"
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Buscar paciente..."
            className="w-full sm:max-w-md min-h-[48px] text-base border border-gray-300 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
        </div>

        {error && (
          <div role="alert" className="mb-6 bg-red-50 border border-red-200 text-red-800 px-4 py-4 rounded-xl flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <p className="text-base">{error}</p>
            <button
              type="button"
              onClick={() => void cargarPacientes()}
              className="min-h-[44px] shrink-0 px-4 py-2 text-base font-semibold bg-white border border-red-300 rounded-xl hover:bg-red-100/50 transition"
            >
              Reintentar
            </button>
          </div>
        )}

        {loading ? (
          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-12 text-center max-w-md mx-auto">
            <p className="text-lg text-gray-800 font-medium" aria-live="polite">Cargando pacientes…</p>
            <p className="text-base text-gray-500 mt-2">Un momento, por favor.</p>
          </div>
        ) : pacientes.length === 0 && !error ? (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-10 text-center text-gray-600">
            <p className="text-lg font-medium text-gray-800">
              {verArchivados ? 'No hay pacientes archivados.' : 'No hay pacientes registrados aún.'}
            </p>
            {!verArchivados && !esAdmin && (
              <p className="text-base mt-3 text-gray-600">Los pacientes que crees quedarán asignados a ti automáticamente.</p>
            )}
            {!verArchivados && esAdmin && (
              <p className="text-base mt-3 text-gray-600">Crea un paciente o usa «Gestionar asignaciones» para asignar enfermeros.</p>
            )}
          </div>
        ) : (
          <ul className="grid gap-4 list-none p-0 m-0" aria-label="Lista de pacientes">
            {pacientes.map(paciente => (
              <li key={paciente.id}>
                <button
                  type="button"
                  onClick={() => router.push(`/pacientes/${paciente.id}`)}
                  className={`w-full text-left bg-white rounded-2xl shadow-sm border border-gray-200 p-6 hover:shadow-md hover:border-blue-200 transition ${verArchivados ? 'opacity-80' : ''}`}
                >
                  <div className="flex justify-between items-start gap-4">
                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <h3 className="text-lg sm:text-xl font-semibold text-gray-900">{paciente.nombre}</h3>
                        {verArchivados && (
                          <span className="bg-gray-100 text-gray-700 text-sm font-medium px-2 py-1 rounded-full">Archivado</span>
                        )}
                      </div>
                      <p className="text-base text-gray-600 mt-2">
                        {paciente.edad} años — {paciente.diagnostico || 'Sin diagnóstico'}
                      </p>
                      <p className="text-base text-gray-500 mt-1">Dr. {paciente.doctor_encargado || '—'}</p>
                    </div>
                    <span className="text-blue-700 text-base font-semibold shrink-0 pt-1">Ver expediente →</span>
                  </div>
                </button>
              </li>
            ))}
          </ul>
        )}

        {total > LIMIT && (
          <div className="flex items-center justify-between mt-6 gap-4 flex-wrap">
            <button
              type="button"
              disabled={page === 1 || loading}
              onClick={() => setPage(p => p - 1)}
              className="min-h-[44px] px-5 py-2 text-base font-medium border border-gray-300 rounded-xl bg-white hover:bg-gray-50 transition disabled:opacity-40 disabled:cursor-not-allowed"
            >
              ← Anterior
            </button>
            <span className="text-base text-gray-600">
              Página <span className="font-semibold text-gray-900">{page}</span> de{' '}
              <span className="font-semibold text-gray-900">{Math.ceil(total / LIMIT)}</span>
              <span className="text-gray-400 ml-2">· {total} pacientes</span>
            </span>
            <button
              type="button"
              disabled={page >= Math.ceil(total / LIMIT) || loading}
              onClick={() => setPage(p => p + 1)}
              className="min-h-[44px] px-5 py-2 text-base font-medium border border-gray-300 rounded-xl bg-white hover:bg-gray-50 transition disabled:opacity-40 disabled:cursor-not-allowed"
            >
              Siguiente →
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
