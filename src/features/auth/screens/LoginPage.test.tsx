import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { LoginPage } from './LoginPage'

describe('LoginPage', () => {
  afterEach(() => {
    vi.unstubAllGlobals()
    sessionStorage.clear()
  })

  it('muestra un mensaje claro cuando las credenciales no son válidas', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue(
        new Response(JSON.stringify({ type: 'about:blank', title: 'x', status: 401 }), { status: 401 }),
      ),
    )

    render(<LoginPage />)
    fireEvent.change(screen.getByLabelText('Correo'), { target: { value: 'admin@uvoluntapp.test' } })
    fireEvent.change(screen.getByLabelText('Contraseña'), { target: { value: 'incorrecta' } })
    fireEvent.click(screen.getByRole('button', { name: 'Entrar' }))

    expect(await screen.findByRole('alert')).toHaveTextContent('Correo o contraseña incorrectos.')
    expect(sessionStorage.getItem('uvoluntapp.session')).toBeNull()
  })

  it('guarda la sesión cuando el inicio de sesión es correcto', async () => {
    const tokens = { accessToken: 'a', refreshToken: 'r', expiresAt: '2030-01-01T00:00:00Z' }
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response(JSON.stringify(tokens), { status: 200 })))

    render(<LoginPage />)
    fireEvent.change(screen.getByLabelText('Correo'), { target: { value: 'admin@uvoluntapp.test' } })
    fireEvent.change(screen.getByLabelText('Contraseña'), { target: { value: 'correcta' } })
    fireEvent.click(screen.getByRole('button', { name: 'Entrar' }))

    await waitFor(() => expect(sessionStorage.getItem('uvoluntapp.session')).not.toBeNull())
    expect(JSON.parse(sessionStorage.getItem('uvoluntapp.session')!).accessToken).toBe('a')
  })
})
