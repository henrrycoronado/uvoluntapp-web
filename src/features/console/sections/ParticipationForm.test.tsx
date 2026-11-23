import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, describe, expect, it, vi } from 'vitest'
import type { Activity } from '../../planning/api'
import { ParticipationForm, toParticipation, validateParticipation, type ParticipationDraft } from './ParticipationForm'

const range = { startsAt: '2026-11-28T13:00:00Z', endsAt: '2026-11-28T21:00:00Z' }
const empty: ParticipationDraft = { groups: [], allowMultipleGroups: false, latitude: '', longitude: '', geofenceRadiusM: '', allowSelfCheckin: false, checkinToleranceMin: '0' }
const group = (over = {}) => ({ key: 'k', name: 'Mañana', startsAt: '2026-11-28T10:00', endsAt: '2026-11-28T12:00', capacity: '5', ...over })

const activity = {
  id: 'a1', ...range,
  participation: { groups: [], allowMultipleGroups: false, latitude: null, longitude: null, geofenceRadiusM: null, allowSelfCheckin: false, checkinToleranceMin: 0 },
} as unknown as Activity

describe('validateParticipation', () => {
  it('acepta una configuración vacía o con turnos válidos', () => {
    expect(validateParticipation(empty, range)).toEqual([])
    expect(validateParticipation({ ...empty, groups: [group()] }, range)).toEqual([])
  })

  it('rechaza turnos sin nombre, repetidos, invertidos o fuera del horario', () => {
    expect(validateParticipation({ ...empty, groups: [group({ name: ' ' })] }, range)[0]).toMatch(/nombre/)
    expect(validateParticipation({ ...empty, groups: [group(), group({ key: 'k2' })] }, range).join()).toMatch(/ya existe/)
    expect(validateParticipation({ ...empty, groups: [group({ endsAt: '2026-11-28T09:00' })] }, range).join()).toMatch(/posterior/)
    expect(validateParticipation({ ...empty, groups: [group({ startsAt: '2026-11-27T10:00' })] }, range).join()).toMatch(/dentro del horario/)
    expect(validateParticipation({ ...empty, groups: [group({ capacity: '0' })] }, range).join()).toMatch(/cupo/)
  })

  it('exige coordenadas completas y en rango', () => {
    expect(validateParticipation({ ...empty, latitude: '-17.4' }, range).join()).toMatch(/completa latitud y longitud/)
    expect(validateParticipation({ ...empty, latitude: '95', longitude: '-66' }, range).join()).toMatch(/latitud/)
    expect(validateParticipation({ ...empty, latitude: '-17.4', longitude: '-66.1', geofenceRadiusM: '50' }, range)).toEqual([])
  })

  it('convierte el borrador al cuerpo de la API', () => {
    const body = toParticipation({ ...empty, groups: [group({ capacity: '' })], latitude: '-17.4', longitude: '-66.1', checkinToleranceMin: '10' })
    expect(body.groups[0]).toMatchObject({ name: 'Mañana', capacity: null })
    expect(body).toMatchObject({ latitude: -17.4, longitude: -66.1, checkinToleranceMin: 10, geofenceRadiusM: null })
  })
})

describe('ParticipationForm', () => {
  afterEach(() => vi.unstubAllGlobals())

  it('no envía con errores y guarda por PUT cuando es válido', async () => {
    const fetchMock = vi.fn(async () => new Response(JSON.stringify({ id: 'a1' })))
    vi.stubGlobal('fetch', fetchMock)
    const onSaved = vi.fn()
    render(<ParticipationForm token="t" activity={activity} onSaved={onSaved} />)

    await userEvent.click(screen.getByRole('button', { name: 'Agregar turno' }))
    await userEvent.click(screen.getByRole('button', { name: 'Guardar participación' }))
    expect(await screen.findByRole('alert')).toHaveTextContent(/nombre/)
    expect(fetchMock).not.toHaveBeenCalled()

    await userEvent.type(screen.getByLabelText('Nombre del turno 1'), 'Mañana')
    await userEvent.click(screen.getByRole('button', { name: 'Guardar participación' }))
    await waitFor(() => expect(onSaved).toHaveBeenCalled())
    const [url, init] = fetchMock.mock.calls[0] as unknown as [string, RequestInit]
    expect(url).toContain('/activities/a1/participation')
    expect(init.method).toBe('PUT')
  })
})
