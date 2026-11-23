import { type FormEvent, useState } from 'react'
import { Button } from '../../../shared/ui'
import { planningApi, type Activity, type ParticipationInput } from '../../planning/api'
import { fromLocalInput, toLocalInput } from '../../planning/format'
import planning from '../../planning/planning.module.css'
import styles from '../console.module.css'
import { Feedback } from './Feedback'
import { Field } from './Field'
import { useAction } from './useAction'

interface GroupDraft {
  key: string
  name: string
  startsAt: string
  endsAt: string
  capacity: string
}

export interface ParticipationDraft {
  groups: GroupDraft[]
  allowMultipleGroups: boolean
  latitude: string
  longitude: string
  geofenceRadiusM: string
  allowSelfCheckin: boolean
  checkinToleranceMin: string
}

const num = (value: string) => (value.trim() ? Number(value) : null)

/** Reglas que el cliente puede comprobar antes de enviar; el servidor sigue siendo la autoridad. */
export function validateParticipation(d: ParticipationDraft, activity: Pick<Activity, 'startsAt' | 'endsAt'>): string[] {
  const errors: string[] = []
  const names = new Set<string>()
  for (const [i, g] of d.groups.entries()) {
    const label = `Turno ${i + 1}`
    if (!g.name.trim()) errors.push(`${label}: indica un nombre.`)
    else if (names.has(g.name.trim().toLowerCase())) errors.push(`${label}: el nombre ya existe en otro turno.`)
    names.add(g.name.trim().toLowerCase())
    if (!g.startsAt || !g.endsAt) errors.push(`${label}: indica inicio y fin.`)
    else {
      if (new Date(g.endsAt) <= new Date(g.startsAt)) errors.push(`${label}: el fin debe ser posterior al inicio.`)
      if (new Date(g.startsAt) < new Date(activity.startsAt) || new Date(g.endsAt) > new Date(activity.endsAt)) {
        errors.push(`${label}: debe quedar dentro del horario de la actividad.`)
      }
    }
    if (g.capacity.trim() && (!Number.isInteger(Number(g.capacity)) || Number(g.capacity) <= 0)) errors.push(`${label}: el cupo debe ser un entero positivo o quedar vacío.`)
  }
  const hasPoint = d.latitude.trim() !== '' || d.longitude.trim() !== ''
  if (hasPoint) {
    const lat = Number(d.latitude)
    const lon = Number(d.longitude)
    if (d.latitude.trim() === '' || d.longitude.trim() === '') errors.push('Ubicación: completa latitud y longitud.')
    else if (Number.isNaN(lat) || lat < -90 || lat > 90) errors.push('Ubicación: la latitud va de -90 a 90.')
    else if (Number.isNaN(lon) || lon < -180 || lon > 180) errors.push('Ubicación: la longitud va de -180 a 180.')
  }
  if (d.geofenceRadiusM.trim() && (!Number.isInteger(Number(d.geofenceRadiusM)) || Number(d.geofenceRadiusM) <= 0)) errors.push('Radio: debe ser un entero positivo en metros.')
  if (!Number.isInteger(Number(d.checkinToleranceMin || 0)) || Number(d.checkinToleranceMin || 0) < 0) errors.push('Tolerancia: debe ser un entero de 0 o más minutos.')
  return errors
}

export function toParticipation(d: ParticipationDraft): ParticipationInput {
  return {
    groups: d.groups.map((g) => ({ name: g.name.trim(), startsAt: fromLocalInput(g.startsAt), endsAt: fromLocalInput(g.endsAt), capacity: num(g.capacity) })),
    allowMultipleGroups: d.allowMultipleGroups,
    latitude: num(d.latitude),
    longitude: num(d.longitude),
    geofenceRadiusM: num(d.geofenceRadiusM),
    allowSelfCheckin: d.allowSelfCheckin,
    checkinToleranceMin: Number(d.checkinToleranceMin || 0),
  }
}

function initial(activity: Activity): ParticipationDraft {
  const p = activity.participation
  return {
    groups: p.groups.map((g) => ({ key: g.id, name: g.name, startsAt: toLocalInput(g.startsAt), endsAt: toLocalInput(g.endsAt), capacity: g.capacity?.toString() ?? '' })),
    allowMultipleGroups: p.allowMultipleGroups,
    latitude: p.latitude?.toString() ?? '',
    longitude: p.longitude?.toString() ?? '',
    geofenceRadiusM: p.geofenceRadiusM?.toString() ?? '',
    allowSelfCheckin: p.allowSelfCheckin,
    checkinToleranceMin: p.checkinToleranceMin.toString(),
  }
}

let counter = 0

/** Turnos, multirregistro y ubicación del evento. Solo se configuran mientras la actividad está en borrador. */
export function ParticipationForm({ token, activity, onSaved }: { token: string; activity: Activity; onSaved: () => void }) {
  const [draft, setDraft] = useState(() => initial(activity))
  const [errors, setErrors] = useState<string[]>([])
  const { message, run } = useAction()

  const setGroup = (key: string, patch: Partial<GroupDraft>) =>
    setDraft((d) => ({ ...d, groups: d.groups.map((g) => (g.key === key ? { ...g, ...patch } : g)) }))

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const found = validateParticipation(draft, activity)
    setErrors(found)
    if (found.length > 0) return
    void run(() => planningApi.activities.setParticipation(token, activity.id, toParticipation(draft)), 'Participación guardada.', onSaved)
  }

  return (
    <form className={planning.form} onSubmit={submit} aria-label="Grupos y turnos" noValidate>
      <fieldset className={planning.fieldset}>
        <legend className={planning.legend}>Grupos y turnos</legend>
        <p className={styles.muted}>Sin turnos, la inscripción es a la actividad. Con turnos, cada persona elige uno y el cupo es por turno.</p>
        {draft.groups.map((g, i) => (
          <div key={g.key} className={planning.grid2} role="group" aria-label={`Turno ${i + 1}`}>
            <Field label={`Nombre del turno ${i + 1}`}>
              {(id) => <input id={id} className={styles.select} value={g.name} maxLength={100} onChange={(e) => setGroup(g.key, { name: e.target.value })} />}
            </Field>
            <Field label={`Inicio del turno ${i + 1}`}>
              {(id) => <input id={id} type="datetime-local" className={styles.select} value={g.startsAt} onChange={(e) => setGroup(g.key, { startsAt: e.target.value })} />}
            </Field>
            <Field label={`Fin del turno ${i + 1}`}>
              {(id) => <input id={id} type="datetime-local" className={styles.select} value={g.endsAt} min={g.startsAt || undefined} onChange={(e) => setGroup(g.key, { endsAt: e.target.value })} />}
            </Field>
            <Field label={`Cupo del turno ${i + 1}`}>
              {(id) => <input id={id} type="number" min={1} step={1} className={styles.select} value={g.capacity} placeholder="Vacío = sin límite" onChange={(e) => setGroup(g.key, { capacity: e.target.value })} />}
            </Field>
            <div>
              <Button type="button" size="sm" variant="secondary" onClick={() => setDraft((d) => ({ ...d, groups: d.groups.filter((x) => x.key !== g.key) }))}>
                Quitar turno {i + 1}
              </Button>
            </div>
          </div>
        ))}
        <div>
          <Button
            type="button"
            size="sm"
            variant="secondary"
            onClick={() => setDraft((d) => ({ ...d, groups: [...d.groups, { key: `new-${counter++}`, name: '', startsAt: toLocalInput(activity.startsAt), endsAt: toLocalInput(activity.endsAt), capacity: '' }] }))}
          >
            Agregar turno
          </Button>
        </div>
        <label className={planning.check}>
          <input type="checkbox" checked={draft.allowMultipleGroups} onChange={(e) => setDraft((d) => ({ ...d, allowMultipleGroups: e.target.checked }))} />
          Permitir inscribirse en más de un turno
        </label>
      </fieldset>

      <fieldset className={planning.fieldset}>
        <legend className={planning.legend}>Ubicación del evento y marcación</legend>
        <div className={planning.grid2}>
          <Field label="Latitud">
            {(id) => <input id={id} inputMode="decimal" className={styles.select} value={draft.latitude} onChange={(e) => setDraft((d) => ({ ...d, latitude: e.target.value }))} />}
          </Field>
          <Field label="Longitud">
            {(id) => <input id={id} inputMode="decimal" className={styles.select} value={draft.longitude} onChange={(e) => setDraft((d) => ({ ...d, longitude: e.target.value }))} />}
          </Field>
          <Field label="Radio (m)">
            {(id) => <input id={id} inputMode="numeric" className={styles.select} value={draft.geofenceRadiusM} onChange={(e) => setDraft((d) => ({ ...d, geofenceRadiusM: e.target.value }))} />}
          </Field>
          <Field label="Tolerancia de marcación (min)">
            {(id) => <input id={id} inputMode="numeric" className={styles.select} value={draft.checkinToleranceMin} onChange={(e) => setDraft((d) => ({ ...d, checkinToleranceMin: e.target.value }))} />}
          </Field>
        </div>
        <label className={planning.check}>
          <input type="checkbox" checked={draft.allowSelfCheckin} onChange={(e) => setDraft((d) => ({ ...d, allowSelfCheckin: e.target.checked }))} />
          Permitir marcación simple informativa
        </label>
        <p className={styles.muted}>La web no registra asistencia: estos datos solo configuran la actividad.</p>
      </fieldset>

      {errors.length > 0 && (
        <ul role="alert" className={planning.warnings}>
          {errors.map((e) => <li key={e}>{e}</li>)}
        </ul>
      )}
      <Feedback message={message} />
      <div className={styles.actions}>
        <Button type="submit" variant="primary">Guardar participación</Button>
      </div>
    </form>
  )
}
