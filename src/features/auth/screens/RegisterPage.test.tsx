import { fireEvent, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { RegisterPage } from './RegisterPage'

describe('RegisterPage', () => {
  afterEach(() => {
    vi.unstubAllGlobals()
    sessionStorage.clear()
  })

  it('valida en el cliente y enfoca el primer campo con error', () => {
    const fetchMock = vi.fn()
    vi.stubGlobal('fetch', fetchMock)
    render(<RegisterPage />)

    fireEvent.change(screen.getByLabelText('Nombres'), { target: { value: 'Ana' } })
    fireEvent.change(screen.getByLabelText('Apellidos'), { target: { value: 'Paz' } })
    fireEvent.change(screen.getByLabelText('Teléfono'), { target: { value: '70000000' } })
    fireEvent.change(screen.getByLabelText('Correo'), { target: { value: 'ana@' } })
    fireEvent.change(screen.getByLabelText('Contraseña'), { target: { value: 'secreta123' } })
    fireEvent.change(screen.getByLabelText('Repite la contraseña'), { target: { value: 'otra12345' } })
    fireEvent.click(screen.getByRole('button', { name: 'Continuar' }))

    expect(screen.getByText(/Escribe un correo válido/)).toBeInTheDocument()
    expect(screen.getByText('Las contraseñas no coinciden.')).toBeInTheDocument()
    expect(screen.getByLabelText('Correo')).toHaveFocus()
    expect(fetchMock).not.toHaveBeenCalled()
  })

  it('envía el teléfono y pasa a verificar el correo', async () => {
    const fetchMock = vi.fn().mockResolvedValue(new Response(JSON.stringify({ message: 'ok' }), { status: 200 }))
    vi.stubGlobal('fetch', fetchMock)
    render(<RegisterPage />)

    fireEvent.change(screen.getByLabelText('Nombres'), { target: { value: 'Ana' } })
    fireEvent.change(screen.getByLabelText('Apellidos'), { target: { value: 'Paz' } })
    fireEvent.change(screen.getByLabelText('Teléfono'), { target: { value: '70000000' } })
    fireEvent.change(screen.getByLabelText('Correo'), { target: { value: 'ana@ucb.edu.bo' } })
    fireEvent.change(screen.getByLabelText('Contraseña'), { target: { value: 'secreta123' } })
    fireEvent.change(screen.getByLabelText('Repite la contraseña'), { target: { value: 'secreta123' } })
    fireEvent.click(screen.getByRole('button', { name: 'Continuar' }))

    await vi.waitFor(() => expect(window.location.pathname).toBe('/verificar'))
    await screen.findByRole('button', { name: 'Continuar' })
    expect(JSON.parse(fetchMock.mock.calls[0][1].body as string)).toMatchObject({ phone: '70000000', email: 'ana@ucb.edu.bo' })
    expect(sessionStorage.getItem('uvoluntapp.pendingEmail')).toBe('ana@ucb.edu.bo')
  })
})
