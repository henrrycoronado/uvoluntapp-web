import { useMemo, useState } from 'react'
import type { Capabilities } from '../../../shared/session/capabilities'
import { Button } from '../../../shared/ui'
import { ActivityCalendar } from '../../planning/ActivityCalendar'
import { ActivityForm } from '../../planning/ActivityForm'
import { planningApi, type Activity, type ActivityStatus } from '../../planning/api'
import { activityPlace, activityStatusLabels, dayRange, formatSchedule } from '../../planning/format'
import planning from '../../planning/planning.module.css'
import type { Access } from '../access'
import styles from '../console.module.css'
import { ActivityDetail } from './ActivityDetail'
import { Feedback } from './Feedback'
import { useAction } from './useAction'
import { useLoad } from './useLoad'

const FREE = '__libres__'

const chipFor: Record<ActivityStatus, string> = {
  DRAFT: planning.chipWarning,
  PUBLISHED: planning.chipPublic,
  IN_PROGRESS: planning.chipLive,
  FINISHED: planning.chip,
  CANCELLED: planning.chip,
}

/**
 * Actividades de la consola (SCRUM-47, 48, 50, 51, 53, 123). La lista incluye borradores solo dentro del ámbito
 * de la persona; cada actividad trae `canManage` desde el servidor, que decide siempre.
 */
export function ActivitiesSection({ token, can, access }: { token: string; can: Capabilities; access: Access }) {
  const [periodId, setPeriodId] = useState('')
  const [programId, setProgramId] = useState('')
  const [status, setStatus] = useState<ActivityStatus | ''>('')
  const [from, setFrom] = useState('')
  const [to, setTo] = useState('')
  const [view, setView] = useState<'list' | 'calendar'>('list')
  const [selected, setSelected] = useState<string | null>(null)
  const [creating, setCreating] = useState(false)
  const { message, run } = useAction()

  const [base] = useLoad(() => Promise.all([planningApi.periods(), planningApi.programs.list(token)]))
  const [activities, reload] = useLoad(() =>
    planningApi.activities.list(token, {
      periodId: periodId || undefined,
      programId: programId && programId !== FREE ? programId : undefined,
      independent: programId === FREE ? true : undefined,
      status,
      ...dayRange(from, to),
    }),
  )

  const groups = useMemo(() => {
    if (activities.status !== 'ready') return []
    const map = new Map<string, Activity[]>()
    for (const a of activities.data.items) {
      const key = a.programName ?? (a.groupLabel ? `Libre · ${a.groupLabel}` : 'Actividades libres')
      map.set(key, [...(map.get(key) ?? []), a])
    }
    return [...map.entries()]
  }, [activities])

  if (base.status === 'loading') return <p className={styles.muted}>Cargando actividades…</p>
  if (base.status === 'error') return <p role="alert" className={styles.alert}>{base.message}</p>

  const [periods, programs] = base.data
  const manageable = programs.items.filter((p) => p.canManage && !p.archivedAt)
  const canCreate = access === 'edit' && (can.isAdmin || manageable.length > 0)
  const items = activities.status === 'ready' ? activities.data.items : []
  const current = items.find((a) => a.id === selected) ?? null

  const filter = <T,>(setter: (v: T) => void) => (v: T) => {
    setter(v)
    reload()
  }

  return (
    <div className={planning.split}>
      <section className={styles.panel} aria-label="Lista de actividades">
        <div className={planning.toolbar}>
          <h2 className={styles.subheading}>Actividades</h2>
          {canCreate && !creating && (
            <Button size="sm" onClick={() => { setCreating(true); setSelected(null) }}>Nueva actividad</Button>
          )}
        </div>
        <div className={planning.filters} role="search" aria-label="Filtrar actividades">
          <label className={styles.label}>
            <span>Periodo</span>
            <select className={styles.select} value={periodId} onChange={(e) => filter(setPeriodId)(e.target.value)}>
              <option value="">Todos</option>
              {periods.map((p) => <option key={p.id} value={p.id}>{p.label}</option>)}
            </select>
          </label>
          <label className={styles.label}>
            <span>Programa</span>
            <select className={styles.select} value={programId} onChange={(e) => filter(setProgramId)(e.target.value)}>
              <option value="">Todos</option>
              <option value={FREE}>Actividades libres</option>
              {programs.items.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
            </select>
          </label>
          <label className={styles.label}>
            <span>Estado</span>
            <select className={styles.select} value={status} onChange={(e) => filter(setStatus)(e.target.value as ActivityStatus | '')}>
              <option value="">Todos</option>
              {(Object.keys(activityStatusLabels) as ActivityStatus[]).map((s) => <option key={s} value={s}>{activityStatusLabels[s]}</option>)}
            </select>
          </label>
          <label className={styles.label}>
          <span>Desde</span>
          <input type="date" className={styles.select} value={from} max={to || undefined} onChange={(e) => filter(setFrom)(e.target.value)} />
        </label>
        <label className={styles.label}>
          <span>Hasta</span>
          <input type="date" className={styles.select} value={to} min={from || undefined} onChange={(e) => filter(setTo)(e.target.value)} />
        </label>
        <div className={planning.segmented} role="group" aria-label="Vista">
            <button type="button" className={planning.segment} aria-pressed={view === 'list'} onClick={() => setView('list')}>Lista</button>
            <button type="button" className={planning.segment} aria-pressed={view === 'calendar'} onClick={() => setView('calendar')}>Calendario</button>
          </div>
        </div>
        <Feedback message={message?.kind === 'error' ? message : null} />

        {activities.status === 'loading' && <p className={styles.muted}>Cargando actividades…</p>}
        {activities.status === 'error' && <p role="alert" className={styles.alert}>{activities.message}</p>}
        {activities.status === 'ready' && items.length === 0 && (
          <p className={styles.muted}>{canCreate ? 'No hay actividades con esos filtros. Crea una nueva.' : 'No hay actividades con esos filtros.'}</p>
        )}
        {items.length > 0 && view === 'calendar' && (
          <ActivityCalendar items={items} onOpen={(id) => { setSelected(id); setCreating(false) }} />
        )}
        {items.length > 0 && view === 'list' &&
          groups.map(([title, list]) => (
            <div key={title} className={planning.group} role="group" aria-label={title}>
              <h3 className={planning.groupTitle}>{title}</h3>
              <ul className={planning.list}>
                {list.map((a) => (
                  <li key={a.id}>
                    <button
                      type="button"
                      className={a.id === selected ? planning.itemSelected : planning.itemButton}
                      aria-pressed={a.id === selected}
                      onClick={() => { setSelected(a.id); setCreating(false) }}
                    >
                      <span className={planning.itemHead}>
                        <span className={planning.itemTitle}>{a.title}</span>
                        <span className={styles.actions}>
                          {a.canManage && <span className={styles.badgeEdit}>Gestionas</span>}
                          <span className={chipFor[a.status]}>{activityStatusLabels[a.status]}</span>
                        </span>
                      </span>
                      <span className={planning.meta}>
                        <span>{formatSchedule(a.startsAt, a.endsAt)}</span>
                        <span>{activityPlace(a)}</span>
                      </span>
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          ))}
      </section>

      {creating && (
        <section className={styles.panel} aria-label="Nueva actividad">
          <h2 className={styles.subheading}>Nueva actividad</h2>
          <p className={styles.muted}>Se guarda como borrador; nadie fuera de su ámbito la ve hasta publicarla.</p>
          <ActivityForm
            programs={manageable}
            canCreateFree={can.isAdmin}
            activePeriod={periods.find((p) => p.status === 'ACTIVE') ?? periods[0]}
            onCancel={() => setCreating(false)}
            checkConflicts={({ programId: target, plan }) =>
              planningApi.activities
                .checkConflicts(token, { programId: target, startsAt: plan.startsAt, endsAt: plan.endsAt, location: plan.location })
                .then((r) => r.conflicts)
            }
            onSubmit={({ programId: target, plan }) =>
              run(
                async () => {
                  const created = await planningApi.activities.create(token, { ...plan, programId: target })
                  setSelected(created.id)
                },
                'Borrador creado. Revísalo y publícalo cuando esté listo.',
                () => { setCreating(false); reload() },
              )
            }
          />
        </section>
      )}

      {!creating && current && (
        <ActivityDetail
          key={current.id}
          token={token}
          activity={current}
          can={can}
          programs={programs.items}
          periods={periods}
          onChanged={reload}
          onRemoved={() => { setSelected(null); reload() }}
        />
      )}
      {!creating && !current && (
        <section className={styles.panel}>
          <p className={styles.muted}>Elige una actividad para ver su detalle y sus acciones.</p>
        </section>
      )}
    </div>
  )
}
