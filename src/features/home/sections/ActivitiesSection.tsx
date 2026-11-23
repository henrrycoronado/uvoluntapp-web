import { CatalogActivities } from '../../planning/CatalogExplorer'
import styles from '../home.module.css'

/** Actividades publicadas y en ejecución, en lista o calendario (SCRUM-52). */
export function ActivitiesSection({ programId, token, openId, onOpenChange }: { programId?: string; token?: string; openId?: string | null; onOpenChange?: (id: string | null) => void }) {
  return (
    <>
      {!openId && (
        <div>
          <h1 className={styles.heading}>Actividades disponibles</h1>
          <p className={styles.summary}>Próximas actividades y las que están en curso, por programa o grupo.</p>
        </div>
      )}
      <CatalogActivities initialProgramId={programId} token={token} openId={openId} onOpenChange={onOpenChange} />
    </>
  )
}
