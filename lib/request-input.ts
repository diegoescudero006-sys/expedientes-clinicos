const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i

export function isUuid(value: unknown): value is string {
  return typeof value === 'string' && UUID_RE.test(value)
}

export function parsePositiveIntParam(
  searchParams: URLSearchParams,
  name: string,
  fallback: number,
  max = Number.MAX_SAFE_INTEGER
) {
  const raw = searchParams.get(name)
  const value = raw === null || raw.trim() === '' ? fallback : Number(raw)

  if (!Number.isInteger(value) || value < 1) return fallback
  return Math.min(value, max)
}
