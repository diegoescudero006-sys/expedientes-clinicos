type TurnoClases = {
  card: string
  texto: string
  hora: string
}

export function turnoClases(createdAt: string): TurnoClases {
  const hora = new Date(createdAt).getHours()
  // 8am–2pm: azul
  if (hora >= 8 && hora < 14) return {
    card: 'border-l-4 border-l-blue-500',
    texto: 'text-blue-700',
    hora: 'text-blue-400',
  }
  // 2pm–8pm: verde
  if (hora >= 14 && hora < 20) return {
    card: 'border-l-4 border-l-green-500',
    texto: 'text-green-700',
    hora: 'text-green-400',
  }
  // 8pm–8am: rojo
  return {
    card: 'border-l-4 border-l-red-500',
    texto: 'text-red-700',
    hora: 'text-red-400',
  }
}
