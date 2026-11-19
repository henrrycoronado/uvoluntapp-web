import { navigate } from '../../app/navigation'
import { readSession } from '../auth/session'
import styles from './landing.module.css'

/** Presentación pública de Uvoluntapp y la Pastoral. "Empezar" lleva al espacio general o al acceso. */
export function LandingPage() {
  const start = () => navigate(readSession() ? '/inicio' : '/acceso')

  return (
    <main className={styles.page}>
      <section className={styles.hero}>
        <img className={styles.logo} src="/brand/logo-full.svg" alt="" width={120} height={142} />
        <p className={styles.wordmark}>
          U-Volunt<span className={styles.accent}>App</span>
        </p>
        <h1 className={styles.title}>El voluntariado de la Pastoral Universitaria UCB, en un solo lugar.</h1>
        <p className={styles.lead}>
          Conoce los programas, súmate a sus actividades y lleva el registro de tu servicio.
        </p>
        <div className={styles.actions}>
          <button type="button" className={styles.primary} onClick={start}>Empezar</button>
          <button type="button" className={styles.secondary} onClick={() => navigate('/registro')}>Crear cuenta</button>
        </div>
      </section>

      <section className={styles.about} aria-label="La Pastoral Universitaria">
        <article className={styles.card}>
          <h2 className={styles.cardTitle}>Misión</h2>
          <p className={styles.placeholder}>Texto pendiente: aquí va la misión oficial de la Pastoral Universitaria.</p>
        </article>
        <article className={styles.card}>
          <h2 className={styles.cardTitle}>Visión</h2>
          <p className={styles.placeholder}>Texto pendiente: aquí va la visión oficial de la Pastoral Universitaria.</p>
        </article>
        <article className={styles.card}>
          <h2 className={styles.cardTitle}>Programas</h2>
          <p className={styles.placeholder}>Al entrar verás los programas activos y sus actividades.</p>
        </article>
      </section>
    </main>
  )
}
