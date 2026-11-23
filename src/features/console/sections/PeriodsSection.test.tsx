import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { PeriodsSection, suggestSuccessor } from './PeriodsSection'

const periods = [
  { id: 'p1', label: '2026-2', startDate: '2026-08-01T00:00:00Z', endDate: null, status: 'ACTIVE' },
  { id: 'p0', label: '2026-1', startDate: '2026-02-01T00:00:00Z', endDate: '2026-07-31T00:00:00Z', status: 'CLOSED' },
]

describe('PeriodsSection', () => {
  afterEach(() => vi.unstubAllGlobals())

  it('sugiere el nombre del sucesor', () => {
    expect(suggestSuccessor('2026-II')).toBe('2027-I')
    expect(suggestSuccessor('2027-I')).toBe('2027-II')
    expect(suggestSuccessor('2026-2')).toBe('2027-1')
    expect(suggestSuccessor('2027-1')).toBe('2027-2')
    expect(suggestSuccessor('Otoño')).toBe('')
  })

  it('cierra el periodo activo con el nombre del sucesor tras confirmar', async () => {
    const fetchMock = vi.fn(async (url: string, init?: RequestInit) =>
      String(url).endsWith('/close') && init?.method === 'POST' ? new Response(JSON.stringify(periods[0])) : new Response(JSON.stringify(periods)),
    )
    vi.stubGlobal('fetch', fetchMock)
    render(<PeriodsSection token="t" />)

    expect(await screen.findByText(/Período académico activo/)).toBeInTheDocument()
    expect(screen.getByText(/2026-1/)).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: 'Cerrar y abrir sucesor' }))
    fireEvent.click(screen.getByRole('button', { name: 'Confirmar cierre' }))

    await waitFor(() => expect(fetchMock.mock.calls.some(([url]) => String(url).endsWith('/academic-periods/p1/close'))).toBe(true))
    const call = fetchMock.mock.calls.find(([url]) => String(url).endsWith('/close')) as unknown as [string, RequestInit]
    expect(JSON.parse(String(call[1].body))).toEqual({ successorLabel: '2027-1' })
  })

  it('no permite un sucesor con el mismo nombre', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => new Response(JSON.stringify(periods))))
    render(<PeriodsSection token="t" />)
    await screen.findByText(/Período académico activo/)
    fireEvent.change(screen.getByLabelText('Código sucesor'), { target: { value: '2026-2' } })
    expect(screen.getByRole('button', { name: 'Cerrar y abrir sucesor' })).toBeDisabled()
  })

  it('muestra el motivo cuando el servidor bloquea el cierre', async () => {
    vi.stubGlobal('fetch', vi.fn(async (url: string, init?: RequestInit) =>
      String(url).endsWith('/close') && init?.method === 'POST'
        ? new Response(JSON.stringify({ type: 'about:blank', title: 'Regla de negocio incumplida.', status: 422, detail: 'Hay actividades en borrador.' }), { status: 422 })
        : new Response(JSON.stringify(periods)),
    ))
    render(<PeriodsSection token="t" />)
    await screen.findByText(/Período académico activo/)
    fireEvent.click(screen.getByRole('button', { name: 'Cerrar y abrir sucesor' }))
    fireEvent.click(screen.getByRole('button', { name: 'Confirmar cierre' }))
    expect(await screen.findByRole('alert')).toHaveTextContent('Hay actividades en borrador.')
  })
})
