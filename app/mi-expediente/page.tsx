'use client'
import { useEffect, useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { turnoClases, turnoNombre } from '@/lib/turno'

const HERDO_OPCIONES = ['Diabetes', 'HAS', 'Cardiopatías', 'Cáncer', 'Enfermedad Neurodegenerativa']
const ABVD_OPCIONES = ['Independiente', 'Con ayuda parcial', 'Dependiente']
const ABVD_CAMPOS: { campo: keyof Paciente; label: string }[] = [
  { campo: 'abvd_bano', label: 'Baño' },
  { campo: 'abvd_vestido', label: 'Vestido' },
  { campo: 'abvd_alimentacion', label: 'Alimentación' },
  { campo: 'abvd_continencia', label: 'Continencia' },
  { campo: 'abvd_movilidad', label: 'Movilidad' },
]
const DOWNTON_CONFIG = [
  { campo: 'downton_caidas_previas', label: 'Caídas previas', opciones: [{ label: 'No', score: 0 }, { label: 'Sí', score: 1 }] },
  { campo: 'downton_medicamentos', label: 'Medicamentos', opciones: [{ label: 'Ninguno', score: 0 }, { label: 'Tranquilizantes/sedantes, Diuréticos, Hipotensores (no diuréticos), Antiparkinsonianos, Antidepresivos', score: 1 }] },
  { campo: 'downton_deficit_sensorial', label: 'Déficits sensoriales', opciones: [{ label: 'Ninguno', score: 0 }, { label: 'Alteraciones visuales, Alteraciones auditivas, Extremidades', score: 1 }] },
  { campo: 'downton_estado_mental', label: 'Estado mental', opciones: [{ label: 'Orientado', score: 0 }, { label: 'Confuso', score: 1 }] },
  { campo: 'downton_deambulacion', label: 'Deambulación', opciones: [{ label: 'Normal/reposo en cama', score: 0 }, { label: 'Segura con ayuda, Insegura con/sin ayuda', score: 1 }] },
  { campo: 'downton_edad', label: 'Edad', opciones: [{ label: 'Menor de 65 años', score: 0 }, { label: '65 años o más', score: 1 }] },
]

function downtonRiesgo(total: number | null | undefined) {
  if (total == null) return null
  if (total <= 1) return { texto: `Riesgo Bajo (${total})`, cls: 'bg-green-100 text-green-800 border-green-300' }
  if (total === 2) return { texto: `Riesgo Moderado (${total})`, cls: 'bg-yellow-100 text-yellow-800 border-yellow-300' }
  return { texto: `Riesgo Alto (${total})`, cls: 'bg-red-100 text-red-800 border-red-300' }
}

const BRADEN_HC_CONFIG: Record<string, { label: string; opciones: { label: string; score: number }[] }> = {
  percepcion: { label: 'Percepción Sensorial', opciones: [{ label: 'Completamente limitada', score: 1 }, { label: 'Muy limitada', score: 2 }, { label: 'Ligeramente limitada', score: 3 }, { label: 'Sin limitación', score: 4 }] },
  humedad: { label: 'Exposición a la Humedad', opciones: [{ label: 'Constantemente húmeda', score: 1 }, { label: 'A menudo húmeda', score: 2 }, { label: 'Ocasionalmente húmeda', score: 3 }, { label: 'Raramente húmeda', score: 4 }] },
  actividad: { label: 'Actividad', opciones: [{ label: 'Encamado', score: 1 }, { label: 'En silla', score: 2 }, { label: 'Deambula ocasionalmente', score: 3 }, { label: 'Deambula con frecuencia', score: 4 }] },
  movilidad: { label: 'Movilidad', opciones: [{ label: 'Completamente inmóvil', score: 1 }, { label: 'Muy limitada', score: 2 }, { label: 'Ligeramente limitada', score: 3 }, { label: 'Sin limitación', score: 4 }] },
  nutricion: { label: 'Nutrición', opciones: [{ label: 'Muy pobre', score: 1 }, { label: 'Probablemente inadecuada', score: 2 }, { label: 'Adecuada', score: 3 }, { label: 'Excelente', score: 4 }] },
  friccion: { label: 'Fricción y Cizallamiento', opciones: [{ label: 'Problema', score: 1 }, { label: 'Problema potencial', score: 2 }, { label: 'No existe problema aparente', score: 3 }] },
}

function bradenHCRiesgo(total: number | null | undefined) {
  if (total == null) return null
  if (total <= 12) return { texto: `Alto Riesgo (${total} pts)`, cls: 'bg-red-100 text-red-800 border-red-300' }
  if (total <= 14) return { texto: `Riesgo Moderado (${total} pts)`, cls: 'bg-amber-100 text-amber-800 border-amber-300' }
  return { texto: `Bajo Riesgo (${total} pts)`, cls: 'bg-green-100 text-green-800 border-green-300' }
}

function parseHeredofamiliares(texto: string | null | undefined): { checked: string[]; otros: string } {
  if (!texto) return { checked: [], otros: '' }
  const lines = texto.split('\n')
  const primera = lines[0] || ''
  const candidatos = primera.split(',').map(s => s.trim()).filter(Boolean)
  const isStructured = candidatos.every(c => HERDO_OPCIONES.includes(c))
  if (isStructured && candidatos.length > 0) {
    return { checked: candidatos, otros: lines.slice(1).join('\n').trim() }
  }
  return { checked: [], otros: texto }
}

interface Paciente {
  id: string
  nombre: string
  edad: number
  sexo: string
  fecha_nacimiento: string
  telefono: string
  diagnostico: string
  contacto: string
  doctor_encargado: string
  direccion: string
  tipo_sangre: string
  peso: string
  altura: string
  primera_visita: string
  motivo_consulta: string
  padecimiento_actual: string
  alergias: string
  antecedentes_medicos: string
  antecedentes_heredofamiliares: string
  antecedentes_patologicos: string
  antecedentes_no_patologicos: string
  creado_por_nombre?: string | null
  // Historia Clínica — nuevos campos
  estado_civil?: string | null
  escolaridad?: string | null
  religion?: string | null
  telefono_local?: string | null
  familiar_responsable?: string | null
  familiar_tel_local?: string | null
  familiar_tel_cel?: string | null
  segundo_numero_emergencia?: string | null
  tiene_servicio_medico?: boolean | null
  cual_servicio_medico?: string | null
  afiliacion?: string | null
  medicos_tratantes?: string | null
  motivo_atencion_domiciliaria?: string | null
  enfermedades_cronicas?: string | null
  ultima_hospitalizacion?: string | null
  cirugias?: string | null
  traumatismos?: string | null
  inmunizaciones?: string | null
  dispositivos_drenaje?: string | null
  estado_cognitivo?: string | null
  mini_mental_resultado?: string | null
  mini_mental_fecha?: string | null
  abvd_bano?: string | null
  abvd_vestido?: string | null
  abvd_alimentacion?: string | null
  abvd_continencia?: string | null
  abvd_movilidad?: string | null
  downton_caidas_previas?: number | null
  downton_medicamentos?: number | null
  downton_deficit_sensorial?: number | null
  downton_estado_mental?: number | null
  downton_deambulacion?: number | null
  downton_edad?: number | null
  downton_total?: number | null
  vf_fecha?: string | null
  vf_ta?: string | null
  vf_fc?: number | null
  vf_fr?: number | null
  vf_temp?: number | null
  vf_spo2?: number | null
  vf_glucosa?: number | null
  vf_cabeza_cuello?: string | null
  vf_cardiopulmonar?: string | null
  vf_abdomen?: string | null
  vf_extremidades?: string | null
  vf_neurologico?: string | null
  vf_piel?: string | null
  vf_profesional?: string | null
  vf_fecha_evaluacion?: string | null
  // Braden Historia Clínica
  braden_percepcion?: number | null
  braden_humedad?: number | null
  braden_actividad?: number | null
  braden_movilidad?: number | null
  braden_nutricion?: number | null
  braden_friccion?: number | null
  braden_total?: number | null
  braden_fecha?: string | null
}

function Campo({ label, valor }: { label: string; valor?: string | number | null }) {
  return (
    <div>
      <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">{label}</p>
      <p className="text-lg text-gray-900 mt-1 font-medium">{valor || '—'}</p>
    </div>
  )
}

function SeccionTitulo({ children }: { children: React.ReactNode }) {
  return <p className="text-xs font-semibold text-blue-700 uppercase tracking-wide mb-3 mt-1">{children}</p>
}

interface Bitacora {
  id: string
  observaciones: string
  estado_paciente: string
  created_at: string
  enfermero_nombre: string
  tension_arterial?: string | null
  frecuencia_cardiaca?: number | null
  frecuencia_respiratoria?: number | null
  temperatura?: number | null
  saturacion_oxigeno?: number | null
  glucosa?: number | null
  uresis?: string | null
  evacuaciones?: string | null
  ingresos_liquidos?: string | null
  egresos_liquidos?: string | null
  balance_liquidos?: string | null
  medicacion_turno?: string | null
  soluciones?: string | null
  dieta?: string | null
  escala_dolor?: number | null
  turno?: string | null
  braden_percepcion?: number | null
  braden_humedad?: number | null
  braden_actividad?: number | null
  braden_movilidad?: number | null
  braden_nutricion?: number | null
  braden_lesiones?: number | null
  braden_total?: number | null
  reporte_enfermeria?: string | null
  supervision_enfermero?: string | null
  supervision_familiar?: string | null
}

function bradenRiesgo(total: number | null | undefined) {
  if (total == null) return null
  if (total < 13) return { texto: `Alto Riesgo (${total} pts)`, cls: 'bg-red-100 text-red-800 border-red-300' }
  if (total <= 14) return { texto: `Mediano Riesgo (${total} pts)`, cls: 'bg-amber-100 text-amber-800 border-amber-300' }
  return { texto: `Bajo Riesgo (${total} pts)`, cls: 'bg-green-100 text-green-800 border-green-300' }
}

const BRADEN_LABELS: Record<string, { label: string; opciones: string[] }> = {
  braden_percepcion: { label: 'Percepción Sensorial', opciones: ['Completamente limitada', 'Muy limitada', 'Urgentemente limitada', 'Sin limitaciones'] },
  braden_humedad: { label: 'Humedad', opciones: ['Constantemente húmeda', 'Humedad con frecuencia', 'Ocasionalmente húmeda', 'Raramente húmeda'] },
  braden_actividad: { label: 'Actividad', opciones: ['Encamado', 'En silla', 'Deambula ocasionalmente', 'Deambula frecuentemente'] },
  braden_movilidad: { label: 'Movilidad', opciones: ['Completamente inmóvil', 'Muy limitada', 'Ligeramente limitada', 'Sin limitaciones'] },
  braden_nutricion: { label: 'Nutrición', opciones: ['Muy pobre', 'Probablemente inadecuada', 'Adecuada', 'Excelente'] },
  braden_lesiones: { label: 'Lesiones Cutáneas', opciones: ['Problema', 'Problema potencial', 'No existe problema aparente'] },
}

interface Medicamento {
  id: string
  nombre: string
  dosis: string
  horario: string
  fecha_inicio: string
  fecha_fin: string
  indeterminado: boolean
  alto_riesgo: boolean
  activo: boolean
}

interface Archivo {
  id: string
  nombre_archivo: string
  url: string
  tipo: string
  created_at: string
  subido_por_nombre: string
}

interface Evento {
  id: string
  titulo: string
  fecha: string
  hora: string | null
  lugar: string | null
  descripcion: string | null
  tipo: string
  completado: boolean
  created_at: string
  creado_por_nombre: string | null
}

const TIPO_AGENDA: Record<string, { label: string; border: string; badge: string }> = {
  cita:        { label: 'Cita médica',  border: 'border-l-blue-400',   badge: 'bg-blue-100 text-blue-700' },
  estudio:     { label: 'Estudio',      border: 'border-l-purple-400', badge: 'bg-purple-100 text-purple-700' },
  laboratorio: { label: 'Laboratorio',  border: 'border-l-orange-400', badge: 'bg-orange-100 text-orange-700' },
  medicamento: { label: 'Medicamento',  border: 'border-l-green-400',  badge: 'bg-green-100 text-green-700' },
  general:     { label: 'General',      border: 'border-l-gray-300',   badge: 'bg-gray-100 text-gray-600' },
}

function fmtFechaEvento(fechaStr: string): string {
  const [y, m, d] = fechaStr.slice(0, 10).split('-').map(Number)
  return new Date(y, m - 1, d).toLocaleDateString('es-MX', {
    weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
  })
}

function fmtHoraEvento(horaStr: string | null | undefined): string | null {
  if (!horaStr) return null
  const [h, min] = horaStr.split(':').map(Number)
  return `${h % 12 || 12}:${String(min).padStart(2, '0')} ${h >= 12 ? 'PM' : 'AM'}`
}

function badgeEvento(fechaStr: string, completado: boolean): { label: string; cls: string } | null {
  if (completado) return null
  const hoy = new Date(); hoy.setHours(0, 0, 0, 0)
  const [y, m, d] = fechaStr.slice(0, 10).split('-').map(Number)
  const diff = Math.floor((new Date(y, m - 1, d).getTime() - hoy.getTime()) / 86400000)
  if (diff === 0) return { label: 'Hoy', cls: 'bg-red-100 text-red-700' }
  if (diff > 0 && diff <= 3) return { label: 'Próximo', cls: 'bg-amber-100 text-amber-700' }
  if (diff < 0) return { label: 'Pendiente', cls: 'bg-red-100 text-red-700' }
  return null
}

export default function MiExpedientePage() {
  const router = useRouter()
  const [paciente, setPaciente] = useState<Paciente | null>(null)
  const [bitacoras, setBitacoras] = useState<Bitacora[]>([])
  const [medicamentos, setMedicamentos] = useState<Medicamento[]>([])
  const [archivos, setArchivos] = useState<Archivo[]>([])
  const [seccion, setSeccion] = useState('datos')
  const [loading, setLoading] = useState(true)
  const [pageBitacora, setPageBitacora] = useState(1)
  const [totalBitacoras, setTotalBitacoras] = useState(0)
  const LIMIT_BITACORA = 20
  const [error, setError] = useState('')
  const [cerrandoSesion, setCerrandoSesion] = useState(false)
  const [subiendoArchivo, setSubiendoArchivo] = useState(false)
  const [mensajeArchivo, setMensajeArchivo] = useState('')
  const [bradenExpandido, setBradenExpandido] = useState<Record<string, boolean>>({})
  const [agenda, setAgenda] = useState<Evento[]>([])
  const [agendaCargada, setAgendaCargada] = useState(false)
  const [agendaLoading, setAgendaLoading] = useState(false)
  const [mostrarHistorialAgenda, setMostrarHistorialAgenda] = useState(false)

  const cargarExpediente = useCallback(async () => {
    setError('')
    setLoading(true)
    try {
      const [pacRes, bitRes, medRes, arcRes] = await Promise.all([
        fetch('/api/mi-expediente', { credentials: 'same-origin' }),
        fetch('/api/mi-expediente/bitacora', { credentials: 'same-origin' }),
        fetch('/api/mi-expediente/medicamentos', { credentials: 'same-origin' }),
        fetch('/api/mi-expediente/archivos', { credentials: 'same-origin' }),
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
        setError(pacData.error || 'No pudimos cargar tu expediente. Revisa tu conexión e inténtalo de nuevo.')
        return
      }

      const p = pacData.paciente
      if (!p) {
        setPaciente(null)
        return
      }

      setPaciente(p)

      if (bitRes.ok) {
        const bitData = await bitRes.json().catch(() => ({}))
        setBitacoras(Array.isArray(bitData.bitacoras) ? bitData.bitacoras : [])
        setTotalBitacoras(typeof bitData.total === 'number' ? bitData.total : 0)
      }

      if (medRes.ok) {
        const medData = await medRes.json().catch(() => ({}))
        setMedicamentos(Array.isArray(medData.medicamentos) ? medData.medicamentos : [])
      }

      if (arcRes.ok) {
        const arcData = await arcRes.json().catch(() => ({}))
        setArchivos(Array.isArray(arcData.archivos) ? arcData.archivos : [])
      }

    } catch {
      setError('No pudimos conectar. Comprueba tu internet e intenta otra vez.')
    } finally {
      setLoading(false)
    }
  }, [router])

  useEffect(() => {
    cargarExpediente()
  }, [cargarExpediente])

  useEffect(() => {
    if (pageBitacora > 1) cargarBitacorasPaginadas(pageBitacora)
  }, [pageBitacora])

  useEffect(() => {
    if (seccion === 'agenda' && !agendaCargada) cargarAgenda()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [seccion])

  async function cargarAgenda() {
    setAgendaLoading(true)
    try {
      const res = await fetch('/api/mi-expediente/agenda', { credentials: 'same-origin' })
      if (res.ok) { const d = await res.json(); setAgenda(d.eventos ?? []); setAgendaCargada(true) }
    } finally { setAgendaLoading(false) }
  }

  async function cargarBitacorasPaginadas(page: number) {
    try {
      const res = await fetch(`/api/mi-expediente/bitacora?page=${page}`, { credentials: 'same-origin' })
      if (res.ok) {
        const data = await res.json().catch(() => ({}))
        setBitacoras(Array.isArray(data.bitacoras) ? data.bitacoras : [])
        setTotalBitacoras(typeof data.total === 'number' ? data.total : 0)
      }
    } catch { /* silencioso */ }
  }

  async function cargarArchivos() {
    try {
      const res = await fetch('/api/mi-expediente/archivos', { credentials: 'same-origin' })
      if (res.ok) {
        const data = await res.json().catch(() => ({}))
        setArchivos(Array.isArray(data.archivos) ? data.archivos : [])
      }
    } catch { /* silencioso */ }
  }

  async function subirArchivo(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setSubiendoArchivo(true)
    setMensajeArchivo('')
    try {
      const formData = new FormData()
      formData.append('archivo', file)
      const res = await fetch('/api/mi-expediente/archivos', {
        method: 'POST',
        body: formData,
        credentials: 'same-origin'
      })
      if (res.ok) {
        setMensajeArchivo('✅ Archivo subido correctamente')
        cargarArchivos()
      } else {
        setMensajeArchivo('❌ Error al subir el archivo')
      }
    } catch {
      setMensajeArchivo('❌ Error de conexión')
    } finally {
      setSubiendoArchivo(false)
      e.target.value = ''
      setTimeout(() => setMensajeArchivo(''), 4000)
    }
  }

  const contenidoPrincipal = () => {
    if (loading) {
      return (
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-10 sm:p-12 text-center max-w-lg mx-auto">
          <p className="text-lg text-gray-800 font-medium" aria-live="polite">
            Cargando tu expediente…
          </p>
          <p className="text-base text-gray-500 mt-3">Un momento, por favor.</p>
        </div>
      )
    }

    if (error) {
      return (
        <div
          role="alert"
          className="bg-white rounded-2xl border border-red-200 shadow-sm p-8 max-w-lg mx-auto text-center"
        >
          <p className="text-lg text-gray-800 font-medium">Algo salió mal</p>
          <p className="text-base text-red-700 mt-2">{error}</p>
          <button
            type="button"
            onClick={() => void cargarExpediente()}
            className="mt-6 min-h-[48px] px-6 py-3 text-base font-semibold bg-blue-600 hover:bg-blue-700 text-white rounded-xl transition w-full sm:w-auto"
          >
            Intentar de nuevo
          </button>
        </div>
      )
    }

    if (!paciente) {
      return (
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-8 max-w-lg mx-auto text-center">
          <p className="text-lg text-gray-800 font-medium">No hay expediente vinculado</p>
          <p className="text-base text-gray-500 mt-2">
            Si crees que es un error, contacta a tu equipo de enfermería.
          </p>
        </div>
      )
    }

    return (
      <>
        <h2 className="text-2xl sm:text-3xl font-bold text-gray-800 mb-2">{paciente.nombre}</h2>
        <p className="text-base text-gray-600 mb-6">
          {paciente.edad} años — {paciente.diagnostico || 'Sin diagnóstico registrado'}
        </p>

        <div className="flex gap-2 mb-6 border-b border-gray-200 flex-wrap" role="tablist">
          {[
            { key: 'datos', label: 'Mis datos' },
            { key: 'bitacora', label: 'Bitácora' },
            { key: 'medicamentos', label: 'Medicamentos' },
            { key: 'archivos', label: 'Archivos y recetas' },
            { key: 'agenda', label: 'Agenda' },
          ].map(tab => (
            <button
              key={tab.key}
              type="button"
              role="tab"
              aria-selected={seccion === tab.key}
              onClick={() => setSeccion(tab.key)}
              className={`min-h-[48px] px-4 py-2 text-base font-medium border-b-2 transition rounded-t-lg ${
                seccion === tab.key
                  ? 'border-blue-600 text-blue-700 bg-blue-50/50'
                  : 'border-transparent text-gray-600 hover:text-gray-900 hover:bg-gray-50'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {seccion === 'datos' && (
          <div className="space-y-4">

            {/* 1. Identificación del Paciente */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 sm:p-8">
              <SeccionTitulo>1. Identificación del Paciente</SeccionTitulo>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <Campo label="Nombre" valor={paciente.nombre} />
                <Campo label="Edad" valor={paciente.edad ? `${paciente.edad} años` : null} />
                <Campo label="Sexo" valor={paciente.sexo} />
                <Campo label="Fecha de nacimiento" valor={paciente.fecha_nacimiento ? new Date(paciente.fecha_nacimiento).toLocaleDateString('es-MX') : null} />
                <Campo label="Estado civil" valor={paciente.estado_civil} />
                <Campo label="Escolaridad" valor={paciente.escolaridad} />
                <Campo label="Religión" valor={paciente.religion} />
                <Campo label="Teléfono celular" valor={paciente.telefono} />
                <Campo label="Teléfono local" valor={paciente.telefono_local} />
                <div className="sm:col-span-2">
                  <Campo label="Dirección" valor={paciente.direccion} />
                </div>
              </div>
            </div>

            {/* 2. Familiar Responsable */}
            {(paciente.familiar_responsable || paciente.familiar_tel_local || paciente.familiar_tel_cel || paciente.segundo_numero_emergencia) && (
              <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 sm:p-8">
                <SeccionTitulo>2. Familiar Responsable</SeccionTitulo>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  <div className="sm:col-span-2">
                    <Campo label="Nombre del familiar responsable" valor={paciente.familiar_responsable} />
                  </div>
                  <Campo label="Teléfono local" valor={paciente.familiar_tel_local} />
                  <Campo label="Teléfono celular" valor={paciente.familiar_tel_cel} />
                  <Campo label="Segundo número de emergencia" valor={paciente.segundo_numero_emergencia} />
                </div>
              </div>
            )}

            {/* 3. Servicio Médico */}
            {(paciente.tiene_servicio_medico != null || paciente.cual_servicio_medico || paciente.afiliacion) && (
              <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 sm:p-8">
                <SeccionTitulo>3. Servicio Médico</SeccionTitulo>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  <Campo label="¿Tiene servicio médico?" valor={paciente.tiene_servicio_medico ? 'Sí' : paciente.tiene_servicio_medico === false ? 'No' : null} />
                  <Campo label="¿Cuál?" valor={paciente.cual_servicio_medico} />
                  <Campo label="Afiliación / N.º" valor={paciente.afiliacion} />
                </div>
              </div>
            )}

            {/* 4. Médicos Tratantes */}
            {paciente.medicos_tratantes && (
              <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 sm:p-8">
                <SeccionTitulo>4. Médicos Tratantes</SeccionTitulo>
                <p className="text-base text-gray-800 whitespace-pre-line">{paciente.medicos_tratantes}</p>
              </div>
            )}

            {/* 5. Datos Clínicos */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 sm:p-8">
              <SeccionTitulo>5. Datos Clínicos</SeccionTitulo>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <Campo label="Tipo de sangre" valor={paciente.tipo_sangre} />
                <Campo label="Primera visita" valor={paciente.primera_visita ? new Date(paciente.primera_visita).toLocaleDateString('es-MX') : null} />
                <Campo label="Peso" valor={paciente.peso ? `${paciente.peso} kg` : null} />
                <Campo label="Altura" valor={paciente.altura ? `${paciente.altura} cm` : null} />
                <Campo label="Doctor encargado" valor={paciente.doctor_encargado} />
                <Campo label="Diagnóstico" valor={paciente.diagnostico} />
              </div>
            </div>

            {/* 6. Motivo de Atención */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 sm:p-8">
              <SeccionTitulo>6. Motivo de Atención</SeccionTitulo>
              <div className="space-y-4">
                <Campo label="Motivo de consulta" valor={paciente.motivo_consulta} />
                <Campo label="Padecimiento actual" valor={paciente.padecimiento_actual} />
                {paciente.motivo_atencion_domiciliaria && (
                  <Campo label="Motivo de atención domiciliaria" valor={paciente.motivo_atencion_domiciliaria} />
                )}
              </div>
            </div>

            {/* 7. Alergias */}
            {paciente.alergias ? (
              <div className="bg-red-50 border border-red-200 rounded-2xl p-6 sm:p-8">
                <SeccionTitulo>7. Alergias</SeccionTitulo>
                <p className="font-medium text-red-800 text-base">{paciente.alergias}</p>
              </div>
            ) : (
              <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 sm:p-8">
                <SeccionTitulo>7. Alergias</SeccionTitulo>
                <p className="text-gray-400 text-base">Sin alergias registradas</p>
              </div>
            )}

            {/* 8. Antecedentes Heredofamiliares */}
            {paciente.antecedentes_heredofamiliares && (() => {
              const parsed = parseHeredofamiliares(paciente.antecedentes_heredofamiliares)
              return (
                <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 sm:p-8">
                  <SeccionTitulo>8. Antecedentes Heredofamiliares</SeccionTitulo>
                  {parsed.checked.length > 0 ? (
                    <div className="space-y-3">
                      <div className="flex flex-wrap gap-2">
                        {HERDO_OPCIONES.map(op => (
                          <span
                            key={op}
                            className={`px-3 py-1 rounded-full text-sm font-medium border ${
                              parsed.checked.includes(op)
                                ? 'bg-orange-100 text-orange-800 border-orange-300'
                                : 'bg-gray-100 text-gray-400 border-gray-200'
                            }`}
                          >
                            {op}
                          </span>
                        ))}
                      </div>
                      {parsed.otros && (
                        <div>
                          <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">Otros</p>
                          <p className="text-base text-gray-800 mt-1 whitespace-pre-line">{parsed.otros}</p>
                        </div>
                      )}
                    </div>
                  ) : (
                    <p className="text-base text-gray-800 whitespace-pre-line">{paciente.antecedentes_heredofamiliares}</p>
                  )}
                </div>
              )
            })()}

            {/* 9. Antecedentes Personales Patológicos */}
            {(paciente.enfermedades_cronicas || paciente.ultima_hospitalizacion || paciente.cirugias || paciente.traumatismos || paciente.antecedentes_medicos) && (
              <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 sm:p-8">
                <SeccionTitulo>9. Antecedentes Personales Patológicos</SeccionTitulo>
                <div className="space-y-4">
                  {paciente.enfermedades_cronicas && <Campo label="Enfermedades crónicas" valor={paciente.enfermedades_cronicas} />}
                  {paciente.ultima_hospitalizacion && <Campo label="Última hospitalización" valor={paciente.ultima_hospitalizacion} />}
                  {paciente.cirugias && <Campo label="Cirugías" valor={paciente.cirugias} />}
                  {paciente.traumatismos && <Campo label="Traumatismos" valor={paciente.traumatismos} />}
                  {paciente.antecedentes_medicos && <Campo label="Medicamentos actuales" valor={paciente.antecedentes_medicos} />}
                </div>
              </div>
            )}

            {/* 10. Antecedentes No Patológicos */}
            {paciente.antecedentes_no_patologicos && (
              <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 sm:p-8">
                <SeccionTitulo>10. Antecedentes No Patológicos</SeccionTitulo>
                <p className="text-base text-gray-800 whitespace-pre-line">{paciente.antecedentes_no_patologicos}</p>
              </div>
            )}

            {/* 11. Inmunizaciones */}
            {paciente.inmunizaciones && (
              <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 sm:p-8">
                <SeccionTitulo>11. Inmunizaciones</SeccionTitulo>
                <p className="text-base text-gray-800 whitespace-pre-line">{paciente.inmunizaciones}</p>
              </div>
            )}

            {/* 12. Dispositivos de Drenaje */}
            {paciente.dispositivos_drenaje && (
              <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 sm:p-8">
                <SeccionTitulo>12. Dispositivos de Drenaje</SeccionTitulo>
                <p className="text-base text-gray-800 whitespace-pre-line">{paciente.dispositivos_drenaje}</p>
              </div>
            )}

            {/* 13. Valoración Geriátrica */}
            {(paciente.estado_cognitivo || paciente.mini_mental_resultado || paciente.mini_mental_fecha) && (
              <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 sm:p-8">
                <SeccionTitulo>13. Valoración Geriátrica</SeccionTitulo>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  {paciente.estado_cognitivo && <Campo label="Estado cognitivo" valor={paciente.estado_cognitivo} />}
                  {paciente.mini_mental_resultado && <Campo label="Mini Mental — resultado" valor={paciente.mini_mental_resultado} />}
                  {paciente.mini_mental_fecha && <Campo label="Mini Mental — fecha" valor={new Date(paciente.mini_mental_fecha).toLocaleDateString('es-MX')} />}
                </div>
              </div>
            )}

            {/* 14. ABVD */}
            {ABVD_CAMPOS.some(({ campo }) => paciente[campo]) && (
              <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 sm:p-8">
                <SeccionTitulo>14. Actividades Básicas de la Vida Diaria (ABVD)</SeccionTitulo>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  {ABVD_CAMPOS.map(({ campo, label }) => {
                    const val = paciente[campo] as string | null | undefined
                    if (!val) return null
                    const colorCls = val === 'Independiente'
                      ? 'bg-green-100 text-green-800 border-green-300'
                      : val === 'Con ayuda parcial'
                      ? 'bg-yellow-100 text-yellow-800 border-yellow-300'
                      : 'bg-red-100 text-red-800 border-red-300'
                    return (
                      <div key={campo} className="text-center">
                        <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">{label}</p>
                        <span className={`inline-block px-3 py-1 rounded-full text-sm font-semibold border ${colorCls}`}>{val}</span>
                      </div>
                    )
                  })}
                </div>
              </div>
            )}

            {/* 15. Escala de Downton */}
            {paciente.downton_total != null && (() => {
              const riesgo = downtonRiesgo(paciente.downton_total)
              return (
                <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 sm:p-8">
                  <SeccionTitulo>15. Escala de Downton — Riesgo de Caídas</SeccionTitulo>
                  <div className="flex items-center gap-3 mb-4 flex-wrap">
                    <span className="text-3xl font-bold text-gray-900">{paciente.downton_total}</span>
                    {riesgo && (
                      <span className={`px-3 py-1 rounded-full text-sm font-semibold border ${riesgo.cls}`}>
                        {riesgo.texto}
                      </span>
                    )}
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {DOWNTON_CONFIG.map(({ campo, label, opciones }) => {
                      const val = paciente[campo as keyof Paciente] as number | null | undefined
                      if (val == null) return null
                      const opcion = opciones.find(o => o.score === val)
                      return (
                        <div key={campo} className="bg-gray-50 rounded-xl p-3 border border-gray-100">
                          <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">{label}</p>
                          <p className="text-sm font-semibold text-gray-800 mt-1">
                            {val} — {opcion ? opcion.label.split(',')[0] : '—'}
                          </p>
                        </div>
                      )
                    })}
                  </div>
                </div>
              )
            })()}

            {/* 16. Braden Historia Clínica */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 sm:p-8">
              <SeccionTitulo>16. Escala de Braden — Riesgo de Úlcera por Presión</SeccionTitulo>
              {paciente.braden_total != null ? (() => {
                const riesgo = bradenHCRiesgo(paciente.braden_total)
                return (
                  <div className="space-y-3">
                    <div className="flex items-center gap-3 flex-wrap">
                      <span className="text-sm text-gray-600">Total: <span className="font-bold text-gray-800">{paciente.braden_total}</span></span>
                      {riesgo && <span className={`text-xs font-semibold px-3 py-1 rounded-full border ${riesgo.cls}`}>{riesgo.texto}</span>}
                      {paciente.braden_fecha && <span className="text-xs text-gray-400">Valoración: {new Date(paciente.braden_fecha).toLocaleDateString('es-MX')}</span>}
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {Object.entries(BRADEN_HC_CONFIG).map(([campo, config]) => {
                        const val = (paciente as unknown as Record<string, number | null | undefined>)[`braden_${campo}`]
                        if (val == null) return null
                        const opcion = config.opciones.find(o => o.score === val)
                        return (
                          <div key={campo} className="bg-gray-50 rounded-xl px-3 py-2">
                            <p className="text-xs text-gray-400">{config.label}</p>
                            <p className="text-sm font-semibold text-gray-800">{val} — {opcion?.label ?? '—'}</p>
                          </div>
                        )
                      })}
                    </div>
                  </div>
                )
              })() : (
                <p className="text-sm text-gray-400">Sin valoración registrada</p>
              )}
            </div>

            {/* 17. Valoración Física Basal */}
            {(paciente.vf_fecha || paciente.vf_ta || paciente.vf_fc != null || paciente.vf_fr != null ||
              paciente.vf_temp != null || paciente.vf_spo2 != null || paciente.vf_glucosa != null ||
              paciente.vf_cabeza_cuello || paciente.vf_cardiopulmonar || paciente.vf_abdomen ||
              paciente.vf_extremidades || paciente.vf_neurologico || paciente.vf_piel) && (
              <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 sm:p-8">
                <SeccionTitulo>17. Valoración Física Basal</SeccionTitulo>
                {(paciente.vf_fecha || paciente.vf_profesional || paciente.vf_fecha_evaluacion) && (
                  <div className="flex flex-wrap gap-4 mb-4 text-sm text-gray-600">
                    {paciente.vf_fecha && <span>Fecha: {new Date(paciente.vf_fecha).toLocaleDateString('es-MX')}</span>}
                    {paciente.vf_profesional && <span>Profesional: {paciente.vf_profesional}</span>}
                    {paciente.vf_fecha_evaluacion && <span>Evaluación: {new Date(paciente.vf_fecha_evaluacion).toLocaleDateString('es-MX')}</span>}
                  </div>
                )}
                {(paciente.vf_ta || paciente.vf_fc != null || paciente.vf_fr != null ||
                  paciente.vf_temp != null || paciente.vf_spo2 != null || paciente.vf_glucosa != null) && (
                  <div className="grid grid-cols-3 sm:grid-cols-6 gap-3 mb-4">
                    {paciente.vf_ta && <div className="bg-blue-50 rounded-xl p-3 text-center border border-blue-100"><p className="text-xs text-blue-500 font-medium">T/A</p><p className="text-sm font-bold text-blue-900 mt-1">{paciente.vf_ta}</p></div>}
                    {paciente.vf_fc != null && <div className="bg-blue-50 rounded-xl p-3 text-center border border-blue-100"><p className="text-xs text-blue-500 font-medium">FC</p><p className="text-sm font-bold text-blue-900 mt-1">{paciente.vf_fc} lpm</p></div>}
                    {paciente.vf_fr != null && <div className="bg-blue-50 rounded-xl p-3 text-center border border-blue-100"><p className="text-xs text-blue-500 font-medium">FR</p><p className="text-sm font-bold text-blue-900 mt-1">{paciente.vf_fr} rpm</p></div>}
                    {paciente.vf_temp != null && <div className="bg-blue-50 rounded-xl p-3 text-center border border-blue-100"><p className="text-xs text-blue-500 font-medium">Temp</p><p className="text-sm font-bold text-blue-900 mt-1">{paciente.vf_temp}°C</p></div>}
                    {paciente.vf_spo2 != null && <div className="bg-blue-50 rounded-xl p-3 text-center border border-blue-100"><p className="text-xs text-blue-500 font-medium">SpO₂</p><p className="text-sm font-bold text-blue-900 mt-1">{paciente.vf_spo2}%</p></div>}
                    {paciente.vf_glucosa != null && <div className="bg-blue-50 rounded-xl p-3 text-center border border-blue-100"><p className="text-xs text-blue-500 font-medium">Glucosa</p><p className="text-sm font-bold text-blue-900 mt-1">{paciente.vf_glucosa} mg/dL</p></div>}
                  </div>
                )}
                <div className="space-y-3">
                  {paciente.vf_cabeza_cuello && <div><p className="text-xs font-medium text-gray-500 uppercase tracking-wide">Cabeza y cuello</p><p className="text-base text-gray-800 mt-1">{paciente.vf_cabeza_cuello}</p></div>}
                  {paciente.vf_cardiopulmonar && <div><p className="text-xs font-medium text-gray-500 uppercase tracking-wide">Cardiopulmonar</p><p className="text-base text-gray-800 mt-1">{paciente.vf_cardiopulmonar}</p></div>}
                  {paciente.vf_abdomen && <div><p className="text-xs font-medium text-gray-500 uppercase tracking-wide">Abdomen</p><p className="text-base text-gray-800 mt-1">{paciente.vf_abdomen}</p></div>}
                  {paciente.vf_extremidades && <div><p className="text-xs font-medium text-gray-500 uppercase tracking-wide">Extremidades</p><p className="text-base text-gray-800 mt-1">{paciente.vf_extremidades}</p></div>}
                  {paciente.vf_neurologico && <div><p className="text-xs font-medium text-gray-500 uppercase tracking-wide">Neurológico</p><p className="text-base text-gray-800 mt-1">{paciente.vf_neurologico}</p></div>}
                  {paciente.vf_piel && <div><p className="text-xs font-medium text-gray-500 uppercase tracking-wide">Piel</p><p className="text-base text-gray-800 mt-1">{paciente.vf_piel}</p></div>}
                </div>
              </div>
            )}

            {/* Creado por */}
            <p className="text-sm text-gray-400 text-right">
              Paciente creado por: <span className="font-medium text-gray-600">{paciente.creado_por_nombre || '—'}</span>
            </p>

          </div>
        )}

        {seccion === 'bitacora' && (
          <div className="space-y-3">
            {bitacoras.length === 0 ? (
              <div className="bg-white rounded-2xl border border-gray-200 p-8 text-center text-gray-500 text-base">
                No hay entradas en la bitácora todavía.
              </div>
            ) : (
              bitacoras.map(b => {
                const tc = turnoClases(b.created_at)
                const tieneSignos = b.tension_arterial || b.frecuencia_cardiaca || b.frecuencia_respiratoria || b.temperatura || b.saturacion_oxigeno || b.glucosa
                const tieneBalance = b.uresis || b.evacuaciones || b.ingresos_liquidos || b.egresos_liquidos || b.balance_liquidos
                const tieneTratamiento = b.medicacion_turno || b.soluciones || b.dieta
                return (
                  <div key={b.id} className={`bg-white rounded-2xl shadow-sm border border-gray-200 p-6 ${tc.card}`}>
                    <div className="flex justify-between items-start mb-2 gap-2 flex-wrap">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="bg-blue-50 text-blue-800 text-sm font-medium px-3 py-1 rounded-full">{b.estado_paciente}</span>
                        <span className="bg-gray-100 text-gray-600 text-xs px-2 py-0.5 rounded-full">{turnoNombre(b.created_at)}</span>
                        {b.escala_dolor != null && (
                          <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${b.escala_dolor >= 7 ? 'bg-red-100 text-red-700' : b.escala_dolor >= 4 ? 'bg-yellow-100 text-yellow-700' : 'bg-green-100 text-green-700'}`}>
                            Dolor: {b.escala_dolor}/10
                          </span>
                        )}
                      </div>
                      <span className={`text-sm shrink-0 ${tc.hora}`}>{new Date(b.created_at).toLocaleString('es-MX')}</span>
                    </div>
                    {tieneSignos && (
                      <div className="mt-3 grid grid-cols-3 sm:grid-cols-6 gap-2">
                        {b.tension_arterial && <div className="bg-gray-50 rounded-lg px-2 py-1.5 text-center"><p className="text-xs text-gray-400">T/A</p><p className="text-xs font-semibold text-gray-800">{b.tension_arterial}</p></div>}
                        {b.frecuencia_cardiaca != null && <div className="bg-gray-50 rounded-lg px-2 py-1.5 text-center"><p className="text-xs text-gray-400">FC</p><p className="text-xs font-semibold text-gray-800">{b.frecuencia_cardiaca} lpm</p></div>}
                        {b.frecuencia_respiratoria != null && <div className="bg-gray-50 rounded-lg px-2 py-1.5 text-center"><p className="text-xs text-gray-400">FR</p><p className="text-xs font-semibold text-gray-800">{b.frecuencia_respiratoria} rpm</p></div>}
                        {b.temperatura != null && <div className="bg-gray-50 rounded-lg px-2 py-1.5 text-center"><p className="text-xs text-gray-400">Temp</p><p className="text-xs font-semibold text-gray-800">{b.temperatura}°C</p></div>}
                        {b.saturacion_oxigeno != null && <div className="bg-gray-50 rounded-lg px-2 py-1.5 text-center"><p className="text-xs text-gray-400">SpO₂</p><p className="text-xs font-semibold text-gray-800">{b.saturacion_oxigeno}%</p></div>}
                        {b.glucosa != null && <div className="bg-gray-50 rounded-lg px-2 py-1.5 text-center"><p className="text-xs text-gray-400">Glucosa</p><p className="text-xs font-semibold text-gray-800">{b.glucosa} mg/dL</p></div>}
                      </div>
                    )}
                    {tieneBalance && (
                      <div className="mt-3 grid grid-cols-2 sm:grid-cols-5 gap-2">
                        {b.uresis && <div className="bg-blue-50 rounded-lg px-2 py-1.5 text-center"><p className="text-xs text-blue-400">Uresis</p><p className="text-xs font-semibold text-blue-800">{b.uresis}</p></div>}
                        {b.evacuaciones && <div className="bg-blue-50 rounded-lg px-2 py-1.5 text-center"><p className="text-xs text-blue-400">Evacuaciones</p><p className="text-xs font-semibold text-blue-800">{b.evacuaciones}</p></div>}
                        {b.ingresos_liquidos && <div className="bg-blue-50 rounded-lg px-2 py-1.5 text-center"><p className="text-xs text-blue-400">Ingresos</p><p className="text-xs font-semibold text-blue-800">{b.ingresos_liquidos}</p></div>}
                        {b.egresos_liquidos && <div className="bg-blue-50 rounded-lg px-2 py-1.5 text-center"><p className="text-xs text-blue-400">Egresos</p><p className="text-xs font-semibold text-blue-800">{b.egresos_liquidos}</p></div>}
                        {b.balance_liquidos && <div className="bg-blue-50 rounded-lg px-2 py-1.5 text-center"><p className="text-xs text-blue-400">Balance</p><p className="text-xs font-semibold text-blue-800">{b.balance_liquidos}</p></div>}
                      </div>
                    )}
                    {tieneTratamiento && (
                      <div className="mt-3 space-y-1 border-t border-gray-100 pt-3">
                        {b.medicacion_turno && <p className="text-sm text-gray-600"><span className="font-medium text-gray-700">Medicación:</span> {b.medicacion_turno}</p>}
                        {b.soluciones && <p className="text-sm text-gray-600"><span className="font-medium text-gray-700">Soluciones:</span> {b.soluciones}</p>}
                        {b.dieta && <p className="text-sm text-gray-600"><span className="font-medium text-gray-700">Dieta:</span> {b.dieta}</p>}
                      </div>
                    )}
                    {(b.reporte_enfermeria || b.supervision_enfermero || b.supervision_familiar) && (
                      <div className="mt-3 space-y-1 border-t border-gray-100 pt-3">
                        {b.reporte_enfermeria && <p className="text-sm text-gray-600"><span className="font-medium text-gray-700">Reporte:</span> {b.reporte_enfermeria}</p>}
                        {b.supervision_enfermero && <p className="text-sm text-gray-600"><span className="font-medium text-gray-700">Supervisión Enf.:</span> {b.supervision_enfermero}</p>}
                        {b.supervision_familiar && <p className="text-sm text-gray-600"><span className="font-medium text-gray-700">Supervisión Familiar:</span> {b.supervision_familiar}</p>}
                      </div>
                    )}
                    {b.braden_total != null && (() => {
                      const riesgo = bradenRiesgo(b.braden_total)
                      const exp = bradenExpandido[b.id]
                      return (
                        <div className="mt-3 border-t border-gray-100 pt-3">
                          <button
                            type="button"
                            onClick={() => setBradenExpandido(prev => ({ ...prev, [b.id]: !prev[b.id] }))}
                            className={`inline-flex items-center gap-1.5 text-sm font-semibold px-3 py-1 rounded-full border cursor-pointer transition hover:opacity-80 ${riesgo?.cls}`}
                          >
                            Escala Braden: {riesgo?.texto}
                            <span>{exp ? '▲' : '▼'}</span>
                          </button>
                          {exp && (
                            <div className="mt-2 grid grid-cols-2 sm:grid-cols-3 gap-2">
                              {(Object.keys(BRADEN_LABELS) as Array<keyof typeof BRADEN_LABELS>).map(campo => {
                                const val = b[campo as keyof Bitacora] as number | null | undefined
                                if (val == null) return null
                                return (
                                  <div key={campo} className="bg-gray-50 rounded-lg px-2 py-1.5">
                                    <p className="text-xs text-gray-400">{BRADEN_LABELS[campo].label}</p>
                                    <p className="text-xs font-semibold text-gray-800">
                                      {val} — {BRADEN_LABELS[campo].opciones[val] ?? '—'}
                                    </p>
                                  </div>
                                )
                              })}
                            </div>
                          )}
                        </div>
                      )
                    })()}
                    <p className={`mt-3 text-base leading-relaxed ${tc.texto}`}>{b.observaciones}</p>
                    <p className="text-sm text-gray-500 mt-3">Registrado por: {b.enfermero_nombre || '—'}</p>
                  </div>
                )
              })
            )}

            {totalBitacoras > LIMIT_BITACORA && (
              <div className="flex items-center justify-between pt-2 gap-4">
                <button
                  type="button"
                  disabled={pageBitacora === 1}
                  onClick={() => setPageBitacora(p => p - 1)}
                  className="min-h-[44px] px-4 py-2 text-base font-medium border border-gray-300 rounded-xl bg-white hover:bg-gray-50 transition disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  ← Anterior
                </button>
                <span className="text-sm text-gray-500">
                  Página <span className="font-semibold text-gray-800">{pageBitacora}</span> de{' '}
                  <span className="font-semibold text-gray-800">{Math.ceil(totalBitacoras / LIMIT_BITACORA)}</span>
                  <span className="text-gray-400 ml-1">· {totalBitacoras} entradas</span>
                </span>
                <button
                  type="button"
                  disabled={pageBitacora >= Math.ceil(totalBitacoras / LIMIT_BITACORA)}
                  onClick={() => setPageBitacora(p => p + 1)}
                  className="min-h-[44px] px-4 py-2 text-base font-medium border border-gray-300 rounded-xl bg-white hover:bg-gray-50 transition disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  Siguiente →
                </button>
              </div>
            )}
          </div>
        )}

        {seccion === 'medicamentos' && (
          <div className="space-y-3">
            {medicamentos.length === 0 ? (
              <div className="bg-white rounded-2xl border border-gray-200 p-8 text-center text-gray-500 text-base">
                No hay medicamentos registrados.
              </div>
            ) : (
              medicamentos.map(m => (
                <div
                  key={m.id}
                  className={`bg-white rounded-2xl shadow-sm border border-gray-200 p-6 ${!m.activo ? 'opacity-60' : ''}`}
                >
                  <div className="flex items-center gap-2 mb-2 flex-wrap">
                    <p className={`text-lg font-semibold ${m.alto_riesgo ? 'text-red-600' : 'text-gray-900'}`}>{m.nombre}</p>
                    {m.alto_riesgo && (
                      <span className="bg-red-100 text-red-700 text-sm font-medium px-2 py-1 rounded-full">
                        Alto riesgo
                      </span>
                    )}
                    {!m.activo && (
                      <span className="bg-red-100 text-red-800 text-sm font-medium px-2 py-1 rounded-full">
                        Suspendido
                      </span>
                    )}
                  </div>
                  <p className={`text-base ${m.alto_riesgo ? 'text-red-500' : 'text-gray-600'}`}>Dosis: {m.dosis}</p>
                  <p className={`text-base ${m.alto_riesgo ? 'text-red-500' : 'text-gray-600'}`}>Horario: {m.horario}</p>
                  <p className={`text-base mt-1 ${m.alto_riesgo ? 'text-red-500' : 'text-gray-600'}`}>
                    Desde: {m.fecha_inicio ? new Date(m.fecha_inicio).toLocaleDateString('es-MX') : '—'}
                    {' · '}
                    Hasta:{' '}
                    {m.indeterminado ? 'Indeterminado' : m.fecha_fin ? new Date(m.fecha_fin).toLocaleDateString('es-MX') : '—'}
                  </p>
                </div>
              ))
            )}
          </div>
        )}

        {seccion === 'archivos' && (
          <div className="space-y-4">
            <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
              <h3 className="font-semibold text-gray-800 mb-4">Subir documento</h3>
              <input
                type="file"
                accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
                onChange={subirArchivo}
                disabled={subiendoArchivo}
                className="w-full border border-gray-300 rounded-lg px-4 py-3 text-sm text-gray-600 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
              />
              {subiendoArchivo && <p className="text-sm text-gray-400 mt-2">Subiendo archivo...</p>}
              {mensajeArchivo && (
                <p className={`text-sm mt-2 ${mensajeArchivo.includes('❌') ? 'text-red-500' : 'text-green-600'}`}>
                  {mensajeArchivo}
                </p>
              )}
            </div>

            <div className="space-y-3">
              {archivos.length === 0 ? (
                <div className="bg-white rounded-2xl border border-gray-200 p-8 text-center text-gray-500 text-base">
                  No hay archivos subidos aún.
                </div>
              ) : (
                archivos.map(a => (
                  <div
                    key={a.id}
                    className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4"
                  >
                    <div>
                      <p className="font-semibold text-gray-900 text-base">{a.nombre_archivo}</p>
                      <p className="text-sm text-gray-500 mt-1">
                        {new Date(a.created_at).toLocaleDateString('es-MX')}
                      </p>
                      <p className="text-sm text-gray-500 mt-1">Subido por: {a.subido_por_nombre}</p>
                    </div>
                    <a
                      href={a.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="shrink-0 min-h-[44px] text-base text-blue-600 hover:text-blue-800 font-medium border border-blue-200 rounded-xl px-5 py-2 text-center transition hover:bg-blue-50"
                    >
                      Ver archivo
                    </a>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {/* AGENDA */}
        {seccion === 'agenda' && (() => {
          const todayStr = (() => {
            const d = new Date()
            return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
          })()
          const proximos = agenda.filter(e => !e.completado && e.fecha.slice(0, 10) >= todayStr)
          const historial = agenda.filter(e => e.completado || e.fecha.slice(0, 10) < todayStr)

          const EvCard = ({ ev }: { ev: Evento }) => {
            const tipo = TIPO_AGENDA[ev.tipo] ?? TIPO_AGENDA.general
            const badge = badgeEvento(ev.fecha, ev.completado)
            const hora = fmtHoraEvento(ev.hora)
            return (
              <div className={`bg-white rounded-2xl shadow-sm border border-l-4 ${tipo.border} p-5 ${ev.completado ? 'opacity-60' : ''}`}>
                <div className="flex flex-wrap items-center gap-2 mb-1">
                  {ev.completado && <span className="text-green-600 font-bold text-lg">✓</span>}
                  <h4 className="font-semibold text-gray-900 text-base">{ev.titulo}</h4>
                  {badge && <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${badge.cls}`}>{badge.label}</span>}
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${tipo.badge}`}>{tipo.label}</span>
                </div>
                <p className="text-sm text-gray-600 capitalize">{fmtFechaEvento(ev.fecha)}</p>
                {hora && <p className="text-sm text-gray-500 mt-0.5">{hora}</p>}
                {ev.lugar && <p className="text-sm text-gray-500 mt-1">📍 {ev.lugar}</p>}
                {ev.descripcion && <p className="text-sm text-gray-600 mt-2">{ev.descripcion}</p>}
              </div>
            )
          }

          return (
            <div className="space-y-6">
              <div>
                <h3 className="font-semibold text-gray-700 text-lg mb-3">Próximos eventos</h3>
                {agendaLoading ? (
                  <p className="text-base text-gray-400">Cargando agenda…</p>
                ) : proximos.length === 0 ? (
                  <div className="bg-white rounded-2xl border border-dashed border-gray-200 p-10 text-center text-gray-400">
                    <p className="text-4xl mb-3">📅</p>
                    <p className="text-base font-medium">No tienes eventos programados próximamente</p>
                  </div>
                ) : (
                  <div className="space-y-3">{proximos.map(ev => <EvCard key={ev.id} ev={ev} />)}</div>
                )}
              </div>

              <div>
                <button
                  type="button"
                  onClick={() => setMostrarHistorialAgenda(v => !v)}
                  className="flex items-center gap-2 text-base font-medium text-gray-500 hover:text-gray-700 transition mb-3"
                >
                  <span>{mostrarHistorialAgenda ? '▾' : '▸'}</span>
                  Historial de eventos ({historial.length})
                </button>
                {mostrarHistorialAgenda && (
                  historial.length === 0 ? (
                    <p className="text-base text-gray-400 px-1">Sin eventos en el historial.</p>
                  ) : (
                    <div className="space-y-3">{historial.map(ev => <EvCard key={ev.id} ev={ev} />)}</div>
                  )
                )}
              </div>
            </div>
          )
        })()}
      </>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <nav className="bg-white shadow-sm border-b border-gray-200 shrink-0">
        <div className="max-w-6xl mx-auto px-4 py-4 flex flex-wrap justify-between items-center gap-3">
          <h1 className="text-xl sm:text-2xl font-bold text-blue-800">Ángel De Los Abuelos</h1>
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => router.push('/mi-expediente/imprimir')}
              className="min-h-[44px] px-4 text-base font-medium text-blue-600 hover:text-blue-800 border border-blue-200 rounded-xl hover:bg-blue-50 transition"
            >
              Exportar PDF
            </button>
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

      <div className="max-w-4xl w-full mx-auto px-4 py-6 sm:py-10 flex-1">{contenidoPrincipal()}</div>
    </div>
  )
}
