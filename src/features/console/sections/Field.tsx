import { type ReactNode, useId } from 'react'
import styles from '../console.module.css'

/** Etiqueta asociada por id: el nombre accesible es solo el texto de la etiqueta. */
export function Field({ label, children }: { label: string; children: (id: string) => ReactNode }) {
  const id = useId()
  return (
    <div className={styles.label}>
      <label htmlFor={id}>{label}</label>
      {children(id)}
    </div>
  )
}
