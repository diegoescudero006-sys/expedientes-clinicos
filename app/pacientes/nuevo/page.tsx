'use client'
import { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Suspense } from 'react'

const HERDO_OPCIONES = ['Diabetes', 'HAS', 'Cardiopatías', 'Cáncer', 'Enfermedad Neurodegenerativa']

const ABVD_OPCIONES = ['Independiente', 'Con ayuda parcial', 'Dependiente']

const DOWNTON_CONFIG: Record<string, { label: string; opciones: { label: string; score: number }[] }> = {
  caidas_previas: {
    label: 'Caídas previas',
    opciones: [{ label: 'No', score: 0 }, { label: 'Sí', score: 1 }],
  },
  medicamentos: {
    label: 'Medicamentos',
    opciones: [
      { label: 'Ninguno', score: 0 },
      { label: 'Tranquilizantes / Sedantes', score: 1 },
      { label: 'Diuréticos', score: 1 },
      { label: 'Hipotensores', score: 1 },
      { label: 'Antiparkinsonianos', score: 1 },
      { label: 'Antidepresivos', score: 1 },
      { label: 'Otros', score: 1 },
    ],
  },
  deficit_sensorial: {
    label: 'Déficit sensorial',
    opciones: [
      { label: 'Ninguno', score: 0 },
      { label: 'Alteraciones visuales', score: 1 },
      { label: 'Alteraciones auditivas', score: 1 },
      { label: 'Extremidades / Parálisis', score: 1 },
    ],
  },
  estado_mental: {
    label: 'Estado mental',
    opciones: [{ label: 'Orientado', score: 0 }, { label: 'Confuso', score: 1 }],
  },
  deambulacion: {
    label: 'Deambulación',
    opciones: [
      { label: 'Normal', score: 0 },
      { label: 'Segura con ayuda', score: 1 },
      { label: 'Insegura con / sin ayuda', score: 1 },
      { label: 'Imposible', score: 1 },
    ],
  },
  edad: {
    label: 'Edad',
    opciones: [{ label: 'Menor de 70 años', score: 0 }, { label: 'Mayor de 70 años', score: 1 }],
  },
}

function downtonRiesgo(total: number) {
  if (total <= 1) return { texto: 'Bajo Riesgo', cls: 'bg-green-100 text-green-800 border-green-300' }
  if (total === 2) return { texto: 'Riesgo Moderado', cls: 'bg-yellow-100 text-yellow-800 border-yellow-300' }
  return { texto: 'Alto Riesgo', cls: 'bg-red-100 text-red-800 border-red-300' }
}

const BRADEN_HC_CONFIG: Record<string, { label: string; opciones: { label: string; score: number }[] }> = {
  percepcion: {
    label: 'Percepción Sensorial',
    opciones: [
      { label: 'Completamente limitada', score: 1 },
      { label: 'Muy limitada', score: 2 },
      { label: 'Ligeramente limitada', score: 3 },
      { label: 'Sin limitación', score: 4 },
    ],
  },
  humedad: {
    label: 'Exposición a la Humedad',
    opciones: [
      { label: 'Constantemente húmeda', score: 1 },
      { label: 'A menudo húmeda', score: 2 },
      { label: 'Ocasionalmente húmeda', score: 3 },
      { label: 'Raramente húmeda', score: 4 },
    ],
  },
  actividad: {
    label: 'Actividad',
    opciones: [
      { label: 'Encamado', score: 1 },
      { label: 'En silla', score: 2 },
      { label: 'Deambula ocasionalmente', score: 3 },
      { label: 'Deambula con frecuencia', score: 4 },
    ],
  },
  movilidad: {
    label: 'Movilidad',
    opciones: [
      { label: 'Completamente inmóvil', score: 1 },
      { label: 'Muy limitada', score: 2 },
      { label: 'Ligeramente limitada', score: 3 },
      { label: 'Sin limitación', score: 4 },
    ],
  },
  nutricion: {
    label: 'Nutrición',
    opciones: [
      { label: 'Muy pobre', score: 1 },
      { label: 'Probablemente inadecuada', score: 2 },
      { label: 'Adecuada', score: 3 },
      { label: 'Excelente', score: 4 },
    ],
  },
  friccion: {
    label: 'Fricción y Cizallamiento',
    opciones: [
      { label: 'Problema', score: 1 },
      { label: 'Problema potencial', score: 2 },
      { label: 'No existe problema aparente', score: 3 },
    ],
  },
}

function bradenHCRiesgo(total: number) {
  if (total <= 12) return { texto: 'Alto Riesgo', cls: 'bg-red-100 text-red-800 border-red-300' }
  if (total <= 14) return { texto: 'Riesgo Moderado', cls: 'bg-yellow-100 text-yellow-800 border-yellow-300' }
  return { texto: 'Bajo Riesgo', cls: 'bg-green-100 text-green-800 border-green-300' }
}

function buildHeredofamiliares(checked: string[], otros: string): string {
  const parts: string[] = []
  if (checked.length > 0) parts.push(checked.join(', '))
  if (otros.trim()) parts.push(otros.trim())
  return parts.join('\n')
}

function NuevoPacienteForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const usuario_id = searchParams.get('usuario_id') || ''
  const nombreInicial = searchParams.get('nombre') || ''

  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const [form, setForm] = useState({
    nombre: nombreInicial,
    fecha_nacimiento: '',
    edad: '',
    sexo: '',
    estado_civil: '',
    escolaridad: '',
    religion: '',
    telefono_local: '',
    telefono: '',
    direccion: '',
    contacto: '',
    familiar_responsable: '',
    familiar_tel_local: '',
    familiar_tel_cel: '',
    segundo_numero_emergencia: '',
    tiene_servicio_medico: false,
    cual_servicio_medico: '',
    afiliacion: '',
    medicos_tratantes: '',
    tipo_sangre: '',
    peso: '',
    altura: '',
    primera_visita: new Date().toISOString().split('T')[0],
    doctor_encargado: '',
    motivo_atencion_domiciliaria: '',
    motivo_consulta: '',
    padecimiento_actual: '',
    diagnostico: '',
    alergias: '',
    antecedentes_medicos: '',
    antecedentes_patologicos: '',
    antecedentes_no_patologicos: '',
    enfermedades_cronicas: '',
    ultima_hospitalizacion: '',
    cirugias: '',
    traumatismos: '',
    inmunizaciones: '',
    dispositivos_drenaje: '',
    estado_cognitivo: '',
    mini_mental_resultado: '',
    mini_mental_fecha: '',
    abvd_bano: '',
    abvd_vestido: '',
    abvd_alimentacion: '',
    abvd_continencia: '',
    abvd_movilidad: '',
    vf_fecha: '',
    vf_ta: '',
    vf_fc: '',
    vf_fr: '',
    vf_temp: '',
    vf_spo2: '',
    vf_glucosa: '',
    vf_cabeza_cuello: '',
    vf_cardiopulmonar: '',
    vf_abdomen: '',
    vf_extremidades: '',
    vf_neurologico: '',
    vf_piel: '',
    vf_profesional: '',
    vf_fecha_evaluacion: '',
    braden_fecha: '',
    usuario_id: usuario_id,
  })

  const [heredoChecked, setHeredoChecked] = useState<string[]>([])
  const [heredoOtros, setHeredoOtros] = useState('')

  // Downton: texto seleccionado por categoría (para radio buttons)
  const [downtonSel, setDowntonSel] = useState<Record<string, string>>({})
  // Downton: score por categoría
  const [downtonScores, setDowntonScores] = useState<Record<string, number>>({})
  // Braden Historia Clínica: score por categoría
  const [bradenHC, setBradenHC] = useState<Record<string, number>>({})

  const downtonTotal = Object.values(downtonScores).reduce((a, b) => a + b, 0)
  const bradenHCTotal = Object.keys(bradenHC).length === 6
    ? Object.values(bradenHC).reduce((a, b) => a + b, 0)
    : null

  useEffect(() => {
    setForm(f => ({ ...f, nombre: nombreInicial, usuario_id }))
  }, [nombreInicial, usuario_id])

  function handleChange(e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) {
    const { name, value, type } = e.target
    if (type === 'checkbox') {
      setForm({ ...form, [name]: (e.target as HTMLInputElement).checked })
    } else {
      setForm({ ...form, [name]: value })
    }
  }

  function toggleHerdo(opcion: string) {
    setHeredoChecked(prev =>
      prev.includes(opcion) ? prev.filter(o => o !== opcion) : [...prev, opcion]
    )
  }

  function handleDownton(campo: string, label: string, score: number) {
    setDowntonSel(d => ({ ...d, [campo]: label }))
    setDowntonScores(s => ({ ...s, [campo]: score }))
  }

  function handleBradenHC(campo: string, score: number) {
    setBradenHC(b => ({ ...b, [campo]: score }))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      const payload = {
        ...form,
        antecedentes_heredofamiliares: buildHeredofamiliares(heredoChecked, heredoOtros),
        downton_caidas_previas: downtonScores['caidas_previas'] ?? null,
        downton_medicamentos: downtonScores['medicamentos'] ?? null,
        downton_deficit_sensorial: downtonScores['deficit_sensorial'] ?? null,
        downton_estado_mental: downtonScores['estado_mental'] ?? null,
        downton_deambulacion: downtonScores['deambulacion'] ?? null,
        downton_edad: downtonScores['edad'] ?? null,
        downton_total: Object.keys(downtonScores).length === 6 ? downtonTotal : null,
        braden_percepcion: bradenHC['percepcion'] ?? null,
        braden_humedad: bradenHC['humedad'] ?? null,
        braden_actividad: bradenHC['actividad'] ?? null,
        braden_movilidad: bradenHC['movilidad'] ?? null,
        braden_nutricion: bradenHC['nutricion'] ?? null,
        braden_friccion: bradenHC['friccion'] ?? null,
        braden_total: bradenHCTotal,
      }

      const res = await fetch('/api/pacientes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })

      if (res.status === 401) {
        router.push('/login')
        return
      }

      const data = await res.json()

      if (!res.ok) {
        setError(data.error || 'Error al crear paciente')
        return
      }

      router.push('/dashboard')
    } catch {
      setError('Error de conexión')
    } finally {
      setLoading(false)
    }
  }

  const inputClass = 'w-full border border-gray-300 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm'
  const labelClass = 'block text-sm font-medium text-gray-700 mb-1'
  const sectionTitle = 'text-sm font-semibold text-blue-700 uppercase tracking-wide mb-4'
  const sectionCard = 'border-t pt-5 mt-5'

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white shadow-sm border-b">
        <div className="max-w-6xl mx-auto px-4 py-4 flex justify-between items-center">
          <h1 className="text-xl font-bold text-blue-700">Ángel De Los Abuelos</h1>
          <button onClick={() => router.push('/dashboard')} className="text-sm text-gray-500 hover:text-blue-500 transition">
            ← Volver
          </button>
        </div>
      </nav>

      <div className="max-w-2xl mx-auto px-4 py-8">
        <h2 className="text-2xl font-bold text-gray-800 mb-2">
          {usuario_id ? `Expediente de ${nombreInicial}` : 'Nuevo paciente'}
        </h2>
        <p className="text-gray-500 mb-6">Completa los datos del paciente. Solo nombre y edad son obligatorios.</p>

        <div className="bg-white rounded-2xl shadow-sm border p-6">
          <form onSubmit={handleSubmit} className="space-y-5">

            {/* SECCIÓN 1 — Identificación */}
            <p className={sectionTitle}>1. Identificación del paciente</p>

            <div>
              <label className={labelClass}>Nombre completo *</label>
              <input name="nombre" value={form.nombre} onChange={handleChange}
                className={inputClass} placeholder="Nombre completo del paciente" required />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className={labelClass}>Fecha de nacimiento</label>
                <input type="date" name="fecha_nacimiento" value={form.fecha_nacimiento}
                  onChange={handleChange} className={inputClass} />
              </div>
              <div>
                <label className={labelClass}>Edad *</label>
                <input name="edad" type="number" value={form.edad} onChange={handleChange}
                  className={inputClass} placeholder="Años" required />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className={labelClass}>Sexo</label>
                <select name="sexo" value={form.sexo} onChange={handleChange} className={inputClass}>
                  <option value="">No especificado</option>
                  <option value="Masculino">Masculino</option>
                  <option value="Femenino">Femenino</option>
                  <option value="Otro">Otro</option>
                </select>
              </div>
              <div>
                <label className={labelClass}>Estado civil</label>
                <select name="estado_civil" value={form.estado_civil} onChange={handleChange} className={inputClass}>
                  <option value="">No especificado</option>
                  <option value="Soltero">Soltero/a</option>
                  <option value="Casado">Casado/a</option>
                  <option value="Viudo">Viudo/a</option>
                  <option value="Divorciado">Divorciado/a</option>
                  <option value="Unión libre">Unión libre</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className={labelClass}>Escolaridad</label>
                <input name="escolaridad" value={form.escolaridad} onChange={handleChange}
                  className={inputClass} placeholder="Ej: Primaria, Licenciatura…" />
              </div>
              <div>
                <label className={labelClass}>Religión</label>
                <input name="religion" value={form.religion} onChange={handleChange}
                  className={inputClass} placeholder="Ej: Católica, Cristiana…" />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className={labelClass}>Teléfono local</label>
                <input name="telefono_local" value={form.telefono_local} onChange={handleChange}
                  className={inputClass} placeholder="Ej: 477 123 4567" />
              </div>
              <div>
                <label className={labelClass}>Teléfono celular</label>
                <input name="telefono" value={form.telefono} onChange={handleChange}
                  className={inputClass} placeholder="Ej: 477 123 4567" />
              </div>
            </div>

            <div>
              <label className={labelClass}>Dirección</label>
              <input name="direccion" value={form.direccion} onChange={handleChange}
                className={inputClass} placeholder="Calle, colonia, ciudad" />
            </div>

            <div>
              <label className={labelClass}>Contacto de emergencia</label>
              <input name="contacto" value={form.contacto} onChange={handleChange}
                className={inputClass} placeholder="Nombre y teléfono" />
            </div>

            {/* SECCIÓN 2 — Familiar responsable */}
            <div className={sectionCard}>
              <p className={sectionTitle}>2. Familiar responsable</p>
            </div>

            <div>
              <label className={labelClass}>Nombre del familiar responsable</label>
              <input name="familiar_responsable" value={form.familiar_responsable} onChange={handleChange}
                className={inputClass} placeholder="Nombre completo" />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className={labelClass}>Tel. local del familiar</label>
                <input name="familiar_tel_local" value={form.familiar_tel_local} onChange={handleChange}
                  className={inputClass} placeholder="Ej: 477 123 4567" />
              </div>
              <div>
                <label className={labelClass}>Tel. celular del familiar</label>
                <input name="familiar_tel_cel" value={form.familiar_tel_cel} onChange={handleChange}
                  className={inputClass} placeholder="Ej: 477 123 4567" />
              </div>
            </div>

            <div>
              <label className={labelClass}>Segundo número de emergencia</label>
              <input name="segundo_numero_emergencia" value={form.segundo_numero_emergencia} onChange={handleChange}
                className={inputClass} placeholder="Ej: 477 123 4567" />
            </div>

            {/* SECCIÓN 3 — Servicio médico */}
            <div className={sectionCard}>
              <p className={sectionTitle}>3. Servicio médico</p>
            </div>

            <div className="flex items-center gap-3">
              <input type="checkbox" id="tiene_servicio_medico" name="tiene_servicio_medico"
                checked={form.tiene_servicio_medico} onChange={handleChange}
                className="w-4 h-4 text-blue-600" />
              <label htmlFor="tiene_servicio_medico" className="text-sm font-medium text-gray-700">
                ¿Cuenta con servicio médico?
              </label>
            </div>

            {form.tiene_servicio_medico && (
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className={labelClass}>¿Cuál servicio?</label>
                  <input name="cual_servicio_medico" value={form.cual_servicio_medico} onChange={handleChange}
                    className={inputClass} placeholder="Ej: IMSS, ISSSTE, Seguro Popular…" />
                </div>
                <div>
                  <label className={labelClass}>Afiliación</label>
                  <input name="afiliacion" value={form.afiliacion} onChange={handleChange}
                    className={inputClass} placeholder="Número de afiliación" />
                </div>
              </div>
            )}

            {/* SECCIÓN 4 — Médicos tratantes */}
            <div className={sectionCard}>
              <p className={sectionTitle}>4. Médicos tratantes</p>
            </div>

            <div>
              <label className={labelClass}>Médicos tratantes con teléfonos</label>
              <textarea name="medicos_tratantes" value={form.medicos_tratantes} onChange={handleChange}
                className={inputClass} rows={3}
                placeholder="Dr. Nombre — Especialidad — Tel: 477 123 4567&#10;Dr. Nombre — Especialidad — Tel: 477 123 4567" />
            </div>

            {/* SECCIÓN 5 — Datos clínicos */}
            <div className={sectionCard}>
              <p className={sectionTitle}>5. Datos clínicos</p>
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div>
                <label className={labelClass}>Tipo de sangre</label>
                <select name="tipo_sangre" value={form.tipo_sangre} onChange={handleChange} className={inputClass}>
                  <option value="">No especificado</option>
                  {['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'].map(t => (
                    <option key={t} value={t}>{t}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className={labelClass}>Peso (kg)</label>
                <input type="number" step="0.1" name="peso" value={form.peso} onChange={handleChange}
                  className={inputClass} placeholder="Ej: 70.5" />
              </div>
              <div>
                <label className={labelClass}>Altura (cm)</label>
                <input type="number" step="0.1" name="altura" value={form.altura} onChange={handleChange}
                  className={inputClass} placeholder="Ej: 170" />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className={labelClass}>Primera visita</label>
                <input type="date" name="primera_visita" value={form.primera_visita}
                  onChange={handleChange} className={inputClass} />
              </div>
              <div>
                <label className={labelClass}>Doctor encargado</label>
                <input name="doctor_encargado" value={form.doctor_encargado} onChange={handleChange}
                  className={inputClass} placeholder="Nombre del doctor" />
              </div>
            </div>

            {/* SECCIÓN 6 — Motivo de atención */}
            <div className={sectionCard}>
              <p className={sectionTitle}>6. Motivo de atención</p>
            </div>

            <div>
              <label className={labelClass}>Motivo de atención domiciliaria</label>
              <textarea name="motivo_atencion_domiciliaria" value={form.motivo_atencion_domiciliaria} onChange={handleChange}
                className={inputClass} placeholder="¿Por qué requiere atención en domicilio?" rows={2} />
            </div>

            <div>
              <label className={labelClass}>Motivo de consulta</label>
              <textarea name="motivo_consulta" value={form.motivo_consulta} onChange={handleChange}
                className={inputClass} placeholder="¿Por qué acude el paciente?" rows={2} />
            </div>

            <div>
              <label className={labelClass}>Padecimiento actual</label>
              <textarea name="padecimiento_actual" value={form.padecimiento_actual} onChange={handleChange}
                className={inputClass} placeholder="Qué siente, desde cuándo, evolución…" rows={3} />
            </div>

            <div>
              <label className={labelClass}>Diagnóstico</label>
              <textarea name="diagnostico" value={form.diagnostico} onChange={handleChange}
                className={inputClass} placeholder="Diagnóstico principal" rows={2} />
            </div>

            {/* SECCIÓN 7 — Alergias */}
            <div className={sectionCard}>
              <p className={sectionTitle}>7. Alergias</p>
            </div>

            <div className="bg-red-50 border border-red-200 rounded-xl p-4">
              <label className="block text-sm font-medium text-red-700 mb-1">Alergias conocidas</label>
              <textarea name="alergias" value={form.alergias} onChange={handleChange}
                className="w-full border border-red-200 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-red-400 text-sm bg-white"
                placeholder="Medicamentos, alimentos, materiales u otras alergias conocidas" rows={2} />
            </div>

            {/* SECCIÓN 8 — Antecedentes heredofamiliares */}
            <div className={sectionCard}>
              <p className={sectionTitle}>8. Antecedentes heredofamiliares</p>
            </div>

            <div>
              <p className="text-sm text-gray-600 mb-3">Marque las condiciones presentes en familiares directos:</p>
              <div className="grid grid-cols-2 gap-2 mb-3">
                {HERDO_OPCIONES.map(op => (
                  <label key={op} className="flex items-center gap-2 cursor-pointer">
                    <input type="checkbox" checked={heredoChecked.includes(op)}
                      onChange={() => toggleHerdo(op)}
                      className="w-4 h-4 text-blue-600 rounded" />
                    <span className="text-sm text-gray-700">{op}</span>
                  </label>
                ))}
              </div>
              <label className={labelClass}>Otros antecedentes heredofamiliares</label>
              <textarea value={heredoOtros} onChange={e => setHeredoOtros(e.target.value)}
                className={inputClass} rows={2}
                placeholder="Describa otros antecedentes en familiares directos…" />
            </div>

            {/* SECCIÓN 9 — Antecedentes personales patológicos */}
            <div className={sectionCard}>
              <p className={sectionTitle}>9. Antecedentes personales patológicos</p>
            </div>

            <div>
              <label className={labelClass}>Enfermedades crónicas</label>
              <textarea name="enfermedades_cronicas" value={form.enfermedades_cronicas} onChange={handleChange}
                className={inputClass} rows={2} placeholder="Enfermedades crónicas del paciente…" />
            </div>

            <div>
              <label className={labelClass}>Última hospitalización</label>
              <textarea name="ultima_hospitalizacion" value={form.ultima_hospitalizacion} onChange={handleChange}
                className={inputClass} rows={2} placeholder="Motivo, hospital, año…" />
            </div>

            <div>
              <label className={labelClass}>Cirugías</label>
              <textarea name="cirugias" value={form.cirugias} onChange={handleChange}
                className={inputClass} rows={2} placeholder="Cirugías previas, año, institución…" />
            </div>

            <div>
              <label className={labelClass}>Traumatismos</label>
              <textarea name="traumatismos" value={form.traumatismos} onChange={handleChange}
                className={inputClass} rows={2} placeholder="Fracturas, lesiones, accidentes…" />
            </div>

            <div>
              <label className={labelClass}>Medicamentos actuales con frecuencia</label>
              <textarea name="antecedentes_medicos" value={form.antecedentes_medicos} onChange={handleChange}
                className={inputClass} rows={2} placeholder="Medicamento — dosis — frecuencia…" />
            </div>

            <div>
              <label className={labelClass}>Otros antecedentes patológicos</label>
              <textarea name="antecedentes_patologicos" value={form.antecedentes_patologicos} onChange={handleChange}
                className={inputClass} rows={2} placeholder="Otros antecedentes relevantes…" />
            </div>

            {/* SECCIÓN 10 — Antecedentes no patológicos */}
            <div className={sectionCard}>
              <p className={sectionTitle}>10. Antecedentes personales no patológicos</p>
            </div>

            <div>
              <textarea name="antecedentes_no_patologicos" value={form.antecedentes_no_patologicos} onChange={handleChange}
                className={inputClass} rows={3}
                placeholder="Hábitos: tabaco, alcohol, actividad física, alimentación, ocupación…" />
            </div>

            {/* SECCIÓN 11 — Inmunizaciones */}
            <div className={sectionCard}>
              <p className={sectionTitle}>11. Inmunizaciones</p>
            </div>

            <div>
              <label className={labelClass}>Vacunas aplicadas</label>
              <textarea name="inmunizaciones" value={form.inmunizaciones} onChange={handleChange}
                className={inputClass} rows={3}
                placeholder="Vacuna | Fecha de aplicación | Próxima aplicación&#10;Influenza | Ene 2024 | Ene 2025&#10;Covid-19 | Mar 2023 | —" />
            </div>

            {/* SECCIÓN 12 — Dispositivos de drenaje */}
            <div className={sectionCard}>
              <p className={sectionTitle}>12. Dispositivos de drenaje</p>
            </div>

            <div>
              <label className={labelClass}>Dispositivos actuales</label>
              <textarea name="dispositivos_drenaje" value={form.dispositivos_drenaje} onChange={handleChange}
                className={inputClass} rows={3}
                placeholder="Dispositivo | Calibre | Fecha de instalación | Periodo de cambio&#10;Sonda Foley | 16 Fr | 01/01/2024 | Mensual" />
            </div>

            {/* SECCIÓN 13 — Valoración geriátrica */}
            <div className={sectionCard}>
              <p className={sectionTitle}>13. Valoración geriátrica</p>
            </div>

            <div>
              <label className={labelClass}>Estado cognitivo (orientación, memoria, lenguaje)</label>
              <textarea name="estado_cognitivo" value={form.estado_cognitivo} onChange={handleChange}
                className={inputClass} rows={3} placeholder="Descripción del estado cognitivo del paciente…" />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className={labelClass}>Resultado Mini Mental Test</label>
                <input name="mini_mental_resultado" value={form.mini_mental_resultado} onChange={handleChange}
                  className={inputClass} placeholder="Ej: 24/30 — Deterioro leve" />
              </div>
              <div>
                <label className={labelClass}>Fecha de aplicación</label>
                <input type="date" name="mini_mental_fecha" value={form.mini_mental_fecha}
                  onChange={handleChange} className={inputClass} />
              </div>
            </div>

            {/* SECCIÓN 14 — ABVD */}
            <div className={sectionCard}>
              <p className={sectionTitle}>14. ABVD — Actividades Básicas de la Vida Diaria</p>
            </div>

            <div className="grid grid-cols-1 gap-3">
              {[
                { name: 'abvd_bano', label: 'Baño' },
                { name: 'abvd_vestido', label: 'Vestido' },
                { name: 'abvd_alimentacion', label: 'Alimentación' },
                { name: 'abvd_continencia', label: 'Continencia' },
                { name: 'abvd_movilidad', label: 'Movilidad' },
              ].map(({ name, label }) => (
                <div key={name} className="flex items-center gap-4">
                  <label className="w-32 text-sm font-medium text-gray-700 shrink-0">{label}</label>
                  <select name={name} value={(form as unknown as Record<string, string>)[name]} onChange={handleChange}
                    className="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
                    <option value="">— Sin valorar —</option>
                    {ABVD_OPCIONES.map(op => (
                      <option key={op} value={op}>{op}</option>
                    ))}
                  </select>
                </div>
              ))}
            </div>

            {/* SECCIÓN 15 — Escala de Downton */}
            <div className={sectionCard}>
              <p className={sectionTitle}>15. Escala de Downton — Riesgo de caídas</p>
            </div>

            <div className="space-y-4">
              {Object.entries(DOWNTON_CONFIG).map(([campo, config]) => (
                <div key={campo} className="border border-gray-200 rounded-xl p-4">
                  <p className="text-sm font-semibold text-gray-700 mb-2">{config.label}</p>
                  <div className="space-y-1">
                    {config.opciones.map((op, i) => (
                      <label key={i} className="flex items-center gap-2 cursor-pointer hover:bg-gray-50 rounded px-1 py-0.5">
                        <input
                          type="radio"
                          name={`downton_${campo}`}
                          checked={downtonSel[campo] === op.label}
                          onChange={() => handleDownton(campo, op.label, op.score)}
                          className="text-blue-600"
                        />
                        <span className="text-sm text-gray-700">{op.label}</span>
                        <span className="text-xs text-gray-400 ml-auto">({op.score})</span>
                      </label>
                    ))}
                  </div>
                </div>
              ))}

              {Object.keys(downtonScores).length > 0 && (
                <div className="flex items-center gap-3 pt-1">
                  <span className="text-sm text-gray-600">
                    {Object.keys(downtonScores).length === 6 ? 'Total:' : `Parcial (${Object.keys(downtonScores).length}/6):`}
                    <span className="font-bold ml-1">{downtonTotal}</span>
                  </span>
                  <span className={`text-xs font-semibold px-3 py-1 rounded-full border ${downtonRiesgo(downtonTotal).cls}`}>
                    {downtonRiesgo(downtonTotal).texto}
                  </span>
                </div>
              )}
            </div>

            {/* SECCIÓN 16 — Escala de Braden */}
            <div className={sectionCard}>
              <p className={sectionTitle}>16. Escala de Braden — Riesgo de Úlcera por Presión</p>
            </div>

            <div>
              <label className={labelClass}>Fecha de valoración Braden</label>
              <input type="date" name="braden_fecha" value={form.braden_fecha}
                onChange={handleChange} className={inputClass} />
            </div>

            <div className="space-y-3">
              {Object.entries(BRADEN_HC_CONFIG).map(([campo, config]) => (
                <div key={campo} className="border border-gray-200 rounded-xl p-4">
                  <p className="text-sm font-semibold text-gray-700 mb-2">{config.label}</p>
                  <div className="space-y-1">
                    {config.opciones.map(op => (
                      <label key={op.score} className="flex items-center gap-2 cursor-pointer hover:bg-gray-50 rounded px-1 py-0.5">
                        <input
                          type="radio"
                          name={`braden_hc_${campo}`}
                          checked={bradenHC[campo] === op.score}
                          onChange={() => handleBradenHC(campo, op.score)}
                          className="text-blue-600"
                        />
                        <span className="text-sm text-gray-700">{op.label}</span>
                        <span className="text-xs text-gray-400 ml-auto">({op.score})</span>
                      </label>
                    ))}
                  </div>
                </div>
              ))}

              {Object.keys(bradenHC).length > 0 && (
                <div className="flex items-center gap-3 pt-1">
                  <span className="text-sm text-gray-600">
                    {bradenHCTotal != null ? 'Total:' : `Parcial (${Object.keys(bradenHC).length}/6):`}
                    <span className="font-bold ml-1">{bradenHCTotal ?? Object.values(bradenHC).reduce((a, b) => a + b, 0)}</span>
                  </span>
                  {bradenHCTotal != null && (
                    <span className={`text-xs font-semibold px-3 py-1 rounded-full border ${bradenHCRiesgo(bradenHCTotal).cls}`}>
                      {bradenHCRiesgo(bradenHCTotal).texto}
                    </span>
                  )}
                </div>
              )}
            </div>

            {/* SECCIÓN 17 — Valoración física basal */}
            <div className={sectionCard}>
              <p className={sectionTitle}>17. Valoración física basal</p>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className={labelClass}>Fecha de evaluación</label>
                <input type="date" name="vf_fecha_evaluacion" value={form.vf_fecha_evaluacion}
                  onChange={handleChange} className={inputClass} />
              </div>
              <div>
                <label className={labelClass}>Nombre y cédula del profesional</label>
                <input name="vf_profesional" value={form.vf_profesional} onChange={handleChange}
                  className={inputClass} placeholder="Dr./Lic. Nombre — Cédula" />
              </div>
            </div>

            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Signos vitales basales</p>
            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className={labelClass}>TA (mmHg)</label>
                <input name="vf_ta" value={form.vf_ta} onChange={handleChange}
                  className={inputClass} placeholder="120/80" />
              </div>
              <div>
                <label className={labelClass}>FC (lpm)</label>
                <input type="number" name="vf_fc" value={form.vf_fc} onChange={handleChange}
                  className={inputClass} placeholder="80" />
              </div>
              <div>
                <label className={labelClass}>FR (rpm)</label>
                <input type="number" name="vf_fr" value={form.vf_fr} onChange={handleChange}
                  className={inputClass} placeholder="18" />
              </div>
              <div>
                <label className={labelClass}>Temperatura (°C)</label>
                <input type="number" step="0.1" name="vf_temp" value={form.vf_temp} onChange={handleChange}
                  className={inputClass} placeholder="36.6" />
              </div>
              <div>
                <label className={labelClass}>SpO₂ (%)</label>
                <input type="number" name="vf_spo2" value={form.vf_spo2} onChange={handleChange}
                  className={inputClass} placeholder="98" />
              </div>
              <div>
                <label className={labelClass}>Glucosa (mg/dL)</label>
                <input type="number" name="vf_glucosa" value={form.vf_glucosa} onChange={handleChange}
                  className={inputClass} placeholder="100" />
              </div>
            </div>

            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Evaluación por sistemas</p>
            {[
              { name: 'vf_cabeza_cuello', label: 'Cabeza y cuello' },
              { name: 'vf_cardiopulmonar', label: 'Cardiopulmonar' },
              { name: 'vf_abdomen', label: 'Abdomen' },
              { name: 'vf_extremidades', label: 'Extremidades' },
              { name: 'vf_neurologico', label: 'Neurológico' },
              { name: 'vf_piel', label: 'Piel' },
            ].map(({ name, label }) => (
              <div key={name}>
                <label className={labelClass}>{label}</label>
                <textarea name={name} value={(form as unknown as Record<string, string>)[name]} onChange={handleChange}
                  className={inputClass} rows={2} placeholder={`Hallazgos en ${label.toLowerCase()}…`} />
              </div>
            ))}

            {error && (
              <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-lg text-sm">
                {error}
              </div>
            )}

            <div className="flex gap-3 pt-2">
              <button type="button" onClick={() => router.push('/dashboard')}
                className="flex-1 border border-gray-300 text-gray-700 py-3 rounded-lg font-medium hover:bg-gray-50 transition">
                Cancelar
              </button>
              <button type="submit" disabled={loading}
                className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-3 rounded-lg font-medium transition disabled:opacity-50">
                {loading ? 'Guardando…' : 'Crear expediente'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}

export default function NuevoPacientePage() {
  return (
    <Suspense>
      <NuevoPacienteForm />
    </Suspense>
  )
}
