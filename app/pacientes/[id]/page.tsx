'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { use } from 'react'

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

function Campo({ label, valor }: { label: string; valor?: string | number | null }) {
  return (
    <div>
      <p className="text-xs text-gray-400 uppercase tracking-wide">{label}</p>
      <p className="font-medium text-gray-800 mt-1">{valor || '—'}</p>
    </div>
  )
}

function SeccionTitulo({ children }: { children: React.ReactNode }) {
  return <p className="text-xs font-semibold text-blue-700 uppercase tracking-wide mb-3 mt-1">{children}</p>
}

const inputCls = 'w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500'
const textareaCls = `${inputCls} resize-none`

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

  const [nuevaBitacora, setNuevaBitacora] = useState({ observaciones: '', estado_paciente: '' })
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
      const res = await fetch(`/api/pacientes/${id}/bitacora`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(nuevaBitacora)
      })
      if (res.ok) {
        setNuevaBitacora({ observaciones: '', estado_paciente: '' })
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
        setNuevoMed({ nombre: '', dosis: '', horario: '', fecha_inicio: '', fecha_fin: '', indeterminado: false })
        setMensaje('✅ Medicamento agregado')
        cargarMedicamentos()
        setTimeout(() => setMensaje(''), 3000)
      }
    } finally { setGuardando(false) }
  }

  function iniciarEdicion() {
    if (!paciente) return
    setDatosEdit({ ...paciente })
    setErrorEdicion('')
    setModoEdicion(true)
  }

  async function guardarEdicion(e: React.FormEvent) {
    e.preventDefault()
    setGuardandoEdicion(true)
    setErrorEdicion('')
    try {
      const res = await fetch(`/api/pacientes/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(datosEdit),
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

  if (loading) return <div className="min-h-screen flex items-center justify-center text-gray-400">Cargando expediente...</div>
  if (!paciente) return <div className="min-h-screen flex items-center justify-center text-gray-400">Paciente no encontrado</div>

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white shadow-sm border-b">
        <div className="max-w-6xl mx-auto px-4 py-4 flex justify-between items-center">
          <h1 className="text-xl font-bold text-blue-700">Expedientes Clínicos</h1>
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
            { key: 'datos', label: 'Datos generales' },
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

        {/* DATOS GENERALES */}
        {seccion === 'datos' && (
          <div className="space-y-4">

            {/* Modo edición */}
            {modoEdicion ? (
              <form onSubmit={guardarEdicion} className="space-y-4">

                {/* Identificación */}
                <div className="bg-white rounded-2xl shadow-sm border p-6">
                  <SeccionTitulo>Identificación</SeccionTitulo>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs text-gray-500 mb-1">Nombre *</label>
                      <input className={inputCls} required value={datosEdit.nombre ?? ''} onChange={e => setDatosEdit({ ...datosEdit, nombre: e.target.value })} />
                    </div>
                    <div>
                      <label className="block text-xs text-gray-500 mb-1">Edad *</label>
                      <input type="number" min={0} className={inputCls} required value={datosEdit.edad ?? ''} onChange={e => setDatosEdit({ ...datosEdit, edad: Number(e.target.value) })} />
                    </div>
                    <div>
                      <label className="block text-xs text-gray-500 mb-1">Sexo</label>
                      <select className={inputCls} value={datosEdit.sexo ?? ''} onChange={e => setDatosEdit({ ...datosEdit, sexo: e.target.value })}>
                        <option value="">— Sin especificar —</option>
                        <option value="Masculino">Masculino</option>
                        <option value="Femenino">Femenino</option>
                        <option value="Otro">Otro</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs text-gray-500 mb-1">Fecha de nacimiento</label>
                      <input type="date" className={inputCls} value={datosEdit.fecha_nacimiento ? datosEdit.fecha_nacimiento.toString().slice(0, 10) : ''} onChange={e => setDatosEdit({ ...datosEdit, fecha_nacimiento: e.target.value })} />
                    </div>
                    <div>
                      <label className="block text-xs text-gray-500 mb-1">Teléfono</label>
                      <input className={inputCls} value={datosEdit.telefono ?? ''} onChange={e => setDatosEdit({ ...datosEdit, telefono: e.target.value })} />
                    </div>
                    <div>
                      <label className="block text-xs text-gray-500 mb-1">Contacto de emergencia</label>
                      <input className={inputCls} value={datosEdit.contacto ?? ''} onChange={e => setDatosEdit({ ...datosEdit, contacto: e.target.value })} />
                    </div>
                    <div className="col-span-2">
                      <label className="block text-xs text-gray-500 mb-1">Dirección</label>
                      <input className={inputCls} value={datosEdit.direccion ?? ''} onChange={e => setDatosEdit({ ...datosEdit, direccion: e.target.value })} />
                    </div>
                  </div>
                </div>

                {/* Datos clínicos */}
                <div className="bg-white rounded-2xl shadow-sm border p-6">
                  <SeccionTitulo>Datos clínicos</SeccionTitulo>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs text-gray-500 mb-1">Tipo de sangre</label>
                      <select className={inputCls} value={datosEdit.tipo_sangre ?? ''} onChange={e => setDatosEdit({ ...datosEdit, tipo_sangre: e.target.value })}>
                        <option value="">— Sin especificar —</option>
                        {['A+','A-','B+','B-','AB+','AB-','O+','O-'].map(t => <option key={t} value={t}>{t}</option>)}
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs text-gray-500 mb-1">Primera visita</label>
                      <input type="date" className={inputCls} value={datosEdit.primera_visita ? datosEdit.primera_visita.toString().slice(0, 10) : ''} onChange={e => setDatosEdit({ ...datosEdit, primera_visita: e.target.value })} />
                    </div>
                    <div>
                      <label className="block text-xs text-gray-500 mb-1">Peso (kg)</label>
                      <input className={inputCls} placeholder="Ej: 70.5" value={datosEdit.peso ?? ''} onChange={e => setDatosEdit({ ...datosEdit, peso: e.target.value })} />
                    </div>
                    <div>
                      <label className="block text-xs text-gray-500 mb-1">Altura (cm)</label>
                      <input className={inputCls} placeholder="Ej: 165" value={datosEdit.altura ?? ''} onChange={e => setDatosEdit({ ...datosEdit, altura: e.target.value })} />
                    </div>
                    <div className="col-span-2">
                      <label className="block text-xs text-gray-500 mb-1">Doctor encargado</label>
                      <input className={inputCls} value={datosEdit.doctor_encargado ?? ''} onChange={e => setDatosEdit({ ...datosEdit, doctor_encargado: e.target.value })} />
                    </div>
                  </div>
                </div>

                {/* Motivo de consulta */}
                <div className="bg-white rounded-2xl shadow-sm border p-6">
                  <SeccionTitulo>Motivo de consulta</SeccionTitulo>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-xs text-gray-500 mb-1">Motivo de consulta</label>
                      <textarea rows={2} className={textareaCls} value={datosEdit.motivo_consulta ?? ''} onChange={e => setDatosEdit({ ...datosEdit, motivo_consulta: e.target.value })} />
                    </div>
                    <div>
                      <label className="block text-xs text-gray-500 mb-1">Padecimiento actual</label>
                      <textarea rows={2} className={textareaCls} value={datosEdit.padecimiento_actual ?? ''} onChange={e => setDatosEdit({ ...datosEdit, padecimiento_actual: e.target.value })} />
                    </div>
                    <div>
                      <label className="block text-xs text-gray-500 mb-1">Diagnóstico</label>
                      <textarea rows={2} className={textareaCls} value={datosEdit.diagnostico ?? ''} onChange={e => setDatosEdit({ ...datosEdit, diagnostico: e.target.value })} />
                    </div>
                  </div>
                </div>

                {/* Alergias */}
                <div className="bg-red-50 border border-red-200 rounded-2xl p-6">
                  <SeccionTitulo>🚨 Alergias</SeccionTitulo>
                  <textarea rows={2} className={textareaCls} placeholder="Dejar vacío si no hay alergias" value={datosEdit.alergias ?? ''} onChange={e => setDatosEdit({ ...datosEdit, alergias: e.target.value })} />
                </div>

                {/* Antecedentes */}
                <div className="bg-white rounded-2xl shadow-sm border p-6">
                  <SeccionTitulo>Antecedentes</SeccionTitulo>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-xs text-gray-500 mb-1">Antecedentes médicos generales</label>
                      <textarea rows={2} className={textareaCls} value={datosEdit.antecedentes_medicos ?? ''} onChange={e => setDatosEdit({ ...datosEdit, antecedentes_medicos: e.target.value })} />
                    </div>
                    <div>
                      <label className="block text-xs text-gray-500 mb-1">Antecedentes heredofamiliares</label>
                      <textarea rows={2} className={textareaCls} value={datosEdit.antecedentes_heredofamiliares ?? ''} onChange={e => setDatosEdit({ ...datosEdit, antecedentes_heredofamiliares: e.target.value })} />
                    </div>
                    <div>
                      <label className="block text-xs text-gray-500 mb-1">Antecedentes personales patológicos</label>
                      <textarea rows={2} className={textareaCls} value={datosEdit.antecedentes_patologicos ?? ''} onChange={e => setDatosEdit({ ...datosEdit, antecedentes_patologicos: e.target.value })} />
                    </div>
                    <div>
                      <label className="block text-xs text-gray-500 mb-1">Antecedentes personales no patológicos</label>
                      <textarea rows={2} className={textareaCls} value={datosEdit.antecedentes_no_patologicos ?? ''} onChange={e => setDatosEdit({ ...datosEdit, antecedentes_no_patologicos: e.target.value })} />
                    </div>
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

            {/* Identificación */}
            <div className="bg-white rounded-2xl shadow-sm border p-6">
              <div className="flex justify-between items-center mb-3">
                <SeccionTitulo>Identificación</SeccionTitulo>
                <button type="button" onClick={iniciarEdicion}
                  className="text-xs text-blue-600 hover:text-blue-800 border border-blue-200 px-3 py-1 rounded-lg transition hover:bg-blue-50">
                  Editar datos
                </button>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <Campo label="Nombre" valor={paciente.nombre} />
                <Campo label="Edad" valor={paciente.edad ? `${paciente.edad} años` : null} />
                <Campo label="Sexo" valor={paciente.sexo} />
                <Campo label="Fecha de nacimiento" valor={paciente.fecha_nacimiento ? new Date(paciente.fecha_nacimiento).toLocaleDateString('es-MX') : null} />
                <Campo label="Teléfono" valor={paciente.telefono} />
                <Campo label="Contacto de emergencia" valor={paciente.contacto} />
                <div className="col-span-2">
                  <Campo label="Dirección" valor={paciente.direccion} />
                </div>
                {paciente.usuario_email && <Campo label="Usuario (email)" valor={paciente.usuario_email} />}
              </div>
            </div>

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

            {/* Motivo de consulta */}
            <div className="bg-white rounded-2xl shadow-sm border p-6">
              <SeccionTitulo>Motivo de consulta</SeccionTitulo>
              <div className="space-y-4">
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

            {/* Antecedentes */}
            <div className="bg-white rounded-2xl shadow-sm border p-6">
              <SeccionTitulo>Antecedentes</SeccionTitulo>
              <div className="space-y-4">
                <Campo label="Antecedentes médicos generales" valor={paciente.antecedentes_medicos} />
                <Campo label="Antecedentes heredofamiliares" valor={paciente.antecedentes_heredofamiliares} />
                <Campo label="Antecedentes personales patológicos" valor={paciente.antecedentes_patologicos} />
                <Campo label="Antecedentes personales no patológicos" valor={paciente.antecedentes_no_patologicos} />
              </div>
            </div>

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

            {/* Archivar */}
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
          </div>
        )}

        {/* BITÁCORA */}
        {seccion === 'bitacora' && (
          <div className="space-y-4">
            <div className="bg-white rounded-2xl shadow-sm border p-6">
              <h3 className="font-semibold text-gray-800 mb-4">Nueva entrada</h3>
              <form onSubmit={agregarBitacora} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Estado del paciente</label>
                  <input value={nuevaBitacora.estado_paciente}
                    onChange={e => setNuevaBitacora({ ...nuevaBitacora, estado_paciente: e.target.value })}
                    className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Ej: Estable, Mejorando, etc." required />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Observaciones</label>
                  <textarea value={nuevaBitacora.observaciones}
                    onChange={e => setNuevaBitacora({ ...nuevaBitacora, observaciones: e.target.value })}
                    className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Observaciones del día..." rows={4} required />
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
              ) : bitacoras.map(b => (
                <div key={b.id} className="bg-white rounded-2xl shadow-sm border p-6">
                  <div className="flex justify-between items-start mb-2">
                    <span className="bg-blue-50 text-blue-700 text-xs font-medium px-3 py-1 rounded-full">{b.estado_paciente}</span>
                    <span className="text-xs text-gray-400">{new Date(b.created_at).toLocaleString('es-MX')}</span>
                  </div>
                  <p className="text-gray-700 mt-3">{b.observaciones}</p>
                  <p className="text-xs text-gray-400 mt-3">Registrado por: {b.enfermero_nombre}</p>
                </div>
              ))}
            </div>

            {totalBitacoras > LIMIT_BITACORA && (
              <div className="flex items-center justify-between mt-2 gap-4">
                <button
                  type="button"
                  disabled={pageBitacora === 1}
                  onClick={() => setPageBitacora(p => p - 1)}
                  className="px-4 py-2 text-sm font-medium border border-gray-300 rounded-xl bg-white hover:bg-gray-50 transition disabled:opacity-40 disabled:cursor-not-allowed"
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
                  className="px-4 py-2 text-sm font-medium border border-gray-300 rounded-xl bg-white hover:bg-gray-50 transition disabled:opacity-40 disabled:cursor-not-allowed"
                >
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
                      <p className="text-xs text-gray-400 mt-1">
                        Subido por: {a.subido_por_nombre} — {new Date(a.created_at).toLocaleDateString('es-MX')}
                      </p>
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