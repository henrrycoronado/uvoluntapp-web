import type { VisibleSection } from '../access'
import styles from '../console.module.css'

/** Sección que llega con un módulo posterior: explica qué podrá hacer la persona con su rol. */
export function PlaceholderSection({ section }: { section: VisibleSection }) {
  const plans = section.plans
  const items = plans ? (section.level === 'edit' ? [...plans.edit, ...plans.review] : plans.review) : []
  return (
    <div className={styles.panel}>
      <h2 className={styles.subheading}>Lo que podrás hacer aquí</h2>
      {items.length > 0 ? (
        <ul className={styles.planList}>
          {items.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>
      ) : (
        <p className={styles.muted}>Esta sección se define con su módulo.</p>
      )}
      <p className={styles.muted}>Disponible con el {section.module?.toLowerCase() ?? 'próximo módulo'}. Por ahora no hay datos que mostrar.</p>
    </div>
  )
}
