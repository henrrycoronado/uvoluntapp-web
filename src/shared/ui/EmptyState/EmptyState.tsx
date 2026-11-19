import type { ReactNode } from 'react'
import styles from './EmptyState.module.css'

export interface EmptyStateProps {
  /** Main title for the empty state. */
  title?: string
  /** Description or guidance. */
  message?: string
  /** Optional action button (e.g. create first item). */
  action?: ReactNode
}

export function EmptyState({
  title = 'Sin resultados',
  message = 'No hay elementos para mostrar.',
  action,
}: EmptyStateProps) {
  return (
    <div className={styles['empty-container']}>
      <span className={styles.icon} aria-hidden="true">
        📭
      </span>
      <h2 className={styles.title}>{title}</h2>
      <p className={styles.message}>{message}</p>
      {action}
    </div>
  )
}
