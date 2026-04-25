'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'

interface Stats {
  pacientes_total: number
  pacientes_activos: number
  pacientes_archivados: number
  enfermeros_total: number
  admins_total: number
  usuarios_total: number
}

function StatCard({
  valor,
  label,
  sub,
  color,
}: {
  valor: number | null
  label: string
  sub?: string
  color: string
}) {
  return (
    <div className={`bg-white rounded-2xl border shadow-sm p-6 flex flex-col gap-1 ${color}`}>
      <p className="text-4xl font-bold text-gray-900 tabular-nums">
        {valor ?? '—'}
      </p>
      <p className="text-sm font-semibold text-gray-700 mt-1">{label}</p>
      {sub && <p className="text-xs text-gray-400">{sub}</p>}
    </div>
  )
}

function Grupo({ titulo, children }: { titulo: string; children: React.ReactNode }) {
  return (
    <section>
      <h3 className="text-xs font-bold uppercase tracking-widest text-gray-400 mb-3">{titulo}</h3>
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">{children}</div>
    </section>
  )
}

export default function EstadisticasPage() {
  const router = useRouter()
  const [stats, setStats] = useState<Stats | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    fetch('/api/stats', { credentials: 'same-origin' })
      .then(async r => {
        if (r.status === 403) { router.replace('/dashboard'); return }
        if (!r.ok) throw new Error()
        setStats(await r.json())
      })
      .catch(() => setError('No se pudieron cargar las estadísticas.'))
      .finally(() => setLoading(false))
  }, [router])

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

      <div className="max-w-3xl mx-auto px-4 py-8 sm:py-10">
        <div className="mb-8">
          <h2 className="text-2xl sm:text-3xl font-bold text-gray-900">Estadísticas del sistema</h2>
          <p className="text-gray-500 mt-1 text-sm">Resumen general — solo visible para administradores</p>
        </div>

        {loading && (
          <div className="text-center text-gray-400 py-16">Cargando estadísticas…</div>
        )}

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 rounded-xl px-4 py-4 text-sm">
            {error}
          </div>
        )}

        {stats && !loading && (
          <div className="space-y-8">

            <Grupo titulo="Pacientes">
              <StatCard
                valor={stats.pacientes_total}
                label="Total de pacientes"
                sub="Activos + archivados"
                color="border-blue-100"
              />
              <StatCard
                valor={stats.pacientes_activos}
                label="Activos"
                sub="En atención actualmente"
                color="border-green-100"
              />
              <StatCard
                valor={stats.pacientes_archivados}
                label="Archivados"
                sub="Dados de baja"
                color="border-gray-100"
              />
            </Grupo>

            <Grupo titulo="Personal">
              <StatCard
                valor={stats.enfermeros_total}
                label="Enfermeros"
                color="border-purple-100"
              />
              <StatCard
                valor={stats.admins_total}
                label="Administradores"
                color="border-amber-100"
              />
            </Grupo>

            <Grupo titulo="Global">
              <StatCard
                valor={stats.usuarios_total}
                label="Usuarios totales"
                sub="Pacientes + enfermeros + admins"
                color="border-blue-100"
              />
            </Grupo>

          </div>
        )}
      </div>
    </div>
  )
}
