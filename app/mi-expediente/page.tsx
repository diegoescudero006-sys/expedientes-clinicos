'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'

interface Paciente {
  id: string
  nombre: string
  edad: number
  diagnostico: string
  contacto: string
  doctor_encargado: string
}

interface Bitacora {
  id: string
  observaciones: string
  estado_paciente: string
  created_at: string
  enfermero_nombre: string
}

interface Medicamento {
  id: string
  nombre: string
  dosis: string
  horario: string
  fecha_inicio: string
  fecha_fin: string
  indeterminado: boolean
  activo: boolean
}

export default function MiExpedientePage() {
  const router = useRouter()
  const [paciente, setPaciente] = useState<Paciente | null>(null)
  const [bitacoras, setBitacoras] = useState<Bitacora[]>([])
  const [medicamentos, setMedicamentos] = useState<Medicamento[]>([])
  const [seccion, setSeccion] = useState('datos')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    cargarExpediente()
  }, [])

  async function cargarExpediente() {
    try {
      const [pacRes, bitRes, medRes] = await Promise.all([
        fetch('/api/mi-expediente', { credentials: 'same-origin' }),
        fetch('/api/mi-expediente/bitacora', { credentials: 'same-origin' }),
        fetch('/api/mi-expediente/medicamentos', { credentials: 'same-origin' }),
      ])

      if (pacRes.status === 401) {
        router.push('/login')
        return
      }

      const pacData = (await pacRes.json().catch(() => ({}))) as {
        error?: string
        paciente?: Paciente | null
      }

      if (!pacRes.ok) {
        setError(pacData.error || 'Error al cargar expediente')
        return
      }

      const p = pacData.paciente
      if (!p) {
        setPaciente(null)
        return
      }

      setPaciente(p)

      let bitacoras: Bitacora[] = []
      if (bitRes.ok) {
        try {
          const bitData = (await bitRes.json()) as { bitacoras?: unknown }
          bitacoras = Array.isArray(bitData.bitacoras) ? bitData.bitacoras : []
        } catch {
          bitacoras = []
        }
      }
      setBitacoras(bitacoras)

      let medicamentos: Medicamento[] = []
      if (medRes.ok) {
        try {
          const medData = (await medRes.json()) as { medicamentos?: unknown }
          medicamentos = Array.isArray(medData.medicamentos) ? medData.medicamentos : []
        } catch {
          medicamentos = []
        }
      }
      setMedicamentos(medicamentos)
    } catch (error) {
      setError('Error de conexión')
    } finally {
      setLoading(false)
    }
  }

  if (loading) return <div className="min-h-screen flex items-center justify-center text-gray-400">Cargando tu expediente...</div>
  if (error) return <div className="min-h-screen flex items-center justify-center text-red-400">{error}</div>
  if (!paciente) return <div className="min-h-screen flex items-center justify-center text-gray-400">No se encontró tu expediente</div>

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white shadow-sm border-b">
        <div className="max-w-6xl mx-auto px-4 py-4 flex justify-between items-center">
          <h1 className="text-xl font-bold text-blue-700">Mi Expediente</h1>
          <button
            onClick={async () => {
              await fetch('/api/auth/logout', { method: 'POST' })
              router.push('/login')
            }}
            className="text-sm text-gray-500 hover:text-red-500 transition"
          >
            Cerrar sesión
          </button>
        </div>
      </nav>

      <div className="max-w-4xl mx-auto px-4 py-8">
        <h2 className="text-2xl font-bold text-gray-800 mb-2">{paciente.nombre}</h2>
        <p className="text-gray-500 mb-6">{paciente.edad} años — {paciente.diagnostico}</p>

        <div className="flex gap-2 mb-6 border-b">
          {[
            { key: 'datos', label: 'Mis datos' },
            { key: 'bitacora', label: 'Bitácora' },
            { key: 'medicamentos', label: 'Medicamentos' },
          ].map(tab => (
            <button
              key={tab.key}
              onClick={() => setSeccion(tab.key)}
              className={`px-4 py-2 text-sm font-medium border-b-2 transition ${
                seccion === tab.key
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {seccion === 'datos' && (
          <div className="bg-white rounded-2xl shadow-sm border p-6">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-xs text-gray-400 uppercase tracking-wide">Nombre</p>
                <p className="font-medium text-gray-800 mt-1">{paciente.nombre}</p>
              </div>
              <div>
                <p className="text-xs text-gray-400 uppercase tracking-wide">Edad</p>
                <p className="font-medium text-gray-800 mt-1">{paciente.edad} años</p>
              </div>
              <div>
                <p className="text-xs text-gray-400 uppercase tracking-wide">Diagnóstico</p>
                <p className="font-medium text-gray-800 mt-1">{paciente.diagnostico || '—'}</p>
              </div>
              <div>
                <p className="text-xs text-gray-400 uppercase tracking-wide">Doctor encargado</p>
                <p className="font-medium text-gray-800 mt-1">{paciente.doctor_encargado || '—'}</p>
              </div>
              <div>
                <p className="text-xs text-gray-400 uppercase tracking-wide">Contacto de emergencia</p>
                <p className="font-medium text-gray-800 mt-1">{paciente.contacto || '—'}</p>
              </div>
            </div>
          </div>
        )}

        {seccion === 'bitacora' && (
          <div className="space-y-3">
            {(bitacoras ?? []).length === 0 ? (
              <div className="bg-white rounded-2xl border p-6 text-center text-gray-400">No hay entradas en la bitácora</div>
            ) : (
              (bitacoras ?? []).map(b => (
                <div key={b.id} className="bg-white rounded-2xl shadow-sm border p-6">
                  <div className="flex justify-between items-start mb-2">
                    <span className="bg-blue-50 text-blue-700 text-xs font-medium px-3 py-1 rounded-full">{b.estado_paciente}</span>
                    <span className="text-xs text-gray-400">{new Date(b.created_at).toLocaleString('es-MX')}</span>
                  </div>
                  <p className="text-gray-700 mt-3">{b.observaciones}</p>
                  <p className="text-xs text-gray-400 mt-3">Registrado por: {b.enfermero_nombre}</p>
                </div>
              ))
            )}
          </div>
        )}

        {seccion === 'medicamentos' && (
          <div className="space-y-3">
            {(medicamentos ?? []).length === 0 ? (
              <div className="bg-white rounded-2xl border p-6 text-center text-gray-400">No hay medicamentos registrados</div>
            ) : (
              (medicamentos ?? []).map(m => (
                <div key={m.id} className={`bg-white rounded-2xl shadow-sm border p-6 ${!m.activo ? 'opacity-50' : ''}`}>
                  <div className="flex items-center gap-2 mb-1">
                    <p className="font-semibold text-gray-800">{m.nombre}</p>
                    {!m.activo && (
                      <span className="bg-red-100 text-red-600 text-xs px-2 py-0.5 rounded-full">Suspendido</span>
                    )}
                  </div>
                  <p className="text-sm text-gray-500">Dosis: {m.dosis}</p>
                  <p className="text-sm text-gray-500">Horario: {m.horario}</p>
                  <p className="text-sm text-gray-500">
                    Desde: {m.fecha_inicio ? new Date(m.fecha_inicio).toLocaleDateString('es-MX') : '—'}
                    {' '}— Hasta: {m.indeterminado ? 'Indeterminado' : m.fecha_fin ? new Date(m.fecha_fin).toLocaleDateString('es-MX') : '—'}
                  </p>
                </div>
              ))
            )}
          </div>
        )}
      </div>
    </div>
  )
}
