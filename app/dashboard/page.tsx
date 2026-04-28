'use client'
import { useEffect, useState, useCallback, useRef } from 'react'
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

interface EventoProximo {
  id: string
  titulo: string
  fecha: string
  hora: string | null
  lugar: string | null
  tipo: string
  paciente_nombre: string
}

const TIPO_CONFIG: Record<string, { label: string; badge: string }> = {
  cita:        { label: 'Cita médica',  badge: 'bg-blue-100 text-blue-700' },
  estudio:     { label: 'Estudio',      badge: 'bg-purple-100 text-purple-700' },
  laboratorio: { label: 'Laboratorio',  badge: 'bg-orange-100 text-orange-700' },
  medicamento: { label: 'Medicamento',  badge: 'bg-green-100 text-green-700' },
  general:     { label: 'General',      badge: 'bg-gray-100 text-gray-600' },
}

function formatFechaEvento(fechaStr: string): string {
  const [y, m, d] = fechaStr.slice(0, 10).split('-').map(Number)
  return new Date(y, m - 1, d).toLocaleDateString('es-MX', {
    weekday: 'long', day: 'numeric', month: 'long',
  })
}

function formatHora(horaStr: string | null): string | null {
  if (!horaStr) return null
  const [h, min] = horaStr.split(':').map(Number)
  return `${h % 12 || 12}:${String(min).padStart(2, '0')} ${h >= 12 ? 'PM' : 'AM'}`
}

function todayStr(): string {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

function tomorrowStr(): string {
  const d = new Date(Date.now() + 86400000)
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
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
  const [emailUsuario, setEmailUsuario] = useState('')
  const [nombreUsuario, setNombreUsuario] = useState('')

  const [bellOpen, setBellOpen] = useState(false)
  const [eventosProximos, setEventosProximos] = useState<EventoProximo[]>([])
  const [eventosLoading, setEventosLoading] = useState(false)
  const bellRef = useRef<HTMLDivElement>(null)

  const ADMIN_EMAILS = ['sam@angeldelosabuelos.com', 'admin@angeldelosabuelos.com']

  useEffect(() => {
    fetch('/api/me', { credentials: 'same-origin' })
      .then(r => r.json())
      .then(d => { setRol(d.rol ?? null); setNombreUsuario(d.nombre ?? ''); setEmailUsuario(d.email ?? '') })
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

  const esAdmin = rol === 'admin' || ADMIN_EMAILS.includes(emailUsuario)
  const puedeVerEnfermeros = ADMIN_EMAILS.includes(emailUsuario) || rol === 'admin'

  const cargarEventos = useCallback(async () => {
    if (!esAdmin) return
    setEventosLoading(true)
    try {
      const res = await fetch('/api/admin/eventos-proximos', { credentials: 'same-origin' })
      if (res.ok) {
        const data = await res.json()
        setEventosProximos(Array.isArray(data.eventos) ? data.eventos : [])
      }
    } catch {
      // silently fail — bell is non-critical
    } finally {
      setEventosLoading(false)
    }
  }, [esAdmin])

  useEffect(() => {
    if (esAdmin) cargarEventos()
  }, [esAdmin, cargarEventos])

  // Close bell panel when clicking outside
  useEffect(() => {
    if (!bellOpen) return
    function handleClick(e: MouseEvent) {
      if (bellRef.current && !bellRef.current.contains(e.target as Node)) {
        setBellOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [bellOpen])

  const hoy = todayStr()
  const manana = tomorrowStr()

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <nav className="bg-white shadow-sm border-b border-gray-200 shrink-0">
        <div className="max-w-6xl mx-auto px-4 py-4 flex flex-wrap justify-between items-center gap-3">
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-blue-800">Ángel De Los Abuelos</h1>
            {nombreUsuario && (
              <p className="text-sm text-gray-500 mt-0.5">
                {esAdmin ? 'Administrador' : 'Enfermero'}: {nombreUsuario}
              </p>
            )}
          </div>
          <div className="flex items-center gap-2">
            {esAdmin && (
              <div className="relative" ref={bellRef}>
                <button
                  type="button"
                  onClick={() => setBellOpen(o => !o)}
                  className="relative min-h-[44px] min-w-[44px] flex items-center justify-center rounded-xl border border-gray-200 hover:bg-gray-50 transition text-gray-600 hover:text-blue-700"
                  aria-label="Próximos eventos"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9"/>
                    <path d="M10.3 21a1.94 1.94 0 0 0 3.4 0"/>
                  </svg>
                  {eventosProximos.length > 0 && (
                    <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs font-bold rounded-full min-w-[18px] h-[18px] flex items-center justify-center px-1 leading-none">
                      {eventosProximos.length > 99 ? '99+' : eventosProximos.length}
                    </span>
                  )}
                </button>

                {bellOpen && (
                  <div className="absolute right-0 top-full mt-2 w-96 max-w-[calc(100vw-2rem)] bg-white rounded-2xl shadow-xl border border-gray-200 z-50">
                    <div className="px-4 py-3 border-b border-gray-100 flex items-center justify-between">
                      <h3 className="font-semibold text-gray-800 text-sm">Próximos eventos (7 días)</h3>
                      {eventosLoading && (
                        <span className="text-xs text-gray-400">Cargando…</span>
                      )}
                    </div>

                    {eventosProximos.length === 0 ? (
                      <div className="px-4 py-6 text-center text-sm text-gray-400">
                        No hay eventos en los próximos 7 días
                      </div>
                    ) : (
                      <ul className="divide-y divide-gray-50 max-h-[420px] overflow-y-auto">
                        {eventosProximos.map(ev => {
                          const fechaCorta = ev.fecha.slice(0, 10)
                          const esHoy = fechaCorta === hoy
                          const esManana = fechaCorta === manana
                          const tipo = TIPO_CONFIG[ev.tipo] ?? TIPO_CONFIG.general
                          const hora = formatHora(ev.hora)
                          return (
                            <li key={ev.id} className="px-4 py-3 hover:bg-gray-50 transition">
                              <div className="flex items-start justify-between gap-2">
                                <div className="flex-1 min-w-0">
                                  <p className="text-xs text-gray-500 truncate font-medium">{ev.paciente_nombre}</p>
                                  <p className="text-sm font-semibold text-gray-800 truncate mt-0.5">{ev.titulo}</p>
                                  <div className="flex flex-wrap items-center gap-1.5 mt-1.5">
                                    <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${tipo.badge}`}>{tipo.label}</span>
                                    {esHoy && (
                                      <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-red-100 text-red-700">Hoy</span>
                                    )}
                                    {esManana && !esHoy && (
                                      <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-amber-100 text-amber-700">Mañana</span>
                                    )}
                                  </div>
                                  <p className="text-xs text-gray-500 mt-1 capitalize">{formatFechaEvento(ev.fecha)}</p>
                                  {(hora || ev.lugar) && (
                                    <p className="text-xs text-gray-400 mt-0.5">
                                      {[hora, ev.lugar].filter(Boolean).join(' · ')}
                                    </p>
                                  )}
                                </div>
                              </div>
                            </li>
                          )
                        })}
                      </ul>
                    )}
                  </div>
                )}
              </div>
            )}

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
              {puedeVerEnfermeros && (
                <button
                  onClick={() => router.push('/enfermeros')}
                  className="min-h-[44px] border border-gray-300 text-gray-600 hover:bg-gray-50 px-4 py-2 rounded-lg font-medium transition"
                >
                  Enfermeros
                </button>
              )}
              {esAdmin && (
                <button
                  onClick={() => router.push('/estadisticas')}
                  className="min-h-[44px] border border-gray-300 text-gray-600 hover:bg-gray-50 px-4 py-2 rounded-lg font-medium transition"
                >
                  Estadísticas
                </button>
              )}
              <button
                onClick={() => router.push('/usuarios/nuevo')}
                className="min-h-[44px] bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium transition"
              >
                {esAdmin ? '+ Nuevo usuario' : '+ Nuevo paciente'}
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
