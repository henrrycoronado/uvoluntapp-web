import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, describe, expect, it, vi } from 'vitest'
import type { Capabilities } from '../../../shared/session/capabilities'
import type { ProfileView } from '../../profile/api'
import { RolesSection } from './RolesSection'

const page = (items: unknown[]) => ({ items, pagination: { page: 1, pageSize: 100, totalCount: items.length, totalPages: 1 } })
const leader: Capabilities = { isAdmin: false, isProgramLeader: true, isOperationalLeader: false, ledProgramIds: ['p1'], canOpenConsole: true }
const profile = { id: 'me', roles: [] } as unknown as ProfileView

describe('RolesSection', () => {
  afterEach(() => vi.unstubAllGlobals())

  it('el líder de programa delega a un operativo sobre una actividad, no sobre el programa', async () => {
    const posted: unknown[] = []
    vi.stubGlobal('fetch', vi.fn(async (url: string, init?: RequestInit) => {
      const u = String(url)
      if (init?.method === 'POST' && u.includes('/role-assignments')) {
        posted.push(JSON.parse(String(init.body)))
        return new Response(JSON.stringify({ id: 'r1' }))
      }
      if (u.includes('/users')) return new Response(JSON.stringify(page([{ id: 'u1', firstName: 'Luis', lastName: 'Rojas', email: 'l@ucb.edu.bo', accountStatus: 'ACTIVE' }])))
      if (u.includes('/programs')) return new Response(JSON.stringify(page([{ id: 'p1', name: 'Comunitario', status: 'ACTIVE' }])))
      if (u.includes('/activities')) return new Response(JSON.stringify(page([{ id: 'act1', title: 'Visita', status: 'PUBLISHED', canManage: true }])))
      return new Response(JSON.stringify(page([])))
    }))

    render(<RolesSection token="t" access="edit" can={leader} profile={profile} />)
    await userEvent.selectOptions(await screen.findByLabelText('Persona'), 'u1')
    await userEvent.selectOptions(screen.getByLabelText('Programa'), 'p1')
    const activity = await screen.findByLabelText('Actividad')
    expect(screen.getByRole('button', { name: 'Asignar' })).toBeDisabled()
    await waitFor(() => expect(screen.getByRole('option', { name: 'Visita' })).toBeInTheDocument())
    await userEvent.selectOptions(activity, 'act1')
    await userEvent.click(screen.getByRole('button', { name: 'Asignar' }))

    await waitFor(() => expect(posted).toHaveLength(1))
    expect(posted[0]).toMatchObject({ userId: 'u1', role: 'OPERATIONAL_LEADER', scope: 'ACTIVITY', scopeId: 'act1' })
  })
})
