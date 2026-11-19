import { type FormEvent, useState } from 'react'
import { navigate } from '../../../app/navigation'
import { ApiError } from '../../../shared/api/http'
import { Button } from '../../../shared/ui'
import { ApprovalFields, type ApprovalValues } from '../ApprovalFields'
import { AuthLayout } from '../AuthLayout'
import { authApi } from '../api'
import styles from '../auth.module.css'
import { commonMessage } from '../messages'
import { readPendingEmail, readPendingNames, setPendingNames } from '../session'
import { useFieldErrors } from '../useFieldErrors'
import { phoneError, requiredError } from '../validation'

/** Después del OTP (o de Google) con correo externo: datos para la solicitud de aprobación. */
export function CompleteRegistrationPage() {
  const email = readPendingEmail()
  const [values, setValues] = useState<ApprovalValues>({ ...readPendingNames(), phone: '', relationWithPastoral: '' })
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
    setSubmitting(true)
    try {
      await authApi.completeRegistration({
        email,
        firstName: values.firstName.trim(),
        lastName: values.lastName.trim(),
        phone: values.phone.trim(),
        relationWithPastoral: values.relationWithPastoral.trim(),
      })
      setPendingNames(null)
      navigate('/en-revision')
    } catch (caught) {
      setError(
        caught instanceof ApiError && (caught.status === 401 || caught.status === 403 || caught.status === 409)
          ? 'Tu verificación venció. Inicia sesión de nuevo para continuar.'
          : commonMessage(caught),
      )
    } finally {
      setSubmitting(false)
    }
  }

  if (!email) {
    return (
      <AuthLayout title="Completa tu solicitud">
        <p className={styles.notice}>Primero verifica tu correo para completar tu solicitud.</p>
        <Button variant="secondary" onClick={() => navigate('/acceso')}>Ir a iniciar sesión</Button>
      </AuthLayout>
    )
  }

  return (
    <AuthLayout
      title="Completa tu solicitud"
      description="Tu correo no es de la universidad, así que un administrador revisará tu cuenta. Cuéntanos quién eres."
    >
      <p className={styles.description}>
        Correo verificado: <span className={styles.email}>{email}</span>
      </p>
      {error && <p role="alert" className={styles.alert}>{error}</p>}
      <form className={styles.form} onSubmit={onSubmit} noValidate>
        <ApprovalFields values={values} fields={fields} onChange={setValues} />
        <div className={styles.actions}>
          <Button type="submit" variant="primary" size="lg" disabled={submitting}>
            {submitting ? 'Enviando…' : 'Enviar solicitud'}
          </Button>
        </div>
      </form>
    </AuthLayout>
  )
}
