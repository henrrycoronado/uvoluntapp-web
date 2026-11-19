import styles from '../home.module.css'

const records = [
  { title: 'Inscripciones', text: 'Las actividades en las que te inscribas aparecerán aquí.' },
  { title: 'Registros de asistencia', text: 'Tus entradas y salidas en actividades.' },
  { title: 'Reportes personales', text: 'Tu resumen de horas y participación.' },
]

export function RecordsSection() {
  return (
    <>
      <div>
        <h1 className={styles.heading}>Mis registros</h1>
        <p className={styles.summary}>Tu participación en la Pastoral. Se completa con los próximos módulos.</p>
      </div>
      <div className={styles.pair}>
        {records.map((r) => (
          <article key={r.title} className={styles.empty}>
            <h2 className={styles.cardTitle}>{r.title}</h2>
            <p className={styles.muted}>{r.text}</p>
            <p className={styles.muted}>Todavía no tienes registros.</p>
          </article>
        ))}
      </div>
    </>
  )
}
