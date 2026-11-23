import { type FormEvent, useState } from 'react'
import { navigate } from '../../../app/navigation'
import { Button, TextField } from '../../../shared/ui'
import { AuthLayout } from '../AuthLayout'
import styles from '../auth.module.css'
import { readPendingEmail, readPendingGoogleToken, readPendingNames } from '../session'
import { useFieldErrors } from '../useFieldErrors'
import { useGoogleSignIn } from '../useGoogleSignIn'
import { LIMITS, phoneError, requiredError } from '../validation'

interface Values {
  firstName: string
  lastName: string
  phone: string
}

/** Acceso institucional con Google al que le faltan datos de contacto: se completan y se repite la solicitud. */
export function CompleteGoogleProfilePage() {
  const idToken = readPendingGoogleToken()
  const email = readPendingEmail()
  const [values, setValues] = useState<Values>({ ...readPendingNames(), phone: '' })
  const [submitting, setSubmitting] = useState(false)
  const google = useGoogleSignIn()
  const fields = useFieldErrors<keyof Values>({
    firstName: () => requiredError(values.firstName, 'tus nombres'),
    lastName: () => requiredError(values.lastName, 'tus apellidos'),
    phone: () => phoneError(values.phone),
  })

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!fields.submit(event.currentTarget)) return
    setSubmitting(true)
    try {
      await google.onCredential(idToken, { firstName: values.firstName.trim(), lastName: values.lastName.trim(), phone: values.phone.trim() })
    } finally {
      setSubmitting(false)
    }
  }

  if (!idToken) {
    return (
      <AuthLayout title="Completa tu perfil">
        <p className={styles.notice}>Tu acceso con Google venció. Vuelve a iniciar sesión para continuar.</p>
        <Button variant="secondary" onClick={() => navigate('/acceso')}>Ir a iniciar sesión</Button>
      </AuthLayout>
    )
  }

  const bind = (name: keyof Values) => ({
    name,
    value: values[name],
    error: fields.error(name),
    onBlur: fields.blur(name),
    onChange: (event: { target: { value: string } }) => setValues({ ...values, [name]: event.target.value }),
  })

  return (
    <AuthLayout
      variant="register"
      eyebrow="Google OAuth confirmado"
      title="Un último paso para comenzar"
      description="Confirmamos tu identidad con Google. Revisa los datos de tu perfil y agrega un teléfono válido antes de crear la cuenta."
    >
      {google.error && <p role="alert" className={styles.alert}>{google.error}</p>}
      <form className={styles.form} onSubmit={onSubmit} noValidate>
        <div className={styles.row}>
          <TextField label="Nombres (editable)" maxLength={LIMITS.personName} autoComplete="given-name" required {...bind('firstName')} />
          <TextField label="Apellidos (editable)" maxLength={LIMITS.personName} autoComplete="family-name" required {...bind('lastName')} />
        </div>
        {email && <TextField label="Correo verificado · no editable" value={email} readOnly disabled />}
        <TextField label="Teléfono" maxLength={LIMITS.phone} placeholder="Ej. +591 7XXXXXXX" type="tel" inputMode="tel" autoComplete="tel" required {...bind('phone')} />
        <p className={styles.info}>
          El número debe cumplir el formato internacional y ser único. Si utilizas un correo externo, la cuenta podrá requerir aprobación institucional. No se solicita contraseña ni OTP.
        </p>
        <div className={styles.actions}>
          <Button type="submit" variant="primary" size="lg" disabled={submitting}>
            {submitting ? 'Guardando…' : 'Completar registro'}
          </Button>
        </div>
      </form>
      <div className={styles.stackLinks}>
        <button type="button" className={styles.link} onClick={() => navigate('/acceso')}>
          ¿Prefieres volver a tu cuenta Google?
        </button>
      </div>
    </AuthLayout>
  )
}
