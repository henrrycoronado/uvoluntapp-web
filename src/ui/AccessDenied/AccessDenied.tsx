import type { ReactNode } from 'react'
import styles from './AccessDenied.module.css'

export interface AccessDeniedProps {
  /** Main title. */
  title?: string
  /** Description or guidance. */
  message?: string
  /** Optional action button (e.g. go back, log in). */
  action?: ReactNode
}

export function AccessDenied({
  title = 'Acceso denegado',
  message = 'No tienes permiso para ver esta página.',
  action,
}: AccessDeniedProps) {
  return (
    <div className={styles['denied-container']} role="alert">
      <span className={styles.icon} aria-hidden="true">
        🔒
      </span>
      <h2 className={styles.title}>{title}</h2>
      <p className={styles.message}>{message}</p>
      {action}
    </div>
  )
}
