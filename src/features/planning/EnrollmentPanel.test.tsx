import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { EnrollmentPanel } from './EnrollmentPanel'
import type { CatalogActivity, Enrollment } from './api'

const participation = (groups: CatalogActivity['participation']['groups'] = []) => ({
  groups, allowMultipleGroups: false, latitude: null, longitude: null, geofenceRadiusM: null, allowSelfCheckin: false, checkinToleranceMin: 0,
})

const activity = (over: Partial<CatalogActivity> = {}): CatalogActivity => ({
  id: 'a1', programId: null, programName: null, periodId: 'per1', status: 'PUBLISHED', title: 'Colecta', description: null,
  modality: 'IN_PERSON', location: 'Campus', startsAt: '2026-11-28T13:00:00Z', endsAt: '2026-11-28T15:00:00Z', requiresRegistration: true,
  capacity: 10, expectedHours: null, participationConditions: null, participation: participation(), groupLabel: null, ...over,
})

const enrollment = (over: Partial<Enrollment> = {}): Enrollment => ({
  id: 'e1', activityId: 'a1', groupId: null, userId: 'u1', status: 'ENROLLED', createdAt: '2026-11-23T10:00:00Z', cancelledAt: null, ...over,
})

describe('EnrollmentPanel', () => {
  afterEach(() => vi.unstubAllGlobals())

  it('sin inscripción previa no ofrece botón', () => {
    render(<EnrollmentPanel activity={activity({ requiresRegistration: false })} token="t" mine={[]} onChanged={vi.fn()} />)
    expect(screen.getByText(/No necesitas inscripción previa/)).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Inscribirme' })).toBeNull()
  })

  it('sin sesión invita a iniciarla', async () => {
    const onLogin = vi.fn()
    render(<EnrollmentPanel activity={activity()} mine={[]} onLogin={onLogin} onChanged={vi.fn()} />)
    await userEvent.click(screen.getByRole('button', { name: 'Iniciar sesión' }))
    expect(onLogin).toHaveBeenCalled()
  })

  it('una actividad cancelada es solo consulta', () => {
    render(<EnrollmentPanel activity={activity({ status: 'CANCELLED' })} token="t" mine={[]} onChanged={vi.fn()} />)
    expect(screen.getByText(/solo consulta/)).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Inscribirme' })).toBeNull()
  })

  it('con turnos exige elegir uno antes de inscribirse y envía su groupId', async () => {
    const fetchMock = vi.fn(async () => new Response(JSON.stringify(enrollment({ groupId: 'g2' })), { status: 201 }))
    vi.stubGlobal('fetch', fetchMock)
    const onChanged = vi.fn()
    const groups = [
      { id: 'g1', name: 'Mañana', startsAt: '2026-11-28T13:00:00Z', endsAt: '2026-11-28T15:00:00Z', capacity: 5 },
      { id: 'g2', name: 'Tarde', startsAt: '2026-11-28T18:00:00Z', endsAt: '2026-11-28T20:00:00Z', capacity: null },
    ]
    render(<EnrollmentPanel activity={activity({ participation: participation(groups) })} token="t" mine={[]} onChanged={onChanged} />)

    const button = screen.getByRole('button', { name: 'Inscribirme' })
    expect(button).toBeDisabled()
    await userEvent.click(screen.getByLabelText(/Tarde/))
    await userEvent.click(button)

    await waitFor(() => expect(onChanged).toHaveBeenCalled())
    const [url, init] = fetchMock.mock.calls[0] as unknown as [string, RequestInit]
    expect(url).toContain('/activities/a1/enrollments')
    expect(JSON.parse(String(init.body))).toEqual({ groupId: 'g2' })
  })

  it('traduce el rechazo por cupo agotado', async () => {
    vi.stubGlobal('fetch', vi.fn(async () =>
      new Response(JSON.stringify({ type: 'about:blank', title: 'Inscripción rechazada.', status: 409, code: 'CAPACITY_FULL' }), { status: 409 }),
    ))
    render(<EnrollmentPanel activity={activity()} token="t" mine={[]} onChanged={vi.fn()} />)
    await userEvent.click(screen.getByRole('button', { name: 'Inscribirme' }))
    expect(await screen.findByRole('alert')).toHaveTextContent('cupo está agotado')
  })

  it('con inscripción vigente muestra el estado y permite cancelar', async () => {
    render(<EnrollmentPanel activity={activity()} token="t" mine={[enrollment()]} onChanged={vi.fn()} />)
    expect(screen.getByText(/Estás inscrito/)).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Inscribirme' })).toBeNull()
    expect(screen.getByRole('button', { name: 'Cancelar inscripción' })).toBeInTheDocument()
  })
})
