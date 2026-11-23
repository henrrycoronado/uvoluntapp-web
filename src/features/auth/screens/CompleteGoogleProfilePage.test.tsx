import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { setPendingGoogleToken, setPendingNames } from '../session'
import { CompleteGoogleProfilePage } from './CompleteGoogleProfilePage'

describe('CompleteGoogleProfilePage', () => {
  beforeEach(() => {
    const data = new Map<string, string>()
    vi.stubGlobal('sessionStorage', {
      getItem: (k: string) => data.get(k) ?? null,
      setItem: (k: string, v: string) => void data.set(k, v),
      removeItem: (k: string) => void data.delete(k),
    })
  })
  afterEach(() => vi.unstubAllGlobals())

  it('sin token de Google pide volver a iniciar sesión', () => {
    render(<CompleteGoogleProfilePage />)
    expect(screen.getByText(/acceso con Google venció/)).toBeInTheDocument()
  })

  it('valida el teléfono y repite la solicitud con el mismo token y los datos completados', async () => {
    setPendingGoogleToken('id-token-1')
    setPendingNames({ firstName: 'Ana', lastName: 'Paz' })
    const fetchMock = vi.fn(async () =>
      new Response(JSON.stringify({ accountStatus: 'ACTIVE', isNewAccount: true, email: 'ana@ucb.edu.bo', requiresApprovalData: false, tokens: { accessToken: 'a', refreshToken: 'r', expiresAt: '2030-01-01T00:00:00Z' } })),
    )
    vi.stubGlobal('fetch', fetchMock)
    render(<CompleteGoogleProfilePage />)

    await userEvent.click(screen.getByRole('button', { name: 'Continuar' }))
    expect(fetchMock).not.toHaveBeenCalled()

    await userEvent.type(screen.getByLabelText(/Teléfono/), '76543210')
    await userEvent.click(screen.getByRole('button', { name: 'Continuar' }))
    await waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(1))
    const [url, init] = fetchMock.mock.calls[0] as unknown as [string, RequestInit]
    expect(url).toContain('/auth/google')
    expect(JSON.parse(String(init.body))).toEqual({ idToken: 'id-token-1', firstName: 'Ana', lastName: 'Paz', phone: '76543210' })
  })
})
