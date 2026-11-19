import { type FormEvent, useState } from 'react'
import { Button } from '../../shared/ui'
import { Field } from '../console/sections/Field'
import type { Activity, ActivityPlan, ConflictWarning, Modality, Period, PlanningProgram } from './api'
import { fromLocalInput, modalityLabels, toLocalInput } from './format'
import consoleStyles from '../console/console.module.css'
import styles from './planning.module.css'

/** Estado editable del formulario: fechas en hora local y números como texto. */
export interface ActivityDraft {
  programId: string
  periodId: string
  title: string
  description: string
  modality: Modality
  location: string
  meetingUrl: string
  startsAt: string
  endsAt: string
  requiresRegistration: boolean
  capacity: string
  expectedHours: string
  participationConditions: string
  periodicityNote: string
  groupLabel: string
}

export const FREE_PROGRAM = ''

export const needsLocation = (m: Modality) => m === 'IN_PERSON' || m === 'HYBRID'
export const needsUrl = (m: Modality) => m === 'VIRTUAL' || m === 'HYBRID'

/** Mismas reglas que el dominio (Activity.ApplyPlan, EnsurePublishable, UpdatePlan). Devuelve errores por campo. */
export function validateDraft(d: ActivityDraft, original?: Activity, period?: Period): Partial<Record<keyof ActivityDraft, string>> {
  const errors: Partial<Record<keyof ActivityDraft, string>> = {}
  if (!d.title.trim()) errors.title = 'El título es obligatorio.'
  else if (d.title.trim().length > 200) errors.title = 'El título admite hasta 200 caracteres.'
  if (!d.periodId) errors.periodId = 'Elige el periodo académico.'
  if (!d.startsAt) errors.startsAt = 'Indica el inicio.'
  else if (period && !original) {
    // Igual que el servidor: desde el primer día del periodo hasta el final de su último día (UTC).
    const start = new Date(d.startsAt).getTime()
    const end = new Date(period.endDate).getTime() + 86_400_000
    if (start < new Date(period.startDate).getTime() || start >= end) errors.startsAt = `La actividad debe empezar dentro del periodo ${period.label}.`
  }
  if (!d.endsAt) errors.endsAt = 'Indica el fin.'
  else if (d.startsAt && new Date(d.endsAt) <= new Date(d.startsAt)) errors.endsAt = 'El fin debe ser posterior al inicio.'
  if (needsLocation(d.modality) && !d.location.trim()) errors.location = 'Una actividad presencial o híbrida necesita lugar.'
  if (needsUrl(d.modality)) {
    if (!d.meetingUrl.trim()) errors.meetingUrl = 'Una actividad virtual o híbrida necesita enlace.'
    else if (!/^https?:\/\/\S+$/i.test(d.meetingUrl.trim())) errors.meetingUrl = 'El enlace debe ser una dirección web válida.'
  }
  if (d.requiresRegistration && d.capacity.trim()) {
    const capacity = Number(d.capacity)
    if (!Number.isInteger(capacity) || capacity <= 0) errors.capacity = 'El cupo debe ser un entero positivo o quedar vacío (sin límite).'
    else if (original && original.status !== 'DRAFT' && (original.capacity == null || capacity < original.capacity)) {
      errors.capacity = 'En una actividad publicada el cupo solo puede aumentar.'
    }
  }
  if (d.expectedHours.trim()) {
    const hours = Number(d.expectedHours)
    if (Number.isNaN(hours) || hours < 0 || hours > 1000) errors.expectedHours = 'Las horas previstas deben estar entre 0 y 1000.'
  }
  return errors
}

const text = (value: string) => (value.trim() ? value.trim() : null)

/** Convierte el borrador al cuerpo de la API: lo que la modalidad o el registro no usan viaja vacío. */
export function toPlan(d: ActivityDraft): ActivityPlan {
  return {
    title: d.title.trim(),
    description: text(d.description),
    modality: d.modality,
    location: needsLocation(d.modality) ? text(d.location) : null,
    meetingUrl: needsUrl(d.modality) ? text(d.meetingUrl) : null,
    startsAt: fromLocalInput(d.startsAt),
    endsAt: fromLocalInput(d.endsAt),
    requiresRegistration: d.requiresRegistration,
    capacity: d.requiresRegistration && d.capacity.trim() ? Number(d.capacity) : null,
    expectedHours: d.expectedHours.trim() ? Number(d.expectedHours) : null,
    participationConditions: text(d.participationConditions),
    periodicityNote: text(d.periodicityNote),
    groupLabel: text(d.groupLabel),
  }
}

function initialDraft(activity: Activity | undefined, programs: PlanningProgram[], canCreateFree: boolean, periods: Period[]): ActivityDraft {
  if (activity) {
    return {
      programId: activity.programId ?? FREE_PROGRAM,
      periodId: activity.periodId,
      title: activity.title,
      description: activity.description ?? '',
      modality: activity.modality,
      location: activity.location ?? '',
      meetingUrl: activity.meetingUrl ?? '',
      startsAt: toLocalInput(activity.startsAt),
      endsAt: toLocalInput(activity.endsAt),
      requiresRegistration: activity.requiresRegistration,
      capacity: activity.capacity?.toString() ?? '',
      expectedHours: activity.expectedHours?.toString() ?? '',
      participationConditions: activity.participationConditions ?? '',
      periodicityNote: activity.periodicityNote ?? '',
      groupLabel: activity.groupLabel ?? '',
    }
  }
  const now = Date.now()
  const current = periods.find((p) => new Date(p.startDate).getTime() <= now && now <= new Date(p.endDate).getTime())
  return {
    programId: canCreateFree && programs.length === 0 ? FREE_PROGRAM : (programs[0]?.id ?? FREE_PROGRAM),
    periodId: current?.id ?? periods[0]?.id ?? '',
    title: '',
    description: '',
    modality: 'IN_PERSON',
    location: '',
    meetingUrl: '',
    startsAt: '',
    endsAt: '',
    requiresRegistration: false,
    capacity: '',
    expectedHours: '',
    participationConditions: '',
    periodicityNote: '',
    groupLabel: '',
  }
}

export interface ActivityFormSubmit {
  programId: string | null
  periodId: string
  plan: ActivityPlan
}

interface ActivityFormProps {
  /** Sin actividad: alta. Con actividad: edición según su estado. */
  activity?: Activity
  /** Programas donde la persona puede crear actividades (los que gestiona). */
  programs: PlanningProgram[]
  /** Solo el ADMIN crea actividades libres. */
  canCreateFree: boolean
  periods: Period[]
  onSubmit: (value: ActivityFormSubmit) => Promise<void>
  onCancel: () => void
  /** Advertencias de solapamiento (SCRUM-54): si hay, se muestran y se guarda solo al confirmar. */
  checkConflicts?: (value: ActivityFormSubmit) => Promise<ConflictWarning[]>
}

/**
 * Planificación y configuración de una actividad (SCRUM-48, SCRUM-49). La configuración nunca se contradice:
 * sin registro previo no hay cupo; el lugar y el enlace dependen de la modalidad. En una actividad publicada
 * o en ejecución solo cambian los campos informativos y el cupo hacia arriba (el horario va por reprogramación).
 */
export function ActivityForm({ activity, programs, canCreateFree, periods, onSubmit, onCancel, checkConflicts }: ActivityFormProps) {
  const [draft, setDraft] = useState(() => initialDraft(activity, programs, canCreateFree, periods))
  const [errors, setErrors] = useState<Partial<Record<keyof ActivityDraft, string>>>({})
  const [busy, setBusy] = useState(false)
  const [warnings, setWarnings] = useState<{ key: string; items: ConflictWarning[] } | null>(null)

  const creating = !activity
  const locked = !!activity && activity.status !== 'DRAFT'
  const isFree = draft.programId === FREE_PROGRAM
  const capacityLocked = locked && activity?.capacity == null

  const set = <K extends keyof ActivityDraft>(key: K, value: ActivityDraft[K]) => setDraft((d) => ({ ...d, [key]: value }))

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const found = validateDraft(draft, activity, periods.find((p) => p.id === draft.periodId))
    if (creating && isFree && !canCreateFree) found.programId = 'Solo un ADMIN crea actividades libres.'
    setErrors(found)
    if (Object.keys(found).length > 0) return
    setBusy(true)
    try {
      const value = { programId: isFree ? null : draft.programId, periodId: draft.periodId, plan: toPlan(draft) }
      // La advertencia no bloquea: el responsable decide guardar igual con un segundo clic.
      const key = JSON.stringify([value.programId, value.plan.startsAt, value.plan.endsAt, value.plan.location])
      if (checkConflicts && !locked && warnings?.key !== key) {
        const found = await checkConflicts(value).catch(() => [])
        if (found.length > 0) {
          setWarnings({ key, items: found })
          return
        }
      }
      await onSubmit(value)
    } finally {
      setBusy(false)
    }
  }

  const error = (key: keyof ActivityDraft) =>
    errors[key] ? <span role="alert" className={consoleStyles.alert}>{errors[key]}</span> : null

  return (
    <form className={styles.form} onSubmit={submit} aria-label={creating ? 'Nueva actividad' : 'Editar actividad'} noValidate>
      {locked && (
        <p className={styles.hint}>
          La actividad ya está publicada: solo cambian descripción, lugar, enlace, condiciones, horas, nota y el cupo hacia arriba. Para cambiar el horario, reprográmala.
        </p>
      )}

      <fieldset className={styles.fieldset}>
        <legend className={styles.legend}>Datos generales</legend>
        <Field label="Título">
          {(id) => (
            <input id={id} className={consoleStyles.select} value={draft.title} maxLength={200} disabled={locked} onChange={(e) => set('title', e.target.value)} />
          )}
        </Field>
        {error('title')}
        <Field label="Descripción (opcional)">
          {(id) => (
            <textarea id={id} className={styles.textarea} value={draft.description} maxLength={2000} onChange={(e) => set('description', e.target.value)} />
          )}
        </Field>
        <div className={styles.grid2}>
          <div className={styles.group}>
            <Field label="Programa">
              {(id) => (
                <select id={id} className={consoleStyles.select} value={draft.programId} disabled={!creating} onChange={(e) => set('programId', e.target.value)}>
                  {(canCreateFree || (!creating && isFree)) && <option value={FREE_PROGRAM}>Actividad libre (sin programa)</option>}
                  {programs.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
                  {!creating && activity?.programId && !programs.some((p) => p.id === activity.programId) && (
                    <option value={activity.programId}>{activity.programName ?? 'Programa'}</option>
                  )}
                </select>
              )}
            </Field>
            {error('programId')}
          </div>
          <div className={styles.group}>
            <Field label="Periodo académico">
              {(id) => (
                <select id={id} className={consoleStyles.select} value={draft.periodId} disabled={!creating} onChange={(e) => set('periodId', e.target.value)}>
                  <option value="">Elige un periodo</option>
                  {periods.map((p) => <option key={p.id} value={p.id}>{p.label}</option>)}
                </select>
              )}
            </Field>
            {error('periodId')}
          </div>
        </div>
        {!creating && <p className={styles.hint}>El programa lo cambia un ADMIN con “Mover”; el periodo queda fijo.</p>}
        {isFree && (
          <Field label="Etiqueta de grupo">
            {(id) => (
              <input
                id={id}
                className={consoleStyles.select}
                value={draft.groupLabel}
                maxLength={100}
                placeholder="Ej.: Campaña de Navidad"
                onChange={(e) => set('groupLabel', e.target.value)}
              />
            )}
          </Field>
        )}
      </fieldset>

      <fieldset className={styles.fieldset}>
        <legend className={styles.legend}>Horario</legend>
        <div className={styles.grid2}>
          <div className={styles.group}>
            <Field label="Inicio">
              {(id) => (
                <input id={id} type="datetime-local" className={consoleStyles.select} value={draft.startsAt} disabled={locked} onChange={(e) => set('startsAt', e.target.value)} />
              )}
            </Field>
            {error('startsAt')}
          </div>
          <div className={styles.group}>
            <Field label="Fin">
              {(id) => (
                <input
                  id={id}
                  type="datetime-local"
                  className={consoleStyles.select}
                  value={draft.endsAt}
                  min={draft.startsAt || undefined}
                  disabled={locked}
                  onChange={(e) => set('endsAt', e.target.value)}
                />
              )}
            </Field>
            {error('endsAt')}
          </div>
        </div>
        <Field label="Periodicidad (nota, opcional)">
          {(id) => (
            <input
              id={id}
              className={consoleStyles.select}
              value={draft.periodicityNote}
              maxLength={500}
              placeholder="Ej.: todos los sábados de noviembre"
              onChange={(e) => set('periodicityNote', e.target.value)}
            />
          )}
        </Field>
      </fieldset>

      <fieldset className={styles.fieldset}>
        <legend className={styles.legend}>Modalidad y lugar</legend>
        <Field label="Modalidad">
          {(id) => (
            <select id={id} className={consoleStyles.select} value={draft.modality} disabled={locked} onChange={(e) => set('modality', e.target.value as Modality)}>
              {(Object.keys(modalityLabels) as Modality[]).map((m) => <option key={m} value={m}>{modalityLabels[m]}</option>)}
            </select>
          )}
        </Field>
        {needsLocation(draft.modality) && (
          <>
            <Field label="Lugar">
              {(id) => <input id={id} className={consoleStyles.select} value={draft.location} maxLength={300} onChange={(e) => set('location', e.target.value)} />}
            </Field>
            {error('location')}
          </>
        )}
        {needsUrl(draft.modality) && (
          <>
            <Field label="Enlace de la reunión">
              {(id) => (
                <input
                  id={id}
                  type="url"
                  className={consoleStyles.select}
                  value={draft.meetingUrl}
                  maxLength={500}
                  placeholder="https://"
                  onChange={(e) => set('meetingUrl', e.target.value)}
                />
              )}
            </Field>
            <p className={styles.hint}>El enlace no se muestra en el catálogo público.</p>
            {error('meetingUrl')}
          </>
        )}
      </fieldset>

      <fieldset className={styles.fieldset}>
        <legend className={styles.legend}>Participación</legend>
        <label className={styles.check}>
          <input
            type="checkbox"
            checked={draft.requiresRegistration}
            disabled={locked}
            onChange={(e) => setDraft((d) => ({ ...d, requiresRegistration: e.target.checked, capacity: e.target.checked ? d.capacity : '' }))}
          />
          Requiere registro previo
        </label>
        <Field label="Cupo">
          {(id) => (
            <input
              id={id}
              type="number"
              inputMode="numeric"
              min={locked && activity?.capacity ? activity.capacity : 1}
              step={1}
              className={consoleStyles.select}
              value={draft.capacity}
              disabled={!draft.requiresRegistration || capacityLocked}
              placeholder={draft.requiresRegistration ? 'Vacío = sin límite' : 'Solo con registro previo'}
              onChange={(e) => set('capacity', e.target.value)}
            />
          )}
        </Field>
        {capacityLocked && <p className={styles.hint}>Publicada sin límite de cupo: no se puede fijar uno.</p>}
        {error('capacity')}
        <div className={styles.grid2}>
          <div className={styles.group}>
            <Field label="Horas previstas (informativas)">
              {(id) => (
                <input
                  id={id}
                  type="number"
                  min={0}
                  max={1000}
                  step={0.5}
                  className={consoleStyles.select}
                  value={draft.expectedHours}
                  onChange={(e) => set('expectedHours', e.target.value)}
                />
              )}
            </Field>
            {error('expectedHours')}
          </div>
        </div>
        <Field label="Condiciones de participación (informativas)">
          {(id) => (
            <textarea
              id={id}
              className={styles.textarea}
              value={draft.participationConditions}
              maxLength={2000}
              onChange={(e) => set('participationConditions', e.target.value)}
            />
          )}
        </Field>
      </fieldset>

      {warnings && (
        <ul className={styles.warnings} aria-label="Advertencias de conflicto">
          {warnings.items.map((c) => <li key={`${c.type}-${c.conflictingActivityId}`}>{c.message}</li>)}
        </ul>
      )}
      <div className={consoleStyles.actions}>
        <Button type="submit" variant="primary" disabled={busy}>
          {busy ? 'Guardando…' : warnings ? 'Guardar de todos modos' : creating ? 'Crear borrador' : 'Guardar cambios'}
        </Button>
        <Button type="button" variant="secondary" onClick={onCancel} disabled={busy}>Cancelar</Button>
      </div>
    </form>
  )
}
