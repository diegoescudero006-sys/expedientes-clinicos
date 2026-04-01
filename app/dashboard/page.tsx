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
  archivado: boolean
}

export default function DashboardPage() {
  const router = useRouter()
  const [pacientes, setPacientes] = useState<Paciente[]>([])
  const [loading, setLoading] = useState(true)
  const [verArchivados, setVerArchivados] = useState(false)

  useEffect(() => {
    cargarPacientes()
  }, [verArchivados])

  async function cargarPacientes() {
    try {
      const res = await fetch(`/api/pacientes?archivados=${verArchivados}`)
      const data = await res.json()
      if (res.ok) setPacientes(data.pacientes)
    } catch (error) {
      console.error('Error cargando pacientes:', error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white shadow-sm border-b">
        <div className="max-w-6xl mx-auto px-4 py-4 flex justify-between items-center">
          <h1 className="text-xl font-bold text-blue-700">Expedientes Clínicos</h1>
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

      <div className="max-w-6xl mx-auto px-4 py-8">
        <div className="flex justify-between items-center mb-6">
          <div className="flex items-center gap-4">
            <h2 className="text-2xl font-bold text-gray-800">
              {verArchivados ? 'Pacientes archivados' : 'Pacientes'}
            </h2>
            <button
              onClick={() => setVerArchivados(!verArchivados)}
              className={`text-sm px-3 py-1 rounded-full border transition ${
                verArchivados
                  ? 'bg-gray-200 text-gray-700 border-gray-300'
                  : 'bg-white text-gray-500 border-gray-300 hover:bg-gray-50'
              }`}
            >
              {verArchivados ? '← Ver activos' : 'Ver archivados'}
            </button>
          </div>
          {!verArchivados && (
            <div className="flex gap-2">
              <button
                onClick={() => router.push('/usuarios/nuevo')}
                className="border border-blue-600 text-blue-600 hover:bg-blue-50 px-4 py-2 rounded-lg font-medium transition"
              >
                + Nuevo usuario
              </button>
              <button
                onClick={() => router.push('/pacientes/nuevo')}
                className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium transition"
              >
                + Nuevo paciente
              </button>
            </div>
          )}
        </div>

        {loading ? (
          <div className="text-center text-gray-400 py-12">Cargando pacientes...</div>
        ) : pacientes.length === 0 ? (
          <div className="bg-white rounded-2xl shadow-sm border p-8 text-center text-gray-400">
            <p className="text-lg">
              {verArchivados ? 'No hay pacientes archivados.' : 'No hay pacientes registrados aún.'}
            </p>
            {!verArchivados && (
              <p className="text-sm mt-1">Crea el primer paciente con el botón de arriba.</p>
            )}
          </div>
        ) : (
          <div className="grid gap-4">
            {pacientes.map(paciente => (
              <div
                key={paciente.id}
                onClick={() => router.push(`/pacientes/${paciente.id}`)}
                className={`bg-white rounded-2xl shadow-sm border p-6 cursor-pointer hover:shadow-md transition ${
                  verArchivados ? 'opacity-70' : ''
                }`}
              >
                <div className="flex justify-between items-start">
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="text-lg font-semibold text-gray-800">{paciente.nombre}</h3>
                      {verArchivados && (
                        <span className="bg-gray-100 text-gray-500 text-xs px-2 py-0.5 rounded-full">Archivado</span>
                      )}
                    </div>
                    <p className="text-gray-500 text-sm mt-1">{paciente.edad} años — {paciente.diagnostico}</p>
                    <p className="text-gray-400 text-sm mt-1">Dr. {paciente.doctor_encargado}</p>
                  </div>
                  <span className="text-blue-500 text-sm font-medium">Ver expediente →</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}