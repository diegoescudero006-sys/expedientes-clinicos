import { S3Client, GetObjectCommand } from '@aws-sdk/client-s3'
import { getSignedUrl } from '@aws-sdk/s3-request-presigner'

export const s3 = new S3Client({
  region: process.env.AWS_REGION!,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
  },
})

// Extrae el key de S3 tanto si viene como key puro como si viene como URL pública antigua
// Ej: "abc/123-file.pdf"  →  "abc/123-file.pdf"
// Ej: "https://bucket.s3.region.amazonaws.com/abc/123-file.pdf"  →  "abc/123-file.pdf"
export function extraerKey(urlOrKey: string): string {
  if (!urlOrKey.startsWith('https://')) return urlOrKey
  try {
    const url = new URL(urlOrKey)
    return url.pathname.slice(1) // quita el "/" inicial
  } catch {
    return urlOrKey
  }
}

// Genera una URL firmada que expira en 1 hora
export async function generarUrlFirmada(urlOrKey: string): Promise<string> {
  const key = extraerKey(urlOrKey)
  const command = new GetObjectCommand({
    Bucket: process.env.AWS_S3_BUCKET!,
    Key: key,
  })
  return getSignedUrl(s3, command, { expiresIn: 3600 })
}
