import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { ProfilePage } from './ProfilePage'

const profile = {
  id: '1',
  email: 'ana@ucb.edu.bo',
  firstName: 'Ana',
  lastName: 'Quispe',
  phone: null,
  institutionalEmail: 'ana@ucb.edu.bo',
  accountStatus: 'ACTIVE',
  roles: [{ role: 'PROGRAM_LEADER', scope: 'PROGRAM', scopeId: 'p1' }],
  createdAt: '2026-11-19T00:00:00Z',
}

describe('ProfilePage', () => {
  afterEach(() => {
    vi.unstubAllGlobals()
    sessionStorage.clear()
  })

  it('muestra los datos del perfil y los roles asignados', async () => {
    sessionStorage.setItem('uvoluntapp.session', JSON.stringify({ accessToken: 'a', refreshToken: 'r', expiresAt: '' }))
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response(JSON.stringify(profile), { status: 200 })))

    render(<ProfilePage />)

    expect(await screen.findByRole('heading', { name: 'Ana Quispe' })).toBeInTheDocument()
    expect(screen.getByText('Líder de programa · Programa')).toBeInTheDocument()
    expect(screen.getByText('Activa')).toBeInTheDocument()
  })

  it('cerrar sesión borra la sesión local', async () => {
    sessionStorage.setItem('uvoluntapp.session', JSON.stringify({ accessToken: 'a', refreshToken: 'r', expiresAt: '' }))
    vi.stubGlobal(
      'fetch',
      vi.fn().mockImplementation((url: string) =>
        Promise.resolve(
          url.endsWith('/profile')
            ? new Response(JSON.stringify(profile), { status: 200 })
            : new Response(null, { status: 204 }),
        ),
      ),
    )

    render(<ProfilePage />)
    await screen.findByRole('heading', { name: 'Ana Quispe' })
    fireEvent.click(screen.getByRole('button', { name: 'Cerrar sesión' }))

    await waitFor(() => expect(sessionStorage.getItem('uvoluntapp.session')).toBeNull())
  })
})
