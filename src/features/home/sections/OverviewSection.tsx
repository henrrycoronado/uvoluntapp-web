import type { ProfileView } from '../../profile/api'
import { activeRolesByRank, roleLabels } from '../../../shared/session/roles'
import { useLoad } from '../../console/sections/useLoad'
import { planningApi } from '../../planning/api'
import { activityPlace, formatSchedule } from '../../planning/format'
import styles from '../home.module.css'

interface OverviewProps {
  profile: ProfileView
  onOpen: (sectionId: string) => void
}

/** Panel de inicio: cifras propias, próximos pasos y la Pastoral. */
export function OverviewSection({ profile, onOpen }: OverviewProps) {
  const [programs] = useLoad(() => planningApi.catalog.programs())
  const [upcoming] = useLoad(() => planningApi.catalog.activities({ status: 'PUBLISHED' }))
  const roles = activeRolesByRank(profile.roles)
  const activePrograms = programs.status === 'ready' ? programs.data.meta.totalCount : null

  const stats = [
    { label: 'Programas activos', value: activePrograms ?? '—', section: 'programas' },
    { label: 'Mis inscripciones', value: 0, section: 'registros' },
    { label: 'Horas registradas', value: 0, section: 'registros' },
  ]

  return (
    <>
      <div className={styles.intro}>
        <p className={styles.greeting}>Hola, {profile.firstName || 'voluntario'}.</p>
        <h1 className={styles.title}>Voluntariado de la Pastoral Universitaria UCB</h1>
        <p className={styles.lead}>
          {roles.length === 0
            ? 'Eres parte del voluntariado. Explora los programas y súmate a sus actividades.'
            : `Participas como voluntario y como ${roles.map((r) => roleLabels[r.role].toLowerCase()).join(', ')}.`}
        </p>
      </div>

      <div className={styles.stats}>
        {stats.map((s) => (
          <button key={s.label} type="button" className={styles.stat} onClick={() => onOpen(s.section)}>
            <span className={styles.statValue}>{s.value}</span>
            <span className={styles.statLabel}>{s.label}</span>
          </button>
        ))}
      </div>

      <div className={styles.pair}>
        <article className={styles.card}>
          <h2 className={styles.cardTitle}>Próximas actividades</h2>
          {upcoming.status === 'ready' && upcoming.data.items.length > 0 ? (
            <ul className={styles.upcoming}>
              {[...upcoming.data.items]
                .sort((a, b) => a.startsAt.localeCompare(b.startsAt))
                .slice(0, 3)
                .map((a) => (
                  <li key={a.id}>
                    <strong>{a.title}</strong>
                    <span className={styles.muted}>{formatSchedule(a.startsAt, a.endsAt)} · {activityPlace(a)}</span>
                  </li>
                ))}
            </ul>
          ) : (
            <p className={styles.muted}>{upcoming.status === 'loading' ? 'Cargando…' : 'Aún no hay actividades publicadas.'}</p>
          )}
          <button type="button" className={styles.link} onClick={() => onOpen('actividades')}>Ver todas las actividades</button>
        </article>
        <article className={styles.card}>
          <h2 className={styles.cardTitle}>Tu cuenta</h2>
          <p className={styles.muted}>
            {profile.institutionalEmail ? 'Tu correo institucional está verificado.' : 'Aún no verificaste un correo institucional.'}
          </p>
          <button type="button" className={styles.link} onClick={() => onOpen('perfil')}>Ir a mi perfil</button>
        </article>
      </div>

      <div className={styles.pair}>
        <article className={styles.card}>
          <h2 className={styles.cardTitle}>Misión</h2>
          <p className={styles.placeholder}>Texto pendiente: aquí va la misión oficial de la Pastoral Universitaria.</p>
        </article>
        <article className={styles.card}>
          <h2 className={styles.cardTitle}>Visión</h2>
          <p className={styles.placeholder}>Texto pendiente: aquí va la visión oficial de la Pastoral Universitaria.</p>
        </article>
      </div>
    </>
  )
}
