import { useLoad } from '../../console/sections/useLoad'
import { homeApi } from '../api'
import styles from '../home.module.css'

export function ProgramsSection({ token, reviewer }: { token: string; reviewer: boolean }) {
  const [programs] = useLoad(() => homeApi.programs(token))
  return (
    <>
      <div>
        <h1 className={styles.heading}>Programas</h1>
        <p className={styles.summary}>Programas de voluntariado de la Pastoral.</p>
      </div>
      {programs.status === 'loading' && <p className={styles.muted}>Cargando programas…</p>}
      {programs.status === 'error' && <p role="alert" className={styles.alert}>{programs.message}</p>}
      {programs.status === 'ready' &&
        (programs.data.items.length === 0 ? (
          <p className={styles.muted}>Aún no hay programas publicados.</p>
        ) : (
          <div className={styles.grid}>
            {programs.data.items.map((p) => (
              <article key={p.id} className={styles.program}>
                <h2 className={styles.programName}>{p.name}</h2>
                {p.description && <p className={styles.muted}>{p.description}</p>}
                {reviewer && p.status !== 'ACTIVE' && <span className={styles.badge}>{p.status === 'DRAFT' ? 'Borrador' : p.status}</span>}
              </article>
            ))}
          </div>
        ))}
    </>
  )
}
