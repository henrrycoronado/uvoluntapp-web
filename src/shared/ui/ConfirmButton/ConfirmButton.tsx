import { useState } from 'react'
import { Button, type ButtonVariant } from '../Button'
import styles from './ConfirmButton.module.css'

export interface ConfirmButtonProps {
  label: string
  confirmLabel: string
  onConfirm: () => Promise<void> | void
  variant?: ButtonVariant
  disabled?: boolean
}

/** Doble verificación sencilla: la acción sensible exige un segundo clic explícito. */
export function ConfirmButton({ label, confirmLabel, onConfirm, variant = 'secondary', disabled }: ConfirmButtonProps) {
  const [armed, setArmed] = useState(false)
  const [busy, setBusy] = useState(false)

  if (!armed) {
    return (
      <Button size="sm" variant={variant} disabled={disabled} onClick={() => setArmed(true)}>
        {label}
      </Button>
    )
  }

  return (
    <span className={styles.group} role="group" aria-label={`Confirmar: ${label}`}>
      <Button
        size="sm"
        variant="danger"
        disabled={busy}
        onClick={async () => {
          setBusy(true)
          try {
            await onConfirm()
          } finally {
            setBusy(false)
            setArmed(false)
          }
        }}
      >
        {busy ? 'Procesando…' : confirmLabel}
      </Button>
      <Button size="sm" variant="secondary" disabled={busy} onClick={() => setArmed(false)}>
        Cancelar
      </Button>
    </span>
  )
}
