import { describe, expect, it } from 'vitest'
import type { Capabilities } from '../../shared/session/capabilities'
import { visibleSections } from './access'

const base: Capabilities = { isAdmin: false, isProgramLeader: false, isOperationalLeader: false, ledProgramIds: [], canOpenConsole: true }
const levels = (can: Capabilities) => Object.fromEntries(visibleSections(can).map((s) => [s.id, s.level]))

describe('matriz de acceso de la consola', () => {
  it('periodos es solo del ADMIN e inscripciones está activa para quien gestiona', () => {
    const admin = visibleSections({ ...base, isAdmin: true })
    expect(admin.find((s) => s.id === 'periodos')).toMatchObject({ level: 'edit', live: true })
    expect(admin.find((s) => s.id === 'inscripciones')).toMatchObject({ level: 'edit', live: true })
    expect(levels({ ...base, isProgramLeader: true, ledProgramIds: ['p1'] }).periodos).toBeUndefined()
    expect(levels({ ...base, isOperationalLeader: true }).inscripciones).toBe('review')
  })

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

  it('M2: actividades y agregación están activas; gestionan ADMIN y PL, el operativo revisa', () => {
    const live = Object.fromEntries(visibleSections({ ...base, isAdmin: true }).map((s) => [s.id, s.live]))
    expect(live.actividades).toBe(true)
    expect(live.agregacion).toBe(true)
    expect(levels({ ...base, isProgramLeader: true }).actividades).toBe('edit')
    expect(levels({ ...base, isOperationalLeader: true }).actividades).toBe('review')
    expect(levels({ ...base, isOperationalLeader: true }).agregacion).toBe('review')
  })

  it('un voluntario no ve secciones de la consola', () => {
    expect(visibleSections({ ...base, canOpenConsole: false })).toHaveLength(0)
  })
})
