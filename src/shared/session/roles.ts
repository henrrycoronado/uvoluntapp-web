import type { RoleView } from '../../features/profile/api'

const order: Record<RoleView['role'], number> = { ADMIN: 0, PROGRAM_LEADER: 1, OPERATIONAL_LEADER: 2 }

export const roleLabels: Record<RoleView['role'], string> = {
  ADMIN: 'Administrador',
  PROGRAM_LEADER: 'Líder de programa',
  OPERATIONAL_LEADER: 'Líder operativo',
}

/** Roles vigentes ordenados por jerarquía: administrador, líder de programa, líder operativo. */
export function activeRolesByRank(roles: RoleView[]): RoleView[] {
  return roles.filter((r) => !r.revokedAt).sort((a, b) => order[a.role] - order[b.role])
}
