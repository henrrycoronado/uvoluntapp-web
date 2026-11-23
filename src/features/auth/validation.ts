/** Reglas de CONTEXT.md repetidas en el cliente; el servidor sigue siendo la autoridad. */
export const PASSWORD_MIN = 8

/** Longitudes máximas del contrato (openapi.yaml) para los datos de cuenta. */
export const LIMITS = { email: 256, password: 128, personName: 100, phone: 30, relationship: 200, reason: 500 } as const

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

export function emailError(value: string): string | undefined {
  const email = value.trim()
  if (!email) return 'Escribe tu correo.'
  if (!EMAIL.test(email)) return 'Escribe un correo válido, por ejemplo nombre@ucb.edu.bo.'
  return undefined
}

export function requiredError(value: string, label: string): string | undefined {
  return value.trim() ? undefined : `Escribe ${label}.`
}

export function passwordError(value: string): string | undefined {
  if (!value) return 'Escribe una contraseña.'
  if (value.length < PASSWORD_MIN) return `La contraseña necesita al menos ${PASSWORD_MIN} caracteres.`
  return undefined
}

export function confirmError(password: string, confirmation: string): string | undefined {
  if (!confirmation) return 'Repite la contraseña.'
  return password === confirmation ? undefined : 'Las contraseñas no coinciden.'
}

export function phoneError(value: string): string | undefined {
  const phone = value.trim()
  if (!phone) return 'Escribe tu teléfono.'
  if (!/^\+?[0-9\s-]{7,20}$/.test(phone)) return 'Escribe un teléfono válido, solo números.'
  return undefined
}

export function codeError(value: string): string | undefined {
  return /^[0-9]{6}$/.test(value) ? undefined : 'El código tiene 6 dígitos.'
}

export const isInstitutional = (email: string) => email.trim().toLowerCase().endsWith('@ucb.edu.bo')
