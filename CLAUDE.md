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

## Roles
- **enfermero**: acceso total — crea/edita pacientes, bitácoras, medicamentos, usuarios; gestiona enfermeros
- **paciente**: solo ve su propio expediente, puede subir archivos a su propio expediente

---

## Estructura de archivos

```
app/
  api/
    auth/login/       POST — login con rate limiting (5 intentos/min por IP)
    auth/logout/      POST — limpia cookie
    pacientes/
      route.ts                  GET (lista paginada+búsqueda) | POST (crear)
      [id]/route.ts             GET | PUT (actualizar)
      [id]/bitacora/route.ts    GET (paginado 20/pág) | POST (agregar entrada)
      [id]/medicamentos/route.ts GET | POST (agregar)
      [id]/archivos/route.ts    GET (signed URLs)
      [id]/archivar/route.ts    POST (archivar paciente)
      [id]/suspender-medicamento/route.ts  POST
    mi-expediente/
      route.ts          GET — expediente propio del paciente
      medicamentos/     GET
      bitacora/         GET (paginado)
      archivos/route.ts GET (signed URLs) | POST (subir archivo)
    archivos/           POST — subir archivo a S3 (PDF/JPG/PNG, máx 10MB)
    usuarios/
      route.ts          POST — crear usuario (enfermero only)
      [id]/cambiar-password/  POST
    enfermeros/
      route.ts          GET — listar enfermeros
      [id]/route.ts     DELETE (cascade)
  components/
    ExpedienteImprimible.tsx  — componente de impresión compartido
  dashboard/            Vista principal enfermero (lista pacientes, búsqueda, filtros)
  pacientes/
    nuevo/              Crear paciente
    [id]/               Ver/editar expediente
    [id]/imprimir/      Reporte imprimible
  enfermeros/           Gestión de enfermeros
  usuarios/nuevo/       Crear usuario
  mi-expediente/        Vista paciente de su expediente
  mi-expediente/imprimir/
  login/
  layout.tsx, page.tsx (redirect a /login)

lib/
  db.ts               Pool PostgreSQL (DATABASE_URL, SSL)
  auth.ts             getUsuario(req) — extrae JWT de cookies (jsonwebtoken)
  auth-constants.ts   AUTH_COOKIE_NAME='token', tipo UsuarioJwt
  jwt-edge.ts         verifyUsuarioJwtEdge() — verificación Edge-compatible (jose)
  authz.ts            requirePacienteAccess(), medicamentoPerteneceAPaciente()
  s3.ts               Cliente S3, getSignedUrl(), extracción de keys
  paciente-del-usuario.ts  findPacienteByUsuarioId()
  schema.sql          Schema completo de la BD
  init-db.ts          Script de inicialización de BD

middleware.ts         Auth y RBAC en el edge (corre en cada request)
next.config.ts        reactCompiler: true, output: 'standalone'
```

---

## Base de datos — Tablas

| Tabla | Propósito |
|-------|-----------|
| `usuarios` | id (UUID), nombre, email (UNIQUE), password (bcrypt), rol, created_at |
| `pacientes` | Expediente completo — datos personales, clínicos, diagnóstico, antecedentes; usuario_id FK; archivado BOOL |
| `enfermeros_pacientes` | Asignación enfermero ↔ paciente |
| `bitacora` | Entradas de notas — paciente_id, enfermero_id, observaciones, estado_paciente; append-only |
| `medicamentos` | nombre, dosis, horario, fecha_inicio/fin, indeterminado BOOL, activo BOOL, suspendido_at |
| `archivos` | S3 key (no URL pública), paciente_id, subido_por, tipo MIME, nombre_archivo |

---

## Flujo de autenticación

1. `POST /api/auth/login` → verifica email+bcrypt → genera JWT `{id, email, rol, nombre}` → cookie `token` HttpOnly 8h
2. `middleware.ts` corre en edge — usa `jose` para verificar token en cada request
3. Rutas públicas: `/login`, `/api/auth/*`
4. Pacientes solo pueden acceder a `/mi-expediente/*` y `/api/mi-expediente/*`
5. En API routes: `getUsuario(req)` de `lib/auth.ts` (usa `jsonwebtoken`)
6. `requirePacienteAccess()` en `lib/authz.ts` devuelve 404 si no tiene acceso (no filtra info)

---

## Reglas de negocio

- **Nada se borra permanentemente** — pacientes se archivan, medicamentos se suspenden
- **Bitácoras son inmutables** — solo append, nunca editar/borrar
- **Pacientes no pueden modificar info médica** — solo pueden subir archivos a su propio expediente
- **Auditoría completa** — cada registro tiene autor (usuario_id) y timestamp
- **Archivos** — guardados por S3 key `{pacienteId}/{timestamp}-{nombre}`, URLs firmadas de 1h
- **Paginación** — 20 elementos por página en bitácora y lista de pacientes

---

## Variables de entorno

```
DATABASE_URL          PostgreSQL connection string (Railway)
JWT_SECRET            Clave para firmar/verificar JWTs
AWS_ACCESS_KEY_ID     }
AWS_SECRET_ACCESS_KEY } Credenciales S3
AWS_REGION            } us-east-2
AWS_S3_BUCKET         } expedientes-clinicos-archivos
NEXT_PUBLIC_APP_NAME  Nombre público de la app (opcional)
```

---

## Dependencias clave

- `pg` — cliente PostgreSQL
- `jsonwebtoken` — firmar JWTs (server-side)
- `jose` — verificar JWTs en Edge (middleware)
- `bcryptjs` — hash de contraseñas
- `@aws-sdk/client-s3` + `@aws-sdk/s3-request-presigner` — S3
- `multer` — manejo de uploads

---

## Scripts útiles

```bash
npm run dev          # Desarrollo
npm run build        # Build producción
npm run db:indexes   # Agregar índices a la BD
node crear-usuario.js            # Crear usuario manual
node crear-admin-railway.js      # Crear admin en Railway
```
