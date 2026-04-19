import { turnoClases } from '@/lib/turno'

interface Paciente {
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
}: {
  paciente: Paciente
  medicamentos: Medicamento[]
  bitacoras: Bitacora[]
}) {
  const fechaImpresion = new Date().toLocaleDateString('es-MX', {
    year: 'numeric', month: 'long', day: 'numeric',
  })

  return (
    <div className="bg-white text-gray-900 font-sans text-sm px-0 py-0">

      {/* Encabezado */}
      <header className="mb-6 pb-4 border-b-2 border-gray-800">
        <div className="flex justify-between items-start">
          <div>
            <p className="text-xs uppercase tracking-widest text-gray-500 font-semibold mb-1">Expediente Clínico</p>
            <h1 className="text-2xl font-bold text-gray-900">{paciente.nombre}</h1>
            <p className="text-sm text-gray-600 mt-1">
              {paciente.edad} años
              {paciente.sexo ? ` · ${paciente.sexo}` : ''}
              {paciente.diagnostico ? ` · ${paciente.diagnostico}` : ''}
            </p>
          </div>
          <div className="text-right text-xs text-gray-500">
            <p>Fecha de impresión</p>
            <p className="font-semibold text-gray-700 mt-0.5">{fechaImpresion}</p>
          </div>
        </div>
      </header>

      {/* Identificación */}
      <Seccion titulo="Identificación">
        <div className="grid grid-cols-3 gap-x-6 gap-y-3">
          <Fila label="Nombre completo" valor={paciente.nombre} />
          <Fila label="Edad" valor={paciente.edad ? `${paciente.edad} años` : null} />
          <Fila label="Sexo" valor={paciente.sexo} />
          <Fila label="Fecha de nacimiento" valor={paciente.fecha_nacimiento ? new Date(paciente.fecha_nacimiento).toLocaleDateString('es-MX') : null} />
          <Fila label="Teléfono" valor={paciente.telefono} />
          <Fila label="Contacto de emergencia" valor={paciente.contacto} />
          <div className="col-span-3">
            <Fila label="Dirección" valor={paciente.direccion} />
          </div>
        </div>
      </Seccion>

      {/* Datos clínicos */}
      <Seccion titulo="Datos clínicos">
        <div className="grid grid-cols-3 gap-x-6 gap-y-3">
          <Fila label="Tipo de sangre" valor={paciente.tipo_sangre} />
          <Fila label="Peso" valor={paciente.peso ? `${paciente.peso} kg` : null} />
          <Fila label="Altura" valor={paciente.altura ? `${paciente.altura} cm` : null} />
          <Fila label="Primera visita" valor={paciente.primera_visita ? new Date(paciente.primera_visita).toLocaleDateString('es-MX') : null} />
          <div className="col-span-2">
            <Fila label="Doctor encargado" valor={paciente.doctor_encargado} />
          </div>
        </div>
      </Seccion>

      {/* Motivo de consulta */}
      <Seccion titulo="Motivo de consulta">
        <div className="space-y-3">
          <Fila label="Motivo de consulta" valor={paciente.motivo_consulta} />
          <Fila label="Padecimiento actual" valor={paciente.padecimiento_actual} />
          <Fila label="Diagnóstico" valor={paciente.diagnostico} />
        </div>
      </Seccion>

      {/* Alergias */}
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

      {/* Antecedentes */}
      <Seccion titulo="Antecedentes">
        <div className="space-y-3">
          <Fila label="Antecedentes médicos generales" valor={paciente.antecedentes_medicos} />
          <Fila label="Antecedentes heredofamiliares" valor={paciente.antecedentes_heredofamiliares} />
          <Fila label="Antecedentes personales patológicos" valor={paciente.antecedentes_patologicos} />
          <Fila label="Antecedentes personales no patológicos" valor={paciente.antecedentes_no_patologicos} />
        </div>
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
                      {b.turno && <span className="text-xs text-gray-500">({b.turno})</span>}
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
        Documento generado el {fechaImpresion} — Sistema de Enfermería a Domicilio
      </footer>
    </div>
  )
}
