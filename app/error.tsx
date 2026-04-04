'use client'
import { useEffect } from 'react'

export default function Error({
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
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-10 max-w-md w-full text-center">
        <p className="text-5xl mb-5">⚠️</p>
        <h2 className="text-xl font-bold text-gray-800 mb-2">Algo salió mal</h2>
        <p className="text-base text-gray-500 mb-8">
          Ocurrió un error inesperado. Puedes intentar de nuevo o recargar la página.
        </p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <button
            type="button"
            onClick={reset}
            className="min-h-[48px] px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl transition"
          >
            Intentar de nuevo
          </button>
          <a
            href="/login"
            className="min-h-[48px] px-6 py-3 border border-gray-300 text-gray-700 font-semibold rounded-xl hover:bg-gray-50 transition flex items-center justify-center"
          >
            Ir al inicio
          </a>
        </div>
      </div>
    </div>
  )
}
