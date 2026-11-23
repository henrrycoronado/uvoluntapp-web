import { render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { CatalogActivities } from './CatalogExplorer'

const page = (items: unknown[]) => ({ items, meta: { page: 1, pageSize: 200, totalCount: items.length, totalPages: 1 } })

describe('catálogo público', () => {
  afterEach(() => vi.unstubAllGlobals())

  it('lista actividades publicadas sin enviar token', async () => {
    const activity = {
      id: 'a1', programId: null, programName: null, periodId: 'per1', status: 'PUBLISHED', title: 'Colecta', description: null,
      modality: 'IN_PERSON', location: 'Campus', startsAt: '2026-11-22T13:00:00Z', endsAt: '2026-11-22T15:00:00Z',
      requiresRegistration: false, capacity: null, expectedHours: null, participationConditions: null, participation: { groups: [], allowMultipleGroups: false, latitude: null, longitude: null, geofenceRadiusM: null, allowSelfCheckin: false, checkinToleranceMin: 0 }, groupLabel: 'Navidad',
    }
    const fetchMock = vi.fn(async (url: string) =>
      new Response(JSON.stringify(String(url).includes('/catalog/activities') ? page([activity]) : String(url).includes('/catalog/periods') ? [] : page([]))),
    )
    vi.stubGlobal('fetch', fetchMock)

    render(<CatalogActivities />)
    expect(await screen.findByText('Colecta')).toBeInTheDocument()
    expect(screen.getByText('Libre · Navidad')).toBeInTheDocument()
    for (const [, init] of fetchMock.mock.calls as unknown as [string, RequestInit][]) {
      expect(new Headers(init?.headers).has('Authorization')).toBe(false)
    }
  })
})
