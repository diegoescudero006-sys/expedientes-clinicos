'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import ExpedienteImprimible from '@/app/components/ExpedienteImprimible'

interface Paciente {
  nombre: string; edad: number; sexo: string; fecha_nacimiento: string
  telefono: string; diagnostico: string; contacto: string; doctor_encargado: string
  direccion: string; tipo_sangre: string; peso: string; altura: string
  primera_visita: string; motivo_consulta: string; padecimiento_actual: string
  alergias: string; antecedentes_medicos: string; antecedentes_heredofamiliares: string
  antecedentes_patologicos: string; antecedentes_no_patologicos: string
}
interface Medicamento {
  id: string; nombre: string; dosis: string; horario: string
  fecha_inicio: string; fecha_fin: string; indeterminado: boolean; alto_riesgo: boolean; activo: boolean
}
interface Bitacora {
  id: string; observaciones: string; estado_paciente: string
  created_at: string; enfermero_nombre: string
}

export default function ImprimirMiExpedientePage() {
  const router = useRouter()

  const [paciente, setPaciente] = useState<Paciente | null>(null)
  const [medicamentos, setMedicamentos] = useState<Medicamento[]>([])
  const [bitacoras, setBitacoras] = useState<Bitacora[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    async function cargar() {
      try {
        const [pacRes, medRes, bitRes] = await Promise.all([
          fetch('/api/mi-expediente', { credentials: 'same-origin' }),
          fetch('/api/mi-expediente/medicamentos', { credentials: 'same-origin' }),
          fetch('/api/mi-expediente/bitacora', { credentials: 'same-origin' }),
        ])
        if (pacRes.status === 401) { router.push('/login'); return }
        if (!pacRes.ok) { setError('No se pudo cargar el expediente'); return }
        const pacData = await pacRes.json() as { paciente?: Paciente | null }
        if (!pacData.paciente) { setError('No tienes expediente vinculado'); return }
        setPaciente(pacData.paciente)
        if (medRes.ok) {
          const d = await medRes.json() as { medicamentos?: Medicamento[] }
          setMedicamentos(d.medicamentos ?? [])
        }
        if (bitRes.ok) {
          const d = await bitRes.json() as { bitacoras?: Bitacora[] }
          setBitacoras(d.bitacoras ?? [])
        }
      } catch {
        setError('Error de conexión')
      } finally {
        setLoading(false)
      }
    }
    void cargar()
  }, [router])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center text-gray-400">
        Preparando expediente…
      </div>
    )
  }

  if (error || !paciente) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4 text-gray-500">
        <p>{error || 'Expediente no disponible'}</p>
        <button onClick={() => router.back()} className="text-blue-600 hover:underline text-sm">
          ← Volver
        </button>
      </div>
    )
  }

  return (
    <div className="bg-gray-100 min-h-screen print:bg-white">

      {/* Barra de acciones — oculta al imprimir */}
      <div className="print:hidden bg-white border-b border-gray-200 shadow-sm">
        <div className="max-w-4xl mx-auto px-4 py-3 flex items-center justify-between gap-3">
          <button
            type="button"
            onClick={() => router.back()}
            className="text-sm text-gray-500 hover:text-blue-600 transition"
          >
            ← Volver a mi expediente
          </button>
          <button
            type="button"
            onClick={() => window.print()}
            className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2 rounded-lg text-sm font-semibold transition"
          >
            Imprimir / Guardar PDF
          </button>
        </div>
      </div>

      {/* Contenido imprimible */}
      <div className="max-w-4xl mx-auto px-6 py-8 print:px-0 print:py-0 print:max-w-none">
        <div className="bg-white rounded-2xl shadow-sm print:shadow-none p-8 print:p-0">
          <ExpedienteImprimible
            paciente={paciente}
            medicamentos={medicamentos}
            bitacoras={bitacoras}
          />
        </div>
      </div>

    </div>
  )
}
