import { afterEach, describe, expect, it, vi } from 'vitest'
import { installSessionRefresh, readSession, writeSession } from '../../features/auth/session'
import { fetchImage, request } from './http'

describe('request', () => {
  afterEach(() => {
    vi.unstubAllGlobals()
    sessionStorage.clear()
  })

  it('renueva la sesión una vez ante un 401 y reintenta con el token nuevo', async () => {
    installSessionRefresh()
    writeSession({ accessToken: 'viejo', refreshToken: 'r1', expiresAt: '2030-01-01T00:00:00Z' })
    const fetchMock = vi.fn(async (url: string, init: RequestInit) => {
      if (url.endsWith('/auth/refresh')) {
        return new Response(JSON.stringify({ accessToken: 'nuevo', refreshToken: 'r2', expiresAt: '2030-01-01T00:00:00Z' }))
      }
      const auth = (init.headers as Record<string, string>).Authorization
      return auth === 'Bearer nuevo'
        ? new Response(JSON.stringify({ ok: true }))
        : new Response(JSON.stringify({ type: 'about:blank', title: 'x', status: 401 }), { status: 401 })
    })
    vi.stubGlobal('fetch', fetchMock)

    const [a, b] = await Promise.all([
      request<{ ok: boolean }>('/profile', { token: 'viejo' }),
      request<{ ok: boolean }>('/users', { token: 'viejo' }),
    ])

    expect(a.ok && b.ok).toBe(true)
    expect(fetchMock.mock.calls.filter(([url]) => String(url).endsWith('/auth/refresh'))).toHaveLength(1)
    expect(readSession()?.refreshToken).toBe('r2')
  })

  it('no rompe con respuestas que no son JSON', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response('<html>Bad gateway</html>', { status: 502 })))
    await expect(request('/profile')).rejects.toMatchObject({ status: 502 })
  })
})

describe('fetchImage', () => {
  afterEach(() => vi.unstubAllGlobals())

  it('descarga sin cookies y con la sesión en Authorization, para que R2 no exija Allow-Credentials', async () => {
    const fetchMock = vi.fn(async () => new Response(new Blob(['x'], { type: 'image/webp' })))
    vi.stubGlobal('fetch', fetchMock)
    const blob = await fetchImage('/programs/p1/cover?thumbnail=true', 'tok')
    expect(blob).not.toBeNull()
    const [url, init] = fetchMock.mock.calls[0] as unknown as [string, RequestInit]
    expect(url).toContain('/programs/p1/cover')
    expect(init.credentials).toBe('omit')
    expect((init.headers as Record<string, string>).Authorization).toBe('Bearer tok')
  })

  it('devuelve null si la imagen no existe', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => new Response(null, { status: 404 })))
    expect(await fetchImage('/programs/p1/cover', 'tok')).toBeNull()
  })
})
