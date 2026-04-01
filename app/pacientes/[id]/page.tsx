'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { use } from 'react'

interface Paciente {
  id: string
  nombre: string
  edad: number
  diagnostico: string
  contacto: string
  doctor_encargado: string
  usuario_id: string | null
  usuario_email?: string | null
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

export default function ExpedientePage({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter()
  const { id } = use(params)

  const [paciente, setPaciente] = useState<Paciente | null>(null)
  const [bitacoras, setBitacoras] = useState<Bitacora[]>([])
  const [medicamentos, setMedicamentos] = useState<Medicamento[]>([])
  const [seccion, setSeccion] = useState('datos')
  const [loading, setLoading] = useState(true)

  const [nuevaBitacora, setNuevaBitacora] = useState({ observaciones: '', estado_paciente: '' })
  const [nuevoMed, setNuevoMed] = useState({
    nombre: '',
    dosis: '',
    horario: '',
    fecha_inicio: '',
    fecha_fin: '',
    indeterminado: false
  })
  const [guardando, setGuardando] = useState(false)
  const [mensaje, setMensaje] = useState('')
  const [mostrarCambioPassword, setMostrarCambioPassword] = useState(false)
  const [nuevaPassword, setNuevaPassword] = useState('')
  const [confirmarPassword, setConfirmarPassword] = useState('')
  const [errorPassword, setErrorPassword] = useState('')
  const [guardandoPassword, setGuardandoPassword] = useState(false)

  useEffect(() => {
    cargarExpediente()
  }, [id])

  async function cargarExpediente() {
    try {
      const [pacRes, bitRes, medRes] = await Promise.all([
        fetch(`/api/pacientes/${id}`),
        fetch(`/api/pacientes/${id}/bitacora`),
        fetch(`/api/pacientes/${id}/medicamentos`)
      ])
      const pacData = await pacRes.json()
      const bitData = await bitRes.json()
      const medData = await medRes.json()

      if (pacRes.ok) setPaciente(pacData.paciente)
      if (bitRes.ok) setBitacoras(bitData.bitacoras)
      if (medRes.ok) setMedicamentos(medData.medicamentos)
    } catch (error) {
      console.error('Error:', error)
    } finally {
      setLoading(false)
    }
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
        cargarExpediente()
        setTimeout(() => setMensaje(''), 3000)
      }
    } finally {
      setGuardando(false)
    }
  }

  async function cambiarPasswordPaciente(e: React.FormEvent) {
    e.preventDefault()
    if (!paciente?.usuario_id) return
    setErrorPassword('')
    if (nuevaPassword.length < 6) {
      setErrorPassword('Mínimo 6 caracteres')
      return
    }
    if (nuevaPassword !== confirmarPassword) {
      setErrorPassword('Las contraseñas no coinciden')
      return
    }
    setGuardandoPassword(true)
    try {
      const res = await fetch(`/api/usuarios/${paciente.usuario_id}/cambiar-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password: nuevaPassword }),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) {
        setErrorPassword(data.error || 'No se pudo actualizar')
        return
      }
      setNuevaPassword('')
      setConfirmarPassword('')
      setMostrarCambioPassword(false)
      setMensaje('✅ Contraseña actualizada')
      setTimeout(() => setMensaje(''), 4000)
    } catch (error) {
      setErrorPassword('Error de conexión, intenta de nuevo')
    } finally {
      setGuardandoPassword(false)
    }
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
        cargarExpediente()
        setTimeout(() => setMensaje(''), 3000)
      }
    } finally {
      setGuardando(false)
    }
  }

  if (loading) return <div className="min-h-screen flex items-center justify-center text-gray-400">Cargando expediente...</div>
  if (!paciente) return <div className="min-h-screen flex items-center justify-center text-gray-400">Paciente no encontrado</div>

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white shadow-sm border-b">
        <div className="max-w-6xl mx-auto px-4 py-4 flex justify-between items-center">
          <h1 className="text-xl font-bold text-blue-700">Expedientes Clínicos</h1>
          <button onClick={() => router.push('/dashboard')} className="text-sm text-gray-500 hover:text-blue-500 transition">
            ← Volver
          </button>
        </div>
      </nav>

      <div className="max-w-4xl mx-auto px-4 py-8">
        <h2 className="text-2xl font-bold text-gray-800 mb-2">{paciente.nombre}</h2>
        <p className="text-gray-500 mb-6">{paciente.edad} años — {paciente.diagnostico}</p>

        <div className="flex gap-2 mb-6 border-b">
          {[
            { key: 'datos', label: 'Datos generales' },
            { key: 'bitacora', label: 'Bitácora' },
            { key: 'medicamentos', label: 'Medicamentos' },
            { key: 'archivos', label: 'Archivos' }
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

        {mensaje && (
          <div className="mb-4 bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg text-sm">
            {mensaje}
          </div>
        )}

        {/* Datos generales */}
        {seccion === 'datos' && (
          <div className="space-y-4">
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

            <div className="bg-white rounded-2xl shadow-sm border p-6">
              <h3 className="text-sm font-semibold text-gray-800 mb-3">Acceso del paciente</h3>
              {paciente.usuario_id && paciente.usuario_email ? (
                <>
                  <p className="text-xs text-gray-400 uppercase tracking-wide">Correo para iniciar sesión</p>
                  <p className="font-medium text-gray-900 mt-1 break-all">{paciente.usuario_email}</p>
                  {!mostrarCambioPassword ? (
                    <button
                      type="button"
                      onClick={() => {
                        setMostrarCambioPassword(true)
                        setNuevaPassword('')
                        setConfirmarPassword('')
                        setErrorPassword('')
                      }}
                      className="mt-4 text-sm bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium transition"
                    >
                      Cambiar contraseña
                    </button>
                  ) : (
                    <form onSubmit={cambiarPasswordPaciente} className="mt-4 space-y-3 max-w-md">
                      <div>
                        <label className="block text-xs font-medium text-gray-600 mb-1">Nueva contraseña</label>
                        <input
                          type="password"
                          autoComplete="new-password"
                          value={nuevaPassword}
                          onChange={e => setNuevaPassword(e.target.value)}
                          className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                          placeholder="Mínimo 6 caracteres"
                          required
                          minLength={6}
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-gray-600 mb-1">Confirmar contraseña</label>
                        <input
                          type="password"
                          autoComplete="new-password"
                          value={confirmarPassword}
                          onChange={e => setConfirmarPassword(e.target.value)}
                          className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                          placeholder="Repite la nueva contraseña"
                          required
                          minLength={6}
                        />
                      </div>
                      {errorPassword && (
                        <p className="text-sm text-red-600">{errorPassword}</p>
                      )}
                      <div className="flex gap-2 pt-1">
                        <button
                          type="submit"
                          disabled={guardandoPassword}
                          className="text-sm bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium transition disabled:opacity-50"
                        >
                          {guardandoPassword ? 'Guardando...' : 'Guardar contraseña'}
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setMostrarCambioPassword(false)
                            setNuevaPassword('')
                            setConfirmarPassword('')
                            setErrorPassword('')
                          }}
                          className="text-sm border border-gray-300 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-50 transition"
                        >
                          Cancelar
                        </button>
                      </div>
                    </form>
                  )}
                </>
              ) : (
                <p className="text-sm text-gray-500">
                  Este expediente no tiene una cuenta de usuario vinculada. Crea un usuario paciente y enlázalo al registrar el expediente.
                </p>
              )}
            </div>

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
                className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition"
              >
                Archivar
              </button>
            </div>
          </div>
        )}

        {/* Bitácora */}
        {seccion === 'bitacora' && (
          <div className="space-y-4">
            <div className="bg-white rounded-2xl shadow-sm border p-6">
              <h3 className="font-semibold text-gray-800 mb-4">Nueva entrada</h3>
              <form onSubmit={agregarBitacora} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Estado del paciente</label>
                  <input
                    value={nuevaBitacora.estado_paciente}
                    onChange={e => setNuevaBitacora({ ...nuevaBitacora, estado_paciente: e.target.value })}
                    className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Ej: Estable, Mejorando, etc."
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Observaciones</label>
                  <textarea
                    value={nuevaBitacora.observaciones}
                    onChange={e => setNuevaBitacora({ ...nuevaBitacora, observaciones: e.target.value })}
                    className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Observaciones del día..."
                    rows={4}
                    required
                  />
                </div>
                <button
                  type="submit"
                  disabled={guardando}
                  className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg font-medium transition disabled:opacity-50"
                >
                  {guardando ? 'Guardando...' : 'Registrar entrada'}
                </button>
              </form>
            </div>

            <div className="space-y-3">
              {bitacoras.length === 0 ? (
                <div className="bg-white rounded-2xl border p-6 text-center text-gray-400">No hay entradas en la bitácora</div>
              ) : (
                bitacoras.map(b => (
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
          </div>
        )}

        {/* Medicamentos */}
        {seccion === 'medicamentos' && (
          <div className="space-y-4">
            <div className="bg-white rounded-2xl shadow-sm border p-6">
              <h3 className="font-semibold text-gray-800 mb-4">Agregar medicamento</h3>
              <form onSubmit={guardarMedicamento} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Medicamento</label>
                  <input
                    value={nuevoMed.nombre}
                    onChange={e => setNuevoMed({ ...nuevoMed, nombre: e.target.value })}
                    className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Nombre del medicamento"
                    required
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Dosis</label>
                    <input
                      value={nuevoMed.dosis}
                      onChange={e => setNuevoMed({ ...nuevoMed, dosis: e.target.value })}
                      className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="Ej: 500mg"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Horario</label>
                    <input
                      value={nuevoMed.horario}
                      onChange={e => setNuevoMed({ ...nuevoMed, horario: e.target.value })}
                      className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="Ej: Cada 8 horas"
                      required
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Fecha inicio</label>
                    <input
                      type="date"
                      value={nuevoMed.fecha_inicio}
                      onChange={e => setNuevoMed({ ...nuevoMed, fecha_inicio: e.target.value })}
                      className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Fecha fin</label>
                    <input
                      type="date"
                      value={nuevoMed.fecha_fin}
                      onChange={e => setNuevoMed({ ...nuevoMed, fecha_fin: e.target.value })}
                      className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      disabled={nuevoMed.indeterminado}
                    />
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="indeterminado"
                    checked={nuevoMed.indeterminado}
                    onChange={e => setNuevoMed({ ...nuevoMed, indeterminado: e.target.checked, fecha_fin: '' })}
                    className="w-4 h-4 text-blue-600"
                  />
                  <label htmlFor="indeterminado" className="text-sm text-gray-700">Tratamiento por tiempo indeterminado</label>
                </div>
                <button
                  type="submit"
                  disabled={guardando}
                  className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg font-medium transition disabled:opacity-50"
                >
                  {guardando ? 'Guardando...' : 'Agregar medicamento'}
                </button>
              </form>
            </div>

            <div className="space-y-3">
              {medicamentos.length === 0 ? (
                <div className="bg-white rounded-2xl border p-6 text-center text-gray-400">No hay medicamentos registrados</div>
              ) : (
                medicamentos.map(m => (
                  <div key={m.id} className={`bg-white rounded-2xl shadow-sm border p-6 ${!m.activo ? 'opacity-50' : ''}`}>
                    <div className="flex justify-between items-start">
                      <div>
                        <div className="flex items-center gap-2">
                          <p className="font-semibold text-gray-800">{m.nombre}</p>
                          {!m.activo && (
                            <span className="bg-red-100 text-red-600 text-xs px-2 py-0.5 rounded-full">Suspendido</span>
                          )}
                        </div>
                        <p className="text-sm text-gray-500 mt-1">Dosis: {m.dosis}</p>
                        <p className="text-sm text-gray-500">Horario: {m.horario}</p>
                        <p className="text-sm text-gray-500">
                          Desde: {m.fecha_inicio ? new Date(m.fecha_inicio).toLocaleDateString('es-MX') : '—'}
                          {' '}— Hasta: {m.indeterminado ? 'Indeterminado' : m.fecha_fin ? new Date(m.fecha_fin).toLocaleDateString('es-MX') : '—'}
                        </p>
                      </div>
                      {m.activo && (
                        <button
                          onClick={async () => {
                            if (!confirm(`¿Suspender ${m.nombre}?`)) return
                            const res = await fetch(`/api/pacientes/${id}/suspender-medicamento`, {
                              method: 'POST',
                              headers: { 'Content-Type': 'application/json' },
                              body: JSON.stringify({ medicamento_id: m.id })
                            })
                            if (res.ok) {
                              setMensaje('Medicamento suspendido')
                              cargarExpediente()
                              setTimeout(() => setMensaje(''), 3000)
                            }
                          }}
                          className="text-xs text-red-500 hover:text-red-700 border border-red-200 px-3 py-1 rounded-lg transition"
                        >
                          Suspender
                        </button>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {/* Archivos */}
        {seccion === 'archivos' && (
          <div className="bg-white rounded-2xl shadow-sm border p-6 text-center text-gray-400">
            <p className="text-lg">Módulo de archivos próximamente</p>
            <p className="text-sm mt-1">Aquí se subirán estudios, recetas y PDFs</p>
          </div>
        )}
      </div>
    </div>
  )
}