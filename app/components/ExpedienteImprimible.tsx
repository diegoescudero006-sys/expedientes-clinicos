import { turnoClases, turnoNombre } from '@/lib/turno'

const HERDO_OPCIONES = ['Diabetes', 'HAS', 'Cardiopatías', 'Cáncer', 'Enfermedad Neurodegenerativa']

const ABVD_CAMPOS = [
  { campo: 'abvd_bano', label: 'Baño / Higiene' },
  { campo: 'abvd_vestido', label: 'Vestido' },
  { campo: 'abvd_alimentacion', label: 'Alimentación' },
  { campo: 'abvd_continencia', label: 'Continencia' },
  { campo: 'abvd_movilidad', label: 'Movilidad / Transferencia' },
]

const DOWNTON_CONFIG: Record<string, { label: string; opciones: { label: string; score: number }[] }> = {
  caidas_previas: { label: 'Caídas previas', opciones: [{ label: 'No', score: 0 }, { label: 'Sí', score: 1 }] },
  medicamentos: { label: 'Medicamentos', opciones: [{ label: 'Ninguno', score: 0 }, { label: 'Tranquilizantes / Sedantes', score: 1 }, { label: 'Diuréticos', score: 1 }, { label: 'Hipotensores', score: 1 }, { label: 'Antiparkinsonianos', score: 1 }, { label: 'Antidepresivos', score: 1 }, { label: 'Otros', score: 1 }] },
  deficit_sensorial: { label: 'Déficit sensorial', opciones: [{ label: 'Ninguno', score: 0 }, { label: 'Alteraciones visuales', score: 1 }, { label: 'Alteraciones auditivas', score: 1 }, { label: 'Extremidades / Parálisis', score: 1 }] },
  estado_mental: { label: 'Estado mental', opciones: [{ label: 'Orientado', score: 0 }, { label: 'Confuso', score: 1 }] },
  deambulacion: { label: 'Deambulación', opciones: [{ label: 'Normal', score: 0 }, { label: 'Segura con ayuda', score: 1 }, { label: 'Insegura con / sin ayuda', score: 1 }, { label: 'Imposible', score: 1 }] },
  edad: { label: 'Edad', opciones: [{ label: 'Menor de 70 años', score: 0 }, { label: 'Mayor de 70 años', score: 1 }] },
}

const BRADEN_HC_CONFIG: Record<string, { label: string; opciones: { label: string; score: number }[] }> = {
  percepcion: { label: 'Percepción Sensorial', opciones: [{ label: 'Completamente limitada', score: 1 }, { label: 'Muy limitada', score: 2 }, { label: 'Ligeramente limitada', score: 3 }, { label: 'Sin limitación', score: 4 }] },
  humedad: { label: 'Exposición a la Humedad', opciones: [{ label: 'Constantemente húmeda', score: 1 }, { label: 'A menudo húmeda', score: 2 }, { label: 'Ocasionalmente húmeda', score: 3 }, { label: 'Raramente húmeda', score: 4 }] },
  actividad: { label: 'Actividad', opciones: [{ label: 'Encamado', score: 1 }, { label: 'En silla', score: 2 }, { label: 'Deambula ocasionalmente', score: 3 }, { label: 'Deambula con frecuencia', score: 4 }] },
  movilidad: { label: 'Movilidad', opciones: [{ label: 'Completamente inmóvil', score: 1 }, { label: 'Muy limitada', score: 2 }, { label: 'Ligeramente limitada', score: 3 }, { label: 'Sin limitación', score: 4 }] },
  nutricion: { label: 'Nutrición', opciones: [{ label: 'Muy pobre', score: 1 }, { label: 'Probablemente inadecuada', score: 2 }, { label: 'Adecuada', score: 3 }, { label: 'Excelente', score: 4 }] },
  friccion: { label: 'Fricción y Cizallamiento', opciones: [{ label: 'Problema', score: 1 }, { label: 'Problema potencial', score: 2 }, { label: 'No existe problema aparente', score: 3 }] },
}

const VF_SISTEMAS = [
  { campo: 'vf_cabeza_cuello', label: 'Cabeza y Cuello' },
  { campo: 'vf_cardiopulmonar', label: 'Cardiopulmonar' },
  { campo: 'vf_abdomen', label: 'Abdomen' },
  { campo: 'vf_extremidades', label: 'Extremidades' },
  { campo: 'vf_neurologico', label: 'Neurológico' },
  { campo: 'vf_piel', label: 'Piel / Tegumentos' },
]

const BRADEN_BITACORA: Array<{ campo: keyof Bitacora; label: string; opciones: string[] }> = [
  { campo: 'braden_percepcion', label: 'Percepción', opciones: ['Completamente limitada', 'Muy limitada', 'Urgentemente limitada', 'Sin limitaciones'] },
  { campo: 'braden_humedad', label: 'Humedad', opciones: ['Constantemente húmeda', 'Humedad con frecuencia', 'Ocasionalmente húmeda', 'Raramente húmeda'] },
  { campo: 'braden_actividad', label: 'Actividad', opciones: ['Encamado', 'En silla', 'Deambula ocast.', 'Deambula frec.'] },
  { campo: 'braden_movilidad', label: 'Movilidad', opciones: ['Completamente inmóvil', 'Muy limitada', 'Ligeramente limitada', 'Sin limitaciones'] },
  { campo: 'braden_nutricion', label: 'Nutrición', opciones: ['Muy pobre', 'Prob. inadecuada', 'Adecuada', 'Excelente'] },
  { campo: 'braden_lesiones', label: 'Lesiones', opciones: ['Problema', 'Prob. potencial', 'Sin problema aparente'] },
]

function downtonRiesgo(total: number | null | undefined) {
  if (total == null) return null
  if (total <= 1) return { texto: 'Bajo Riesgo', color: 'text-green-700' }
  if (total === 2) return { texto: 'Riesgo Moderado', color: 'text-amber-700' }
  return { texto: 'Alto Riesgo', color: 'text-red-700' }
}

function bradenHCRiesgo(total: number | null | undefined) {
  if (total == null) return null
  if (total <= 12) return { texto: 'Alto Riesgo', color: 'text-red-700' }
  if (total <= 14) return { texto: 'Riesgo Moderado', color: 'text-amber-700' }
  return { texto: 'Bajo Riesgo', color: 'text-green-700' }
}

function bradenBitacoraRiesgo(total: number | null | undefined) {
  if (total == null) return null
  if (total < 13) return `Alto Riesgo (${total}/18)`
  if (total <= 14) return `Mediano Riesgo (${total}/18)`
  return `Bajo Riesgo (${total}/18)`
}

function bradenHCLabel(campo: string, score: number | null | undefined): string {
  if (score == null) return '—'
  const cfg = BRADEN_HC_CONFIG[campo]
  if (!cfg) return String(score)
  return cfg.opciones.find(o => o.score === score)?.label ?? String(score)
}

function downtonLabel(score: number | null | undefined): string {
  if (score == null) return '—'
  return score === 0 ? 'Sin riesgo (0 pt)' : `Con riesgo (${score} pt)`
}

function parseHeredofamiliares(texto: string | null | undefined): { checked: string[]; otros: string } {
  if (!texto) return { checked: [], otros: '' }
  const lines = texto.split('\n')
  const firstLine = lines[0]
  const checked = HERDO_OPCIONES.filter(op => firstLine.includes(op))
  if (checked.length === 0) return { checked: [], otros: texto }
  return { checked, otros: lines.slice(1).join('\n').trim() }
}

interface Paciente {
  nombre: string
  edad: number
  sexo?: string | null
  fecha_nacimiento?: string | null
  telefono?: string | null
  diagnostico?: string | null
  contacto?: string | null
  doctor_encargado?: string | null
  direccion?: string | null
  tipo_sangre?: string | null
  peso?: string | null
  altura?: string | null
  primera_visita?: string | null
  motivo_consulta?: string | null
  padecimiento_actual?: string | null
  alergias?: string | null
  antecedentes_medicos?: string | null
  antecedentes_heredofamiliares?: string | null
  antecedentes_patologicos?: string | null
  antecedentes_no_patologicos?: string | null
  // Identificación ampliada
  estado_civil?: string | null
  escolaridad?: string | null
  religion?: string | null
  telefono_local?: string | null
  // Familiar responsable
  familiar_responsable?: string | null
  familiar_tel_local?: string | null
  familiar_tel_cel?: string | null
  segundo_numero_emergencia?: string | null
  // Servicio médico
  tiene_servicio_medico?: boolean | null
  cual_servicio_medico?: string | null
  afiliacion?: string | null
  // Médicos tratantes
  medicos_tratantes?: string | null
  // Motivo de atención
  motivo_atencion_domiciliaria?: string | null
  // Antecedentes patológicos ampliados
  enfermedades_cronicas?: string | null
  ultima_hospitalizacion?: string | null
  cirugias?: string | null
  traumatismos?: string | null
  // Inmunizaciones y dispositivos
  inmunizaciones?: string | null
  dispositivos_drenaje?: string | null
  // Valoración geriátrica
  estado_cognitivo?: string | null
  mini_mental_resultado?: string | null
  mini_mental_fecha?: string | null
  // ABVD
  abvd_bano?: string | null
  abvd_vestido?: string | null
  abvd_alimentacion?: string | null
  abvd_continencia?: string | null
  abvd_movilidad?: string | null
  // Downton
  downton_caidas_previas?: number | null
  downton_medicamentos?: number | null
  downton_deficit_sensorial?: number | null
  downton_estado_mental?: number | null
  downton_deambulacion?: number | null
  downton_edad?: number | null
  downton_total?: number | null
  // Braden Historia Clínica
  braden_percepcion?: number | null
  braden_humedad?: number | null
  braden_actividad?: number | null
  braden_movilidad?: number | null
  braden_nutricion?: number | null
  braden_friccion?: number | null
  braden_total?: number | null
  braden_fecha?: string | null
  // Valoración física basal
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

function Fila({ label, valor }: { label: string; valor?: string | number | null }) {
  return (
    <div>
      <p className="text-[10px] uppercase tracking-wide text-gray-500 font-semibold">{label}</p>
      <p className="text-sm text-gray-900 mt-0.5">{valor || '—'}</p>
    </div>
  )
}

function Seccion({ titulo, children }: { titulo: string; children: React.ReactNode }) {
  return (
    <section className="mb-5">
      <h2 className="text-xs font-bold text-blue-800 uppercase tracking-wide border-b border-blue-200 pb-1 mb-3">
        {titulo}
      </h2>
      {children}
    </section>
  )
}

export default function ExpedienteImprimible({
  paciente,
  medicamentos,
  bitacoras,
  modo = 'completo',
}: {
  paciente: Paciente
  medicamentos: Medicamento[]
  bitacoras: Bitacora[]
  modo?: 'completo' | 'bitacora'
}) {
  const fechaImpresion = new Date().toLocaleDateString('es-MX', {
    year: 'numeric', month: 'long', day: 'numeric',
  })

  const { checked: herdoChecked, otros: herdoOtros } = parseHeredofamiliares(paciente.antecedentes_heredofamiliares)

  const downtonTotal = paciente.downton_total
  const downtonRiesgoResult = downtonRiesgo(downtonTotal)
  const bradenHCTotal = paciente.braden_total
  const bradenHCRiesgoResult = bradenHCRiesgo(bradenHCTotal)

  const tieneVFSignos = paciente.vf_ta || paciente.vf_fc || paciente.vf_fr || paciente.vf_temp || paciente.vf_spo2 || paciente.vf_glucosa
  const tieneVFSistemas = VF_SISTEMAS.some(s => (paciente as unknown as Record<string, string | null>)[s.campo])

  const tieneDownton = downtonTotal != null
  const tieneBradenHC = bradenHCTotal != null
  const tieneABVD = ABVD_CAMPOS.some(c => (paciente as unknown as Record<string, string | null>)[c.campo])

  return (
    <div className="bg-white text-gray-900 font-sans text-sm px-0 py-0">

      {/* Encabezado */}
      <header className="mb-6 pb-4 border-b-2 border-gray-800">
        <div className="flex justify-between items-start">
          <div className="flex items-center gap-4">
            <img src="/logo.jpeg" alt="Ángel De Los Abuelos" className="h-16 w-auto object-contain" />
            <div>
              <p className="text-xs uppercase tracking-widest text-gray-500 font-semibold mb-1">Expediente Clínico</p>
              <h1 className="text-2xl font-bold text-gray-900">{paciente.nombre}</h1>
              <p className="text-sm text-gray-600 mt-1">
                {paciente.edad} años
                {paciente.sexo ? ` · ${paciente.sexo}` : ''}
                {paciente.diagnostico ? ` · ${paciente.diagnostico}` : ''}
              </p>
            </div>
          </div>
          <div className="text-right text-xs text-gray-500">
            <p>Fecha de impresión</p>
            <p className="font-semibold text-gray-700 mt-0.5">{fechaImpresion}</p>
          </div>
        </div>
      </header>

      {modo === 'completo' && <>

      {/* 1. Identificación */}
      <Seccion titulo="Identificación">
        <div className="grid grid-cols-3 gap-x-6 gap-y-3">
          <Fila label="Nombre completo" valor={paciente.nombre} />
          <Fila label="Edad" valor={paciente.edad ? `${paciente.edad} años` : null} />
          <Fila label="Sexo" valor={paciente.sexo} />
          <Fila label="Fecha de nacimiento" valor={paciente.fecha_nacimiento ? new Date(paciente.fecha_nacimiento).toLocaleDateString('es-MX') : null} />
          <Fila label="Estado civil" valor={paciente.estado_civil} />
          <Fila label="Escolaridad" valor={paciente.escolaridad} />
          <Fila label="Religión" valor={paciente.religion} />
          <Fila label="Teléfono celular" valor={paciente.telefono} />
          <Fila label="Teléfono local" valor={paciente.telefono_local} />
          <div className="col-span-3">
            <Fila label="Dirección" valor={paciente.direccion} />
          </div>
        </div>
      </Seccion>

      {/* 2. Familiar Responsable */}
      <Seccion titulo="Familiar Responsable">
        <div className="grid grid-cols-3 gap-x-6 gap-y-3">
          <div className="col-span-2">
            <Fila label="Nombre del familiar responsable" valor={paciente.familiar_responsable} />
          </div>
          <Fila label="Contacto de emergencia" valor={paciente.contacto} />
          <Fila label="Tel. local del familiar" valor={paciente.familiar_tel_local} />
          <Fila label="Tel. celular del familiar" valor={paciente.familiar_tel_cel} />
          <Fila label="Segundo número de emergencia" valor={paciente.segundo_numero_emergencia} />
        </div>
      </Seccion>

      {/* 3. Servicio Médico */}
      <Seccion titulo="Servicio Médico">
        <div className="grid grid-cols-3 gap-x-6 gap-y-3">
          <Fila label="Cuenta con servicio médico" valor={paciente.tiene_servicio_medico == null ? null : paciente.tiene_servicio_medico ? 'Sí' : 'No'} />
          <Fila label="Cuál servicio" valor={paciente.cual_servicio_medico} />
          <Fila label="Afiliación / NSS" valor={paciente.afiliacion} />
        </div>
      </Seccion>

      {/* 4. Médicos Tratantes */}
      <Seccion titulo="Médicos Tratantes">
        <div className="grid grid-cols-2 gap-x-6 gap-y-3">
          <Fila label="Doctor encargado (enfermería)" valor={paciente.doctor_encargado} />
          <div className="col-span-2">
            <Fila label="Médicos tratantes" valor={paciente.medicos_tratantes} />
          </div>
        </div>
      </Seccion>

      {/* 5. Datos Clínicos */}
      <Seccion titulo="Datos Clínicos">
        <div className="grid grid-cols-3 gap-x-6 gap-y-3">
          <Fila label="Tipo de sangre" valor={paciente.tipo_sangre} />
          <Fila label="Peso" valor={paciente.peso ? `${paciente.peso} kg` : null} />
          <Fila label="Altura" valor={paciente.altura ? `${paciente.altura} cm` : null} />
          <Fila label="Primera visita" valor={paciente.primera_visita ? new Date(paciente.primera_visita).toLocaleDateString('es-MX') : null} />
          <div className="col-span-2">
            <Fila label="Diagnóstico" valor={paciente.diagnostico} />
          </div>
        </div>
      </Seccion>

      {/* 6. Motivo de Atención */}
      <Seccion titulo="Motivo de Atención">
        <div className="space-y-3">
          <Fila label="Motivo de consulta" valor={paciente.motivo_consulta} />
          <Fila label="Padecimiento actual" valor={paciente.padecimiento_actual} />
          <Fila label="Motivo de atención domiciliaria" valor={paciente.motivo_atencion_domiciliaria} />
        </div>
      </Seccion>

      {/* 7. Alergias */}
      {paciente.alergias ? (
        <section className="mb-5 bg-red-50 border border-red-300 rounded p-3">
          <h2 className="text-xs font-bold text-red-700 uppercase tracking-wide mb-2">⚠ Alergias</h2>
          <p className="text-sm font-semibold text-red-900">{paciente.alergias}</p>
        </section>
      ) : (
        <Seccion titulo="Alergias">
          <p className="text-sm text-gray-400">Sin alergias registradas</p>
        </Seccion>
      )}

      {/* 8. Antecedentes Heredofamiliares */}
      <Seccion titulo="Antecedentes Heredofamiliares">
        {herdoChecked.length > 0 ? (
          <div className="space-y-2">
            <div className="flex flex-wrap gap-2">
              {herdoChecked.map(op => (
                <span key={op} className="text-xs bg-blue-50 border border-blue-200 text-blue-800 px-2 py-0.5 rounded-full font-medium">{op}</span>
              ))}
            </div>
            {herdoOtros && <p className="text-sm text-gray-700 mt-1">{herdoOtros}</p>}
          </div>
        ) : paciente.antecedentes_heredofamiliares ? (
          <p className="text-sm text-gray-700">{paciente.antecedentes_heredofamiliares}</p>
        ) : (
          <p className="text-sm text-gray-400">Sin antecedentes registrados</p>
        )}
      </Seccion>

      {/* 9. Antecedentes Patológicos */}
      <Seccion titulo="Antecedentes Patológicos">
        <div className="space-y-3">
          <Fila label="Enfermedades crónicas" valor={paciente.enfermedades_cronicas} />
          <Fila label="Última hospitalización" valor={paciente.ultima_hospitalizacion} />
          <Fila label="Cirugías" valor={paciente.cirugias} />
          <Fila label="Traumatismos" valor={paciente.traumatismos} />
          <Fila label="Antecedentes médicos generales" valor={paciente.antecedentes_patologicos} />
          <Fila label="Medicamentos actuales" valor={paciente.antecedentes_medicos} />
        </div>
      </Seccion>

      {/* 10. Antecedentes No Patológicos */}
      <Seccion titulo="Antecedentes No Patológicos">
        {paciente.antecedentes_no_patologicos
          ? <p className="text-sm text-gray-700">{paciente.antecedentes_no_patologicos}</p>
          : <p className="text-sm text-gray-400">Sin antecedentes registrados</p>
        }
      </Seccion>

      {/* 11. Inmunizaciones */}
      <Seccion titulo="Inmunizaciones">
        {paciente.inmunizaciones
          ? <p className="text-sm text-gray-700">{paciente.inmunizaciones}</p>
          : <p className="text-sm text-gray-400">Sin inmunizaciones registradas</p>
        }
      </Seccion>

      {/* 12. Dispositivos de Drenaje */}
      <Seccion titulo="Dispositivos de Drenaje / Sondas">
        {paciente.dispositivos_drenaje
          ? <p className="text-sm text-gray-700">{paciente.dispositivos_drenaje}</p>
          : <p className="text-sm text-gray-400">Sin dispositivos registrados</p>
        }
      </Seccion>

      {/* 13. Valoración Geriátrica */}
      <Seccion titulo="Valoración Geriátrica">
        <div className="grid grid-cols-3 gap-x-6 gap-y-3">
          <Fila label="Estado cognitivo" valor={paciente.estado_cognitivo} />
          <Fila label="Mini-Mental (resultado)" valor={paciente.mini_mental_resultado} />
          <Fila label="Fecha Mini-Mental" valor={paciente.mini_mental_fecha ? new Date(paciente.mini_mental_fecha).toLocaleDateString('es-MX') : null} />
        </div>
      </Seccion>

      {/* 14. Actividades Básicas de la Vida Diaria (ABVD) */}
      <Seccion titulo="Actividades Básicas de la Vida Diaria (ABVD)">
        {tieneABVD ? (
          <div className="grid grid-cols-3 gap-x-6 gap-y-3">
            {ABVD_CAMPOS.map(({ campo, label }) => {
              const val = (paciente as unknown as Record<string, string | null>)[campo]
              return <Fila key={campo} label={label} valor={val} />
            })}
          </div>
        ) : (
          <p className="text-sm text-gray-400">Sin valoración registrada</p>
        )}
      </Seccion>

      {/* 15. Escala de Downton */}
      <Seccion titulo="Escala de Downton — Riesgo de Caídas">
        {tieneDownton ? (
          <div>
            <div className="flex items-center gap-3 mb-3">
              <span className="text-sm font-bold text-gray-800">Total: {downtonTotal} / 7</span>
              {downtonRiesgoResult && (
                <span className={`text-xs font-semibold ${downtonRiesgoResult.color}`}>
                  {downtonRiesgoResult.texto}
                </span>
              )}
            </div>
            <table className="w-full text-xs border-collapse">
              <thead>
                <tr className="bg-gray-50">
                  <th className="text-left py-1.5 px-2 font-semibold text-gray-600 border border-gray-200 w-1/2">Categoría</th>
                  <th className="text-left py-1.5 px-2 font-semibold text-gray-600 border border-gray-200">Resultado</th>
                </tr>
              </thead>
              <tbody>
                {[
                  { key: 'caidas_previas', field: 'downton_caidas_previas' },
                  { key: 'medicamentos', field: 'downton_medicamentos' },
                  { key: 'deficit_sensorial', field: 'downton_deficit_sensorial' },
                  { key: 'estado_mental', field: 'downton_estado_mental' },
                  { key: 'deambulacion', field: 'downton_deambulacion' },
                  { key: 'edad', field: 'downton_edad' },
                ].map(({ key, field }) => {
                  const score = (paciente as unknown as Record<string, number | null>)[field]
                  const cfg = DOWNTON_CONFIG[key]
                  return (
                    <tr key={key}>
                      <td className="py-1.5 px-2 border border-gray-200">{cfg?.label ?? key}</td>
                      <td className="py-1.5 px-2 border border-gray-200">{downtonLabel(score)}</td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="text-sm text-gray-400">Sin valoración registrada</p>
        )}
      </Seccion>

      {/* 16. Escala de Braden — Valoración Basal */}
      <Seccion titulo="Escala de Braden — Valoración Basal (Historia Clínica)">
        {tieneBradenHC ? (
          <div>
            <div className="flex items-center gap-3 mb-3">
              <span className="text-sm font-bold text-gray-800">Total: {bradenHCTotal} / 23</span>
              {bradenHCRiesgoResult && (
                <span className={`text-xs font-semibold ${bradenHCRiesgoResult.color}`}>
                  {bradenHCRiesgoResult.texto}
                </span>
              )}
              {paciente.braden_fecha && (
                <span className="text-xs text-gray-500">
                  Fecha: {new Date(paciente.braden_fecha).toLocaleDateString('es-MX')}
                </span>
              )}
            </div>
            <table className="w-full text-xs border-collapse">
              <thead>
                <tr className="bg-gray-50">
                  <th className="text-left py-1.5 px-2 font-semibold text-gray-600 border border-gray-200 w-1/2">Categoría</th>
                  <th className="text-left py-1.5 px-2 font-semibold text-gray-600 border border-gray-200 w-1/6">Puntaje</th>
                  <th className="text-left py-1.5 px-2 font-semibold text-gray-600 border border-gray-200">Descripción</th>
                </tr>
              </thead>
              <tbody>
                {[
                  { key: 'percepcion', field: 'braden_percepcion' },
                  { key: 'humedad', field: 'braden_humedad' },
                  { key: 'actividad', field: 'braden_actividad' },
                  { key: 'movilidad', field: 'braden_movilidad' },
                  { key: 'nutricion', field: 'braden_nutricion' },
                  { key: 'friccion', field: 'braden_friccion' },
                ].map(({ key, field }) => {
                  const score = (paciente as unknown as Record<string, number | null>)[field]
                  const cfg = BRADEN_HC_CONFIG[key]
                  return (
                    <tr key={key}>
                      <td className="py-1.5 px-2 border border-gray-200">{cfg?.label ?? key}</td>
                      <td className="py-1.5 px-2 border border-gray-200 text-center font-semibold">{score ?? '—'}</td>
                      <td className="py-1.5 px-2 border border-gray-200">{bradenHCLabel(key, score)}</td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="text-sm text-gray-400">Sin valoración registrada</p>
        )}
      </Seccion>

      {/* 17. Valoración Física Basal */}
      <Seccion titulo="Valoración Física Basal">
        {(tieneVFSignos || tieneVFSistemas || paciente.vf_profesional) ? (
          <div className="space-y-4">
            {tieneVFSignos && (
              <div>
                <p className="text-[10px] uppercase tracking-wide text-gray-500 font-semibold mb-2">Signos Vitales</p>
                <div className="flex flex-wrap gap-x-6 gap-y-2 text-xs text-gray-700">
                  {paciente.vf_ta && <span><strong>T/A:</strong> {paciente.vf_ta}</span>}
                  {paciente.vf_fc != null && <span><strong>FC:</strong> {paciente.vf_fc} lpm</span>}
                  {paciente.vf_fr != null && <span><strong>FR:</strong> {paciente.vf_fr} rpm</span>}
                  {paciente.vf_temp != null && <span><strong>Temp:</strong> {paciente.vf_temp} °C</span>}
                  {paciente.vf_spo2 != null && <span><strong>SpO₂:</strong> {paciente.vf_spo2}%</span>}
                  {paciente.vf_glucosa != null && <span><strong>Glucosa:</strong> {paciente.vf_glucosa} mg/dL</span>}
                </div>
              </div>
            )}
            {tieneVFSistemas && (
              <div>
                <p className="text-[10px] uppercase tracking-wide text-gray-500 font-semibold mb-2">Exploración por Sistemas</p>
                <div className="grid grid-cols-2 gap-x-6 gap-y-3">
                  {VF_SISTEMAS.map(({ campo, label }) => {
                    const val = (paciente as unknown as Record<string, string | null>)[campo]
                    if (!val) return null
                    return <Fila key={campo} label={label} valor={val} />
                  })}
                </div>
              </div>
            )}
            {(paciente.vf_profesional || paciente.vf_fecha_evaluacion) && (
              <div className="flex gap-6 pt-1 border-t border-gray-100">
                <Fila label="Profesional que evalúa" valor={paciente.vf_profesional} />
                <Fila label="Fecha de evaluación" valor={paciente.vf_fecha_evaluacion ? new Date(paciente.vf_fecha_evaluacion).toLocaleDateString('es-MX') : null} />
              </div>
            )}
          </div>
        ) : (
          <p className="text-sm text-gray-400">Sin valoración registrada</p>
        )}
      </Seccion>

      {/* Medicamentos */}
      <Seccion titulo={`Medicamentos (${medicamentos.length})`}>
        {medicamentos.length === 0 ? (
          <p className="text-sm text-gray-400">Sin medicamentos registrados</p>
        ) : (
          <table className="w-full text-xs border-collapse">
            <thead>
              <tr className="bg-gray-100">
                <th className="text-left py-1.5 px-2 font-semibold text-gray-600 border border-gray-200">Medicamento</th>
                <th className="text-left py-1.5 px-2 font-semibold text-gray-600 border border-gray-200">Dosis</th>
                <th className="text-left py-1.5 px-2 font-semibold text-gray-600 border border-gray-200">Horario</th>
                <th className="text-left py-1.5 px-2 font-semibold text-gray-600 border border-gray-200">Desde</th>
                <th className="text-left py-1.5 px-2 font-semibold text-gray-600 border border-gray-200">Hasta</th>
                <th className="text-left py-1.5 px-2 font-semibold text-gray-600 border border-gray-200">Estado</th>
              </tr>
            </thead>
            <tbody>
              {medicamentos.map(m => (
                <tr key={m.id} className={!m.activo ? 'opacity-50' : ''}>
                  <td className={`py-1.5 px-2 border border-gray-200 font-medium ${m.alto_riesgo ? 'text-red-600' : ''}`}>
                    {m.nombre}{m.alto_riesgo ? ' ⚠' : ''}
                  </td>
                  <td className={`py-1.5 px-2 border border-gray-200 ${m.alto_riesgo ? 'text-red-600' : ''}`}>{m.dosis}</td>
                  <td className={`py-1.5 px-2 border border-gray-200 ${m.alto_riesgo ? 'text-red-600' : ''}`}>{m.horario}</td>
                  <td className="py-1.5 px-2 border border-gray-200">
                    {m.fecha_inicio ? new Date(m.fecha_inicio).toLocaleDateString('es-MX') : '—'}
                  </td>
                  <td className="py-1.5 px-2 border border-gray-200">
                    {m.indeterminado ? 'Indeterminado' : m.fecha_fin ? new Date(m.fecha_fin).toLocaleDateString('es-MX') : '—'}
                  </td>
                  <td className="py-1.5 px-2 border border-gray-200">
                    {m.activo ? 'Activo' : 'Suspendido'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </Seccion>

      </>}

      {/* Bitácora */}
      <Seccion titulo={`Bitácora clínica (${bitacoras.length} entradas)`}>
        {bitacoras.length === 0 ? (
          <p className="text-sm text-gray-400">Sin entradas en la bitácora</p>
        ) : (
          <div className="space-y-3">
            {bitacoras.map(b => {
              const tc = turnoClases(b.created_at)
              const tieneSignos = b.tension_arterial || b.frecuencia_cardiaca || b.frecuencia_respiratoria || b.temperatura || b.saturacion_oxigeno || b.glucosa
              const tieneBalance = b.uresis || b.evacuaciones || b.ingresos_liquidos || b.egresos_liquidos || b.balance_liquidos
              const tieneTratamiento = b.medicacion_turno || b.soluciones || b.dieta
              return (
                <div key={b.id} className={`border border-gray-200 rounded p-3 ${tc.card}`}>
                  <div className="flex justify-between items-center mb-1 flex-wrap gap-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-xs font-semibold text-blue-700">{b.estado_paciente}</span>
                      <span className="text-xs text-gray-500">({turnoNombre(b.created_at)})</span>
                      {b.escala_dolor != null && <span className="text-xs font-medium text-orange-600">Dolor: {b.escala_dolor}/10</span>}
                    </div>
                    <span className={`text-xs ${tc.hora}`}>{new Date(b.created_at).toLocaleString('es-MX')}</span>
                  </div>
                  {tieneSignos && (
                    <div className="flex flex-wrap gap-x-4 gap-y-1 my-2 text-xs text-gray-700 border-t border-gray-100 pt-2">
                      {b.tension_arterial && <span><strong>T/A:</strong> {b.tension_arterial}</span>}
                      {b.frecuencia_cardiaca != null && <span><strong>FC:</strong> {b.frecuencia_cardiaca} lpm</span>}
                      {b.frecuencia_respiratoria != null && <span><strong>FR:</strong> {b.frecuencia_respiratoria} rpm</span>}
                      {b.temperatura != null && <span><strong>Temp:</strong> {b.temperatura}°C</span>}
                      {b.saturacion_oxigeno != null && <span><strong>SpO₂:</strong> {b.saturacion_oxigeno}%</span>}
                      {b.glucosa != null && <span><strong>Glucosa:</strong> {b.glucosa} mg/dL</span>}
                    </div>
                  )}
                  {tieneBalance && (
                    <div className="flex flex-wrap gap-x-4 gap-y-1 my-2 text-xs text-gray-700 border-t border-gray-100 pt-2">
                      {b.uresis && <span><strong>Uresis:</strong> {b.uresis}</span>}
                      {b.evacuaciones && <span><strong>Evacuaciones:</strong> {b.evacuaciones}</span>}
                      {b.ingresos_liquidos && <span><strong>Ingresos:</strong> {b.ingresos_liquidos}</span>}
                      {b.egresos_liquidos && <span><strong>Egresos:</strong> {b.egresos_liquidos}</span>}
                      {b.balance_liquidos && <span><strong>Balance:</strong> {b.balance_liquidos}</span>}
                    </div>
                  )}
                  {tieneTratamiento && (
                    <div className="my-2 text-xs text-gray-700 border-t border-gray-100 pt-2 space-y-0.5">
                      {b.medicacion_turno && <p><strong>Medicación:</strong> {b.medicacion_turno}</p>}
                      {b.soluciones && <p><strong>Soluciones:</strong> {b.soluciones}</p>}
                      {b.dieta && <p><strong>Dieta:</strong> {b.dieta}</p>}
                    </div>
                  )}
                  {(b.reporte_enfermeria || b.supervision_enfermero || b.supervision_familiar) && (
                    <div className="my-2 text-xs text-gray-700 border-t border-gray-100 pt-2 space-y-0.5">
                      {b.reporte_enfermeria && <p><strong>Reporte:</strong> {b.reporte_enfermeria}</p>}
                      {b.supervision_enfermero && <p><strong>Supervisión Enf.:</strong> {b.supervision_enfermero}</p>}
                      {b.supervision_familiar && <p><strong>Supervisión Familiar:</strong> {b.supervision_familiar}</p>}
                    </div>
                  )}
                  {b.braden_total != null && (
                    <div className="my-2 border-t border-gray-100 pt-2">
                      <p className="text-xs font-semibold text-gray-700 mb-1">
                        Escala Braden: {bradenBitacoraRiesgo(b.braden_total)}
                      </p>
                      <div className="flex flex-wrap gap-x-4 gap-y-0.5 text-xs text-gray-600">
                        {BRADEN_BITACORA.map(({ campo, label, opciones }) => {
                          const val = b[campo] as number | null | undefined
                          if (val == null) return null
                          return <span key={campo}><strong>{label}:</strong> {val} ({opciones[val] ?? '—'})</span>
                        })}
                      </div>
                    </div>
                  )}
                  <p className={`text-sm leading-relaxed ${tc.texto} border-t border-gray-100 pt-2 mt-2`}>{b.observaciones}</p>
                  <p className="text-xs text-gray-400 mt-1">Registrado por: {b.enfermero_nombre || '—'}</p>
                </div>
              )
            })}
          </div>
        )}
      </Seccion>

      {/* Pie de página */}
      <footer className="mt-8 pt-3 border-t border-gray-300 text-xs text-gray-400 text-center">
        Documento generado el {fechaImpresion} — Ángel De Los Abuelos
      </footer>
    </div>
  )
}
