import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { RegisterScreen } from './RegisterScreen'

describe('RegisterScreen', () => {
  it('validates required fields', async () => {
    const user = userEvent.setup()
    render(<RegisterScreen onRegistered={vi.fn()} />)
    await user.click(screen.getByRole('button', { name: 'Continuar' }))
    expect(screen.getByText(/Completa todos los campos/)).toBeInTheDocument()
  })

  it('shows an API problem without exposing account existence', async () => {
    const user = userEvent.setup()
    render(<RegisterScreen onRegistered={vi.fn()} />)
    await user.type(screen.getByLabelText('Correo electrónico'), 'error@ucb.edu.bo')
    await user.type(screen.getByLabelText('Nombres'), 'Ana')
    await user.type(screen.getByLabelText('Apellidos'), 'Pérez')
    await user.type(screen.getByLabelText('Contraseña'), 'password123')
    await user.click(screen.getByRole('button', { name: 'Continuar' }))
    expect(await screen.findByText('Revisa los datos ingresados e intenta de nuevo.')).toBeInTheDocument()
    expect(screen.queryByText(/correo existe/i)).not.toBeInTheDocument()
  })
})
