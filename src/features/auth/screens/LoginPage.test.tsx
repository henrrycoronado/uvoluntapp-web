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
    fireEvent.change(screen.getByLabelText('Correo electrónico'), { target: { value: 'admin@uvoluntapp.test' } })
    fireEvent.change(screen.getByLabelText('Contraseña'), { target: { value: 'incorrecta' } })
    fireEvent.click(screen.getByRole('button', { name: 'Iniciar sesión' }))

    expect(await screen.findByRole('alert')).toHaveTextContent('Correo o contraseña incorrectos.')
    expect(sessionStorage.getItem('uvoluntapp.session')).toBeNull()
  })

  it('guarda la sesión cuando el inicio de sesión es correcto', async () => {
    const tokens = { accessToken: 'a', refreshToken: 'r', expiresAt: '2030-01-01T00:00:00Z' }
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response(JSON.stringify(tokens), { status: 200 })))

    render(<LoginPage />)
    fireEvent.change(screen.getByLabelText('Correo electrónico'), { target: { value: 'admin@uvoluntapp.test' } })
    fireEvent.change(screen.getByLabelText('Contraseña'), { target: { value: 'correcta' } })
    fireEvent.click(screen.getByRole('button', { name: 'Iniciar sesión' }))

    await waitFor(() => expect(sessionStorage.getItem('uvoluntapp.session')).not.toBeNull())
    expect(JSON.parse(sessionStorage.getItem('uvoluntapp.session')!).accessToken).toBe('a')
  })

  it('lleva a crear contraseña cuando la cuenta se creó con Google', async () => {
    const problem = { type: 'urn:uvoluntapp:password-setup-required', title: 'x', status: 409 }
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response(JSON.stringify(problem), { status: 409 })))

    render(<LoginPage />)
    fireEvent.change(screen.getByLabelText('Correo electrónico'), { target: { value: 'ana@gmail.com' } })
    fireEvent.change(screen.getByLabelText('Contraseña'), { target: { value: 'cualquiera' } })
    fireEvent.click(screen.getByRole('button', { name: 'Iniciar sesión' }))

    await waitFor(() => expect(window.location.pathname).toBe('/crear-contrasena'))
    expect(sessionStorage.getItem('uvoluntapp.pendingEmail')).toBe('ana@gmail.com')
  })

  it('informa cuándo podrá volver a postular una cuenta rechazada', async () => {
    const problem = {
      type: 'urn:uvoluntapp:inactive-account',
      title: 'x',
      status: 422,
      accountStatus: 'REJECTED',
      rejectionReason: 'Sin vínculo',
      reapplyAvailableAt: '2999-01-01T12:00:00Z',
    }
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response(JSON.stringify(problem), { status: 422 })))

    render(<LoginPage />)
    fireEvent.change(screen.getByLabelText('Correo electrónico'), { target: { value: 'ana@gmail.com' } })
    fireEvent.change(screen.getByLabelText('Contraseña'), { target: { value: 'correcta1' } })
    fireEvent.click(screen.getByRole('button', { name: 'Iniciar sesión' }))

    expect(await screen.findByRole('alert')).toHaveTextContent('Motivo: Sin vínculo')
  })
})
