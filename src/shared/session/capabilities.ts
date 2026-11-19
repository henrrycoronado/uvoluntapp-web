import type { ProfileView, RoleView } from '../../features/profile/api'

export interface Capabilities {
  isAdmin: boolean
  isProgramLeader: boolean
  isOperationalLeader: boolean
  /** Programas en los que la persona es líder de programa. */
  ledProgramIds: string[]
  /** Cualquier rol distinto de voluntario abre la consola. */
  canOpenConsole: boolean
}

function isActive(role: RoleView): boolean {
  if (role.revokedAt) return false
  return !role.validUntil || new Date(role.validUntil) > new Date()
}

/** Capacidades derivadas de los roles. El servidor valida siempre; esto solo decide qué se muestra. */
export function capabilitiesOf(profile: ProfileView | null): Capabilities {
  const roles = (profile?.roles ?? []).filter(isActive)
  const isAdmin = roles.some((r) => r.role === 'ADMIN')
  const isProgramLeader = roles.some((r) => r.role === 'PROGRAM_LEADER')
  const isOperationalLeader = roles.some((r) => r.role === 'OPERATIONAL_LEADER')
  const ledProgramIds = roles
    .filter((r) => r.role === 'PROGRAM_LEADER' && r.scope === 'PROGRAM' && r.scopeId)
    .map((r) => r.scopeId as string)
  return {
    isAdmin,
    isProgramLeader,
    isOperationalLeader,
    ledProgramIds,
    canOpenConsole: isAdmin || isProgramLeader || isOperationalLeader,
  }
}
