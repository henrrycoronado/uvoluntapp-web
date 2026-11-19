import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { ActivityForm, type ActivityDraft, validateDraft } from './ActivityForm'
import type { Activity, Period, PlanningProgram } from './api'

const periods: Period[] = [{ id: 'per1', label: '2026-2', startDate: '2026-08-01T00:00:00Z', endDate: '2026-12-15T00:00:00Z' }]
const programs: PlanningProgram[] = [
  { id: 'p1', name: 'Comunitario', status: 'ACTIVE', createdAt: '2026-11-01T00:00:00Z', canManage: true },
]

const draft = (over: Partial<ActivityDraft> = {}): ActivityDraft => ({
  programId: 'p1',
  periodId: 'per1',
  title: 'Visita',
  description: '',
  modality: 'IN_PERSON',
  location: 'Plaza',
  meetingUrl: '',
  startsAt: '2026-11-22T09:00',
  endsAt: '2026-11-22T11:00',
  requiresRegistration: false,
  capacity: '',
  expectedHours: '',
  participationConditions: '',
  periodicityNote: '',
  groupLabel: '',
  ...over,
})

const renderForm = (props: Partial<Parameters<typeof ActivityForm>[0]> = {}) =>
  render(<ActivityForm programs={programs} canCreateFree={false} periods={periods} onSubmit={vi.fn()} onCancel={vi.fn()} {...props} />)

describe('ActivityForm', () => {
  it('el cupo solo se habilita con registro previo y se borra al desmarcarlo', () => {
    renderForm()
    const capacity = screen.getByLabelText('Cupo') as HTMLInputElement
    const registration = screen.getByLabelText('Requiere registro previo')
    expect(capacity).toBeDisabled()

    fireEvent.click(registration)
    expect(capacity).toBeEnabled()
    fireEvent.change(capacity, { target: { value: '20' } })
    expect(capacity.value).toBe('20')

    fireEvent.click(registration)
    expect(capacity).toBeDisabled()
    expect(capacity.value).toBe('')
  })

  it('muestra lugar o enlace según la modalidad', () => {
    renderForm()
    const modality = screen.getByLabelText('Modalidad')
    expect(screen.getByLabelText('Lugar')).toBeInTheDocument()
    expect(screen.queryByLabelText('Enlace de la reunión')).toBeNull()

    fireEvent.change(modality, { target: { value: 'VIRTUAL' } })
    expect(screen.queryByLabelText('Lugar')).toBeNull()
    expect(screen.getByLabelText('Enlace de la reunión')).toBeInTheDocument()

    fireEvent.change(modality, { target: { value: 'HYBRID' } })
    expect(screen.getByLabelText('Lugar')).toBeInTheDocument()
    expect(screen.getByLabelText('Enlace de la reunión')).toBeInTheDocument()
  })

  it('solo el ADMIN ve la opción de actividad libre y su etiqueta de grupo', () => {
    const { unmount } = renderForm()
    expect(screen.queryByRole('option', { name: /Actividad libre/ })).toBeNull()
    unmount()

    renderForm({ canCreateFree: true })
    fireEvent.change(screen.getByLabelText('Programa'), { target: { value: '' } })
    expect(screen.getByLabelText('Etiqueta de grupo')).toBeInTheDocument()
  })

  it('una actividad publicada bloquea título, horario, modalidad y registro', () => {
    const published = {
      id: 'a1', programId: 'p1', periodId: 'per1', status: 'PUBLISHED', title: 'Visita', description: null, modality: 'IN_PERSON',
      location: 'Plaza', meetingUrl: null, startsAt: '2026-11-22T13:00:00Z', endsAt: '2026-11-22T15:00:00Z', requiresRegistration: true,
      capacity: 10, expectedHours: null, participationConditions: null, periodicityNote: null, groupLabel: null,
      createdAt: '2026-11-01T00:00:00Z', canManage: true, canMove: false,
    } satisfies Activity
    renderForm({ activity: published })
    expect(screen.getByLabelText('Título')).toBeDisabled()
    expect(screen.getByLabelText('Inicio')).toBeDisabled()
    expect(screen.getByLabelText('Modalidad')).toBeDisabled()
    expect(screen.getByLabelText('Requiere registro previo')).toBeDisabled()
    expect(screen.getByLabelText('Cupo')).toBeEnabled()
    expect(validateDraft(draft({ requiresRegistration: true, capacity: '5' }), published).capacity).toMatch(/solo puede aumentar/)
  })

  it('repite las reglas del dominio', () => {
    expect(validateDraft(draft())).toEqual({})
    expect(validateDraft(draft({ title: ' ' })).title).toBeDefined()
    expect(validateDraft(draft({ endsAt: '2026-11-22T08:00' })).endsAt).toMatch(/posterior/)
    expect(validateDraft(draft({ location: '' })).location).toMatch(/lugar/)
    expect(validateDraft(draft({ modality: 'VIRTUAL', meetingUrl: 'zoom' })).meetingUrl).toMatch(/válida/)
    expect(validateDraft(draft({ requiresRegistration: true, capacity: '0' })).capacity).toBeDefined()
    expect(validateDraft(draft({ expectedHours: '1001' })).expectedHours).toBeDefined()
    expect(validateDraft(draft({ startsAt: '2027-01-10T09:00', endsAt: '2027-01-10T10:00' }), undefined, periods[0]).startsAt).toMatch(/2026-2/)
  })

  it('no envía si hay errores y envía la configuración limpia si es válida', async () => {
    const onSubmit = vi.fn(async () => {})
    renderForm({ onSubmit })
    fireEvent.click(screen.getByRole('button', { name: 'Crear borrador' }))
    expect(await screen.findByText('El título es obligatorio.')).toBeInTheDocument()
    expect(onSubmit).not.toHaveBeenCalled()

    fireEvent.change(screen.getByLabelText('Título'), { target: { value: 'Visita' } })
    fireEvent.change(screen.getByLabelText('Lugar'), { target: { value: 'Plaza' } })
    fireEvent.change(screen.getByLabelText('Inicio'), { target: { value: '2026-11-22T09:00' } })
    fireEvent.change(screen.getByLabelText('Fin'), { target: { value: '2026-11-22T11:00' } })
    fireEvent.click(screen.getByRole('button', { name: 'Crear borrador' }))
    await vi.waitFor(() => expect(onSubmit).toHaveBeenCalledTimes(1))
    const [{ programId, plan }] = onSubmit.mock.calls[0] as unknown as [{ programId: string; plan: { capacity: unknown; meetingUrl: unknown } }]
    expect(programId).toBe('p1')
    expect(plan.capacity).toBeNull()
    expect(plan.meetingUrl).toBeNull()
  })

  it('advierte solapamientos y guarda solo al confirmar', async () => {
    const onSubmit = vi.fn(async () => {})
    const checkConflicts = vi.fn(async () => [
      { type: 'LOCATION_OVERLAP' as const, conflictingActivityId: 'x', conflictingActivityTitle: 'Otra', message: 'El lugar "Plaza" ya está ocupado por "Otra".' },
    ])
    renderForm({ onSubmit, checkConflicts })
    fireEvent.change(screen.getByLabelText('Título'), { target: { value: 'Visita' } })
    fireEvent.change(screen.getByLabelText('Lugar'), { target: { value: 'Plaza' } })
    fireEvent.change(screen.getByLabelText('Inicio'), { target: { value: '2026-11-22T09:00' } })
    fireEvent.change(screen.getByLabelText('Fin'), { target: { value: '2026-11-22T11:00' } })
    fireEvent.click(screen.getByRole('button', { name: 'Crear borrador' }))
    expect(await screen.findByText(/ya está ocupado/)).toBeInTheDocument()
    expect(onSubmit).not.toHaveBeenCalled()

    fireEvent.click(screen.getByRole('button', { name: 'Guardar de todos modos' }))
    await vi.waitFor(() => expect(onSubmit).toHaveBeenCalledTimes(1))
    expect(checkConflicts).toHaveBeenCalledTimes(1)
  })
})
