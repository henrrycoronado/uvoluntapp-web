import { type FormEvent, useState } from 'react'
import { Button, validateImage } from '../../shared/ui'
import { Field } from '../console/sections/Field'
import type { Activity, ActivityPlan, ConflictWarning, Modality, Period, PlanningProgram } from './api'
import { activityStatusLabels, fromLocalInput, modalityLabels, toLocalInput } from './format'
import consoleStyles from '../console/console.module.css'
import detail from './detail.module.css'
import styles from './planning.module.css'

/** Estado editable del formulario: fechas en hora local y números como texto. */
export interface ActivityDraft {
  programId: string
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
  if (!d.startsAt) errors.startsAt = 'Indica el inicio.'
  else if (period && !original) {
    // Igual que el servidor: desde el primer día del periodo hasta el final de su último día (UTC).
    const start = new Date(d.startsAt).getTime()
    const end = period.endDate ? new Date(period.endDate).getTime() + 86_400_000 : Number.POSITIVE_INFINITY
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
    groupLabel: text(d.groupLabel),
  }
}

function initialDraft(activity: Activity | undefined, programs: PlanningProgram[], canCreateFree: boolean): ActivityDraft {
  if (activity) {
    return {
      programId: activity.programId ?? FREE_PROGRAM,
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
      groupLabel: activity.groupLabel ?? '',
    }
  }
  return {
    programId: canCreateFree && programs.length === 0 ? FREE_PROGRAM : (programs[0]?.id ?? FREE_PROGRAM),
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
    groupLabel: '',
  }
}

export interface ActivityFormSubmit {
  programId: string | null
  plan: ActivityPlan
  /** Imagen elegida al crear; se sube cuando la actividad ya existe. */
  image: File | null
}

/** Fecha y hora por separado (prototipo) a partir del valor "YYYY-MM-DDTHH:mm". */
const datePart = (value: string) => value.split('T')[0] ?? ''
const timePart = (value: string) => value.split('T')[1] ?? ''
const join = (date: string, time: string) => (date ? `${date}T${time || '00:00'}` : '')

interface ActivityFormProps {
  /** Sin actividad: alta. Con actividad: edición según su estado. */
  activity?: Activity
  /** Programas donde la persona puede crear actividades (los que gestiona). */
  programs: PlanningProgram[]
  /** Solo el ADMIN crea actividades libres. */
  canCreateFree: boolean
  /** Periodo activo: la actividad nace en él y su fecha de inicio debe caer dentro (lo asigna el servidor). */
  activePeriod?: Period
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
export function ActivityForm({ activity, programs, canCreateFree, activePeriod, onSubmit, onCancel, checkConflicts }: ActivityFormProps) {
  const [draft, setDraft] = useState(() => initialDraft(activity, programs, canCreateFree))
  const [errors, setErrors] = useState<Partial<Record<keyof ActivityDraft, string>>>({})
  const [busy, setBusy] = useState(false)
  const [warnings, setWarnings] = useState<{ key: string; items: ConflictWarning[] } | null>(null)
  const [image, setImage] = useState<File | null>(null)
  const [imageError, setImageError] = useState<string | null>(null)

  const creating = !activity
  const locked = !!activity && activity.status !== 'DRAFT'
  const isFree = draft.programId === FREE_PROGRAM
  const capacityLocked = locked && activity?.capacity == null

  const set = <K extends keyof ActivityDraft>(key: K, value: ActivityDraft[K]) => setDraft((d) => ({ ...d, [key]: value }))

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const found = validateDraft(draft, activity, activePeriod)
    if (creating && isFree && !canCreateFree) found.programId = 'Solo un ADMIN crea actividades libres.'
    setErrors(found)
    if (Object.keys(found).length > 0) return
    setBusy(true)
    try {
      const value = { programId: isFree ? null : draft.programId, plan: toPlan(draft), image }
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

  const statusLine = activity ? `${activityStatusLabels[activity.status]} (${activity.status})` : 'Borrador (DRAFT)'

  return (
    <form onSubmit={submit} aria-label={creating ? 'Nueva actividad' : 'Editar actividad'} noValidate>
      <div className={detail.layout}>
        <div className={detail.stack}>
          {locked && (
            <p className={styles.hint}>
              La actividad ya está publicada: solo cambian descripción, lugar, enlace, condiciones, horas y el cupo hacia arriba. Para cambiar el horario, reprográmala.
            </p>
          )}

          <section className={detail.card} aria-labelledby="ident">
            <h2 id="ident" className={detail.cardTitle}>Identificación y período</h2>
            <p className={detail.hint}>El período ACTIVE se asigna al crear; la vinculación al programa no se cambia después.</p>
            <div className={detail.facts}>
              <div className={styles.group}>
                <Field label="Título de la actividad *">
                  {(id) => (
                    <input id={id} className={consoleStyles.select} value={draft.title} maxLength={200} disabled={locked} onChange={(e) => set('title', e.target.value)} />
                  )}
                </Field>
                {error('title')}
              </div>
              <Field label="Período académico">
                {(id) => <input id={id} className={consoleStyles.select} value={activePeriod ? `${activePeriod.label} · ACTIVE` : 'Período activo'} readOnly />}
              </Field>
              <div className={styles.group}>
                <Field label="Programa vinculado">
                  {(id) => (
                    <select id={id} className={consoleStyles.select} value={draft.programId} disabled={!creating} onChange={(e) => set('programId', e.target.value)}>
                      {(canCreateFree || (!creating && isFree)) && <option value={FREE_PROGRAM}>Actividad libre (sin programa) · opcional</option>}
                      {programs.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
                      {!creating && activity?.programId && !programs.some((p) => p.id === activity.programId) && (
                        <option value={activity.programId}>{activity.programName ?? 'Programa'}</option>
                      )}
                    </select>
                  )}
                </Field>
                {error('programId')}
              </div>
              <Field label="Estado inicial">
                {(id) => <input id={id} className={consoleStyles.select} value={statusLine} readOnly />}
              </Field>
            </div>
            {!creating && <p className={detail.hint}>El programa y el periodo de una actividad no se pueden cambiar.</p>}
            <Field label="Descripción">
              {(id) => <textarea id={id} className={styles.textarea} value={draft.description} maxLength={2000} onChange={(e) => set('description', e.target.value)} />}
            </Field>
            {isFree && (
              <Field label="Etiqueta de grupo">
                {(id) => (
                  <input id={id} className={consoleStyles.select} value={draft.groupLabel} maxLength={100} placeholder="Ej.: Campaña de Navidad" onChange={(e) => set('groupLabel', e.target.value)} />
                )}
              </Field>
            )}
            {creating && (
              <div>
                <p className={detail.sectionTitle}>Imagen de actividad</p>
                <input
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  aria-label="Adjuntar imagen de actividad"
                  onChange={(e) => {
                    const file = e.target.files?.[0] ?? null
                    const invalid = file ? validateImage(file) : null
                    setImageError(invalid)
                    setImage(invalid ? null : file)
                  }}
                />
                {imageError && <span role="alert" className={consoleStyles.alert}>{imageError}</span>}
                <p className={detail.hint}>Una imagen pública opcional; restringida en FINISHED y CANCELLED.</p>
              </div>
            )}
          </section>

          <section className={detail.card} aria-labelledby="agenda">
            <h2 id="agenda" className={detail.cardTitle}>Agenda y lugar</h2>
            <p className={detail.hint}>Fecha y horas explícitas. El lugar incluye nombre.</p>
            <div className={detail.facts}>
              <div className={styles.group}>
                <Field label="Fecha de inicio *">
                  {(id) => (
                    <input id={id} type="date" className={consoleStyles.select} value={datePart(draft.startsAt)} disabled={locked} onChange={(e) => set('startsAt', join(e.target.value, timePart(draft.startsAt)))} />
                  )}
                </Field>
                {error('startsAt')}
              </div>
              <Field label="Hora de inicio *">
                {(id) => (
                  <input id={id} type="time" className={consoleStyles.select} value={timePart(draft.startsAt)} disabled={locked} onChange={(e) => set('startsAt', join(datePart(draft.startsAt), e.target.value))} />
                )}
              </Field>
              <div className={styles.group}>
                <Field label="Fecha de fin *">
                  {(id) => (
                    <input id={id} type="date" className={consoleStyles.select} value={datePart(draft.endsAt)} min={datePart(draft.startsAt) || undefined} disabled={locked} onChange={(e) => set('endsAt', join(e.target.value, timePart(draft.endsAt)))} />
                  )}
                </Field>
                {error('endsAt')}
              </div>
              <Field label="Hora de fin *">
                {(id) => (
                  <input id={id} type="time" className={consoleStyles.select} value={timePart(draft.endsAt)} disabled={locked} onChange={(e) => set('endsAt', join(datePart(draft.endsAt), e.target.value))} />
                )}
              </Field>
              <Field label="Modalidad del evento">
                {(id) => (
                  <select id={id} className={consoleStyles.select} value={draft.modality} disabled={locked} onChange={(e) => set('modality', e.target.value as Modality)}>
                    {(Object.keys(modalityLabels) as Modality[]).map((m) => <option key={m} value={m}>{modalityLabels[m]}</option>)}
                  </select>
                )}
              </Field>
              {needsLocation(draft.modality) && (
                <div className={styles.group}>
                  <Field label="Nombre del lugar">
                    {(id) => <input id={id} className={consoleStyles.select} value={draft.location} maxLength={300} onChange={(e) => set('location', e.target.value)} />}
                  </Field>
                  {error('location')}
                </div>
              )}
            </div>
            {needsUrl(draft.modality) && (
              <div className={styles.group}>
                <Field label="Enlace de la reunión">
                  {(id) => (
                    <input id={id} type="url" className={consoleStyles.select} value={draft.meetingUrl} maxLength={500} placeholder="https://" onChange={(e) => set('meetingUrl', e.target.value)} />
                  )}
                </Field>
                <p className={styles.hint}>El enlace no se muestra en el catálogo público.</p>
                {error('meetingUrl')}
              </div>
            )}
            {creating && <p className={detail.hint}>Las coordenadas del lugar y los turnos se configuran en la ficha del borrador (Grupos y turnos).</p>}
          </section>

          <section className={detail.card} aria-labelledby="participacion">
            <h2 id="participacion" className={detail.cardTitle}>Participación</h2>
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
            <div className={styles.group}>
              <Field label="Horas previstas (informativas)">
                {(id) => (
                  <input id={id} type="number" min={0} max={1000} step={0.5} className={consoleStyles.select} value={draft.expectedHours} onChange={(e) => set('expectedHours', e.target.value)} />
                )}
              </Field>
              {error('expectedHours')}
            </div>
            <Field label="Condiciones de participación (informativas)">
              {(id) => (
                <textarea id={id} className={styles.textarea} value={draft.participationConditions} maxLength={2000} onChange={(e) => set('participationConditions', e.target.value)} />
              )}
            </Field>
          </section>

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
        </div>

        <aside className={detail.card} aria-label="Validaciones y reglas">
          <h2 className={detail.cardTitle}>Validaciones y reglas</h2>
          <p>No hay periodicidad, recurrencia ni sesiones generadas.</p>
          <p className={detail.hint}>Los grupos deben configurarse en borrador y admiten horas y capacidad propias.</p>
          <p className={detail.hint}>Al publicarse, cambios de fecha requieren reprogramación auditada.</p>
        </aside>
      </div>
    </form>
  )
}
