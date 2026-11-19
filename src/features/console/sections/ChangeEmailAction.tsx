import { useState } from 'react'
import { Button, ConfirmButton } from '../../../shared/ui'
import { emailError } from '../../auth/validation'
import styles from '../console.module.css'

interface ChangeEmailActionProps {
  currentEmail: string
  onConfirm: (newEmail: string, reason: string) => Promise<void>
}

/** Reemplaza el correo de acceso de quien lo perdió: correo nuevo, motivo y doble confirmación. */
export function ChangeEmailAction({ currentEmail, onConfirm }: ChangeEmailActionProps) {
  const [open, setOpen] = useState(false)
  const [email, setEmail] = useState('')
  const [reason, setReason] = useState('')

  if (!open) {
    return <Button variant="secondary" size="sm" onClick={() => setOpen(true)}>Cambiar correo</Button>
  }

  const invalid = Boolean(emailError(email)) || email.trim().toLowerCase() === currentEmail.toLowerCase() || !reason.trim()

  return (
    <span className={styles.actions}>
      <input
        className={styles.select}
        type="email"
        aria-label={`Correo nuevo para ${currentEmail}`}
        placeholder="Correo nuevo"
        value={email}
        onChange={(event) => setEmail(event.target.value)}
      />
      <input
        className={styles.select}
        aria-label="Motivo del cambio de correo"
        placeholder="Motivo"
        value={reason}
        onChange={(event) => setReason(event.target.value)}
      />
      <ConfirmButton
        label="Cambiar"
        confirmLabel="Confirmar cambio"
        disabled={invalid}
        onConfirm={async () => {
          await onConfirm(email.trim(), reason.trim())
          setOpen(false)
          setEmail('')
          setReason('')
        }}
      />
      <Button variant="secondary" size="sm" onClick={() => setOpen(false)}>Cancelar</Button>
    </span>
  )
}
