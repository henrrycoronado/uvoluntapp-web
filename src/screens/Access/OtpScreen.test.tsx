import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { OtpScreen } from './OtpScreen'

describe('OtpScreen', () => {
  it('validates and reports an expired code', async () => {
    const user = userEvent.setup()
    render(<OtpScreen email="ana@ucb.edu.bo" firstName="Ana" lastName="Pérez" onVerified={vi.fn()} />)
    await user.type(screen.getByLabelText('Código de verificación'), '000000')
    await user.click(screen.getByRole('button', { name: 'Verificar código' }))
    expect(await screen.findByText(/código expiró/i)).toBeInTheDocument()
  })

  it('verifies a valid institutional code', async () => {
    const onVerified = vi.fn()
    const user = userEvent.setup()
    render(<OtpScreen email="ana@ucb.edu.bo" firstName="Ana" lastName="Pérez" onVerified={onVerified} />)
    await user.type(screen.getByLabelText('Código de verificación'), '123456')
    await user.click(screen.getByRole('button', { name: 'Verificar código' }))
    await screen.findByText('Correo verificado. Ya puedes iniciar sesión.')
    expect(onVerified).toHaveBeenCalledOnce()
  })
})
