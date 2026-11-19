import type { ReactNode } from 'react'
import styles from './ErrorState.module.css'

export interface ErrorStateProps {
  /** Main error title. */
  title?: string
  /** Detailed error description. */
  message?: string
  /** Optional action button (e.g. retry). */
  action?: ReactNode
}

export function ErrorState({
  title = 'Algo salió mal',
  message = 'Ocurrió un error inesperado. Intenta de nuevo más tarde.',
  action,
}: ErrorStateProps) {
  return (
    <div className={styles['error-container']} role="alert">
      <span className={styles.icon} aria-hidden="true">
        ⚠
      </span>
      <h2 className={styles.title}>{title}</h2>
      <p className={styles.message}>{message}</p>
      {action}
    </div>
  )
}
