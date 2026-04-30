export class PatientInputError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'PatientInputError'
  }
}

function isBlank(value: unknown) {
  return value === null || value === undefined || (typeof value === 'string' && value.trim() === '')
}

export function requiredInteger(value: unknown, label: string) {
  if (isBlank(value)) {
    throw new PatientInputError(`${label} es requerido`)
  }

  const numberValue = Number(value)
  if (!Number.isInteger(numberValue)) {
    throw new PatientInputError(`${label} debe ser un numero entero`)
  }

  return numberValue
}

export function optionalInteger(value: unknown, label: string) {
  if (isBlank(value)) return null

  const numberValue = Number(value)
  if (!Number.isInteger(numberValue)) {
    throw new PatientInputError(`${label} debe ser un numero entero`)
  }

  return numberValue
}

export function optionalNumber(value: unknown, label: string) {
  if (isBlank(value)) return null

  const numberValue = Number(value)
  if (!Number.isFinite(numberValue)) {
    throw new PatientInputError(`${label} debe ser un numero valido`)
  }

  return numberValue
}
