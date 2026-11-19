import styles from './LoadingState.module.css'

export interface LoadingStateProps {
  /** Accessible label for the spinner. */
  message?: string
}

export function LoadingState({ message = 'Cargando…' }: LoadingStateProps) {
  return (
    <div className={styles.loading} role="status" aria-label={message}>
      <div className={styles.spinner} />
      <span className={styles.message}>{message}</span>
    </div>
  )
}
