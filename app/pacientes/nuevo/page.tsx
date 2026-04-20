'use client'
import { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Suspense } from 'react'

function NuevoPacienteForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const usuario_id = searchParams.get('usuario_id') || ''
  const nombreInicial = searchParams.get('nombre') || ''

  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [form, setForm] = useState({
    // Identificación
    nombre: nombreInicial,
    fecha_nacimiento: '',
    edad: '',
    sexo: '',
    telefono: '',
    direccion: '',
    contacto: '',
    // Datos clínicos básicos
    tipo_sangre: '',
    peso: '',
    altura: '',
    primera_visita: new Date().toISOString().split('T')[0],
    doctor_encargado: '',
    // Motivo de consulta
    motivo_consulta: '',
    padecimiento_actual: '',
    diagnostico: '',
    // Antecedentes
    alergias: '',
    antecedentes_medicos: '',
    antecedentes_heredofamiliares: '',
    antecedentes_patologicos: '',
    antecedentes_no_patologicos: '',
    // Usuario
    usuario_id: usuario_id
  })

  useEffect(() => {
    setForm(f => ({ ...f, nombre: nombreInicial, usuario_id }))
  }, [nombreInicial, usuario_id])

  function handleChange(e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) {
    setForm({ ...form, [e.target.name]: e.target.value })
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      const res = await fetch('/api/pacientes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form)
      })

      const data = await res.json()

      if (!res.ok) {
        setError(data.error || 'Error al crear paciente')
        return
      }

      router.push('/dashboard')
    } catch (err) {
      setError('Error de conexión')
    } finally {
      setLoading(false)
    }
  }

  const inputClass = "w-full border border-gray-300 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
  const labelClass = "block text-sm font-medium text-gray-700 mb-1"
  const sectionClass = "border-t pt-5 mt-5"
  const sectionTitle = "text-sm font-semibold text-blue-700 uppercase tracking-wide mb-4"

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
        {usuario_id && (
          <p className="text-gray-500 mb-6">Completa los datos del paciente. Todos los campos son opcionales excepto el nombre y la edad.</p>
        )}

        <div className="bg-white rounded-2xl shadow-sm border p-6">
          <form onSubmit={handleSubmit} className="space-y-5">

            {/* SECCIÓN 1 — Identificación */}
            <p className={sectionTitle}>Identificación del paciente</p>

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
                <label className={labelClass}>Teléfono del paciente</label>
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

            {/* SECCIÓN 2 — Datos clínicos */}
            <div className={sectionClass}>
              <p className={sectionTitle}>Datos clínicos</p>
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div>
                <label className={labelClass}>Tipo de sangre</label>
                <select name="tipo_sangre" value={form.tipo_sangre} onChange={handleChange} className={inputClass}>
                  <option value="">No especificado</option>
                  <option value="A+">A+</option>
                  <option value="A-">A-</option>
                  <option value="B+">B+</option>
                  <option value="B-">B-</option>
                  <option value="AB+">AB+</option>
                  <option value="AB-">AB-</option>
                  <option value="O+">O+</option>
                  <option value="O-">O-</option>
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

            {/* SECCIÓN 3 — Motivo de consulta */}
            <div className={sectionClass}>
              <p className={sectionTitle}>Motivo de consulta</p>
            </div>

            <div>
              <label className={labelClass}>Motivo de consulta</label>
              <textarea name="motivo_consulta" value={form.motivo_consulta} onChange={handleChange}
                className={inputClass} placeholder="¿Por qué acude el paciente?" rows={2} />
            </div>

            <div>
              <label className={labelClass}>Padecimiento actual</label>
              <textarea name="padecimiento_actual" value={form.padecimiento_actual} onChange={handleChange}
                className={inputClass} placeholder="Qué siente, desde cuándo, evolución..." rows={3} />
            </div>

            <div>
              <label className={labelClass}>Diagnóstico</label>
              <textarea name="diagnostico" value={form.diagnostico} onChange={handleChange}
                className={inputClass} placeholder="Diagnóstico principal" rows={2} />
            </div>

            {/* SECCIÓN 4 — Alergias */}
            <div className={sectionClass}>
              <p className={sectionTitle}>🚨 Alergias</p>
            </div>

            <div>
              <label className={labelClass}>Alergias conocidas</label>
              <textarea name="alergias" value={form.alergias} onChange={handleChange}
                className={inputClass} placeholder="Medicamentos, alimentos, materiales u otras alergias conocidas" rows={2} />
            </div>

            {/* SECCIÓN 5 — Antecedentes */}
            <div className={sectionClass}>
              <p className={sectionTitle}>Antecedentes</p>
            </div>

            <div>
              <label className={labelClass}>Antecedentes médicos generales</label>
              <textarea name="antecedentes_medicos" value={form.antecedentes_medicos} onChange={handleChange}
                className={inputClass} placeholder="Enfermedades, cirugías, hospitalizaciones previas..." rows={2} />
            </div>

            <div>
              <label className={labelClass}>Antecedentes heredofamiliares</label>
              <textarea name="antecedentes_heredofamiliares" value={form.antecedentes_heredofamiliares} onChange={handleChange}
                className={inputClass} placeholder="Ej: diabetes, hipertensión, cáncer en familiares directos..." rows={2} />
            </div>

            <div>
              <label className={labelClass}>Antecedentes personales patológicos</label>
              <textarea name="antecedentes_patologicos" value={form.antecedentes_patologicos} onChange={handleChange}
                className={inputClass} placeholder="Enfermedades previas del paciente..." rows={2} />
            </div>

            <div>
              <label className={labelClass}>Antecedentes personales no patológicos</label>
              <textarea name="antecedentes_no_patologicos" value={form.antecedentes_no_patologicos} onChange={handleChange}
                className={inputClass} placeholder="Hábitos: tabaco, alcohol, actividad física, alimentación..." rows={2} />
            </div>

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
                {loading ? 'Guardando...' : 'Crear expediente'}
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