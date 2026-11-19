import { describe, expect, it } from 'vitest'
import type { ProfileView, RoleView } from '../../features/profile/api'
import { capabilitiesOf } from './capabilities'

const profileWith = (roles: RoleView[]): ProfileView => ({
  id: 'u1',
  email: 'u1@ucb.edu.bo',
  firstName: 'Ana',
  lastName: 'Quispe',
  accountStatus: 'ACTIVE',
  roles,
  createdAt: '2026-11-19T00:00:00Z',
})

describe('capabilitiesOf', () => {
  it('un voluntario sin roles no abre la consola', () => {
    expect(capabilitiesOf(profileWith([])).canOpenConsole).toBe(false)
  })

  it('el líder de programa conoce los programas que lidera', () => {
    const can = capabilitiesOf(profileWith([{ id: 'r1', role: 'PROGRAM_LEADER', scope: 'PROGRAM', scopeId: 'p1' }]))
    expect(can.isProgramLeader).toBe(true)
    expect(can.ledProgramIds).toEqual(['p1'])
    expect(can.canOpenConsole).toBe(true)
  })

  it('un líder sin programa abre la consola pero no lidera ningún programa', () => {
    const can = capabilitiesOf(profileWith([{ id: 'r1', role: 'PROGRAM_LEADER', scope: 'GLOBAL', scopeId: null }]))
    expect(can.canOpenConsole).toBe(true)
    expect(can.ledProgramIds).toEqual([])
  })

  it('un rol revocado no da capacidades', () => {
    const can = capabilitiesOf(profileWith([{ id: 'r1', role: 'ADMIN', scope: 'GLOBAL', revokedAt: '2026-11-18T00:00:00Z' }]))
    expect(can.isAdmin).toBe(false)
    expect(can.canOpenConsole).toBe(false)
  })
})
