import { CatalogActivities } from '../../planning/CatalogExplorer'
import styles from '../home.module.css'

/** Actividades publicadas y en ejecución, en lista o calendario (SCRUM-52). */
export function ActivitiesSection({ programId }: { programId?: string }) {
  return (
    <>
      <div>
        <h1 className={styles.heading}>Actividades</h1>
        <p className={styles.summary}>Próximas actividades y las que están en curso, por programa o grupo.</p>
      </div>
      <CatalogActivities initialProgramId={programId} />
    </>
  )
}
