import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { UsersSection } from './UsersSection'

const page = (items: unknown[]) => ({ items, pagination: { page: 1, pageSize: 100, totalCount: items.length, totalPages: 1 } })

describe('UsersSection', () => {
  afterEach(() => vi.unstubAllGlobals())

  it('ya no ofrece verificación manual: la verificación es automática o por reemplazo de correo', async () => {
    const user = { id: 'u1', email: 'ana@gmail.com', firstName: 'Ana', lastName: 'Paz', accountStatus: 'ACTIVE', createdAt: '2026-11-01T00:00:00Z', verifiedAt: null }
    vi.stubGlobal('fetch', vi.fn(async () => new Response(JSON.stringify(page([user])))))

    render(<UsersSection token="t" access="edit" />)
    expect(await screen.findByText('Sin verificar')).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Verificar' })).toBeNull()
    expect(screen.getByRole('button', { name: 'Cambiar correo' })).toBeInTheDocument()
  })

  it('el ADMIN suspende con motivo y reactiva una cuenta', async () => {
    const active = { id: 'u1', email: 'ana@gmail.com', firstName: 'Ana', lastName: 'Paz', accountStatus: 'ACTIVE', createdAt: '2026-11-01T00:00:00Z', verifiedAt: '2026-11-02T00:00:00Z' }
    const suspended = { ...active, id: 'u2', email: 'luis@gmail.com', accountStatus: 'SUSPENDED' }
    const fetchMock = vi.fn(async (url: string) =>
      String(url).includes('/suspend') || String(url).includes('/reactivate') ? new Response(JSON.stringify({ message: 'ok' })) : new Response(JSON.stringify(page([active, suspended]))),
    )
    vi.stubGlobal('fetch', fetchMock)

    render(<UsersSection token="t" access="edit" />)
    await screen.findByText('ana@gmail.com')
    fireEvent.click(screen.getByRole('button', { name: 'Reactivar' }))
    fireEvent.click(screen.getByRole('button', { name: 'Confirmar reactivación' }))
    await waitFor(() => expect(fetchMock.mock.calls.some(([url]) => String(url).endsWith('/users/u2/reactivate'))).toBe(true))
  })

  it('un líder solo revisa: ve la verificación pero no las acciones', async () => {
    const user = { id: 'u1', email: 'ana@ucb.edu.bo', firstName: 'Ana', lastName: 'Paz', accountStatus: 'ACTIVE', createdAt: '2026-11-01T00:00:00Z', verifiedAt: '2026-11-02T00:00:00Z' }
    vi.stubGlobal('fetch', vi.fn(async () => new Response(JSON.stringify(page([user])))))

    render(<UsersSection token="t" access="review" />)
    expect(await screen.findByText('Verificada')).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Cambiar correo' })).toBeNull()
  })
})
