import { type FormEvent, useState } from 'react'
import { navigate } from '../../../app/navigation'
import { ApiError } from '../../../shared/api/http'
import { Button } from '../../../shared/ui'
import { AuthLayout } from '../AuthLayout'
import { CodeBoxes } from '../CodeBoxes'
import { ResendCode } from '../ResendCode'
import { authApi } from '../api'
import styles from '../auth.module.css'
import { commonMessage } from '../messages'
import { readPendingEmail, writeSession } from '../session'
import { codeError } from '../validation'

export function OtpPage() {
  const email = readPendingEmail()
  const [code, setCode] = useState('')
  const [message, setMessage] = useState<{ kind: 'ok' | 'error'; text: string } | null>(null)
  const [submitting, setSubmitting] = useState(false)

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setMessage(null)
    if (codeError(code)) {
      setMessage({ kind: 'error', text: 'Escribe los 6 dígitos del código.' })
      return
    }
    setSubmitting(true)
    try {
      const result = await authApi.verifyOtp(email, code)
      if (result.tokens) {
        writeSession(result.tokens)
        navigate('/inicio')
      } else if (result.requiresApprovalData) {
        navigate('/completar-registro')
      } else {
        navigate('/en-revision')
      }
    } catch (caught) {
      setMessage({
        kind: 'error',
        text: caught instanceof ApiError && caught.status === 422 ? 'El código es incorrecto o ya venció. Revisa tu correo o pide otro.' : commonMessage(caught),
      })
    } finally {
      setSubmitting(false)
    }
  }

  if (!email) {
    return (
      <AuthLayout title="Verifica tu correo">
        <p className={styles.notice}>Primero crea tu cuenta para recibir el código.</p>
        <Button variant="secondary" onClick={() => navigate('/registro')}>Ir a crear cuenta</Button>
      </AuthLayout>
    )
  }

  return (
    <AuthLayout
      variant="register"
      eyebrow="Verificación de correo"
      title="Confirma tu correo"
      description="Enviamos un código de seis dígitos al correo indicado después de validar tu formulario de registro manual."
    >
      <p className={styles.description}>
        Correo: <span className={styles.email}>{email}</span>
      </p>
      {message && (
        <p role={message.kind === 'error' ? 'alert' : 'status'} className={message.kind === 'error' ? styles.alert : styles.success}>
          {message.text}
        </p>
      )}
      <form className={styles.form} onSubmit={onSubmit} noValidate>
        <p className={styles.codeLabel}>Código de verificación</p>
        <CodeBoxes label="Código de verificación" value={code} onChange={setCode} />
        <p className={styles.help}>El código es de un solo uso y caduca en 10 minutos. No lo compartas.</p>
        <div className={styles.actions}>
          <Button type="submit" variant="primary" size="lg" disabled={submitting || code.length !== 6}>
            {submitting ? 'Verificando…' : 'Verificar código'}
          </Button>
        </div>
      </form>
      <ResendCode send={() => authApi.resendOtp(email)} onMessage={setMessage} />
      <p className={styles.footnote}>
        ¿Te equivocaste de correo?{' '}
        <button type="button" className={styles.link} onClick={() => navigate('/registro')}>
          Volver al registro
        </button>
      </p>
    </AuthLayout>
  )
}
