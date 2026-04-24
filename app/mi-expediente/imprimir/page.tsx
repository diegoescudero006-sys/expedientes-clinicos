'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import ExpedienteImprimible from '@/app/components/ExpedienteImprimible'

interface Paciente {
  nombre: string; edad: number; sexo?: string | null; fecha_nacimiento?: string | null
  telefono?: string | null; diagnostico?: string | null; contacto?: string | null; doctor_encargado?: string | null
  direccion?: string | null; tipo_sangre?: string | null; peso?: string | null; altura?: string | null
  primera_visita?: string | null; motivo_consulta?: string | null; padecimiento_actual?: string | null
  alergias?: string | null; antecedentes_medicos?: string | null; antecedentes_heredofamiliares?: string | null
  antecedentes_patologicos?: string | null; antecedentes_no_patologicos?: string | null
  estado_civil?: string | null; escolaridad?: string | null; religion?: string | null; telefono_local?: string | null
  familiar_responsable?: string | null; familiar_tel_local?: string | null; familiar_tel_cel?: string | null; segundo_numero_emergencia?: string | null
  tiene_servicio_medico?: boolean | null; cual_servicio_medico?: string | null; afiliacion?: string | null
  medicos_tratantes?: string | null; motivo_atencion_domiciliaria?: string | null
  enfermedades_cronicas?: string | null; ultima_hospitalizacion?: string | null; cirugias?: string | null; traumatismos?: string | null
  inmunizaciones?: string | null; dispositivos_drenaje?: string | null
  estado_cognitivo?: string | null; mini_mental_resultado?: string | null; mini_mental_fecha?: string | null
  abvd_bano?: string | null; abvd_vestido?: string | null; abvd_alimentacion?: string | null; abvd_continencia?: string | null; abvd_movilidad?: string | null
  downton_caidas_previas?: number | null; downton_medicamentos?: number | null; downton_deficit_sensorial?: number | null
  downton_estado_mental?: number | null; downton_deambulacion?: number | null; downton_edad?: number | null; downton_total?: number | null
  braden_percepcion?: number | null; braden_humedad?: number | null; braden_actividad?: number | null
  braden_movilidad?: number | null; braden_nutricion?: number | null; braden_friccion?: number | null; braden_total?: number | null; braden_fecha?: string | null
  vf_ta?: string | null; vf_fc?: number | null; vf_fr?: number | null; vf_temp?: number | null; vf_spo2?: number | null; vf_glucosa?: number | null
  vf_cabeza_cuello?: string | null; vf_cardiopulmonar?: string | null; vf_abdomen?: string | null
  vf_extremidades?: string | null; vf_neurologico?: string | null; vf_piel?: string | null
  vf_profesional?: string | null; vf_fecha_evaluacion?: string | null
}
interface Medicamento {
  id: string; nombre: string; dosis: string; horario: string
  fecha_inicio: string; fecha_fin: string; indeterminado: boolean; alto_riesgo: boolean; activo: boolean
}
interface Bitacora {
  id: string; observaciones: string; estado_paciente: string
  created_at: string; enfermero_nombre: string
  tension_arterial?: string | null; frecuencia_cardiaca?: number | null
  frecuencia_respiratoria?: number | null; temperatura?: number | null
  saturacion_oxigeno?: number | null; glucosa?: number | null
  uresis?: string | null; evacuaciones?: string | null
  ingresos_liquidos?: string | null; egresos_liquidos?: string | null; balance_liquidos?: string | null
  medicacion_turno?: string | null; soluciones?: string | null; dieta?: string | null
  escala_dolor?: number | null; turno?: string | null
  braden_percepcion?: number | null; braden_humedad?: number | null; braden_actividad?: number | null
  braden_movilidad?: number | null; braden_nutricion?: number | null; braden_lesiones?: number | null
  braden_total?: number | null
  reporte_enfermeria?: string | null; supervision_enfermero?: string | null; supervision_familiar?: string | null
}

export default function ImprimirMiExpedientePage() {
  const router = useRouter()

  const [paciente, setPaciente] = useState<Paciente | null>(null)
  const [medicamentos, setMedicamentos] = useState<Medicamento[]>([])
  const [bitacoras, setBitacoras] = useState<Bitacora[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [modo, setModo] = useState<'completo' | 'bitacora'>('completo')

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
        <div className="max-w-4xl mx-auto px-4 py-3 flex flex-wrap items-center justify-between gap-3">
          <button
            type="button"
            onClick={() => router.back()}
            className="text-sm text-gray-500 hover:text-blue-600 transition"
          >
            ← Volver a mi expediente
          </button>
          <div className="flex items-center gap-2">
            <div className="flex rounded-lg border border-gray-200 overflow-hidden text-sm font-medium">
              <button
                type="button"
                onClick={() => setModo('completo')}
                className={`px-4 py-2 transition ${modo === 'completo' ? 'bg-blue-600 text-white' : 'bg-white text-gray-600 hover:bg-gray-50'}`}
              >
                Expediente completo
              </button>
              <button
                type="button"
                onClick={() => setModo('bitacora')}
                className={`px-4 py-2 border-l border-gray-200 transition ${modo === 'bitacora' ? 'bg-blue-600 text-white' : 'bg-white text-gray-600 hover:bg-gray-50'}`}
              >
                Solo bitácora
              </button>
            </div>
            <button
              type="button"
              onClick={() => window.print()}
              className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2 rounded-lg text-sm font-semibold transition"
            >
              Imprimir / Guardar PDF
            </button>
          </div>
        </div>
      </div>

      {/* Contenido imprimible */}
      <div className="max-w-4xl mx-auto px-6 py-8 print:px-0 print:py-0 print:max-w-none">
        <div className="bg-white rounded-2xl shadow-sm print:shadow-none p-8 print:p-0">
          <ExpedienteImprimible
            paciente={paciente}
            medicamentos={medicamentos}
            bitacoras={bitacoras}
            modo={modo}
          />
        </div>
      </div>

    </div>
  )
}
