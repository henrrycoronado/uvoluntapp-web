import { useLoad } from '../../console/sections/useLoad'
import { homeApi } from '../api'
import styles from '../home.module.css'

export function ActivitiesSection({ token }: { token: string }) {
  const [programs] = useLoad(() => homeApi.programs(token))
  return (
    <>
      <div>
        <h1 className={styles.heading}>Actividades</h1>
        <p className={styles.summary}>Actividades agrupadas por programa.</p>
      </div>
      {programs.status === 'loading' && <p className={styles.muted}>Cargando…</p>}
      {programs.status === 'error' && <p role="alert" className={styles.alert}>{programs.message}</p>}
      {programs.status === 'ready' &&
        programs.data.items.map((p) => (
          <section key={p.id} className={styles.card} aria-label={p.name}>
            <h2 className={styles.cardTitle}>{p.name}</h2>
            <p className={styles.muted}>Todavía no hay actividades publicadas. Llegan con el módulo de actividades.</p>
          </section>
        ))}
    </>
  )
}
