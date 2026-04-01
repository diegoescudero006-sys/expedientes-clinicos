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
  const [error, setError] = useState('')
  const [cerrandoSesion, setCerrandoSesion] = useState(false)

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search.trim())
    }, 500)
    return () => clearTimeout(timer)
  }, [search])

  const cargarPacientes = useCallback(async () => {
    setError('')
    setLoading(true)
    try {
      const params = new URLSearchParams({
        archivados: String(verArchivados),
      })
      if (debouncedSearch) {
        params.set('search', debouncedSearch)
      }

      const res = await fetch(`/api/pacientes?${params.toString()}`, { credentials: 'same-origin' })

      if (res.status === 401) {
        router.push('/login')
        return
      }

      const data = await res.json().catch(() => ({}))

      if (!res.ok) {
        setError(
          typeof data.error === 'string'
            ? data.error
            : 'No pudimos cargar la lista de pacientes. Intenta de nuevo.'
        )
        setPacientes([])
        return
      }

      setPacientes(Array.isArray(data.pacientes) ? data.pacientes : [])
    } catch {
      setError('No pudimos conectar. Comprueba tu internet e intenta otra vez.')
      setPacientes([])
    } finally {
      setLoading(false)
    }
  }, [router, verArchivados, debouncedSearch])

  useEffect(() => {
    cargarPacientes()
  }, [cargarPacientes])

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <nav className="bg-white shadow-sm border-b border-gray-200 shrink-0">
        <div className="max-w-6xl mx-auto px-4 py-4 flex flex-wrap justify-between items-center gap-3">
          <h1 className="text-xl sm:text-2xl font-bold text-blue-800">Expedientes clínicos</h1>
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
              {verArchivados ? 'Pacientes archivados' : 'Pacientes'}
            </h2>
            <button
              type="button"
              disabled={loading}
              onClick={() => setVerArchivados(v => !v)}
              className={`min-h-[44px] px-4 py-2 text-base rounded-xl border transition font-medium ${
                verArchivados
                  ? 'bg-gray-200 text-gray-800 border-gray-300'
                  : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
              } disabled:opacity-50`}
            >
              {verArchivados ? 'Ver activos' : 'Ver archivados'}
            </button>
          </div>
          {!verArchivados && (
            <div className="flex flex-wrap gap-3">
              <button
                type="button"
                onClick={() => router.push('/usuarios/nuevo')}
                className="min-h-[48px] px-5 text-base font-semibold border-2 border-blue-600 text-blue-700 hover:bg-blue-50 rounded-xl transition"
              >
                Nuevo usuario
              </button>
              <button
                type="button"
                onClick={() => router.push('/pacientes/nuevo')}
                className="min-h-[48px] px-5 text-base font-semibold bg-blue-600 hover:bg-blue-700 text-white rounded-xl transition"
              >
                Nuevo paciente
              </button>
            </div>
          )}
        </div>

        <div className="mb-6">
          <label htmlFor="dashboard-search" className="sr-only">
            Buscar paciente por nombre o edad
          </label>
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
          <div
            role="alert"
            className="mb-6 bg-red-50 border border-red-200 text-red-800 px-4 py-4 rounded-xl flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3"
          >
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
            <p className="text-lg text-gray-800 font-medium" aria-live="polite">
              Cargando pacientes…
            </p>
            <p className="text-base text-gray-500 mt-2">Un momento, por favor.</p>
          </div>
        ) : pacientes.length === 0 && !error ? (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-10 text-center text-gray-600">
            <p className="text-lg font-medium text-gray-800">
              {verArchivados ? 'No hay pacientes archivados.' : 'No hay pacientes registrados aún.'}
            </p>
            {!verArchivados && (
              <p className="text-base mt-3 text-gray-600">Usa el botón «Nuevo paciente» para agregar uno.</p>
            )}
          </div>
        ) : pacientes.length === 0 ? null : (
          <ul className="grid gap-4 list-none p-0 m-0" aria-label="Lista de pacientes">
            {pacientes.map(paciente => (
              <li key={paciente.id}>
                <button
                  type="button"
                  onClick={() => router.push(`/pacientes/${paciente.id}`)}
                  className={`w-full text-left bg-white rounded-2xl shadow-sm border border-gray-200 p-6 hover:shadow-md hover:border-blue-200 transition ${
                    verArchivados ? 'opacity-80' : ''
                  }`}
                >
                  <div className="flex justify-between items-start gap-4">
                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <h3 className="text-lg sm:text-xl font-semibold text-gray-900">{paciente.nombre}</h3>
                        {verArchivados && (
                          <span className="bg-gray-100 text-gray-700 text-sm font-medium px-2 py-1 rounded-full">
                            Archivado
                          </span>
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
      </div>
    </div>
  )
}
