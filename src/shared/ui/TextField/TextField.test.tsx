import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { TextField } from './TextField'

describe('TextField', () => {
  it('muestra y oculta la contraseña con un botón accesible', () => {
    render(<TextField label="Contraseña" type="password" />)
    const input = screen.getByLabelText('Contraseña')
    const toggle = screen.getByRole('button', { name: 'Mostrar contraseña' })
    expect(input).toHaveAttribute('type', 'password')
    expect(toggle).toHaveAttribute('aria-pressed', 'false')

    fireEvent.click(toggle)
    expect(input).toHaveAttribute('type', 'text')
    expect(screen.getByRole('button', { name: 'Ocultar contraseña' })).toHaveAttribute('aria-pressed', 'true')
  })

  it('no agrega el botón a otros campos', () => {
    render(<TextField label="Correo" type="email" />)
    expect(screen.queryByRole('button')).toBeNull()
  })
})
