'use client'
import { useEffect, useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { turnoClases, turnoNombre } from '@/lib/turno'

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

            {/* Identificación */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 sm:p-8">
              <SeccionTitulo>Identificación</SeccionTitulo>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <Campo label="Nombre" valor={paciente.nombre} />
                <Campo label="Edad" valor={paciente.edad ? `${paciente.edad} años` : null} />
                <Campo label="Sexo" valor={paciente.sexo} />
                <Campo label="Fecha de nacimiento" valor={paciente.fecha_nacimiento ? new Date(paciente.fecha_nacimiento).toLocaleDateString('es-MX') : null} />
                <Campo label="Teléfono" valor={paciente.telefono} />
                <Campo label="Contacto de emergencia" valor={paciente.contacto} />
                <div className="sm:col-span-2">
                  <Campo label="Dirección" valor={paciente.direccion} />
                </div>
              </div>
            </div>

            {/* Datos clínicos */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 sm:p-8">
              <SeccionTitulo>Datos clínicos</SeccionTitulo>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <Campo label="Tipo de sangre" valor={paciente.tipo_sangre} />
                <Campo label="Primera visita" valor={paciente.primera_visita ? new Date(paciente.primera_visita).toLocaleDateString('es-MX') : null} />
                <Campo label="Peso" valor={paciente.peso ? `${paciente.peso} kg` : null} />
                <Campo label="Altura" valor={paciente.altura ? `${paciente.altura} cm` : null} />
                <Campo label="Doctor encargado" valor={paciente.doctor_encargado} />
              </div>
            </div>

            {/* Motivo de consulta */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 sm:p-8">
              <SeccionTitulo>Motivo de consulta</SeccionTitulo>
              <div className="space-y-4">
                <Campo label="Motivo de consulta" valor={paciente.motivo_consulta} />
                <Campo label="Padecimiento actual" valor={paciente.padecimiento_actual} />
                <Campo label="Diagnóstico" valor={paciente.diagnostico} />
              </div>
            </div>

            {/* Alergias */}
            {paciente.alergias ? (
              <div className="bg-red-50 border border-red-200 rounded-2xl p-6 sm:p-8">
                <SeccionTitulo>🚨 Alergias</SeccionTitulo>
                <p className="font-medium text-red-800 text-base">{paciente.alergias}</p>
              </div>
            ) : (
              <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 sm:p-8">
                <SeccionTitulo>🚨 Alergias</SeccionTitulo>
                <p className="text-gray-400 text-base">Sin alergias registradas</p>
              </div>
            )}

            {/* Antecedentes */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 sm:p-8">
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
      </>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <nav className="bg-white shadow-sm border-b border-gray-200 shrink-0">
        <div className="max-w-6xl mx-auto px-4 py-4 flex flex-wrap justify-between items-center gap-3">
          <h1 className="text-xl sm:text-2xl font-bold text-blue-800">Mi expediente</h1>
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
