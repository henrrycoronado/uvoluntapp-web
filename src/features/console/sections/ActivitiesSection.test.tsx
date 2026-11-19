import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, describe, expect, it, vi } from 'vitest'
import type { Capabilities } from '../../../shared/session/capabilities'
import { ActivitiesSection } from './ActivitiesSection'

const page = (items: unknown[]) => ({ items, meta: { page: 1, pageSize: 200, totalCount: items.length, totalPages: 1 } })
const base: Capabilities = { isAdmin: false, isProgramLeader: false, isOperationalLeader: false, ledProgramIds: [], canOpenConsole: true }

const activity = (over: Record<string, unknown>) => ({
  id: 'a1', programId: 'p1', programName: 'Comunitario', periodId: 'per1', status: 'DRAFT', title: 'Visita', description: null,
  modality: 'IN_PERSON', location: 'Plaza', meetingUrl: null, startsAt: '2026-11-22T13:00:00Z', endsAt: '2026-11-22T15:00:00Z',
  requiresRegistration: false, capacity: null, expectedHours: null, participationConditions: null, periodicityNote: null, groupLabel: null,
  createdAt: '2026-11-01T00:00:00Z', canManage: false, canMove: false, ...over,
})

function stub(activities: unknown[], programs: unknown[]) {
  vi.stubGlobal(
    'fetch',
    vi.fn(async (url: string) => {
      const u = String(url)
      if (u.includes('/catalog/periods')) return new Response(JSON.stringify([]))
      if (u.includes('/team')) return new Response(JSON.stringify([]))
      if (u.includes('/reschedules')) return new Response(JSON.stringify([]))
      if (u.includes('/programs')) return new Response(JSON.stringify(page(programs)))
      return new Response(JSON.stringify(page(activities)))
    }),
  )
}

const program = (canManage: boolean) => ({ id: 'p1', name: 'Comunitario', status: 'ACTIVE', createdAt: '2026-11-01T00:00:00Z', canManage })

describe('ActivitiesSection', () => {
  afterEach(() => vi.unstubAllGlobals())

  it('el líder que gestiona ve crear, editar y publicar, pero no mover', async () => {
    stub([activity({ canManage: true })], [program(true)])
    render(<ActivitiesSection token="t" can={{ ...base, isProgramLeader: true, ledProgramIds: ['p1'] }} access="edit" />)
    await userEvent.click(await screen.findByRole('button', { name: /Visita/ }))
    expect(screen.getByRole('button', { name: 'Nueva actividad' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Editar' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Publicar' })).toBeInTheDocument()
    expect(screen.queryByRole('group', { name: 'Mover actividad' })).toBeNull()
  })

  it('el ADMIN puede mover la actividad', async () => {
    stub([activity({ canManage: true, canMove: true, status: 'PUBLISHED' })], [program(true)])
    render(<ActivitiesSection token="t" can={{ ...base, isAdmin: true }} access="edit" />)
    await userEvent.click(await screen.findByRole('button', { name: /Visita/ }))
    expect(screen.getByRole('group', { name: 'Mover actividad' })).toBeInTheDocument()
    expect(screen.getByRole('group', { name: 'Reprogramar' })).toBeInTheDocument()
  })

  it('el líder operativo solo consulta', async () => {
    stub([activity({ status: 'PUBLISHED' })], [program(false)])
    render(<ActivitiesSection token="t" can={{ ...base, isOperationalLeader: true }} access="review" />)
    await userEvent.click(await screen.findByRole('button', { name: /Visita/ }))
    expect(screen.getByText(/Solo consulta/)).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Nueva actividad' })).toBeNull()
    expect(screen.queryByRole('button', { name: 'Editar' })).toBeNull()
    expect(screen.queryByRole('button', { name: 'Cancelar actividad' })).toBeNull()
  })
})
