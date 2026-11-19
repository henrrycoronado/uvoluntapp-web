import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it } from 'vitest'
import { LoginScreen } from './LoginScreen'

describe('LoginScreen', () => {
  it('shows a generic API error', async () => {
    const user = userEvent.setup()
    render(<LoginScreen />)
    await user.type(screen.getByLabelText('Correo electrónico'), 'error@example.com')
    await user.type(screen.getByLabelText('Contraseña'), 'password123')
    await user.click(screen.getByRole('button', { name: 'Ingresar' }))
    expect(await screen.findByText('El correo o la contraseña no son válidos.')).toBeInTheDocument()
  })

  it('offers logout after a successful login', async () => {
    const user = userEvent.setup()
    render(<LoginScreen />)
    await user.type(screen.getByLabelText('Correo electrónico'), 'ana@ucb.edu.bo')
    await user.type(screen.getByLabelText('Contraseña'), 'password123')
    await user.click(screen.getByRole('button', { name: 'Ingresar' }))
    await screen.findByText('Sesión iniciada')
    await user.click(screen.getByRole('button', { name: 'Cerrar sesión' }))
    expect(screen.getByRole('button', { name: 'Ingresar' })).toBeInTheDocument()
  })
})
