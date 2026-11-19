import { useState } from 'react'
import styles from './auth.module.css'
import { commonMessage } from './messages'
import { useCountdown } from './useCountdown'

const WAIT_SECONDS = 60

interface ResendCodeProps {
  send: () => Promise<unknown>
  onMessage: (message: { kind: 'ok' | 'error'; text: string }) => void
}

/** Botón "Reenviar código" con espera entre envíos. */
export function ResendCode({ send, onMessage }: ResendCodeProps) {
  const countdown = useCountdown(WAIT_SECONDS)
  const [sending, setSending] = useState(false)

  async function resend() {
    setSending(true)
    try {
      await send()
      countdown.restart()
      onMessage({ kind: 'ok', text: 'Te enviamos un código nuevo. El anterior ya no sirve.' })
    } catch (caught) {
      onMessage({ kind: 'error', text: commonMessage(caught) })
    } finally {
      setSending(false)
    }
  }

  return (
    <p className={styles.resend}>
      {countdown.remaining > 0 ? (
        <span aria-live="polite">Puedes pedir otro código en {countdown.remaining} s</span>
      ) : (
        <button type="button" className={styles.link} onClick={() => void resend()} disabled={sending}>
          {sending ? 'Enviando…' : 'Reenviar código'}
        </button>
      )}
    </p>
  )
}
