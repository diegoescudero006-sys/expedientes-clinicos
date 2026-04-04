'use client'
import { useEffect } from 'react'

// Se activa cuando falla el layout raíz — no tiene acceso a CSS de Tailwind
export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error(error)
  }, [error])

  return (
    <html lang="es">
      <body style={{ margin: 0, fontFamily: 'Arial, sans-serif', background: '#f9fafb' }}>
        <div style={{
          minHeight: '100vh', display: 'flex', alignItems: 'center',
          justifyContent: 'center', padding: '1rem'
        }}>
          <div style={{
            background: '#fff', borderRadius: '1rem', border: '1px solid #e5e7eb',
            padding: '2.5rem', maxWidth: '420px', width: '100%', textAlign: 'center'
          }}>
            <p style={{ fontSize: '3rem', marginBottom: '1rem' }}>🏥</p>
            <h2 style={{ fontSize: '1.25rem', fontWeight: 700, color: '#1f2937', marginBottom: '0.5rem' }}>
              El servicio no está disponible
            </h2>
            <p style={{ color: '#6b7280', marginBottom: '2rem', lineHeight: 1.6 }}>
              Estamos teniendo problemas técnicos. Por favor intenta de nuevo en unos minutos.
            </p>
            <button
              onClick={reset}
              style={{
                background: '#2563eb', color: '#fff', border: 'none',
                borderRadius: '0.75rem', padding: '0.75rem 1.5rem',
                fontSize: '1rem', fontWeight: 600, cursor: 'pointer'
              }}
            >
              Intentar de nuevo
            </button>
          </div>
        </div>
      </body>
    </html>
  )
}
