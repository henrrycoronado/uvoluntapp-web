import { useEffect, useMemo, useState } from 'react'
import { imageSrc } from '../../shared/api/http'
import { Button } from '../../shared/ui'
import { describe } from '../console/sections/useAction'
import { ActivityCalendar } from './ActivityCalendar'
import { planningApi, type CatalogActivity, type CatalogProgram, type Enrollment, type Period } from './api'
import { ActivityDetailView } from './ActivityDetailView'
import detail from './detail.module.css'
import { activityPlace, activityStatusLabels, dayRange, formatSchedule } from './format'
import consoleStyles from '../console/console.module.css'
import styles from './planning.module.css'

type Load<T> = { status: 'loading' } | { status: 'ready'; data: T } | { status: 'error'; message: string }

function useCatalog<T>(loader: () => Promise<T>, deps: unknown[]): Load<T> {
  const [state, setState] = useState<Load<T>>({ status: 'loading' })
  useEffect(() => {
    let active = true
    setState({ status: 'loading' })
    loader()
      .then((data) => active && setState({ status: 'ready', data }))
      .catch((caught: unknown) => active && setState({ status: 'error', message: describe(caught) }))
    return () => {
      active = false
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps)
  return state
}

/** Programas activos del catálogo público, con su ficha (SCRUM-52). */
export function CatalogPrograms({ onSeeActivities }: { onSeeActivities?: (program: CatalogProgram) => void }) {
  const programs = useCatalog(() => planningApi.catalog.programs(), [])
  if (programs.status === 'loading') return <p className={styles.hint}>Cargando programas…</p>
  if (programs.status === 'error') return <p role="alert" className={styles.warnings}>{programs.message}</p>
  if (programs.data.items.length === 0) return <p className={styles.hint}>Aún no hay programas activos.</p>

  return (
    <ul className={styles.list}>
      {programs.data.items.map((p) => (
        <li key={p.id} className={styles.item}>
          {p.imageUrl && <img src={imageSrc(p.imageUrl)} alt={`Portada de ${p.name}`} loading="lazy" style={{ maxWidth: '100%', borderRadius: '0.5rem' }} />}
          <h3 className={styles.itemTitle}>{p.name}</h3>
          {p.description && <p className={styles.meta}>{p.description}</p>}
          <dl className={styles.facts}>
            {p.referenceSchedule && <div><dt>Horario de referencia</dt><dd>{p.referenceSchedule}</dd></div>}
            {p.contact && <div><dt>Contacto</dt><dd>{p.contact}</dd></div>}
          </dl>
          {onSeeActivities && (
            <div>
              <Button size="sm" variant="secondary" onClick={() => onSeeActivities(p)}>Ver sus actividades</Button>
            </div>
          )}
        </li>
      ))}
    </ul>
  )
}

const FREE = '__libres__'

/**
 * Actividades publicadas o en ejecución, en lista o calendario con los mismos filtros (SCRUM-52).
 * Las de programa se agrupan por programa; las libres, por su etiqueta de grupo.
 */
interface CatalogActivitiesProps {
  initialProgramId?: string
  token?: string
  onLogin?: () => void
  /** Actividad abierta: si el padre la controla (por ejemplo desde "Mis inscripciones") se recibe aquí. */
  openId?: string | null
  onOpenChange?: (id: string | null) => void
}

export function CatalogActivities({ initialProgramId, token, onLogin, openId, onOpenChange }: CatalogActivitiesProps) {
  const [periodId, setPeriodId] = useState('')
  const [programId, setProgramId] = useState(initialProgramId ?? '')
  const [status, setStatus] = useState<'' | 'PUBLISHED' | 'IN_PROGRESS'>('')
  const [from, setFrom] = useState('')
  const [to, setTo] = useState('')
  const [view, setView] = useState<'list' | 'calendar'>('list')
  const [innerOpen, setInnerOpen] = useState<string | null>(null)
  const controlled = onOpenChange !== undefined
  const open = controlled ? (openId ?? null) : innerOpen
  const setOpen = (id: string | null) => (controlled ? onOpenChange(id) : setInnerOpen(id))

  useEffect(() => setProgramId(initialProgramId ?? ''), [initialProgramId])

  // Inscripciones de la persona (solo con sesión); se recargan tras inscribirse o cancelar.
  const [version, setVersion] = useState(0)
  const mine = useCatalog<Enrollment[]>(() => (token ? planningApi.enrollments.mine(token) : Promise.resolve([])), [token, version])
  const enrollments = mine.status === 'ready' ? mine.data : []

  const periods = useCatalog<Period[]>(() => planningApi.periods(), [])
  const programs = useCatalog(() => planningApi.catalog.programs(), [])
  const activities = useCatalog(
    () =>
      planningApi.catalog.activities({
        periodId: periodId || undefined,
        programId: programId && programId !== FREE ? programId : undefined,
        independent: programId === FREE ? true : undefined,
        status,
        ...dayRange(from, to),
      }),
    [periodId, programId, status, from, to],
  )

  const groups = useMemo(() => {
    if (activities.status !== 'ready') return []
    const map = new Map<string, CatalogActivity[]>()
    for (const a of activities.data.items) {
      const key = a.programName ?? (a.groupLabel ? `Libre · ${a.groupLabel}` : 'Actividades libres')
      map.set(key, [...(map.get(key) ?? []), a])
    }
    return [...map.entries()]
  }, [activities])

  if (open) {
    return (
      <OpenedActivity
        id={open}
        known={activities.status === 'ready' ? activities.data.items : []}
        periods={periods.status === 'ready' ? periods.data : []}
        token={token}
        mine={enrollments}
        onLogin={onLogin}
        onChanged={() => setVersion((v) => v + 1)}
        onBack={() => setOpen(null)}
      />
    )
  }

  return (
    <div className={styles.group}>
      <div className={styles.filters} role="search" aria-label="Filtrar actividades">
        <label className={consoleStyles.label}>
          <span>Periodo</span>
          <select className={consoleStyles.select} value={periodId} onChange={(e) => setPeriodId(e.target.value)}>
            <option value="">Todos</option>
            {periods.status === 'ready' && periods.data.map((p) => <option key={p.id} value={p.id}>{p.label}</option>)}
          </select>
        </label>
        <label className={consoleStyles.label}>
          <span>Programa</span>
          <select className={consoleStyles.select} value={programId} onChange={(e) => setProgramId(e.target.value)}>
            <option value="">Todos</option>
            <option value={FREE}>Actividades libres</option>
            {programs.status === 'ready' && programs.data.items.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
          </select>
        </label>
        <label className={consoleStyles.label}>
          <span>Estado</span>
          <select className={consoleStyles.select} value={status} onChange={(e) => setStatus(e.target.value as typeof status)}>
            <option value="">Publicadas y en ejecución</option>
            <option value="PUBLISHED">Próximas</option>
            <option value="IN_PROGRESS">En ejecución</option>
          </select>
        </label>
        <label className={consoleStyles.label}>
          <span>Desde</span>
          <input type="date" className={consoleStyles.select} value={from} max={to || undefined} onChange={(e) => setFrom(e.target.value)} />
        </label>
        <label className={consoleStyles.label}>
          <span>Hasta</span>
          <input type="date" className={consoleStyles.select} value={to} min={from || undefined} onChange={(e) => setTo(e.target.value)} />
        </label>
        <div className={styles.segmented} role="group" aria-label="Vista">
          <button type="button" className={styles.segment} aria-pressed={view === 'list'} onClick={() => setView('list')}>Lista</button>
          <button type="button" className={styles.segment} aria-pressed={view === 'calendar'} onClick={() => setView('calendar')}>Calendario</button>
        </div>
      </div>

      {activities.status === 'loading' && <p className={styles.hint}>Cargando actividades…</p>}
      {activities.status === 'error' && <p role="alert" className={styles.warnings}>{activities.message}</p>}
      {activities.status === 'ready' && activities.data.items.length === 0 && (
        <p className={styles.hint}>No hay actividades publicadas con esos filtros.</p>
      )}
      {activities.status === 'ready' && activities.data.items.length > 0 && view === 'calendar' && (
        <ActivityCalendar items={activities.data.items} onOpen={(id) => { setView('list'); setOpen(id) }} />
      )}
      {activities.status === 'ready' && view === 'list' &&
        groups.map(([title, items]) => (
          <section key={title} className={styles.group} aria-label={title}>
            <h3 className={styles.groupTitle}>{title}</h3>
            <ul className={detail.cards}>
              {items.map((a) => (
                <li key={a.id} className={detail.row}>
                  {a.imageUrl ? (
                    <img className={detail.thumb} src={imageSrc(a.imageUrl)} alt="" loading="lazy" />
                  ) : (
                    <span className={detail.thumbEmpty} aria-hidden="true" />
                  )}
                  <div className={detail.rowMeta}>
                    <h4 className={detail.rowTitle}>{a.title}</h4>
                    <span>{formatSchedule(a.startsAt, a.endsAt)} · {activityPlace(a)}</span>
                    <span>{a.requiresRegistration ? (a.participation.groups.length > 0 ? 'Con inscripción previa por grupo' : a.capacity ? `Cupo: ${a.capacity}` : 'Requiere registro previo') : 'Sin registro previo'}</span>
                  </div>
                  <div className={detail.rowSide}>
                    <span className={a.status === 'IN_PROGRESS' ? styles.chipLive : styles.chip}>{activityStatusLabels[a.status]}</span>
                    <button type="button" className={detail.link} onClick={() => setOpen(a.id)} aria-label={`Ver actividad ${a.title}`}>
                      Ver actividad →
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          </section>
        ))}
    </div>
  )
}


/** Carga la actividad abierta (aunque ya no esté en la lista filtrada) y muestra su detalle. */
function OpenedActivity({ id, known, periods, token, mine, onLogin, onChanged, onBack }: {
  id: string
  known: CatalogActivity[]
  periods: Period[]
  token?: string
  mine: Enrollment[]
  onLogin?: () => void
  onChanged: () => void
  onBack: () => void
}) {
  const [version, setVersion] = useState(0)
  const loaded = useCatalog<CatalogActivity>(() => planningApi.catalog.activity(id), [id, version])
  const activity = loaded.status === 'ready' ? loaded.data : known.find((a) => a.id === id)

  if (!activity) {
    return loaded.status === 'error' ? (
      <div className={styles.group}>
        <button type="button" className={detail.back} onClick={onBack}>← Actividades disponibles</button>
        <p role="alert" className={styles.warnings}>{loaded.message}</p>
      </div>
    ) : (
      <p className={styles.hint}>Cargando actividad…</p>
    )
  }
  return (
    <ActivityDetailView
      activity={activity}
      periodLabel={periods.find((p) => p.id === activity.periodId)?.label}
      token={token}
      mine={mine}
      onLogin={onLogin}
      onChanged={() => {
        setVersion((v) => v + 1)
        onChanged()
      }}
      onBack={onBack}
    />
  )
}
