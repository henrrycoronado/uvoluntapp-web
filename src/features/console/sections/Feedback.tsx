import styles from '../console.module.css'

export function Feedback({ message }: { message: { kind: 'ok' | 'error'; text: string } | null }) {
  if (!message) return null
  return (
    <p role={message.kind === 'error' ? 'alert' : 'status'} className={message.kind === 'error' ? styles.alert : styles.success}>
      {message.text}
    </p>
  )
}
