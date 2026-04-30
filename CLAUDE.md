@AGENTS.md
# Sistema de Expedientes Clínicos — Enfermería a Domicilio

## Objetivo
App web para gestión de expedientes clínicos de enfermería a domicilio. Enfermeros administran todo; pacientes solo consultan su propio expediente.

## Stack
- Next.js 16.2 (App Router) + TypeScript + React 19
- PostgreSQL en Railway (SSL, pool de 10 conexiones)
- AWS S3 (us-east-2) para archivos — signed URLs de 1 hora
- JWT en cookies HttpOnly (8h expiración) para autenticación
- Deploy en Railway con output standalone
- Tailwind CSS v4
- Resend — envío de correos (recordatorios automáticos de citas)

## Roles
- **admin**: acceso total — crear/editar pacientes, bitácoras, medicamentos, usuarios, enfermeros; archivar/desarchivar pacientes; cambiar contraseñas; ver estadísticas
- **enfermero**: puede ver expedientes, registrar bitácoras, agregar medicamentos y eventos de agenda; NO puede archivar, cambiar contraseñas ni editar la Historia Clínica
- **paciente**: solo ve su propio expediente y puede subir archivos a él

---

## Estructura de archivos

```
app/
  api/
    auth/
      login/        POST — login con rate limiting (5 intentos/min por IP)
      logout/       POST — limpia cookie
    pacientes/
      route.ts                        GET (lista paginada+búsqueda) | POST (crear)
      [id]/route.ts                   GET | PUT (actualizar) — solo admin edita HC
      [id]/bitacora/route.ts          GET (paginado 20/pág) | POST (agregar entrada)
      [id]/medicamentos/route.ts      GET | POST (agregar)
      [id]/archivos/route.ts          GET (signed URLs)
      [id]/archivar/route.ts          POST — solo admin
      [id]/desarchivar/route.ts       POST — solo admin
      [id]/suspender-medicamento/route.ts  POST
      [id]/agenda/route.ts            GET | POST (agregar evento)
      [id]/agenda/[eventoId]/route.ts PATCH (marcar completado — solo admin)
    mi-expediente/
      route.ts          GET — expediente propio del paciente
      medicamentos/     GET
      bitacora/         GET (paginado)
      archivos/route.ts GET (signed URLs) | POST (subir archivo)
      agenda/route.ts   GET — agenda propia del paciente
    archivos/           POST — subir archivo a S3 (PDF/JPG/PNG, máx 10MB)
    usuarios/
      route.ts                    POST — crear usuario (solo admin)
      [id]/cambiar-password/      POST — solo admin
    enfermeros/
      route.ts          GET — listar enfermeros
      [id]/route.ts     DELETE (cascade)
    admin/
      eventos-proximos/ GET — eventos de todos los pacientes en los próximos 7 días (solo admin)
    stats/              GET — estadísticas globales (solo admin)
    cron/
      recordatorios/    GET — envía email resumen de citas del día siguiente (autenticado por CRON_SECRET)
    me/                 GET — datos del usuario autenticado (id, nombre, email, rol)
    health/             GET — healthcheck para Railway
  components/
    ExpedienteImprimible.tsx  — componente de impresión compartido (usado en /imprimir y /mi-expediente/imprimir)
  dashboard/            Vista principal (lista pacientes, búsqueda, campana de eventos para admin)
  pacientes/
    nuevo/              Crear paciente
    [id]/               Ver expediente — tabs: Historia Clínica, Bitácora, Medicamentos, Archivos, Agenda
    [id]/imprimir/      Reporte imprimible PDF (solo admin)
  enfermeros/           Gestión de enfermeros (cambio de contraseña inline — solo admin)
  estadisticas/         Estadísticas globales — solo admin
  asignaciones/         Gestión de asignaciones enfermero ↔ paciente
  usuarios/nuevo/       Crear usuario
  mi-expediente/        Vista paciente — tabs: Datos, Bitácora, Medicamentos, Archivos, Agenda
  mi-expediente/imprimir/
  login/
  layout.tsx            Layout raíz con fuente
  page.tsx              Redirect a /login

lib/
  db.ts                 Pool PostgreSQL (DATABASE_URL, SSL)
  auth.ts               getUsuario(req) — extrae JWT de cookies (jsonwebtoken)
  auth-constants.ts     AUTH_COOKIE_NAME='token', tipo UsuarioJwt
  jwt-edge.ts           verifyUsuarioJwtEdge() — verificación Edge-compatible (jose)
  authz.ts              requirePacienteAccess(), medicamentoPerteneceAPaciente()
  s3.ts                 Cliente S3, getSignedUrl(), extracción de keys
  paciente-del-usuario.ts  findPacienteByUsuarioId()
  resend.ts             getResendClient() lazy, REMINDER_RECIPIENTS()
  turno.ts              turnoClases(), turnoNombre() — clasificación por hora del día
  schema.sql            Schema completo de la BD (fuente de verdad)
  init-db.ts            Script de inicialización de BD (TypeScript, uso manual)

scripts/                Scripts de Node.js para migraciones y utilidades — NO son importados
  crear-usuario.js          Crear usuario manualmente en la BD
  crear-admin-railway.js    Crear admin en entorno Railway
  crear-admins.js           Crear múltiples admins
  add-indexes.js            Agregar índices de rendimiento a la BD
  add-creado-por.js         Migración: columna creado_por en pacientes
  agregar-campos-clinicos.js    Migración: campos de Historia Clínica
  agregar-columnas.js           Migración: columnas varias
  agregar-alto-riesgo.js        Migración: campo alto_riesgo en medicamentos
  agregar-asignaciones-activo.js Migración: campo activo en enfermeros_pacientes
  agregar-signos-vitales.js     Migración: columnas de signos vitales en bitácora
  agregar-braden.js             Migración: escala Braden en bitácora
  agregar-braden-historia.js    Migración: escala Braden en Historia Clínica
  agregar-historia-clinica.js   Migración: campos completos de Historia Clínica
  agregar-agenda.js             Migración: tabla agenda
  agregar-vitales-multiples.js  Migración: tomas #2 y #3 de signos vitales + notas de glucosa

middleware.ts         Auth y RBAC en el edge (corre en cada request)
next.config.ts        reactCompiler: true, output: 'standalone'
railway.toml          Cron: envía recordatorio de citas diario a las 14:00 UTC
```

---

## Base de datos — Tablas

| Tabla | Propósito |
|-------|-----------|
| `usuarios` | id (UUID), nombre, email (UNIQUE), password (bcrypt), rol, created_at |
| `pacientes` | Expediente completo — datos personales, clínicos, diagnóstico, antecedentes; usuario_id FK; archivado BOOL |
| `enfermeros_pacientes` | Asignación enfermero ↔ paciente; campo `activo` BOOL |
| `bitacora` | Entradas clínicas — append-only; 3 tomas de signos vitales (sv1/sv2/sv3); nota de glucosa; Braden; balance de líquidos |
| `medicamentos` | nombre, dosis, horario, fecha_inicio/fin, indeterminado BOOL, alto_riesgo BOOL, activo BOOL |
| `archivos` | S3 key (no URL pública), paciente_id, subido_por, tipo MIME, nombre_archivo |
| `agenda` | Eventos por paciente — titulo, fecha, hora, lugar, tipo, completado BOOL; append-only |
| `login_rate_limits` | Control de intentos de login por IP |
| `expediente_auditoria` | Log de cambios importantes (JSONB antes/después) |

---

## Flujo de autenticación

1. `POST /api/auth/login` → verifica email+bcrypt → genera JWT `{id, email, rol, nombre}` → cookie `token` HttpOnly 8h
2. `middleware.ts` corre en edge — usa `jose` para verificar token en cada request
3. Rutas públicas: `/login`, `/api/auth/*`
4. Pacientes solo pueden acceder a `/mi-expediente/*` y `/api/mi-expediente/*`
5. En API routes: `getUsuario(req)` de `lib/auth.ts` (usa `jsonwebtoken`)
6. `requirePacienteAccess()` en `lib/authz.ts` devuelve 404 si no tiene acceso

---

## Permisos por acción

| Acción | Admin | Enfermero | Paciente |
|--------|-------|-----------|---------|
| Ver expediente | ✅ | ✅ (asignados) | ✅ (propio) |
| Editar Historia Clínica | ✅ | ❌ | ❌ |
| Registrar bitácora | ✅ | ✅ | ❌ |
| Agregar medicamento | ✅ | ✅ | ❌ |
| Subir archivos | ✅ | ✅ | ✅ (propio) |
| Agregar evento agenda | ✅ | ✅ | ❌ |
| Marcar evento completado | ✅ | ❌ | ❌ |
| Archivar / desarchivar | ✅ | ❌ | ❌ |
| Cambiar contraseña | ✅ | ❌ | ❌ |
| Exportar PDF | ✅ | ❌ | ❌ |
| Ver estadísticas | ✅ | ❌ | ❌ |
| Gestionar enfermeros | ✅ | ❌ | ❌ |

---

## Reglas de negocio

- **Nada se borra permanentemente** — pacientes se archivan, medicamentos se suspenden
- **Bitácoras son inmutables** — solo append, nunca editar/borrar
- **Agenda es append-only** — solo se puede marcar como completado, nunca borrar
- **Pacientes no pueden modificar info médica** — solo pueden subir archivos
- **Auditoría completa** — cada registro tiene autor (usuario_id) y timestamp
- **Archivos** — guardados por S3 key `{pacienteId}/{timestamp}-{nombre}`, URLs firmadas de 1h
- **Paginación** — 20 elementos por página en bitácora y lista de pacientes
- **Signos vitales** — hasta 3 tomas por entrada de bitácora (sv1/sv2/sv3), cada una con hora y nota de glucosa

---

## Variables de entorno

```
DATABASE_URL          PostgreSQL connection string (Railway)
JWT_SECRET            Clave para firmar/verificar JWTs
AWS_ACCESS_KEY_ID     }
AWS_SECRET_ACCESS_KEY } Credenciales S3
AWS_REGION            } us-east-2
AWS_S3_BUCKET         } expedientes-clinicos-archivos
RESEND_API_KEY        API key de Resend para envío de correos
REMINDER_EMAIL_1      Destinatario 1 de recordatorios
REMINDER_EMAIL_2      Destinatario 2 de recordatorios
REMINDER_EMAIL_3      Destinatario 3 (opcional)
CRON_SECRET           Token para autenticar el endpoint /api/cron/recordatorios
NEXT_PUBLIC_APP_NAME  Nombre público de la app (opcional)
```

---

## Dependencias clave

- `pg` — cliente PostgreSQL
- `jsonwebtoken` — firmar JWTs (server-side)
- `jose` — verificar JWTs en Edge (middleware)
- `bcryptjs` — hash de contraseñas
- `@aws-sdk/client-s3` + `@aws-sdk/s3-request-presigner` — S3
- `resend` — envío de emails
- `multer` — manejo de uploads

---

## Scripts útiles

```bash
npm run dev                          # Desarrollo local
npm run build                        # Build producción
npm run db:indexes                   # Agregar índices a la BD

# Ejecutar scripts de migración (requiere .env.local cargado):
export $(grep -v '^#' .env.local | xargs) && node scripts/<nombre>.js

# Ejemplos:
node scripts/crear-usuario.js            # Crear usuario manual
node scripts/crear-admin-railway.js      # Crear admin en Railway
node scripts/agregar-vitales-multiples.js  # Migración: múltiples tomas de signos vitales
```

> **Nota:** Los scripts en `scripts/` son utilidades de mantenimiento manual. No son importados por la app ni se ejecutan en Railway. Para correrlos necesitan acceso a la BD via `DATABASE_URL`.
