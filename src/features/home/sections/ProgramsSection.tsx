import { CatalogPrograms } from '../../planning/CatalogExplorer'
import type { CatalogProgram } from '../../planning/api'
import styles from '../home.module.css'

/** Programas activos con su ficha (SCRUM-52). */
export function ProgramsSection({ onSeeActivities }: { onSeeActivities: (program: CatalogProgram) => void }) {
  return (
    <>
      <div>
        <h1 className={styles.heading}>Programas</h1>
        <p className={styles.summary}>Programas de voluntariado activos de la Pastoral.</p>
      </div>
      <CatalogPrograms onSeeActivities={onSeeActivities} />
    </>
  )
}
