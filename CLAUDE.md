@AGENTS.md
# Sistema de Expedientes Clínicos — Enfermería a Domicilio

## Objetivo
App web para gestión de expedientes clínicos. Enfermeros administran todo, pacientes solo consultan.

## Stack
- Next.js 16 (App Router) + TypeScript
- PostgreSQL en Railway
- AWS S3 para archivos
- JWT en cookies para autenticación
- Deploy en Railway

## Roles
- **enfermero**: acceso total, crea pacientes, bitácoras, medicamentos
- **paciente**: solo ve su propio expediente, puede subir archivos

## Estructura clave
- `app/api/` — todos los endpoints REST
- `app/dashboard/` — vista principal del enfermero
- `app/pacientes/[id]/` — expediente desde vista enfermero
- `app/mi-expediente/` — expediente desde vista paciente
- `lib/auth.ts` — función getUsuario() centralizada
- `lib/db.ts` — conexión PostgreSQL

## Reglas de negocio importantes
- Nada se borra permanentemente (solo archivar/suspender)
- Bitácoras son inmutables (solo se agregan)
- Pacientes no pueden modificar info médica
- Cada registro tiene autor y timestamp

## Variables de entorno necesarias
DATABASE_URL, JWT_SECRET, AWS_ACCESS_KEY_ID, AWS_SECRET_ACCESS_KEY, AWS_REGION, AWS_S3_BUCKET