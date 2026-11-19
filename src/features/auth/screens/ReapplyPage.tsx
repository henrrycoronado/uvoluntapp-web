import { type FormEvent, useState } from 'react'
import { navigate } from '../../../app/navigation'
import { ApiError } from '../../../shared/api/http'
import { Button, TextField } from '../../../shared/ui'
import { ApprovalFields, type ApprovalValues } from '../ApprovalFields'
import { AuthLayout } from '../AuthLayout'
import { authApi } from '../api'
import styles from '../auth.module.css'
import { commonMessage, formatDate } from '../messages'
import { takeReapplyHandoff } from '../reapplyHandoff'
import { readPendingEmail } from '../session'
import { useFieldErrors } from '../useFieldErrors'
import { phoneError, requiredError } from '../validation'

const handoff = () => takeReapplyHandoff() ?? { password: '', reason: '' }

/** Cuenta externa rechazada que vuelve a postular pasado un día. */
export function ReapplyPage() {
  const email = readPendingEmail()
  const [{ password: given, reason }] = useState(handoff)
  const [password, setPassword] = useState(given)
  const [values, setValues] = useState<ApprovalValues>({ firstName: '', lastName: '', phone: '', relationWithPastoral: '' })
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const fields = useFieldErrors<keyof ApprovalValues>({
    firstName: () => requiredError(values.firstName, 'tus nombres'),
    lastName: () => requiredError(values.lastName, 'tus apellidos'),
    phone: () => phoneError(values.phone),
    relationWithPastoral: () => requiredError(values.relationWithPastoral, 'tu relación con la Pastoral'),
  })

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError(null)
    if (!fields.submit(event.currentTarget)) return
    if (!password) {
      setError('Escribe tu contraseña para confirmar que eres tú.')
      return
    }
    setSubmitting(true)
    try {
      await authApi.reapply({
        email,
        password,
        firstName: values.firstName.trim(),
        lastName: values.lastName.trim(),
        phone: values.phone.trim(),
        relationWithPastoral: values.relationWithPastoral.trim(),
      })
      navigate('/en-revision')
    } catch (caught) {
      if (caught instanceof ApiError && caught.problem.type === 'urn:uvoluntapp:reapply-too-early') {
        setError(`Todavía no puedes enviar otra solicitud. Podrás hacerlo desde el ${formatDate(caught.problem.reapplyAvailableAt)}.`)
      } else if (caught instanceof ApiError && caught.status === 401) {
        setError('La contraseña no es correcta.')
      } else {
        setError(commonMessage(caught))
      }
    } finally {
      setSubmitting(false)
    }
  }

  if (!email) {
    return (
      <AuthLayout title="Nueva solicitud">
        <p className={styles.notice}>Inicia sesión con tu cuenta para enviar una nueva solicitud.</p>
        <Button variant="secondary" onClick={() => navigate('/acceso')}>Ir a iniciar sesión</Button>
      </AuthLayout>
    )
  }

  return (
    <AuthLayout title="Nueva solicitud" description="Tu solicitud anterior fue rechazada. Puedes enviar una nueva con tus datos actualizados.">
      {reason && <p className={styles.notice}>Motivo del rechazo: {reason}</p>}
      {error && <p role="alert" className={styles.alert}>{error}</p>}
      <form className={styles.form} onSubmit={onSubmit} noValidate>
        <ApprovalFields values={values} fields={fields} onChange={setValues} />
        {!given && (
          <TextField label="Contraseña" name="password" type="password" autoComplete="current-password" value={password} onChange={(e) => setPassword(e.target.value)} required />
        )}
        <div className={styles.actions}>
          <Button type="submit" variant="primary" size="lg" disabled={submitting}>
            {submitting ? 'Enviando…' : 'Enviar nueva solicitud'}
          </Button>
        </div>
      </form>
    </AuthLayout>
  )
}
