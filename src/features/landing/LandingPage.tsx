import { navigate } from '../../app/navigation'
import styles from './landing.module.css'

const steps = [
  { title: 'Crea tu cuenta', text: 'Con tu correo @ucb.edu.bo se activa al instante. Con otro correo, un administrador revisa tu solicitud.' },
  { title: 'Elige un programa', text: 'Explora los programas de la Pastoral y las actividades que tienen abiertas.' },
  { title: 'Participa y registra', text: 'Tus inscripciones, asistencias y horas quedan guardadas en tu historial.' },
]

const audiences = [
  { title: 'Estudiantes y docentes UCB', text: 'Entran con su correo institucional o con Google y empiezan de inmediato.' },
  { title: 'Personas externas', text: 'Se suman a la Pastoral con una solicitud que revisa un administrador.' },
  { title: 'Líderes de programa', text: 'Organizan sus programas, actividades y equipos de apoyo desde la consola.' },
]

/** Presentación pública de Uvoluntapp y la Pastoral Universitaria UCB. */
export function LandingPage() {
  return (
    <div className={styles.page}>
      <main className={styles.content}>
        <section className={styles.hero}>
          <img className={styles.logo} src="/brand/logo-full.svg" alt="" width={120} height={142} />
          <p className={styles.wordmark}>
            U-Volunt<span className={styles.accent}>App</span>
          </p>
          <h1 className={styles.title}>El voluntariado de la Pastoral Universitaria UCB, en un solo lugar.</h1>
          <p className={styles.lead}>
            Conoce los programas, súmate a sus actividades y lleva el registro de tu servicio, desde cualquier dispositivo.
          </p>
          <div className={styles.actions}>
            <button type="button" className={styles.primary} onClick={() => navigate('/acceso')}>Empezar</button>
            <button type="button" className={styles.secondary} onClick={() => navigate('/registro')}>Crear cuenta</button>
          </div>
        </section>

        <section className={styles.block} aria-labelledby="como-funciona">
          <h2 id="como-funciona" className={styles.blockTitle}>Cómo funciona</h2>
          <ol className={styles.steps}>
            {steps.map((step) => (
              <li key={step.title} className={styles.step}>
                <h3 className={styles.cardTitle}>{step.title}</h3>
                <p className={styles.text}>{step.text}</p>
              </li>
            ))}
          </ol>
        </section>

        <section className={styles.block} aria-labelledby="para-quien">
          <h2 id="para-quien" className={styles.blockTitle}>Para quién es</h2>
          <div className={styles.grid}>
            {audiences.map((a) => (
              <article key={a.title} className={styles.card}>
                <h3 className={styles.cardTitle}>{a.title}</h3>
                <p className={styles.text}>{a.text}</p>
              </article>
            ))}
          </div>
        </section>

        <section className={styles.block} aria-labelledby="pastoral">
          <h2 id="pastoral" className={styles.blockTitle}>La Pastoral Universitaria</h2>
          <div className={styles.grid}>
            <article className={styles.card}>
              <h3 className={styles.cardTitle}>Misión</h3>
              <p className={styles.pending}>Texto pendiente: aquí va la misión oficial de la Pastoral Universitaria.</p>
            </article>
            <article className={styles.card}>
              <h3 className={styles.cardTitle}>Visión</h3>
              <p className={styles.pending}>Texto pendiente: aquí va la visión oficial de la Pastoral Universitaria.</p>
            </article>
          </div>
        </section>

        <section className={styles.cta}>
          <h2 className={styles.blockTitle}>¿Listo para sumarte?</h2>
          <button type="button" className={styles.primary} onClick={() => navigate('/registro')}>Crear mi cuenta</button>
        </section>
      </main>
      <footer className={styles.footer}>
        <span>Pastoral Universitaria · Universidad Católica Boliviana, Santa Cruz</span>
        <span>
          <button type="button" className={styles.footerLink} onClick={() => navigate('/acceso')}>Iniciar sesión</button>
        </span>
      </footer>
    </div>
  )
}
