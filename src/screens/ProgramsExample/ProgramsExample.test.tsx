import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it } from 'vitest'
import { ProgramsExample } from './ProgramsExample'

describe('ProgramsExample', () => {
  it('renders the data state by default', () => {
    render(<ProgramsExample />)
    expect(
      screen.getByText('Voluntariado Comunitario 2026'),
    ).toBeInTheDocument()
    expect(screen.getByText('Tutorías Académicas')).toBeInTheDocument()
  })

  it('shows loading state', async () => {
    const user = userEvent.setup()
    render(<ProgramsExample />)

    await user.click(screen.getByRole('button', { name: 'Carga' }))

    expect(screen.getByRole('status')).toBeInTheDocument()
    expect(screen.getByText('Cargando programas…')).toBeInTheDocument()
  })

  it('shows empty state', async () => {
    const user = userEvent.setup()
    render(<ProgramsExample />)

    await user.click(screen.getByRole('button', { name: 'Vacío' }))

    expect(screen.getByText('Sin programas')).toBeInTheDocument()
  })

  it('shows error state with retry action', async () => {
    const user = userEvent.setup()
    render(<ProgramsExample />)

    await user.click(screen.getByRole('button', { name: 'Error' }))

    expect(screen.getByText('Error al cargar programas')).toBeInTheDocument()
    expect(
      screen.getByRole('button', { name: 'Reintentar' }),
    ).toBeInTheDocument()
  })

  it('shows access denied state', async () => {
    const user = userEvent.setup()
    render(<ProgramsExample />)

    await user.click(screen.getByRole('button', { name: 'Denegado' }))

    expect(screen.getByText('Acceso denegado')).toBeInTheDocument()
  })

  it('transitions from error back to data on retry', async () => {
    const user = userEvent.setup()
    render(<ProgramsExample />)

    await user.click(screen.getByRole('button', { name: 'Error' }))
    expect(screen.getByText('Error al cargar programas')).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: 'Reintentar' }))
    expect(
      screen.getByText('Voluntariado Comunitario 2026'),
    ).toBeInTheDocument()
  })
})
