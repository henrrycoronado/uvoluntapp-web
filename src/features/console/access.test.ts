import { describe, expect, it } from 'vitest'
import type { Capabilities } from '../../shared/session/capabilities'
import { visibleSections } from './access'

const base: Capabilities = { isAdmin: false, isProgramLeader: false, isOperationalLeader: false, ledProgramIds: [], canOpenConsole: true }
const levels = (can: Capabilities) => Object.fromEntries(visibleSections(can).map((s) => [s.id, s.level]))

describe('matriz de acceso de la consola', () => {
  it('el ADMIN gestiona todo y revisa la auditoría', () => {
    const admin = levels({ ...base, isAdmin: true })
    expect(admin.usuarios).toBe('edit')
    expect(admin.aprobaciones).toBe('edit')
    expect(admin.administradores).toBe('edit')
    expect(admin.asignaciones).toBe('edit')
    expect(admin.auditoria).toBe('review')
    expect(admin.reportes).toBe('edit')
  })

  it('el líder de programa gestiona roles de su programa pero no aprueba cuentas ni promueve administradores', () => {
    const leader = levels({ ...base, isProgramLeader: true, ledProgramIds: ['p1'] })
    expect(leader.asignaciones).toBe('edit')
    expect(leader.usuarios).toBe('review')
    expect(leader.aprobaciones).toBeUndefined()
    expect(leader.administradores).toBeUndefined()
    expect(leader.reportes).toBe('edit')
    expect(leader.financiero).toBe('review')
  })

  it('el líder operativo revisa y registra, sin reportes ni IA', () => {
    const operative = levels({ ...base, isOperationalLeader: true })
    expect(operative.usuarios).toBe('review')
    expect(operative.asignaciones).toBe('review')
    expect(operative.registros).toBe('edit')
    expect(operative.reportes).toBeUndefined()
    expect(operative.aprobaciones).toBeUndefined()
  })

  it('un voluntario no ve secciones de la consola', () => {
    expect(visibleSections({ ...base, canOpenConsole: false })).toHaveLength(0)
  })
})
