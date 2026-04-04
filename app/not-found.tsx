import Link from 'next/link'

export default function NotFound() {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-10 max-w-md w-full text-center">
        <p className="text-5xl mb-5">🔍</p>
        <h2 className="text-xl font-bold text-gray-800 mb-2">Página no encontrada</h2>
        <p className="text-base text-gray-500 mb-8">
          La página que buscas no existe o fue movida.
        </p>
        <Link
          href="/login"
          className="inline-flex items-center justify-center min-h-[48px] px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl transition"
        >
          Ir al inicio
        </Link>
      </div>
    </div>
  )
}
