import { fireEvent, render, screen } from '@testing-library/react'
import { useState } from 'react'
import { describe, expect, it } from 'vitest'
import { CodeBoxes } from './CodeBoxes'

function Harness() {
  const [code, setCode] = useState('')
  return (
    <>
      <CodeBoxes label="Código" value={code} onChange={setCode} />
      <output aria-label="valor">{code}</output>
    </>
  )
}

const box = (n: number) => screen.getByLabelText(`Código, dígito ${n} de 6`) as HTMLInputElement

describe('CodeBoxes', () => {
  it('escribe un dígito por casilla, avanza solo e ignora lo que no es número', () => {
    render(<Harness />)
    fireEvent.change(box(1), { target: { value: '4' } })
    expect(box(2)).toHaveFocus()
    fireEvent.change(box(2), { target: { value: 'x' } })
    expect(screen.getByLabelText('valor')).toHaveTextContent('4')
    fireEvent.change(box(2), { target: { value: '7' } })
    expect(screen.getByLabelText('valor')).toHaveTextContent('47')
  })

  it('al pegar un código completo reparte los seis dígitos', () => {
    render(<Harness />)
    fireEvent.paste(box(1), { clipboardData: { getData: () => '123 456' } })
    expect(screen.getByLabelText('valor')).toHaveTextContent('123456')
    expect(box(6).value).toBe('6')
  })

  it('Backspace en una casilla vacía vuelve a la anterior y la borra', () => {
    render(<Harness />)
    fireEvent.change(box(1), { target: { value: '9' } })
    fireEvent.keyDown(box(2), { key: 'Backspace' })
    expect(box(1)).toHaveFocus()
    expect(screen.getByLabelText('valor')).toHaveTextContent('')
  })
})
