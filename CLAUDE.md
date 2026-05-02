@AGENTS.md
# Sistema de Expedientes Clínicos — Enfermería a Domicilio

## Stack
Next.js 16.2 (App Router) · TypeScript · React 19 · PostgreSQL (Railway, SSL, pool 10) · AWS S3 us-east-2 (signed URLs 1h) · JWT HttpOnly 8h · Tailwind CSS v4 · Resend (correos) · Railway deploy (standalone)

## Roles
- **admin**: acceso total (CRUD pacientes, bitácoras, meds, usuarios, enfermeros; archivar; stats)
- **enfermero**: ver asignados, registrar bitácora/meds/agenda — NO archivar, NO editar HC, NO cambiar contraseñas
- **paciente**: solo su expediente + subir archivos

## Rutas API principales
```
POST   /api/auth/login                    # rate-limit 5/min por IP
POST   /api/auth/logout
GET|POST  /api/pacientes                  # lista paginada | crear
GET|PUT   /api/pacientes/[id]             # GET todos | PUT solo admin edita HC
POST      /api/pacientes/[id]/bitacora    # append-only
GET|POST  /api/pacientes/[id]/medicamentos
GET       /api/pacientes/[id]/archivos    # signed URLs
POST      /api/pacientes/[id]/archivar|desarchivar   # solo admin
POST      /api/pacientes/[id]/suspender-medicamento
GET|POST  /api/pacientes/[id]/agenda
PATCH     /api/pacientes/[id]/agenda/[eventoId]       # marcar completado, solo admin
GET       /api/mi-expediente              # expediente propio paciente
GET|POST  /api/mi-expediente/archivos     # ver y subir archivos propios
GET       /api/admin/eventos-proximos     # próximos 7 días, solo admin
GET       /api/stats                      # solo admin
GET       /api/cron/recordatorios         # autenticado por CRON_SECRET
GET       /api/me
GET       /api/health
```

## Páginas
```
/dashboard            lista pacientes + búsqueda + campana (admin)
/pacientes/nuevo      crear paciente
/pacientes/[id]       expediente — tabs: HC, Bitácora, Medicamentos, Archivos, Agenda
/pacientes/[id]/imprimir   PDF (solo admin)
/enfermeros           gestión enfermeros + cambio password inline
/estadisticas         solo admin
/asignaciones         enfermero ↔ paciente
/usuarios/nuevo
/mi-expediente        vista paciente (tabs: Datos, Bitácora, Meds, Archivos, Agenda)
/mi-expediente/imprimir
/login
```

## Lib
```
lib/db.ts              Pool PostgreSQL
lib/auth.ts            getUsuario(req) — JWT con jsonwebtoken
lib/jwt-edge.ts        verifyUsuarioJwtEdge() — Edge/jose
lib/authz.ts           requirePacienteAccess(), medicamentoPerteneceAPaciente()
lib/s3.ts              getSignedUrl(), S3 client
lib/paciente-del-usuario.ts  findPacienteByUsuarioId()
lib/resend.ts          getResendClient() lazy
lib/turno.ts           turnoClases(), turnoNombre()
lib/schema.sql         Schema BD (fuente de verdad)
lib/patient-input.ts   requiredInteger(), optionalInteger(), optionalNumber(), PatientInputError
```

## Base de datos — tablas clave
| Tabla | Notas |
|-------|-------|
| `usuarios` | UUID, email UNIQUE, bcrypt, rol |
| `pacientes` | expediente completo; archivado BOOL; HC con escalas Downton y Braden |
| `enfermeros_pacientes` | activo BOOL |
| `bitacora` | append-only; sv1/sv2/sv3 (signos vitales × 3 tomas); Braden; balance líquidos |
| `medicamentos` | activo BOOL, alto_riesgo BOOL, indeterminado BOOL |
| `archivos` | S3 key (no URL), paciente_id, subido_por |
| `agenda` | append-only; completado BOOL |
| `expediente_auditoria` | JSONB antes/después de cada PUT |

### Escala Downton (tabla pacientes)
- `downton_caidas_previas`, `downton_estado_mental`, `downton_deambulacion`, `downton_edad` — INTEGER (score único)
- `downton_medicamentos` INTEGER (suma de ítems seleccionados), `downton_medicamentos_items TEXT[]`
- `downton_deficit_sensorial` INTEGER (suma), `downton_deficit_sensorial_items TEXT[]`
- `downton_total` INTEGER
- Medicamentos y déficit sensorial son **multi-select** (checkboxes); las demás categorías son single-select (checkboxes)
- "Ninguno" es exclusivo en las categorías multi-select
- Riesgo: ≤1 Bajo · 2 Moderado · ≥3 Alto

### DOWNTON_CONFIG (definido igual en nuevo/page.tsx y [id]/page.tsx)
- `multi: true` en `medicamentos` y `deficit_sensorial`
- `computeDowntonScores(sel)` derivada del estado, no estado propio

## Auth flow
1. POST /api/auth/login → JWT `{id, email, rol, nombre}` → cookie `token` HttpOnly 8h
2. `middleware.ts` (edge, jose) verifica en cada request
3. Rutas públicas: `/login`, `/api/auth/*`
4. Pacientes solo acceden a `/mi-expediente/*` y `/api/mi-expediente/*`

## Reglas de negocio
- **Nada se borra**: pacientes se archivan, meds se suspenden
- **Bitácora y Agenda**: append-only (no editar, no borrar)
- **Archivos S3**: key `{pacienteId}/{timestamp}-{nombre}`, URL firmada 1h, máx 10MB
- **Paginación**: 20 por página (bitácora y lista pacientes)
- **Auditoría**: `expediente_auditoria` registra cada PUT con antes/después JSONB

## Variables de entorno
```
DATABASE_URL  JWT_SECRET
AWS_ACCESS_KEY_ID  AWS_SECRET_ACCESS_KEY  AWS_REGION(us-east-2)  AWS_S3_BUCKET(expedientes-clinicos-archivos)
RESEND_API_KEY  REMINDER_EMAIL_1/2/3  CRON_SECRET
NEXT_PUBLIC_APP_NAME (opcional)
```

## Scripts de migración (requieren DATABASE_URL cargado)
```bash
export $(grep -v '^#' .env.local | xargs) && node scripts/<nombre>.js
```
Scripts relevantes en `scripts/`:
- `crear-usuario.js` / `crear-admin-railway.js`
- `agregar-downton-items.js` — **PENDIENTE EJECUTAR** — agrega `downton_medicamentos_items` y `downton_deficit_sensorial_items`
- `agregar-vitales-multiples.js` — tomas sv2/sv3 + notas glucosa
- Ver lista completa en `scripts/`

## Componentes compartidos
- `app/components/ExpedienteImprimible.tsx` — usado en `/imprimir` y `/mi-expediente/imprimir`
