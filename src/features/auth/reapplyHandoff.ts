/**
 * Paso del inicio de sesión a la nueva solicitud. Vive solo en memoria: la contraseña
 * nunca se guarda en el navegador y al recargar se vuelve a pedir.
 */
interface Handoff {
  password: string
  reason: string
}

let handoff: Handoff | null = null

export function giveReapplyHandoff(value: Handoff): void {
  handoff = value
}

export function takeReapplyHandoff(): Handoff | null {
  const value = handoff
  handoff = null
  return value
}
