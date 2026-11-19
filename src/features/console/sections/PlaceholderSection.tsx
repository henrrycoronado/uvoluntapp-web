import type { SectionDefinition } from '../access'
import styles from '../console.module.css'

/** Sección reservada: ya tiene su lugar y sus permisos; el contenido llega con su módulo. */
export function PlaceholderSection({ section, canEdit }: { section: SectionDefinition; canEdit: boolean }) {
  return (
    <div className={styles.empty}>
      <p className={styles.muted}>{section.summary}</p>
      <p className={styles.muted}>
        Este espacio se habilita con el {section.module.toLowerCase()}.{' '}
        {canEdit ? 'Cuando esté listo, podrás gestionarlo desde aquí.' : 'Cuando esté listo, podrás consultarlo desde aquí.'}
      </p>
    </div>
  )
}
