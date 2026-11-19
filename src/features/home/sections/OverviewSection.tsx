import type { ProfileView } from '../../profile/api'
import styles from '../home.module.css'

export function OverviewSection({ profile }: { profile: ProfileView }) {
  return (
    <>
      <div className={styles.intro}>
        <p className={styles.greeting}>Hola, {profile.firstName || 'voluntario'}.</p>
        <h1 className={styles.title}>Voluntariado de la Pastoral Universitaria UCB</h1>
        <p className={styles.lead}>Desde aquí ves los programas, sus actividades y tu historial de participación.</p>
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
