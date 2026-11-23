import { useState } from 'react'
import { ConfirmButton } from '../../../shared/ui'
import styles from '../console.module.css'
import { LIMITS } from '../../auth/validation'

interface ReasonActionProps {
  label: string
  confirmLabel: string
  onConfirm: (reason: string) => Promise<void>
}

/** Acción sensible con motivo obligatorio y doble confirmación. */
export function ReasonAction({ label, confirmLabel, onConfirm }: ReasonActionProps) {
  const [reason, setReason] = useState('')
  return (
    <span className={styles.actions}>
      <input
        className={styles.select}
        aria-label={`Motivo para ${label.toLowerCase()}`}
        placeholder="Motivo"
        maxLength={LIMITS.reason}
        value={reason}
        onChange={(event) => setReason(event.target.value)}
      />
      <ConfirmButton
        label={label}
        confirmLabel={confirmLabel}
        disabled={reason.trim().length === 0}
        onConfirm={async () => {
          await onConfirm(reason.trim())
          setReason('')
        }}
      />
    </span>
  )
}
