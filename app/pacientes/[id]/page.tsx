'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { use } from 'react'
import { turnoClases, turnoNombre } from '@/lib/turno'

const HERDO_OPCIONES = ['Diabetes', 'HAS', 'Cardiopatías', 'Cáncer', 'Enfermedad Neurodegenerativa']
const ABVD_OPCIONES = ['Independiente', 'Con ayuda parcial', 'Dependiente']

const DOWNTON_CONFIG: Record<string, { label: string; opciones: { label: string; score: number }[] }> = {
  caidas_previas: { label: 'Caídas previas', opciones: [{ label: 'No', score: 0 }, { label: 'Sí', score: 1 }] },
  medicamentos: {
    label: 'Medicamentos', opciones: [
      { label: 'Ninguno', score: 0 }, { label: 'Tranquilizantes / Sedantes', score: 1 },
      { label: 'Diuréticos', score: 1 }, { label: 'Hipotensores', score: 1 },
      { label: 'Antiparkinsonianos', score: 1 }, { label: 'Antidepresivos', score: 1 }, { label: 'Otros', score: 1 },
    ],
  },
  deficit_sensorial: {
    label: 'Déficit sensorial', opciones: [
      { label: 'Ninguno', score: 0 }, { label: 'Alteraciones visuales', score: 1 },
      { label: 'Alteraciones auditivas', score: 1 }, { label: 'Extremidades / Parálisis', score: 1 },
    ],
  },
  estado_mental: { label: 'Estado mental', opciones: [{ label: 'Orientado', score: 0 }, { label: 'Confuso', score: 1 }] },
  deambulacion: {
    label: 'Deambulación', opciones: [
      { label: 'Normal', score: 0 }, { label: 'Segura con ayuda', score: 1 },
      { label: 'Insegura con / sin ayuda', score: 1 }, { label: 'Imposible', score: 1 },
    ],
  },
  edad: { label: 'Edad', opciones: [{ label: 'Menor de 70 años', score: 0 }, { label: 'Mayor de 70 años', score: 1 }] },
}

function downtonRiesgo(total: number | null | undefined) {
  if (total == null) return null
  if (total <= 1) return { texto: 'Bajo Riesgo', cls: 'bg-green-100 text-green-800 border-green-300' }
  if (total === 2) return { texto: 'Riesgo Moderado', cls: 'bg-yellow-100 text-yellow-800 border-yellow-300' }
  return { texto: 'Alto Riesgo', cls: 'bg-red-100 text-red-800 border-red-300' }
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
  const firstLine = lines[0]
  const checked = HERDO_OPCIONES.filter(op => firstLine.includes(op))
  if (checked.length === 0) return { checked: [], otros: texto }
  const otros = lines.slice(1).join('\n').trim()
  return { checked, otros }
}

function buildHeredofamiliares(checked: string[], otros: string): string {
  const parts: string[] = []
  if (checked.length > 0) parts.push(checked.join(', '))
  if (otros.trim()) parts.push(otros.trim())
  return parts.join('\n')
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
  usuario_id: string | null
  usuario_email?: string | null
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
  archivado?: boolean
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

function Campo({ label, valor }: { label: string; valor?: string | number | boolean | null }) {
  const display = valor == null ? null : typeof valor === 'boolean' ? (valor ? 'Sí' : 'No') : valor
  return (
    <div>
      <p className="text-xs text-gray-400 uppercase tracking-wide">{label}</p>
      <p className="font-medium text-gray-800 mt-1">{display || '—'}</p>
    </div>
  )
}

function SeccionTitulo({ children }: { children: React.ReactNode }) {
  return <p className="text-xs font-semibold text-blue-700 uppercase tracking-wide mb-3 mt-1">{children}</p>
}

const inputCls = 'w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500'
const textareaCls = `${inputCls} resize-none`

function bradenRiesgo(total: number | null | undefined) {
  if (total == null) return null
  if (total < 13) return { texto: `Alto Riesgo (${total} pts)`, cls: 'bg-red-100 text-red-800 border-red-300' }
  if (total <= 14) return { texto: `Mediano Riesgo (${total} pts)`, cls: 'bg-amber-100 text-amber-800 border-amber-300' }
  return { texto: `Bajo Riesgo (${total} pts)`, cls: 'bg-green-100 text-green-800 border-green-300' }
}

const BRADEN_OPCIONES: Record<string, { label: string; opciones: string[] }> = {
  braden_percepcion: { label: 'Percepción Sensorial', opciones: ['Completamente limitada', 'Muy limitada', 'Urgentemente limitada', 'Sin limitaciones'] },
  braden_humedad: { label: 'Exposición a la Humedad', opciones: ['Constantemente húmeda', 'Humedad con frecuencia', 'Ocasionalmente húmeda', 'Raramente húmeda'] },
  braden_actividad: { label: 'Actividad', opciones: ['Encamado', 'En silla', 'Deambula ocasionalmente', 'Deambula frecuentemente'] },
  braden_movilidad: { label: 'Movilidad', opciones: ['Completamente inmóvil', 'Muy limitada', 'Ligeramente limitada', 'Sin limitaciones'] },
  braden_nutricion: { label: 'Nutrición', opciones: ['Muy pobre', 'Probablemente inadecuada', 'Adecuada', 'Excelente'] },
  braden_lesiones: { label: 'Riesgo de Lesiones Cutáneas', opciones: ['Problema', 'Problema potencial', 'No existe problema aparente'] },
}

export default function ExpedientePage({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter()
  const { id } = use(params)

  const [paciente, setPaciente] = useState<Paciente | null>(null)
  const [bitacoras, setBitacoras] = useState<Bitacora[]>([])
  const [medicamentos, setMedicamentos] = useState<Medicamento[]>([])
  const [archivos, setArchivos] = useState<Archivo[]>([])
  const [seccion, setSeccion] = useState('datos')
  const [loading, setLoading] = useState(true)

  const [pageBitacora, setPageBitacora] = useState(1)
  const [totalBitacoras, setTotalBitacoras] = useState(0)
  const LIMIT_BITACORA = 20

  const BITACORA_EMPTY = {
    observaciones: '', estado_paciente: '',
    tension_arterial: '', frecuencia_cardiaca: '', frecuencia_respiratoria: '',
    temperatura: '', saturacion_oxigeno: '', glucosa: '',
    uresis: '', evacuaciones: '', ingresos_liquidos: '', egresos_liquidos: '', balance_liquidos: '',
    medicacion_turno: '', soluciones: '', dieta: '', escala_dolor: '',
    braden_percepcion: '', braden_humedad: '', braden_actividad: '',
    braden_movilidad: '', braden_nutricion: '', braden_lesiones: '',
    reporte_enfermeria: '', supervision_enfermero: '', supervision_familiar: '',
  }
  const [nuevaBitacora, setNuevaBitacora] = useState(BITACORA_EMPTY)
  const [mostrarBraden, setMostrarBraden] = useState(false)
  const [bradenExpandido, setBradenExpandido] = useState<Record<string, boolean>>({})
  const [nuevoMed, setNuevoMed] = useState({
    nombre: '', dosis: '', horario: '', fecha_inicio: '', fecha_fin: '', indeterminado: false, alto_riesgo: false
  })
  const [guardando, setGuardando] = useState(false)
  const [mensaje, setMensaje] = useState('')
  const [mostrarCambioPassword, setMostrarCambioPassword] = useState(false)
  const [nuevaPassword, setNuevaPassword] = useState('')
  const [confirmarPassword, setConfirmarPassword] = useState('')
  const [errorPassword, setErrorPassword] = useState('')
  const [guardandoPassword, setGuardandoPassword] = useState(false)

  const [modoEdicion, setModoEdicion] = useState(false)
  const [datosEdit, setDatosEdit] = useState<Partial<Paciente>>({})
  const [guardandoEdicion, setGuardandoEdicion] = useState(false)
  const [errorEdicion, setErrorEdicion] = useState('')
  const [editHeredoChecked, setEditHeredoChecked] = useState<string[]>([])
  const [editHeredoOtros, setEditHeredoOtros] = useState('')
  const [editDowntonSel, setEditDowntonSel] = useState<Record<string, string>>({})
  const [editBradenHC, setEditBradenHC] = useState<Record<string, number>>({})

  useEffect(() => { cargarExpediente() }, [id])
  useEffect(() => { if (pageBitacora > 1) cargarBitacoras(pageBitacora) }, [pageBitacora])

  async function cargarExpediente() {
    try {
      const [pacRes, bitRes, medRes, arcRes] = await Promise.all([
        fetch(`/api/pacientes/${id}`),
        fetch(`/api/pacientes/${id}/bitacora`),
        fetch(`/api/pacientes/${id}/medicamentos`),
        fetch(`/api/pacientes/${id}/archivos`)
      ])
      const pacData = await pacRes.json()
      const bitData = await bitRes.json()
      const medData = await medRes.json()
      const arcData = await arcRes.json()

      if (pacRes.ok) setPaciente(pacData.paciente)
      if (bitRes.ok) {
        setBitacoras(bitData.bitacoras)
        setTotalBitacoras(typeof bitData.total === 'number' ? bitData.total : 0)
      }
      if (medRes.ok) setMedicamentos(medData.medicamentos)
      if (arcRes.ok) setArchivos(arcData.archivos)
    } catch (error) {
      console.error('Error:', error)
    } finally {
      setLoading(false)
    }
  }

  async function cargarBitacoras(page = pageBitacora) {
    try {
      const res = await fetch(`/api/pacientes/${id}/bitacora?page=${page}`)
      if (res.ok) {
        const d = await res.json()
        setBitacoras(d.bitacoras)
        setTotalBitacoras(typeof d.total === 'number' ? d.total : 0)
      }
    } catch { /* silencioso */ }
  }

  async function cargarMedicamentos() {
    try {
      const res = await fetch(`/api/pacientes/${id}/medicamentos`)
      if (res.ok) { const d = await res.json(); setMedicamentos(d.medicamentos) }
    } catch { /* silencioso */ }
  }

  async function cargarArchivosLista() {
    try {
      const res = await fetch(`/api/pacientes/${id}/archivos`)
      if (res.ok) { const d = await res.json(); setArchivos(d.archivos) }
    } catch { /* silencioso */ }
  }

  async function agregarBitacora(e: React.FormEvent) {
    e.preventDefault()
    setGuardando(true)
    try {
      const bradenFields = [
        nuevaBitacora.braden_percepcion, nuevaBitacora.braden_humedad,
        nuevaBitacora.braden_actividad, nuevaBitacora.braden_movilidad,
        nuevaBitacora.braden_nutricion, nuevaBitacora.braden_lesiones,
      ]
      const allBraden = bradenFields.every(v => v !== '')
      const braden_total = allBraden
        ? bradenFields.reduce((s, v) => s + parseInt(v as string, 10), 0)
        : null
      const payload = { ...nuevaBitacora, braden_total: allBraden ? braden_total : '' }
      const res = await fetch(`/api/pacientes/${id}/bitacora`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      })
      if (res.ok) {
        setNuevaBitacora(BITACORA_EMPTY)
        setMostrarBraden(false)
        setMensaje('✅ Bitácora registrada')
        setPageBitacora(1)
        cargarBitacoras(1)
        setTimeout(() => setMensaje(''), 3000)
      }
    } finally { setGuardando(false) }
  }

  async function cambiarPasswordPaciente(e: React.FormEvent) {
    e.preventDefault()
    if (!paciente?.usuario_id) return
    setErrorPassword('')
    if (nuevaPassword.length < 6) { setErrorPassword('Mínimo 6 caracteres'); return }
    if (nuevaPassword !== confirmarPassword) { setErrorPassword('Las contraseñas no coinciden'); return }
    setGuardandoPassword(true)
    try {
      const res = await fetch(`/api/usuarios/${paciente.usuario_id}/cambiar-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password: nuevaPassword }),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) { setErrorPassword(data.error || 'No se pudo actualizar'); return }
      setNuevaPassword('')
      setConfirmarPassword('')
      setMostrarCambioPassword(false)
      setMensaje('✅ Contraseña actualizada')
      setTimeout(() => setMensaje(''), 4000)
    } catch { setErrorPassword('Error de conexión, intenta de nuevo') }
    finally { setGuardandoPassword(false) }
  }

  async function guardarMedicamento(e: React.FormEvent) {
    e.preventDefault()
    setGuardando(true)
    try {
      const res = await fetch(`/api/pacientes/${id}/medicamentos`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(nuevoMed)
      })
      if (res.ok) {
        setNuevoMed({ nombre: '', dosis: '', horario: '', fecha_inicio: '', fecha_fin: '', indeterminado: false, alto_riesgo: false })
        setMensaje('✅ Medicamento agregado')
        cargarMedicamentos()
        setTimeout(() => setMensaje(''), 3000)
      }
    } finally { setGuardando(false) }
  }

  function iniciarEdicion() {
    if (!paciente) return
    setDatosEdit({ ...paciente })
    const parsed = parseHeredofamiliares(paciente.antecedentes_heredofamiliares)
    setEditHeredoChecked(parsed.checked)
    setEditHeredoOtros(parsed.otros)
    // Pre-populate downton text labels from scores
    const sel: Record<string, string> = {}
    const campos = ['caidas_previas', 'medicamentos', 'deficit_sensorial', 'estado_mental', 'deambulacion', 'edad']
    campos.forEach(campo => {
      const score = (paciente as unknown as Record<string, number | null | undefined>)[`downton_${campo}`]
      if (score != null) {
        const match = DOWNTON_CONFIG[campo]?.opciones.find(op => op.score === score)
        if (match) sel[campo] = match.label
      }
    })
    setEditDowntonSel(sel)
    // Pre-populate Braden HC scores
    const bradenHC: Record<string, number> = {}
    const bradenCampos = ['percepcion', 'humedad', 'actividad', 'movilidad', 'nutricion', 'friccion']
    bradenCampos.forEach(campo => {
      const score = (paciente as unknown as Record<string, number | null | undefined>)[`braden_${campo}`]
      if (score != null) bradenHC[campo] = score
    })
    setEditBradenHC(bradenHC)
    setErrorEdicion('')
    setModoEdicion(true)
  }

  async function guardarEdicion(e: React.FormEvent) {
    e.preventDefault()
    setGuardandoEdicion(true)
    setErrorEdicion('')
    try {
      // Compute downton scores from selections
      const downtonScores: Record<string, number | null> = {}
      const campos = ['caidas_previas', 'medicamentos', 'deficit_sensorial', 'estado_mental', 'deambulacion', 'edad']
      campos.forEach(campo => {
        const sel = editDowntonSel[campo]
        if (sel !== undefined) {
          const match = DOWNTON_CONFIG[campo]?.opciones.find(op => op.label === sel)
          downtonScores[`downton_${campo}`] = match ? match.score : null
        } else {
          downtonScores[`downton_${campo}`] = (datosEdit as unknown as Record<string, number | null | undefined>)[`downton_${campo}`] ?? null
        }
      })
      const scores = Object.values(downtonScores).filter(v => v != null) as number[]
      const downton_total = scores.length === 6 ? scores.reduce((a, b) => a + b, 0) : (datosEdit.downton_total ?? null)

      const bradenCampos = ['percepcion', 'humedad', 'actividad', 'movilidad', 'nutricion', 'friccion']
      const bradenScores: Record<string, number | null> = {}
      bradenCampos.forEach(campo => {
        bradenScores[`braden_${campo}`] = editBradenHC[campo] ?? null
      })
      const bradenHCTotal = bradenCampos.every(c => editBradenHC[c] != null)
        ? bradenCampos.reduce((sum, c) => sum + (editBradenHC[c] ?? 0), 0)
        : (datosEdit.braden_total ?? null)

      const payload = {
        ...datosEdit,
        antecedentes_heredofamiliares: buildHeredofamiliares(editHeredoChecked, editHeredoOtros),
        ...downtonScores,
        downton_total,
        ...bradenScores,
        braden_total: bradenHCTotal,
      }

      const res = await fetch(`/api/pacientes/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      const data = await res.json() as { error?: string; paciente?: Paciente }
      if (!res.ok) { setErrorEdicion(data.error || 'No se pudo guardar'); return }
      setPaciente(data.paciente ?? paciente)
      setModoEdicion(false)
    } catch {
      setErrorEdicion('Error de conexión, intenta de nuevo')
    } finally {
      setGuardandoEdicion(false)
    }
  }

  function setEdit(campo: string, valor: unknown) {
    setDatosEdit(d => ({ ...d, [campo]: valor }))
  }

  if (loading) return <div className="min-h-screen flex items-center justify-center text-gray-400">Cargando expediente...</div>
  if (!paciente) return <div className="min-h-screen flex items-center justify-center text-gray-400">Paciente no encontrado</div>

  const heredoParsed = parseHeredofamiliares(paciente.antecedentes_heredofamiliares)

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white shadow-sm border-b">
        <div className="max-w-6xl mx-auto px-4 py-4 flex justify-between items-center">
          <h1 className="text-xl font-bold text-blue-700">Ángel De Los Abuelos</h1>
          <div className="flex items-center gap-3">
            <button
              onClick={() => router.push(`/pacientes/${id}/imprimir`)}
              className="text-sm font-medium text-blue-600 hover:text-blue-800 border border-blue-200 px-3 py-1.5 rounded-lg hover:bg-blue-50 transition"
            >
              Exportar PDF
            </button>
            <button onClick={() => router.push('/dashboard')} className="text-sm text-gray-500 hover:text-blue-500 transition">
              ← Volver
            </button>
          </div>
        </div>
      </nav>

      <div className="max-w-4xl mx-auto px-4 py-8">
        <h2 className="text-2xl font-bold text-gray-800 mb-1">{paciente.nombre}</h2>
        <p className="text-gray-500 mb-6">{paciente.edad} años — {paciente.sexo || ''} — {paciente.diagnostico || 'Sin diagnóstico'}</p>

        <div className="flex gap-2 mb-6 border-b overflow-x-auto">
          {[
            { key: 'datos', label: 'Historia Clínica' },
            { key: 'bitacora', label: 'Bitácora' },
            { key: 'medicamentos', label: 'Medicamentos' },
            { key: 'archivos', label: 'Archivos' }
          ].map(tab => (
            <button key={tab.key} onClick={() => setSeccion(tab.key)}
              className={`px-4 py-2 text-sm font-medium border-b-2 transition whitespace-nowrap ${
                seccion === tab.key ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}>
              {tab.label}
            </button>
          ))}
        </div>

        {mensaje && (
          <div className="mb-4 bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg text-sm">{mensaje}</div>
        )}

        {/* HISTORIA CLÍNICA */}
        {seccion === 'datos' && (
          <div className="space-y-4">

            {modoEdicion ? (
              <form onSubmit={guardarEdicion} className="space-y-4">

                {/* Identificación */}
                <div className="bg-white rounded-2xl shadow-sm border p-6">
                  <SeccionTitulo>Identificación del paciente</SeccionTitulo>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs text-gray-500 mb-1">Nombre *</label>
                      <input className={inputCls} required value={datosEdit.nombre ?? ''} onChange={e => setEdit('nombre', e.target.value)} />
                    </div>
                    <div>
                      <label className="block text-xs text-gray-500 mb-1">Edad *</label>
                      <input type="number" min={0} className={inputCls} required value={datosEdit.edad ?? ''} onChange={e => setEdit('edad', Number(e.target.value))} />
                    </div>
                    <div>
                      <label className="block text-xs text-gray-500 mb-1">Sexo</label>
                      <select className={inputCls} value={datosEdit.sexo ?? ''} onChange={e => setEdit('sexo', e.target.value)}>
                        <option value="">— Sin especificar —</option>
                        <option value="Masculino">Masculino</option>
                        <option value="Femenino">Femenino</option>
                        <option value="Otro">Otro</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs text-gray-500 mb-1">Estado civil</label>
                      <select className={inputCls} value={datosEdit.estado_civil ?? ''} onChange={e => setEdit('estado_civil', e.target.value)}>
                        <option value="">— Sin especificar —</option>
                        <option value="Soltero">Soltero/a</option>
                        <option value="Casado">Casado/a</option>
                        <option value="Viudo">Viudo/a</option>
                        <option value="Divorciado">Divorciado/a</option>
                        <option value="Unión libre">Unión libre</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs text-gray-500 mb-1">Fecha de nacimiento</label>
                      <input type="date" className={inputCls} value={datosEdit.fecha_nacimiento ? datosEdit.fecha_nacimiento.toString().slice(0, 10) : ''} onChange={e => setEdit('fecha_nacimiento', e.target.value)} />
                    </div>
                    <div>
                      <label className="block text-xs text-gray-500 mb-1">Escolaridad</label>
                      <input className={inputCls} value={datosEdit.escolaridad ?? ''} onChange={e => setEdit('escolaridad', e.target.value)} />
                    </div>
                    <div>
                      <label className="block text-xs text-gray-500 mb-1">Religión</label>
                      <input className={inputCls} value={datosEdit.religion ?? ''} onChange={e => setEdit('religion', e.target.value)} />
                    </div>
                    <div>
                      <label className="block text-xs text-gray-500 mb-1">Teléfono local</label>
                      <input className={inputCls} value={datosEdit.telefono_local ?? ''} onChange={e => setEdit('telefono_local', e.target.value)} />
                    </div>
                    <div>
                      <label className="block text-xs text-gray-500 mb-1">Teléfono celular</label>
                      <input className={inputCls} value={datosEdit.telefono ?? ''} onChange={e => setEdit('telefono', e.target.value)} />
                    </div>
                    <div>
                      <label className="block text-xs text-gray-500 mb-1">Contacto de emergencia</label>
                      <input className={inputCls} value={datosEdit.contacto ?? ''} onChange={e => setEdit('contacto', e.target.value)} />
                    </div>
                    <div className="col-span-2">
                      <label className="block text-xs text-gray-500 mb-1">Dirección</label>
                      <input className={inputCls} value={datosEdit.direccion ?? ''} onChange={e => setEdit('direccion', e.target.value)} />
                    </div>
                  </div>
                </div>

                {/* Familiar responsable */}
                <div className="bg-white rounded-2xl shadow-sm border p-6">
                  <SeccionTitulo>Familiar responsable</SeccionTitulo>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="col-span-2">
                      <label className="block text-xs text-gray-500 mb-1">Nombre del familiar</label>
                      <input className={inputCls} value={datosEdit.familiar_responsable ?? ''} onChange={e => setEdit('familiar_responsable', e.target.value)} />
                    </div>
                    <div>
                      <label className="block text-xs text-gray-500 mb-1">Tel. local</label>
                      <input className={inputCls} value={datosEdit.familiar_tel_local ?? ''} onChange={e => setEdit('familiar_tel_local', e.target.value)} />
                    </div>
                    <div>
                      <label className="block text-xs text-gray-500 mb-1">Tel. celular</label>
                      <input className={inputCls} value={datosEdit.familiar_tel_cel ?? ''} onChange={e => setEdit('familiar_tel_cel', e.target.value)} />
                    </div>
                    <div>
                      <label className="block text-xs text-gray-500 mb-1">Segundo número de emergencia</label>
                      <input className={inputCls} value={datosEdit.segundo_numero_emergencia ?? ''} onChange={e => setEdit('segundo_numero_emergencia', e.target.value)} />
                    </div>
                  </div>
                </div>

                {/* Servicio médico */}
                <div className="bg-white rounded-2xl shadow-sm border p-6">
                  <SeccionTitulo>Servicio médico</SeccionTitulo>
                  <div className="space-y-3">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input type="checkbox" checked={datosEdit.tiene_servicio_medico ?? false}
                        onChange={e => setEdit('tiene_servicio_medico', e.target.checked)}
                        className="w-4 h-4 text-blue-600" />
                      <span className="text-sm font-medium text-gray-700">¿Cuenta con servicio médico?</span>
                    </label>
                    {datosEdit.tiene_servicio_medico && (
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-xs text-gray-500 mb-1">¿Cuál servicio?</label>
                          <input className={inputCls} value={datosEdit.cual_servicio_medico ?? ''} onChange={e => setEdit('cual_servicio_medico', e.target.value)} />
                        </div>
                        <div>
                          <label className="block text-xs text-gray-500 mb-1">Afiliación</label>
                          <input className={inputCls} value={datosEdit.afiliacion ?? ''} onChange={e => setEdit('afiliacion', e.target.value)} />
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Médicos tratantes */}
                <div className="bg-white rounded-2xl shadow-sm border p-6">
                  <SeccionTitulo>Médicos tratantes</SeccionTitulo>
                  <textarea rows={3} className={textareaCls} value={datosEdit.medicos_tratantes ?? ''} onChange={e => setEdit('medicos_tratantes', e.target.value)} placeholder="Dr. Nombre — Especialidad — Tel…" />
                </div>

                {/* Datos clínicos */}
                <div className="bg-white rounded-2xl shadow-sm border p-6">
                  <SeccionTitulo>Datos clínicos</SeccionTitulo>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs text-gray-500 mb-1">Tipo de sangre</label>
                      <select className={inputCls} value={datosEdit.tipo_sangre ?? ''} onChange={e => setEdit('tipo_sangre', e.target.value)}>
                        <option value="">— Sin especificar —</option>
                        {['A+','A-','B+','B-','AB+','AB-','O+','O-'].map(t => <option key={t} value={t}>{t}</option>)}
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs text-gray-500 mb-1">Primera visita</label>
                      <input type="date" className={inputCls} value={datosEdit.primera_visita ? datosEdit.primera_visita.toString().slice(0, 10) : ''} onChange={e => setEdit('primera_visita', e.target.value)} />
                    </div>
                    <div>
                      <label className="block text-xs text-gray-500 mb-1">Peso (kg)</label>
                      <input className={inputCls} value={datosEdit.peso ?? ''} onChange={e => setEdit('peso', e.target.value)} />
                    </div>
                    <div>
                      <label className="block text-xs text-gray-500 mb-1">Altura (cm)</label>
                      <input className={inputCls} value={datosEdit.altura ?? ''} onChange={e => setEdit('altura', e.target.value)} />
                    </div>
                    <div className="col-span-2">
                      <label className="block text-xs text-gray-500 mb-1">Doctor encargado</label>
                      <input className={inputCls} value={datosEdit.doctor_encargado ?? ''} onChange={e => setEdit('doctor_encargado', e.target.value)} />
                    </div>
                  </div>
                </div>

                {/* Motivo de atención */}
                <div className="bg-white rounded-2xl shadow-sm border p-6">
                  <SeccionTitulo>Motivo de atención</SeccionTitulo>
                  <div className="space-y-3">
                    <div>
                      <label className="block text-xs text-gray-500 mb-1">Motivo de atención domiciliaria</label>
                      <textarea rows={2} className={textareaCls} value={datosEdit.motivo_atencion_domiciliaria ?? ''} onChange={e => setEdit('motivo_atencion_domiciliaria', e.target.value)} />
                    </div>
                    <div>
                      <label className="block text-xs text-gray-500 mb-1">Motivo de consulta</label>
                      <textarea rows={2} className={textareaCls} value={datosEdit.motivo_consulta ?? ''} onChange={e => setEdit('motivo_consulta', e.target.value)} />
                    </div>
                    <div>
                      <label className="block text-xs text-gray-500 mb-1">Padecimiento actual</label>
                      <textarea rows={2} className={textareaCls} value={datosEdit.padecimiento_actual ?? ''} onChange={e => setEdit('padecimiento_actual', e.target.value)} />
                    </div>
                    <div>
                      <label className="block text-xs text-gray-500 mb-1">Diagnóstico</label>
                      <textarea rows={2} className={textareaCls} value={datosEdit.diagnostico ?? ''} onChange={e => setEdit('diagnostico', e.target.value)} />
                    </div>
                  </div>
                </div>

                {/* Alergias */}
                <div className="bg-red-50 border border-red-200 rounded-2xl p-6">
                  <SeccionTitulo>🚨 Alergias</SeccionTitulo>
                  <textarea rows={2} className={textareaCls} placeholder="Dejar vacío si no hay alergias" value={datosEdit.alergias ?? ''} onChange={e => setEdit('alergias', e.target.value)} />
                </div>

                {/* Antecedentes heredofamiliares */}
                <div className="bg-white rounded-2xl shadow-sm border p-6">
                  <SeccionTitulo>Antecedentes heredofamiliares</SeccionTitulo>
                  <div className="grid grid-cols-2 gap-2 mb-3">
                    {HERDO_OPCIONES.map(op => (
                      <label key={op} className="flex items-center gap-2 cursor-pointer">
                        <input type="checkbox"
                          checked={editHeredoChecked.includes(op)}
                          onChange={() => setEditHeredoChecked(prev => prev.includes(op) ? prev.filter(o => o !== op) : [...prev, op])}
                          className="w-4 h-4 text-blue-600 rounded" />
                        <span className="text-sm text-gray-700">{op}</span>
                      </label>
                    ))}
                  </div>
                  <label className="block text-xs text-gray-500 mb-1">Otros antecedentes heredofamiliares</label>
                  <textarea rows={2} className={textareaCls} value={editHeredoOtros} onChange={e => setEditHeredoOtros(e.target.value)} />
                </div>

                {/* Antecedentes patológicos */}
                <div className="bg-white rounded-2xl shadow-sm border p-6">
                  <SeccionTitulo>Antecedentes personales patológicos</SeccionTitulo>
                  <div className="space-y-3">
                    {[
                      { campo: 'enfermedades_cronicas', label: 'Enfermedades crónicas' },
                      { campo: 'ultima_hospitalizacion', label: 'Última hospitalización' },
                      { campo: 'cirugias', label: 'Cirugías' },
                      { campo: 'traumatismos', label: 'Traumatismos' },
                      { campo: 'antecedentes_medicos', label: 'Medicamentos actuales con frecuencia' },
                      { campo: 'antecedentes_patologicos', label: 'Otros antecedentes patológicos' },
                    ].map(({ campo, label }) => (
                      <div key={campo}>
                        <label className="block text-xs text-gray-500 mb-1">{label}</label>
                        <textarea rows={2} className={textareaCls}
                          value={(datosEdit as unknown as Record<string, string | null | undefined>)[campo] ?? ''}
                          onChange={e => setEdit(campo, e.target.value)} />
                      </div>
                    ))}
                  </div>
                </div>

                {/* Antecedentes no patológicos */}
                <div className="bg-white rounded-2xl shadow-sm border p-6">
                  <SeccionTitulo>Antecedentes personales no patológicos</SeccionTitulo>
                  <textarea rows={3} className={textareaCls} value={datosEdit.antecedentes_no_patologicos ?? ''} onChange={e => setEdit('antecedentes_no_patologicos', e.target.value)} />
                </div>

                {/* Inmunizaciones */}
                <div className="bg-white rounded-2xl shadow-sm border p-6">
                  <SeccionTitulo>Inmunizaciones</SeccionTitulo>
                  <textarea rows={3} className={textareaCls} value={datosEdit.inmunizaciones ?? ''} onChange={e => setEdit('inmunizaciones', e.target.value)} placeholder="Vacuna | Fecha aplicación | Próxima aplicación" />
                </div>

                {/* Dispositivos */}
                <div className="bg-white rounded-2xl shadow-sm border p-6">
                  <SeccionTitulo>Dispositivos de drenaje</SeccionTitulo>
                  <textarea rows={3} className={textareaCls} value={datosEdit.dispositivos_drenaje ?? ''} onChange={e => setEdit('dispositivos_drenaje', e.target.value)} placeholder="Dispositivo | Calibre | Fecha instalación | Periodo cambio" />
                </div>

                {/* Valoración geriátrica */}
                <div className="bg-white rounded-2xl shadow-sm border p-6">
                  <SeccionTitulo>Valoración geriátrica</SeccionTitulo>
                  <div className="space-y-3">
                    <div>
                      <label className="block text-xs text-gray-500 mb-1">Estado cognitivo</label>
                      <textarea rows={2} className={textareaCls} value={datosEdit.estado_cognitivo ?? ''} onChange={e => setEdit('estado_cognitivo', e.target.value)} />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs text-gray-500 mb-1">Resultado Mini Mental</label>
                        <input className={inputCls} value={datosEdit.mini_mental_resultado ?? ''} onChange={e => setEdit('mini_mental_resultado', e.target.value)} />
                      </div>
                      <div>
                        <label className="block text-xs text-gray-500 mb-1">Fecha aplicación</label>
                        <input type="date" className={inputCls} value={datosEdit.mini_mental_fecha ? datosEdit.mini_mental_fecha.toString().slice(0, 10) : ''} onChange={e => setEdit('mini_mental_fecha', e.target.value)} />
                      </div>
                    </div>
                  </div>
                </div>

                {/* ABVD */}
                <div className="bg-white rounded-2xl shadow-sm border p-6">
                  <SeccionTitulo>ABVD — Actividades Básicas de la Vida Diaria</SeccionTitulo>
                  <div className="space-y-2">
                    {[
                      { campo: 'abvd_bano', label: 'Baño' },
                      { campo: 'abvd_vestido', label: 'Vestido' },
                      { campo: 'abvd_alimentacion', label: 'Alimentación' },
                      { campo: 'abvd_continencia', label: 'Continencia' },
                      { campo: 'abvd_movilidad', label: 'Movilidad' },
                    ].map(({ campo, label }) => (
                      <div key={campo} className="flex items-center gap-4">
                        <label className="w-32 text-sm font-medium text-gray-700 shrink-0">{label}</label>
                        <select className="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                          value={(datosEdit as unknown as Record<string, string | null | undefined>)[campo] ?? ''}
                          onChange={e => setEdit(campo, e.target.value)}>
                          <option value="">— Sin valorar —</option>
                          {ABVD_OPCIONES.map(op => <option key={op} value={op}>{op}</option>)}
                        </select>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Downton */}
                <div className="bg-white rounded-2xl shadow-sm border p-6">
                  <SeccionTitulo>Escala de Downton — Riesgo de caídas</SeccionTitulo>
                  <div className="space-y-3">
                    {Object.entries(DOWNTON_CONFIG).map(([campo, config]) => (
                      <div key={campo}>
                        <p className="text-xs font-semibold text-gray-600 mb-1">{config.label}</p>
                        <div className="flex flex-wrap gap-2">
                          {config.opciones.map((op, i) => (
                            <label key={i} className="flex items-center gap-1.5 cursor-pointer">
                              <input type="radio" name={`edit_downton_${campo}`}
                                checked={editDowntonSel[campo] === op.label}
                                onChange={() => setEditDowntonSel(d => ({ ...d, [campo]: op.label }))}
                                className="text-blue-600" />
                              <span className="text-sm text-gray-700">{op.label} <span className="text-gray-400">({op.score})</span></span>
                            </label>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Braden Historia Clínica */}
                <div className="bg-white rounded-2xl shadow-sm border p-6">
                  <SeccionTitulo>Escala de Braden — Riesgo de Úlcera por Presión</SeccionTitulo>
                  <div className="mb-4">
                    <label className="block text-xs text-gray-500 mb-1">Fecha de valoración</label>
                    <input type="date" className={inputCls}
                      value={datosEdit.braden_fecha ? datosEdit.braden_fecha.toString().slice(0, 10) : ''}
                      onChange={e => setEdit('braden_fecha', e.target.value)} />
                  </div>
                  <div className="space-y-3">
                    {Object.entries(BRADEN_HC_CONFIG).map(([campo, config]) => (
                      <div key={campo}>
                        <p className="text-xs font-semibold text-gray-600 mb-1">{config.label}</p>
                        <div className="flex flex-wrap gap-2">
                          {config.opciones.map(op => (
                            <label key={op.score} className="flex items-center gap-1.5 cursor-pointer">
                              <input type="radio" name={`edit_braden_hc_${campo}`}
                                checked={editBradenHC[campo] === op.score}
                                onChange={() => setEditBradenHC(b => ({ ...b, [campo]: op.score }))}
                                className="text-blue-600" />
                              <span className="text-sm text-gray-700">{op.label} <span className="text-gray-400">({op.score})</span></span>
                            </label>
                          ))}
                        </div>
                      </div>
                    ))}
                    {Object.keys(editBradenHC).length > 0 && (() => {
                      const sum = Object.values(editBradenHC).reduce((a, b) => a + b, 0)
                      const complete = Object.keys(editBradenHC).length === 6
                      const riesgo = complete ? bradenHCRiesgo(sum) : null
                      return (
                        <div className="flex items-center gap-3 pt-1">
                          <span className="text-sm text-gray-600">
                            {complete ? 'Total:' : `Parcial (${Object.keys(editBradenHC).length}/6):`}
                            <span className="font-bold ml-1">{sum}</span>
                          </span>
                          {riesgo && (
                            <span className={`text-xs font-semibold px-3 py-1 rounded-full border ${riesgo.cls}`}>
                              {riesgo.texto}
                            </span>
                          )}
                        </div>
                      )
                    })()}
                  </div>
                </div>

                {/* Valoración física */}
                <div className="bg-white rounded-2xl shadow-sm border p-6">
                  <SeccionTitulo>Valoración física basal</SeccionTitulo>
                  <div className="grid grid-cols-2 gap-4 mb-4">
                    <div>
                      <label className="block text-xs text-gray-500 mb-1">Fecha de evaluación</label>
                      <input type="date" className={inputCls} value={datosEdit.vf_fecha_evaluacion ? datosEdit.vf_fecha_evaluacion.toString().slice(0, 10) : ''} onChange={e => setEdit('vf_fecha_evaluacion', e.target.value)} />
                    </div>
                    <div>
                      <label className="block text-xs text-gray-500 mb-1">Profesional y cédula</label>
                      <input className={inputCls} value={datosEdit.vf_profesional ?? ''} onChange={e => setEdit('vf_profesional', e.target.value)} />
                    </div>
                  </div>
                  <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Signos vitales basales</p>
                  <div className="grid grid-cols-3 gap-3 mb-4">
                    {[
                      { campo: 'vf_ta', label: 'TA', placeholder: '120/80', type: 'text' },
                      { campo: 'vf_fc', label: 'FC (lpm)', placeholder: '80', type: 'number' },
                      { campo: 'vf_fr', label: 'FR (rpm)', placeholder: '18', type: 'number' },
                      { campo: 'vf_temp', label: 'Temp (°C)', placeholder: '36.6', type: 'number' },
                      { campo: 'vf_spo2', label: 'SpO₂ (%)', placeholder: '98', type: 'number' },
                      { campo: 'vf_glucosa', label: 'Glucosa', placeholder: '100', type: 'number' },
                    ].map(({ campo, label, placeholder, type }) => (
                      <div key={campo}>
                        <label className="block text-xs text-gray-500 mb-1">{label}</label>
                        <input type={type} step={campo === 'vf_temp' ? '0.1' : undefined}
                          className={inputCls} placeholder={placeholder}
                          value={(datosEdit as unknown as Record<string, string | number | null | undefined>)[campo] ?? ''}
                          onChange={e => setEdit(campo, type === 'number' ? (e.target.value ? Number(e.target.value) : null) : e.target.value)} />
                      </div>
                    ))}
                  </div>
                  <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Evaluación por sistemas</p>
                  <div className="space-y-3">
                    {[
                      { campo: 'vf_cabeza_cuello', label: 'Cabeza y cuello' },
                      { campo: 'vf_cardiopulmonar', label: 'Cardiopulmonar' },
                      { campo: 'vf_abdomen', label: 'Abdomen' },
                      { campo: 'vf_extremidades', label: 'Extremidades' },
                      { campo: 'vf_neurologico', label: 'Neurológico' },
                      { campo: 'vf_piel', label: 'Piel' },
                    ].map(({ campo, label }) => (
                      <div key={campo}>
                        <label className="block text-xs text-gray-500 mb-1">{label}</label>
                        <textarea rows={2} className={textareaCls}
                          value={(datosEdit as unknown as Record<string, string | null | undefined>)[campo] ?? ''}
                          onChange={e => setEdit(campo, e.target.value)} />
                      </div>
                    ))}
                  </div>
                </div>

                {errorEdicion && <p className="text-red-500 text-sm">{errorEdicion}</p>}
                <div className="flex gap-3">
                  <button type="submit" disabled={guardandoEdicion}
                    className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg font-medium transition disabled:opacity-50">
                    {guardandoEdicion ? 'Guardando…' : 'Guardar cambios'}
                  </button>
                  <button type="button" onClick={() => setModoEdicion(false)}
                    className="px-6 py-2 rounded-lg font-medium text-gray-700 border border-gray-300 hover:bg-gray-50 transition">
                    Cancelar
                  </button>
                </div>
              </form>
            ) : (
              <>
                {/* Vista — Identificación */}
                <div className="bg-white rounded-2xl shadow-sm border p-6">
                  <div className="flex justify-between items-center mb-3">
                    <SeccionTitulo>Identificación del paciente</SeccionTitulo>
                    <button type="button" onClick={iniciarEdicion}
                      className="text-xs text-blue-600 hover:text-blue-800 border border-blue-200 px-3 py-1 rounded-lg transition hover:bg-blue-50">
                      Editar datos
                    </button>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <Campo label="Nombre" valor={paciente.nombre} />
                    <Campo label="Edad" valor={paciente.edad ? `${paciente.edad} años` : null} />
                    <Campo label="Sexo" valor={paciente.sexo} />
                    <Campo label="Estado civil" valor={paciente.estado_civil} />
                    <Campo label="Fecha de nacimiento" valor={paciente.fecha_nacimiento ? new Date(paciente.fecha_nacimiento).toLocaleDateString('es-MX') : null} />
                    <Campo label="Escolaridad" valor={paciente.escolaridad} />
                    <Campo label="Religión" valor={paciente.religion} />
                    <Campo label="Tel. local" valor={paciente.telefono_local} />
                    <Campo label="Tel. celular" valor={paciente.telefono} />
                    <Campo label="Contacto de emergencia" valor={paciente.contacto} />
                    <div className="col-span-2">
                      <Campo label="Dirección" valor={paciente.direccion} />
                    </div>
                    {paciente.usuario_email && <Campo label="Usuario (email)" valor={paciente.usuario_email} />}
                  </div>
                </div>

                {/* Familiar responsable */}
                {(paciente.familiar_responsable || paciente.familiar_tel_local || paciente.familiar_tel_cel || paciente.segundo_numero_emergencia) && (
                  <div className="bg-white rounded-2xl shadow-sm border p-6">
                    <SeccionTitulo>Familiar responsable</SeccionTitulo>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="col-span-2"><Campo label="Nombre" valor={paciente.familiar_responsable} /></div>
                      <Campo label="Tel. local" valor={paciente.familiar_tel_local} />
                      <Campo label="Tel. celular" valor={paciente.familiar_tel_cel} />
                      <Campo label="Segundo número emergencia" valor={paciente.segundo_numero_emergencia} />
                    </div>
                  </div>
                )}

                {/* Servicio médico */}
                {(paciente.tiene_servicio_medico || paciente.cual_servicio_medico || paciente.afiliacion) && (
                  <div className="bg-white rounded-2xl shadow-sm border p-6">
                    <SeccionTitulo>Servicio médico</SeccionTitulo>
                    <div className="grid grid-cols-2 gap-4">
                      <Campo label="Cuenta con servicio" valor={paciente.tiene_servicio_medico ? 'Sí' : 'No'} />
                      <Campo label="Servicio" valor={paciente.cual_servicio_medico} />
                      <Campo label="Afiliación" valor={paciente.afiliacion} />
                    </div>
                  </div>
                )}

                {/* Médicos tratantes */}
                {paciente.medicos_tratantes && (
                  <div className="bg-white rounded-2xl shadow-sm border p-6">
                    <SeccionTitulo>Médicos tratantes</SeccionTitulo>
                    <p className="text-sm text-gray-800 whitespace-pre-line">{paciente.medicos_tratantes}</p>
                  </div>
                )}

                {/* Datos clínicos */}
                <div className="bg-white rounded-2xl shadow-sm border p-6">
                  <SeccionTitulo>Datos clínicos</SeccionTitulo>
                  <div className="grid grid-cols-2 gap-4">
                    <Campo label="Tipo de sangre" valor={paciente.tipo_sangre} />
                    <Campo label="Primera visita" valor={paciente.primera_visita ? new Date(paciente.primera_visita).toLocaleDateString('es-MX') : null} />
                    <Campo label="Peso" valor={paciente.peso ? `${paciente.peso} kg` : null} />
                    <Campo label="Altura" valor={paciente.altura ? `${paciente.altura} cm` : null} />
                    <Campo label="Doctor encargado" valor={paciente.doctor_encargado} />
                  </div>
                </div>

                {/* Motivo de atención */}
                <div className="bg-white rounded-2xl shadow-sm border p-6">
                  <SeccionTitulo>Motivo de atención</SeccionTitulo>
                  <div className="space-y-4">
                    {paciente.motivo_atencion_domiciliaria && <Campo label="Motivo de atención domiciliaria" valor={paciente.motivo_atencion_domiciliaria} />}
                    <Campo label="Motivo de consulta" valor={paciente.motivo_consulta} />
                    <Campo label="Padecimiento actual" valor={paciente.padecimiento_actual} />
                    <Campo label="Diagnóstico" valor={paciente.diagnostico} />
                  </div>
                </div>

                {/* Alergias */}
                {paciente.alergias ? (
                  <div className="bg-red-50 border border-red-200 rounded-2xl p-6">
                    <SeccionTitulo>🚨 Alergias</SeccionTitulo>
                    <p className="font-medium text-red-800">{paciente.alergias}</p>
                  </div>
                ) : (
                  <div className="bg-white rounded-2xl shadow-sm border p-6">
                    <SeccionTitulo>🚨 Alergias</SeccionTitulo>
                    <p className="text-gray-400 text-sm">Sin alergias registradas</p>
                  </div>
                )}

                {/* Antecedentes heredofamiliares */}
                <div className="bg-white rounded-2xl shadow-sm border p-6">
                  <SeccionTitulo>Antecedentes heredofamiliares</SeccionTitulo>
                  {heredoParsed.checked.length > 0 ? (
                    <div className="space-y-3">
                      <div className="flex flex-wrap gap-2">
                        {HERDO_OPCIONES.map(op => (
                          <span key={op}
                            className={`text-xs font-medium px-3 py-1 rounded-full border ${
                              heredoParsed.checked.includes(op)
                                ? 'bg-orange-100 text-orange-800 border-orange-300'
                                : 'bg-gray-50 text-gray-400 border-gray-200'
                            }`}>
                            {op}
                          </span>
                        ))}
                      </div>
                      {heredoParsed.otros && <p className="text-sm text-gray-700 whitespace-pre-line">{heredoParsed.otros}</p>}
                    </div>
                  ) : (
                    <p className="text-sm text-gray-700 whitespace-pre-line">{paciente.antecedentes_heredofamiliares || '—'}</p>
                  )}
                </div>

                {/* Antecedentes patológicos */}
                <div className="bg-white rounded-2xl shadow-sm border p-6">
                  <SeccionTitulo>Antecedentes personales patológicos</SeccionTitulo>
                  <div className="space-y-4">
                    {paciente.enfermedades_cronicas && <Campo label="Enfermedades crónicas" valor={paciente.enfermedades_cronicas} />}
                    {paciente.ultima_hospitalizacion && <Campo label="Última hospitalización" valor={paciente.ultima_hospitalizacion} />}
                    {paciente.cirugias && <Campo label="Cirugías" valor={paciente.cirugias} />}
                    {paciente.traumatismos && <Campo label="Traumatismos" valor={paciente.traumatismos} />}
                    {paciente.antecedentes_medicos && <Campo label="Medicamentos actuales" valor={paciente.antecedentes_medicos} />}
                    {paciente.antecedentes_patologicos && <Campo label="Otros antecedentes" valor={paciente.antecedentes_patologicos} />}
                    {!paciente.enfermedades_cronicas && !paciente.ultima_hospitalizacion && !paciente.cirugias && !paciente.traumatismos && !paciente.antecedentes_medicos && !paciente.antecedentes_patologicos && (
                      <p className="text-gray-400 text-sm">Sin antecedentes registrados</p>
                    )}
                  </div>
                </div>

                {/* Antecedentes no patológicos */}
                {paciente.antecedentes_no_patologicos && (
                  <div className="bg-white rounded-2xl shadow-sm border p-6">
                    <SeccionTitulo>Antecedentes no patológicos</SeccionTitulo>
                    <p className="text-sm text-gray-700 whitespace-pre-line">{paciente.antecedentes_no_patologicos}</p>
                  </div>
                )}

                {/* Inmunizaciones */}
                {paciente.inmunizaciones && (
                  <div className="bg-white rounded-2xl shadow-sm border p-6">
                    <SeccionTitulo>Inmunizaciones</SeccionTitulo>
                    <p className="text-sm text-gray-700 whitespace-pre-line">{paciente.inmunizaciones}</p>
                  </div>
                )}

                {/* Dispositivos */}
                {paciente.dispositivos_drenaje && (
                  <div className="bg-white rounded-2xl shadow-sm border p-6">
                    <SeccionTitulo>Dispositivos de drenaje</SeccionTitulo>
                    <p className="text-sm text-gray-700 whitespace-pre-line">{paciente.dispositivos_drenaje}</p>
                  </div>
                )}

                {/* Valoración geriátrica */}
                {(paciente.estado_cognitivo || paciente.mini_mental_resultado) && (
                  <div className="bg-white rounded-2xl shadow-sm border p-6">
                    <SeccionTitulo>Valoración geriátrica</SeccionTitulo>
                    <div className="space-y-4">
                      {paciente.estado_cognitivo && <Campo label="Estado cognitivo" valor={paciente.estado_cognitivo} />}
                      {paciente.mini_mental_resultado && <Campo label="Resultado Mini Mental" valor={paciente.mini_mental_resultado} />}
                      {paciente.mini_mental_fecha && <Campo label="Fecha Mini Mental" valor={new Date(paciente.mini_mental_fecha).toLocaleDateString('es-MX')} />}
                    </div>
                  </div>
                )}

                {/* ABVD */}
                {(paciente.abvd_bano || paciente.abvd_vestido || paciente.abvd_alimentacion || paciente.abvd_continencia || paciente.abvd_movilidad) && (
                  <div className="bg-white rounded-2xl shadow-sm border p-6">
                    <SeccionTitulo>ABVD — Actividades Básicas de la Vida Diaria</SeccionTitulo>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                      {[
                        { campo: 'abvd_bano', label: 'Baño' },
                        { campo: 'abvd_vestido', label: 'Vestido' },
                        { campo: 'abvd_alimentacion', label: 'Alimentación' },
                        { campo: 'abvd_continencia', label: 'Continencia' },
                        { campo: 'abvd_movilidad', label: 'Movilidad' },
                      ].map(({ campo, label }) => {
                        const val = (paciente as unknown as Record<string, string | null | undefined>)[campo]
                        return (
                          <div key={campo} className="bg-gray-50 rounded-xl p-3">
                            <p className="text-xs text-gray-400 uppercase tracking-wide">{label}</p>
                            <p className={`text-sm font-semibold mt-1 ${
                              val === 'Independiente' ? 'text-green-700' :
                              val === 'Con ayuda parcial' ? 'text-yellow-700' :
                              val === 'Dependiente' ? 'text-red-700' : 'text-gray-400'
                            }`}>{val || '—'}</p>
                          </div>
                        )
                      })}
                    </div>
                  </div>
                )}

                {/* Downton */}
                {paciente.downton_total != null && (
                  <div className="bg-white rounded-2xl shadow-sm border p-6">
                    <SeccionTitulo>Escala de Downton — Riesgo de caídas</SeccionTitulo>
                    {(() => {
                      const riesgo = downtonRiesgo(paciente.downton_total)
                      return (
                        <div className="space-y-3">
                          <div className="flex items-center gap-3">
                            <span className="text-sm text-gray-600">Total: <span className="font-bold text-gray-800">{paciente.downton_total}</span></span>
                            {riesgo && (
                              <span className={`text-xs font-semibold px-3 py-1 rounded-full border ${riesgo.cls}`}>
                                {riesgo.texto}
                              </span>
                            )}
                          </div>
                          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                            {[
                              { campo: 'downton_caidas_previas', label: 'Caídas previas' },
                              { campo: 'downton_medicamentos', label: 'Medicamentos' },
                              { campo: 'downton_deficit_sensorial', label: 'Déficit sensorial' },
                              { campo: 'downton_estado_mental', label: 'Estado mental' },
                              { campo: 'downton_deambulacion', label: 'Deambulación' },
                              { campo: 'downton_edad', label: 'Edad' },
                            ].map(({ campo, label }) => {
                              const val = (paciente as unknown as Record<string, number | null | undefined>)[campo]
                              return val != null ? (
                                <div key={campo} className="bg-gray-50 rounded-xl px-3 py-2">
                                  <p className="text-xs text-gray-400">{label}</p>
                                  <p className={`text-sm font-semibold ${val === 0 ? 'text-green-700' : 'text-red-700'}`}>{val}</p>
                                </div>
                              ) : null
                            })}
                          </div>
                        </div>
                      )
                    })()}
                  </div>
                )}

                {/* Braden Historia Clínica */}
                <div className="bg-white rounded-2xl shadow-sm border p-6">
                  <SeccionTitulo>Escala de Braden — Riesgo de Úlcera por Presión</SeccionTitulo>
                  {paciente.braden_total != null ? (() => {
                    const riesgo = bradenHCRiesgo(paciente.braden_total)
                    return (
                      <div className="space-y-3">
                        <div className="flex items-center gap-3 flex-wrap">
                          <span className="text-sm text-gray-600">Total: <span className="font-bold text-gray-800">{paciente.braden_total}</span></span>
                          {riesgo && <span className={`text-xs font-semibold px-3 py-1 rounded-full border ${riesgo.cls}`}>{riesgo.texto}</span>}
                          {paciente.braden_fecha && <span className="text-xs text-gray-400">Valoración: {new Date(paciente.braden_fecha).toLocaleDateString('es-MX')}</span>}
                        </div>
                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
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

                {/* Valoración física */}
                {(paciente.vf_ta || paciente.vf_fc || paciente.vf_cabeza_cuello || paciente.vf_profesional) && (
                  <div className="bg-white rounded-2xl shadow-sm border p-6">
                    <SeccionTitulo>Valoración física basal</SeccionTitulo>
                    <div className="space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        {paciente.vf_fecha_evaluacion && <Campo label="Fecha de evaluación" valor={new Date(paciente.vf_fecha_evaluacion).toLocaleDateString('es-MX')} />}
                        {paciente.vf_profesional && <Campo label="Profesional" valor={paciente.vf_profesional} />}
                      </div>
                      {(paciente.vf_ta || paciente.vf_fc || paciente.vf_fr || paciente.vf_temp || paciente.vf_spo2 || paciente.vf_glucosa) && (
                        <>
                          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Signos vitales basales</p>
                          <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
                            {paciente.vf_ta && <div className="bg-gray-50 rounded-lg px-2 py-1.5 text-center"><p className="text-xs text-gray-400">T/A</p><p className="text-xs font-semibold text-gray-800">{paciente.vf_ta}</p></div>}
                            {paciente.vf_fc != null && <div className="bg-gray-50 rounded-lg px-2 py-1.5 text-center"><p className="text-xs text-gray-400">FC</p><p className="text-xs font-semibold text-gray-800">{paciente.vf_fc} lpm</p></div>}
                            {paciente.vf_fr != null && <div className="bg-gray-50 rounded-lg px-2 py-1.5 text-center"><p className="text-xs text-gray-400">FR</p><p className="text-xs font-semibold text-gray-800">{paciente.vf_fr} rpm</p></div>}
                            {paciente.vf_temp != null && <div className="bg-gray-50 rounded-lg px-2 py-1.5 text-center"><p className="text-xs text-gray-400">Temp</p><p className="text-xs font-semibold text-gray-800">{paciente.vf_temp}°C</p></div>}
                            {paciente.vf_spo2 != null && <div className="bg-gray-50 rounded-lg px-2 py-1.5 text-center"><p className="text-xs text-gray-400">SpO₂</p><p className="text-xs font-semibold text-gray-800">{paciente.vf_spo2}%</p></div>}
                            {paciente.vf_glucosa != null && <div className="bg-gray-50 rounded-lg px-2 py-1.5 text-center"><p className="text-xs text-gray-400">Glucosa</p><p className="text-xs font-semibold text-gray-800">{paciente.vf_glucosa} mg/dL</p></div>}
                          </div>
                        </>
                      )}
                      {[
                        { campo: 'vf_cabeza_cuello', label: 'Cabeza y cuello' },
                        { campo: 'vf_cardiopulmonar', label: 'Cardiopulmonar' },
                        { campo: 'vf_abdomen', label: 'Abdomen' },
                        { campo: 'vf_extremidades', label: 'Extremidades' },
                        { campo: 'vf_neurologico', label: 'Neurológico' },
                        { campo: 'vf_piel', label: 'Piel' },
                      ].map(({ campo, label }) => {
                        const val = (paciente as unknown as Record<string, string | null | undefined>)[campo]
                        return val ? <Campo key={campo} label={label} valor={val} /> : null
                      })}
                    </div>
                  </div>
                )}

                {/* Creado por */}
                <p className="text-sm text-gray-400 text-right">
                  Paciente creado por: <span className="font-medium text-gray-600">{paciente.creado_por_nombre || '—'}</span>
                </p>
              </>
            )}

            {/* Contraseña */}
            {paciente.usuario_id && (
              <div className="bg-white rounded-2xl shadow-sm border p-6">
                <div className="flex justify-between items-center mb-2">
                  <p className="text-sm font-medium text-gray-700">Contraseña del paciente</p>
                  <button onClick={() => setMostrarCambioPassword(!mostrarCambioPassword)}
                    className="text-sm text-blue-600 hover:text-blue-800 transition">
                    {mostrarCambioPassword ? 'Cancelar' : 'Cambiar contraseña'}
                  </button>
                </div>
                {mostrarCambioPassword && (
                  <form onSubmit={cambiarPasswordPaciente} className="space-y-3 mt-3">
                    <input type="password" value={nuevaPassword} onChange={e => setNuevaPassword(e.target.value)}
                      className="w-full border border-gray-300 rounded-lg px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="Nueva contraseña (mín. 6 caracteres)" required />
                    <input type="password" value={confirmarPassword} onChange={e => setConfirmarPassword(e.target.value)}
                      className="w-full border border-gray-300 rounded-lg px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="Confirmar contraseña" required />
                    {errorPassword && <p className="text-red-500 text-xs">{errorPassword}</p>}
                    <button type="submit" disabled={guardandoPassword}
                      className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition disabled:opacity-50">
                      {guardandoPassword ? 'Guardando...' : 'Guardar contraseña'}
                    </button>
                  </form>
                )}
              </div>
            )}

            {/* Archivar / Desarchivar */}
            {paciente.archivado ? (
              <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 flex justify-between items-center">
                <div>
                  <p className="text-sm font-medium text-amber-800">Paciente archivado</p>
                  <p className="text-xs text-amber-600 mt-1">Volver a activarlo lo mostrará en el dashboard</p>
                </div>
                <button
                  onClick={async () => {
                    if (!confirm(`¿Desarchivar a ${paciente.nombre}?`)) return
                    const res = await fetch(`/api/pacientes/${id}/desarchivar`, { method: 'POST' })
                    if (res.ok) router.push('/dashboard')
                  }}
                  className="bg-amber-500 hover:bg-amber-600 text-white px-4 py-2 rounded-lg text-sm font-medium transition">
                  Desarchivar
                </button>
              </div>
            ) : (
              <div className="bg-red-50 border border-red-200 rounded-2xl p-4 flex justify-between items-center">
                <div>
                  <p className="text-sm font-medium text-red-700">Archivar paciente</p>
                  <p className="text-xs text-red-500 mt-1">El paciente desaparecerá del dashboard pero su expediente se conserva</p>
                </div>
                <button
                  onClick={async () => {
                    if (!confirm('¿Seguro que deseas archivar este paciente?')) return
                    const res = await fetch(`/api/pacientes/${id}/archivar`, { method: 'POST' })
                    if (res.ok) router.push('/dashboard')
                  }}
                  className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition">
                  Archivar
                </button>
              </div>
            )}
          </div>
        )}

        {/* BITÁCORA */}
        {seccion === 'bitacora' && (
          <div className="space-y-4">
            <div className="bg-white rounded-2xl shadow-sm border p-6">
              <h3 className="font-semibold text-gray-800 mb-4">Nueva entrada</h3>
              <form onSubmit={agregarBitacora} className="space-y-5">

                <div>
                  <p className="text-xs font-semibold text-blue-700 uppercase tracking-wide mb-3">Estado</p>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Estado del paciente *</label>
                    <input value={nuevaBitacora.estado_paciente}
                      onChange={e => setNuevaBitacora({ ...nuevaBitacora, estado_paciente: e.target.value })}
                      className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="Ej: Estable, Mejorando…" required />
                  </div>
                </div>

                <div>
                  <p className="text-xs font-semibold text-blue-700 uppercase tracking-wide mb-3">Signos vitales</p>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                    <div>
                      <label className="block text-xs text-gray-500 mb-1">T/A (mmHg)</label>
                      <input value={nuevaBitacora.tension_arterial}
                        onChange={e => setNuevaBitacora({ ...nuevaBitacora, tension_arterial: e.target.value })}
                        className={inputCls} placeholder="120/80" />
                    </div>
                    <div>
                      <label className="block text-xs text-gray-500 mb-1">FC (lpm)</label>
                      <input type="number" min={0} value={nuevaBitacora.frecuencia_cardiaca}
                        onChange={e => setNuevaBitacora({ ...nuevaBitacora, frecuencia_cardiaca: e.target.value })}
                        className={inputCls} placeholder="80" />
                    </div>
                    <div>
                      <label className="block text-xs text-gray-500 mb-1">FR (rpm)</label>
                      <input type="number" min={0} value={nuevaBitacora.frecuencia_respiratoria}
                        onChange={e => setNuevaBitacora({ ...nuevaBitacora, frecuencia_respiratoria: e.target.value })}
                        className={inputCls} placeholder="18" />
                    </div>
                    <div>
                      <label className="block text-xs text-gray-500 mb-1">Temperatura (°C)</label>
                      <input type="number" step="0.1" min={0} value={nuevaBitacora.temperatura}
                        onChange={e => setNuevaBitacora({ ...nuevaBitacora, temperatura: e.target.value })}
                        className={inputCls} placeholder="36.6" />
                    </div>
                    <div>
                      <label className="block text-xs text-gray-500 mb-1">SpO₂ (%)</label>
                      <input type="number" min={0} max={100} value={nuevaBitacora.saturacion_oxigeno}
                        onChange={e => setNuevaBitacora({ ...nuevaBitacora, saturacion_oxigeno: e.target.value })}
                        className={inputCls} placeholder="98" />
                    </div>
                    <div>
                      <label className="block text-xs text-gray-500 mb-1">Glucosa (mg/dL)</label>
                      <input type="number" min={0} value={nuevaBitacora.glucosa}
                        onChange={e => setNuevaBitacora({ ...nuevaBitacora, glucosa: e.target.value })}
                        className={inputCls} placeholder="100" />
                    </div>
                  </div>
                  <div className="mt-3">
                    <label className="block text-xs text-gray-500 mb-1">Escala de dolor (0–10)</label>
                    <input type="number" min={0} max={10} value={nuevaBitacora.escala_dolor}
                      onChange={e => setNuevaBitacora({ ...nuevaBitacora, escala_dolor: e.target.value })}
                      className="w-32 border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="0–10" />
                  </div>
                </div>

                <div>
                  <p className="text-xs font-semibold text-blue-700 uppercase tracking-wide mb-3">Balance de líquidos</p>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                    <div>
                      <label className="block text-xs text-gray-500 mb-1">Uresis</label>
                      <input value={nuevaBitacora.uresis} onChange={e => setNuevaBitacora({ ...nuevaBitacora, uresis: e.target.value })} className={inputCls} placeholder="Ej: 800 mL" />
                    </div>
                    <div>
                      <label className="block text-xs text-gray-500 mb-1">Evacuaciones</label>
                      <input value={nuevaBitacora.evacuaciones} onChange={e => setNuevaBitacora({ ...nuevaBitacora, evacuaciones: e.target.value })} className={inputCls} placeholder="Ej: 1 vez" />
                    </div>
                    <div>
                      <label className="block text-xs text-gray-500 mb-1">Ingresos</label>
                      <input value={nuevaBitacora.ingresos_liquidos} onChange={e => setNuevaBitacora({ ...nuevaBitacora, ingresos_liquidos: e.target.value })} className={inputCls} placeholder="Ej: 1500 mL" />
                    </div>
                    <div>
                      <label className="block text-xs text-gray-500 mb-1">Egresos</label>
                      <input value={nuevaBitacora.egresos_liquidos} onChange={e => setNuevaBitacora({ ...nuevaBitacora, egresos_liquidos: e.target.value })} className={inputCls} placeholder="Ej: 1200 mL" />
                    </div>
                    <div>
                      <label className="block text-xs text-gray-500 mb-1">Balance</label>
                      <input value={nuevaBitacora.balance_liquidos} onChange={e => setNuevaBitacora({ ...nuevaBitacora, balance_liquidos: e.target.value })} className={inputCls} placeholder="Ej: +300 mL" />
                    </div>
                  </div>
                </div>

                <div>
                  <p className="text-xs font-semibold text-blue-700 uppercase tracking-wide mb-3">Tratamiento</p>
                  <div className="space-y-3">
                    <div>
                      <label className="block text-xs text-gray-500 mb-1">Medicación del turno</label>
                      <textarea value={nuevaBitacora.medicacion_turno} onChange={e => setNuevaBitacora({ ...nuevaBitacora, medicacion_turno: e.target.value })} className={textareaCls} rows={2} placeholder="Medicamentos administrados en el turno…" />
                    </div>
                    <div>
                      <label className="block text-xs text-gray-500 mb-1">Soluciones</label>
                      <textarea value={nuevaBitacora.soluciones} onChange={e => setNuevaBitacora({ ...nuevaBitacora, soluciones: e.target.value })} className={textareaCls} rows={2} placeholder="Soluciones IV administradas…" />
                    </div>
                    <div>
                      <label className="block text-xs text-gray-500 mb-1">Dieta</label>
                      <input value={nuevaBitacora.dieta} onChange={e => setNuevaBitacora({ ...nuevaBitacora, dieta: e.target.value })} className={inputCls} placeholder="Ej: Líquidos, Blanda, Normal…" />
                    </div>
                  </div>
                </div>

                <div className="border border-gray-200 rounded-xl overflow-hidden">
                  <button type="button" onClick={() => setMostrarBraden(v => !v)}
                    className="w-full flex items-center justify-between px-4 py-3 bg-gray-50 hover:bg-gray-100 transition text-left">
                    <span className="text-xs font-semibold text-blue-700 uppercase tracking-wide">Escala de Braden — Valoración de Riesgo de Úlcera por Presión</span>
                    <span className="text-gray-400 text-sm">{mostrarBraden ? '▲' : '▼'}</span>
                  </button>
                  {mostrarBraden && (
                    <div className="p-4 space-y-4">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        {(Object.keys(BRADEN_OPCIONES) as Array<keyof typeof BRADEN_OPCIONES>).map(campo => (
                          <div key={campo}>
                            <label className="block text-xs text-gray-500 mb-1">{BRADEN_OPCIONES[campo].label}</label>
                            <select value={(nuevaBitacora as Record<string, string>)[campo]}
                              onChange={e => setNuevaBitacora({ ...nuevaBitacora, [campo]: e.target.value })}
                              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white">
                              <option value="">— Sin evaluar —</option>
                              {BRADEN_OPCIONES[campo].opciones.map((op, i) => (
                                <option key={i} value={String(i)}>{i} — {op}</option>
                              ))}
                            </select>
                          </div>
                        ))}
                      </div>
                      {(() => {
                        const vals = [nuevaBitacora.braden_percepcion, nuevaBitacora.braden_humedad, nuevaBitacora.braden_actividad, nuevaBitacora.braden_movilidad, nuevaBitacora.braden_nutricion, nuevaBitacora.braden_lesiones]
                        const filled = vals.filter(v => v !== '')
                        if (filled.length === 0) return null
                        const total = filled.reduce((s, v) => s + parseInt(v, 10), 0)
                        const riesgo = bradenRiesgo(total)
                        return (
                          <div className="flex items-center gap-3 pt-2 border-t border-gray-100">
                            <span className="text-xs text-gray-500">{filled.length === 6 ? 'Total:' : `Parcial (${filled.length}/6):`}</span>
                            {riesgo && <span className={`text-xs font-semibold px-3 py-1 rounded-full border ${riesgo.cls}`}>{riesgo.texto}</span>}
                          </div>
                        )
                      })()}
                    </div>
                  )}
                </div>

                <div>
                  <p className="text-xs font-semibold text-blue-700 uppercase tracking-wide mb-3">Reporte y Supervisión</p>
                  <div className="space-y-3">
                    <div>
                      <label className="block text-xs text-gray-500 mb-1">Reporte de enfermería del turno</label>
                      <textarea value={nuevaBitacora.reporte_enfermeria} onChange={e => setNuevaBitacora({ ...nuevaBitacora, reporte_enfermeria: e.target.value })} className={textareaCls} rows={3} placeholder="Resumen general del turno, novedades, pendientes…" />
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs text-gray-500 mb-1">Supervisión de Enf.</label>
                        <input value={nuevaBitacora.supervision_enfermero} onChange={e => setNuevaBitacora({ ...nuevaBitacora, supervision_enfermero: e.target.value })} className={inputCls} placeholder="Nombre del enfermero supervisor" />
                      </div>
                      <div>
                        <label className="block text-xs text-gray-500 mb-1">Supervisión de Familiar</label>
                        <input value={nuevaBitacora.supervision_familiar} onChange={e => setNuevaBitacora({ ...nuevaBitacora, supervision_familiar: e.target.value })} className={inputCls} placeholder="Nombre del familiar supervisor" />
                      </div>
                    </div>
                  </div>
                </div>

                <div>
                  <p className="text-xs font-semibold text-blue-700 uppercase tracking-wide mb-3">Observaciones</p>
                  <textarea value={nuevaBitacora.observaciones}
                    onChange={e => setNuevaBitacora({ ...nuevaBitacora, observaciones: e.target.value })}
                    className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                    placeholder="Observaciones clínicas del turno…" rows={4} required />
                </div>

                <button type="submit" disabled={guardando}
                  className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg font-medium transition disabled:opacity-50">
                  {guardando ? 'Guardando...' : 'Registrar entrada'}
                </button>
              </form>
            </div>
            <div className="space-y-3">
              {bitacoras.length === 0 ? (
                <div className="bg-white rounded-2xl border p-6 text-center text-gray-400">No hay entradas en la bitácora</div>
              ) : bitacoras.map(b => {
                const tc = turnoClases(b.created_at)
                const tieneSignos = b.tension_arterial || b.frecuencia_cardiaca || b.frecuencia_respiratoria || b.temperatura || b.saturacion_oxigeno || b.glucosa
                const tieneBalance = b.uresis || b.evacuaciones || b.ingresos_liquidos || b.egresos_liquidos || b.balance_liquidos
                const tieneTratamiento = b.medicacion_turno || b.soluciones || b.dieta
                return (
                  <div key={b.id} className={`bg-white rounded-2xl shadow-sm border p-6 ${tc.card}`}>
                    <div className="flex justify-between items-start mb-2 flex-wrap gap-2">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="bg-blue-50 text-blue-700 text-xs font-medium px-3 py-1 rounded-full">{b.estado_paciente}</span>
                        <span className="bg-gray-100 text-gray-600 text-xs px-2 py-0.5 rounded-full">{turnoNombre(b.created_at)}</span>
                        {b.escala_dolor != null && (
                          <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${b.escala_dolor >= 7 ? 'bg-red-100 text-red-700' : b.escala_dolor >= 4 ? 'bg-yellow-100 text-yellow-700' : 'bg-green-100 text-green-700'}`}>
                            Dolor: {b.escala_dolor}/10
                          </span>
                        )}
                      </div>
                      <span className={`text-xs ${tc.hora}`}>{new Date(b.created_at).toLocaleString('es-MX')}</span>
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
                        {b.medicacion_turno && <p className="text-xs text-gray-600"><span className="font-medium text-gray-700">Medicación:</span> {b.medicacion_turno}</p>}
                        {b.soluciones && <p className="text-xs text-gray-600"><span className="font-medium text-gray-700">Soluciones:</span> {b.soluciones}</p>}
                        {b.dieta && <p className="text-xs text-gray-600"><span className="font-medium text-gray-700">Dieta:</span> {b.dieta}</p>}
                      </div>
                    )}
                    {(b.reporte_enfermeria || b.supervision_enfermero || b.supervision_familiar) && (
                      <div className="mt-3 space-y-1 border-t border-gray-100 pt-3">
                        {b.reporte_enfermeria && <p className="text-xs text-gray-600"><span className="font-medium text-gray-700">Reporte:</span> {b.reporte_enfermeria}</p>}
                        {b.supervision_enfermero && <p className="text-xs text-gray-600"><span className="font-medium text-gray-700">Supervisión Enf.:</span> {b.supervision_enfermero}</p>}
                        {b.supervision_familiar && <p className="text-xs text-gray-600"><span className="font-medium text-gray-700">Supervisión Familiar:</span> {b.supervision_familiar}</p>}
                      </div>
                    )}
                    {b.braden_total != null && (() => {
                      const riesgo = bradenRiesgo(b.braden_total)
                      const exp = bradenExpandido[b.id]
                      return (
                        <div className="mt-3 border-t border-gray-100 pt-3">
                          <button type="button"
                            onClick={() => setBradenExpandido(prev => ({ ...prev, [b.id]: !prev[b.id] }))}
                            className={`inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1 rounded-full border cursor-pointer transition hover:opacity-80 ${riesgo?.cls}`}>
                            Braden: {riesgo?.texto}
                            <span>{exp ? '▲' : '▼'}</span>
                          </button>
                          {exp && (
                            <div className="mt-2 grid grid-cols-2 sm:grid-cols-3 gap-2">
                              {(Object.keys(BRADEN_OPCIONES) as Array<keyof typeof BRADEN_OPCIONES>).map(campo => {
                                const val = b[campo as keyof Bitacora] as number | null | undefined
                                if (val == null) return null
                                return (
                                  <div key={campo} className="bg-gray-50 rounded-lg px-2 py-1.5">
                                    <p className="text-xs text-gray-400">{BRADEN_OPCIONES[campo].label}</p>
                                    <p className="text-xs font-semibold text-gray-800">{val} — {BRADEN_OPCIONES[campo].opciones[val] ?? '—'}</p>
                                  </div>
                                )
                              })}
                            </div>
                          )}
                        </div>
                      )
                    })()}
                    <p className={`mt-3 ${tc.texto} text-sm`}>{b.observaciones}</p>
                    <p className="text-xs text-gray-400 mt-3">Registrado por: {b.enfermero_nombre}</p>
                  </div>
                )
              })}
            </div>
            {totalBitacoras > LIMIT_BITACORA && (
              <div className="flex items-center justify-between mt-2 gap-4">
                <button type="button" disabled={pageBitacora === 1} onClick={() => setPageBitacora(p => p - 1)}
                  className="px-4 py-2 text-sm font-medium border border-gray-300 rounded-xl bg-white hover:bg-gray-50 transition disabled:opacity-40 disabled:cursor-not-allowed">
                  ← Anterior
                </button>
                <span className="text-sm text-gray-500">
                  Página <span className="font-semibold text-gray-800">{pageBitacora}</span> de{' '}
                  <span className="font-semibold text-gray-800">{Math.ceil(totalBitacoras / LIMIT_BITACORA)}</span>
                  <span className="text-gray-400 ml-1">· {totalBitacoras} entradas</span>
                </span>
                <button type="button" disabled={pageBitacora >= Math.ceil(totalBitacoras / LIMIT_BITACORA)} onClick={() => setPageBitacora(p => p + 1)}
                  className="px-4 py-2 text-sm font-medium border border-gray-300 rounded-xl bg-white hover:bg-gray-50 transition disabled:opacity-40 disabled:cursor-not-allowed">
                  Siguiente →
                </button>
              </div>
            )}
          </div>
        )}

        {/* MEDICAMENTOS */}
        {seccion === 'medicamentos' && (
          <div className="space-y-4">
            <div className="bg-white rounded-2xl shadow-sm border p-6">
              <h3 className="font-semibold text-gray-800 mb-4">Agregar medicamento</h3>
              <form onSubmit={guardarMedicamento} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Medicamento</label>
                  <input value={nuevoMed.nombre} onChange={e => setNuevoMed({ ...nuevoMed, nombre: e.target.value })}
                    className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Nombre del medicamento" required />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Dosis</label>
                    <input value={nuevoMed.dosis} onChange={e => setNuevoMed({ ...nuevoMed, dosis: e.target.value })}
                      className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="Ej: 500mg" required />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Horario</label>
                    <input value={nuevoMed.horario} onChange={e => setNuevoMed({ ...nuevoMed, horario: e.target.value })}
                      className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="Ej: Cada 8 horas" required />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Fecha inicio</label>
                    <input type="date" value={nuevoMed.fecha_inicio} onChange={e => setNuevoMed({ ...nuevoMed, fecha_inicio: e.target.value })}
                      className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500" required />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Fecha fin</label>
                    <input type="date" value={nuevoMed.fecha_fin} onChange={e => setNuevoMed({ ...nuevoMed, fecha_fin: e.target.value })}
                      className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      disabled={nuevoMed.indeterminado} />
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <input type="checkbox" id="indeterminado" checked={nuevoMed.indeterminado}
                    onChange={e => setNuevoMed({ ...nuevoMed, indeterminado: e.target.checked, fecha_fin: '' })}
                    className="w-4 h-4 text-blue-600" />
                  <label htmlFor="indeterminado" className="text-sm text-gray-700">Tratamiento por tiempo indeterminado</label>
                </div>
                <div className="flex items-center gap-2">
                  <input type="checkbox" id="alto_riesgo" checked={nuevoMed.alto_riesgo}
                    onChange={e => setNuevoMed({ ...nuevoMed, alto_riesgo: e.target.checked })}
                    className="w-4 h-4 text-red-600 accent-red-600" />
                  <label htmlFor="alto_riesgo" className="text-sm font-medium text-red-600">Antibiótico o medicamento de alto riesgo</label>
                </div>
                <button type="submit" disabled={guardando}
                  className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg font-medium transition disabled:opacity-50">
                  {guardando ? 'Guardando...' : 'Agregar medicamento'}
                </button>
              </form>
            </div>
            <div className="space-y-3">
              {medicamentos.length === 0 ? (
                <div className="bg-white rounded-2xl border p-6 text-center text-gray-400">No hay medicamentos registrados</div>
              ) : medicamentos.map(m => (
                <div key={m.id} className={`bg-white rounded-2xl shadow-sm border p-6 ${!m.activo ? 'opacity-50' : ''}`}>
                  <div className="flex justify-between items-start">
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className={`font-semibold ${m.alto_riesgo ? 'text-red-600' : 'text-gray-800'}`}>{m.nombre}</p>
                        {m.alto_riesgo && <span className="bg-red-100 text-red-600 text-xs px-2 py-0.5 rounded-full font-medium">Alto riesgo</span>}
                        {!m.activo && <span className="bg-red-100 text-red-600 text-xs px-2 py-0.5 rounded-full">Suspendido</span>}
                      </div>
                      <p className={`text-sm mt-1 ${m.alto_riesgo ? 'text-red-500' : 'text-gray-500'}`}>Dosis: {m.dosis}</p>
                      <p className={`text-sm ${m.alto_riesgo ? 'text-red-500' : 'text-gray-500'}`}>Horario: {m.horario}</p>
                      <p className={`text-sm ${m.alto_riesgo ? 'text-red-500' : 'text-gray-500'}`}>
                        Desde: {m.fecha_inicio ? new Date(m.fecha_inicio).toLocaleDateString('es-MX') : '—'}
                        {' '}— Hasta: {m.indeterminado ? 'Indeterminado' : m.fecha_fin ? new Date(m.fecha_fin).toLocaleDateString('es-MX') : '—'}
                      </p>
                    </div>
                    {m.activo && (
                      <button onClick={async () => {
                          if (!confirm(`¿Suspender ${m.nombre}?`)) return
                          const res = await fetch(`/api/pacientes/${id}/suspender-medicamento`, {
                            method: 'POST', headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({ medicamento_id: m.id })
                          })
                          if (res.ok) { setMensaje('Medicamento suspendido'); cargarMedicamentos(); setTimeout(() => setMensaje(''), 3000) }
                        }}
                        className="text-xs text-red-500 hover:text-red-700 border border-red-200 px-3 py-1 rounded-lg transition">
                        Suspender
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ARCHIVOS */}
        {seccion === 'archivos' && (
          <div className="space-y-4">
            <div className="bg-white rounded-2xl shadow-sm border p-6">
              <h3 className="font-semibold text-gray-800 mb-4">Subir archivo</h3>
              <input type="file" accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
                onChange={async (e) => {
                  const file = e.target.files?.[0]
                  if (!file) return
                  const formData = new FormData()
                  formData.append('archivo', file)
                  formData.append('paciente_id', id)
                  setGuardando(true)
                  try {
                    const res = await fetch('/api/archivos', { method: 'POST', body: formData })
                    if (res.ok) { setMensaje('✅ Archivo subido correctamente'); cargarArchivosLista(); setTimeout(() => setMensaje(''), 3000) }
                    else { setMensaje('❌ Error al subir archivo'); setTimeout(() => setMensaje(''), 3000) }
                  } finally { setGuardando(false); e.target.value = '' }
                }}
                className="w-full border border-gray-300 rounded-lg px-4 py-3 text-sm text-gray-600 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100" />
              {guardando && <p className="text-sm text-gray-400 mt-2">Subiendo archivo...</p>}
            </div>
            <div className="space-y-3">
              {archivos.length === 0 ? (
                <div className="bg-white rounded-2xl border p-6 text-center text-gray-400">No hay archivos subidos aún</div>
              ) : archivos.map(a => (
                <div key={a.id} className="bg-white rounded-2xl shadow-sm border p-6">
                  <div className="flex justify-between items-center">
                    <div>
                      <p className="font-medium text-gray-800">{a.nombre_archivo}</p>
                      <p className="text-xs text-gray-400 mt-1">Subido por: {a.subido_por_nombre} — {new Date(a.created_at).toLocaleDateString('es-MX')}</p>
                    </div>
                    <a href={a.url} target="_blank" rel="noopener noreferrer"
                      className="text-sm text-blue-600 hover:text-blue-800 border border-blue-200 px-3 py-1 rounded-lg transition">
                      Ver archivo
                    </a>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
