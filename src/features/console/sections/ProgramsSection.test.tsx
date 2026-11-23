import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, describe, expect, it, vi } from 'vitest'
import type { Capabilities } from '../../../shared/session/capabilities'
import { ProgramsSection } from './ProgramsSection'

const page = (items: unknown[]) => ({ items, pagination: { page: 1, pageSize: 100, totalCount: items.length, totalPages: 1 } })
const admin: Capabilities = { isAdmin: true, isProgramLeader: false, isOperationalLeader: false, ledProgramIds: [], canOpenConsole: true }
const leader: Capabilities = { ...admin, isAdmin: false, isProgramLeader: true, ledProgramIds: ['p1'] }

const program = (over: Record<string, unknown>) => ({
  id: 'p1', name: 'Comunidad y apoyo', description: 'Servicio', contact: null, referenceSchedule: 'Sábados', status: 'ACTIVE',
  createdAt: '2026-11-01T00:00:00Z', archivedAt: null, canManage: true, imageUrl: null, ...over,
})

const stub = (items: unknown[], extra?: (url: string, init?: RequestInit) => Response | undefined) =>
  vi.stubGlobal('fetch', vi.fn(async (url: string, init?: RequestInit) => {
    const custom = extra?.(String(url), init)
    if (custom) return custom
    if (String(url).includes('/periods')) return new Response(JSON.stringify([]))
    return new Response(JSON.stringify(page(items)))
  }))

describe('ProgramsSection', () => {
  afterEach(() => vi.unstubAllGlobals())

  it('muestra las cifras por estado y una tarjeta por programa', async () => {
    stub([program({}), program({ id: 'p2', name: 'Formación', status: 'DRAFT' }), program({ id: 'p3', name: 'Cuidado', status: 'INACTIVE' })])
    render(<ProgramsSection token="t" can={admin} />)
    expect(await screen.findByRole('heading', { name: 'Gestión de programas' })).toBeInTheDocument()
    const stats = screen.getByRole('group', { name: 'Resumen de programas' })
    expect(stats).toHaveTextContent(/Programas\s*3/)
    expect(stats).toHaveTextContent(/Activos\s*1/)
    expect(stats).toHaveTextContent(/Borradores\s*1/)
    expect(stats).toHaveTextContent(/Inactivos\s*1/)
    expect(screen.getByRole('button', { name: 'Gestionar Comunidad y apoyo' })).toBeInTheDocument()
  })

  it('filtra por estado y por nombre', async () => {
    stub([program({}), program({ id: 'p2', name: 'Formación', status: 'DRAFT' })])
    render(<ProgramsSection token="t" can={admin} />)
    await screen.findByText('Comunidad y apoyo')
    fireEvent.change(screen.getByLabelText('Estado'), { target: { value: 'DRAFT' } })
    expect(screen.queryByText('Comunidad y apoyo')).toBeNull()
    expect(screen.getByText('Formación')).toBeInTheDocument()
    fireEvent.change(screen.getByLabelText('Estado'), { target: { value: '' } })
    await userEvent.type(screen.getByLabelText('Buscar'), 'forma')
    await userEvent.click(screen.getByRole('button', { name: 'Buscar' }))
    expect(screen.queryByText('Comunidad y apoyo')).toBeNull()
    expect(screen.getByText('Formación')).toBeInTheDocument()
  })

  it('solo el ADMIN ve "Crear programa"; el líder solo gestiona los suyos', async () => {
    stub([program({}), program({ id: 'p2', name: 'Ajeno', canManage: false })])
    render(<ProgramsSection token="t" can={leader} />)
    await screen.findByText('Ajeno')
    expect(screen.queryByRole('button', { name: 'Crear programa' })).toBeNull()
    expect(screen.getByRole('button', { name: 'Ver Ajeno' })).toBeInTheDocument()
    fireEvent.change(screen.getByLabelText('Ámbito'), { target: { value: 'mine' } })
    expect(screen.queryByText('Ajeno')).toBeNull()
  })

  it('crea un programa en borrador y sube la portada elegida', async () => {
    const calls: { url: string; method?: string }[] = []
    stub([], (url, init) => {
      calls.push({ url, method: init?.method })
      if (init?.method === 'POST' && url.endsWith('/programs')) return new Response(JSON.stringify(program({ id: 'nuevo', status: 'DRAFT' })), { status: 201 })
      if (init?.method === 'PUT' && url.includes('/cover')) return new Response(null, { status: 204 })
      return undefined
    })
    render(<ProgramsSection token="t" can={admin} />)
    await userEvent.click(await screen.findByRole('button', { name: 'Crear programa' }))
    expect(screen.getByRole('heading', { name: 'Ficha y edición de programa' })).toBeInTheDocument()
    expect(screen.getByLabelText('Estado actual')).toHaveValue('Borrador (DRAFT)')
    await userEvent.type(screen.getByLabelText('Nombre *'), 'Nuevo programa')
    await userEvent.upload(screen.getByLabelText('Adjuntar imagen de portada'), new File(['x'], 'c.png', { type: 'image/png' }))
    await userEvent.click(screen.getByRole('button', { name: 'Crear programa' }))
    await waitFor(() => expect(calls.some((c) => c.method === 'PUT' && c.url.includes('/programs/nuevo/cover'))).toBe(true))
    expect(calls.some((c) => c.method === 'POST' && c.url.endsWith('/programs'))).toBe(true)
  })

  it('abre la ficha de un programa que gestiona con sus acciones de estado', async () => {
    stub([program({ status: 'DRAFT' })])
    render(<ProgramsSection token="t" can={admin} />)
    await userEvent.click(await screen.findByRole('button', { name: 'Gestionar Comunidad y apoyo' }))
    expect(await screen.findByRole('button', { name: 'Activar' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Archivar' })).toBeInTheDocument()
    await userEvent.click(screen.getByRole('button', { name: '← Programas' }))
    expect(await screen.findByRole('heading', { name: 'Gestión de programas' })).toBeInTheDocument()
  })
})
