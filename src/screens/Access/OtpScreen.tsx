import { useState, type FormEvent } from 'react'
import { BrandBanner, Button, ErrorState, LoadingState, TextField } from '../../ui'
import { completeRegistration, problemMessage, resendOtp, verifyOtp } from './accessApi'
import styles from './Access.module.css'

interface OtpScreenProps {
  email: string
  firstName: string
  lastName: string
  onVerified: () => void
}

export function OtpScreen({ email, firstName, lastName, onVerified }: OtpScreenProps) {
  const [code, setCode] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')
  const [needsDetails, setNeedsDetails] = useState(false)
  const [details, setDetails] = useState({ phone: '', relation: '' })

  async function submit(event: FormEvent) {
    event.preventDefault()
    setError('')
    setMessage('')
    if (!/^\d{6}$/.test(code)) {
      setError('Ingresa un código de 6 dígitos.')
      return
    }
    setLoading(true)
    try {
      const result = await verifyOtp(email, code)
      if (result.requiresApprovalData) setNeedsDetails(true)
      else {
        setMessage('Correo verificado. Ya puedes iniciar sesión.')
        onVerified()
      }
    } catch (requestError) {
      setError(problemMessage(requestError, 'No se pudo verificar el código.'))
    } finally {
      setLoading(false)
    }
  }

  async function submitDetails(event: FormEvent) {
    event.preventDefault()
    setError('')
    if (!details.phone || !details.relation) {
      setError('Completa tu teléfono y relación con la Pastoral.')
      return
    }
    setLoading(true)
    try {
      const result = await completeRegistration({
        email,
        firstName,
        lastName,
        phone: details.phone,
        relationWithPastoral: details.relation,
      })
      setMessage(result.message)
      setNeedsDetails(false)
    } catch (requestError) {
      setError(problemMessage(requestError, 'No se pudo enviar la solicitud.'))
    } finally {
      setLoading(false)
    }
  }

  async function resend() {
    setError('')
    setLoading(true)
    try {
      setMessage((await resendOtp(email)).message)
    } catch (requestError) {
      setError(problemMessage(requestError, 'No se pudo reenviar el código.'))
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className={styles.page}>
      <BrandBanner />
      <main className={styles.content}>
        <section className={styles.card}>
          <div className={styles.heading}>
            <h2 className={styles.title}>Verifica tu correo</h2>
            <p className={styles.muted}>Enviamos un código de 6 dígitos a {email}.</p>
          </div>
          {loading && <LoadingState message="Procesando…" />}
          {error && <ErrorState title="No se pudo completar" message={error} />}
          {message && <p className={styles.success} role="status">{message}</p>}
          {!needsDetails ? (
            <form className={styles.form} onSubmit={submit} noValidate>
              <TextField label="Código de verificación" inputMode="numeric" maxLength={6} value={code} onChange={(event) => setCode(event.target.value.replace(/\D/g, ''))} />
              <div className={styles.actions}>
                <Button type="submit" disabled={loading}>Verificar código</Button>
                <Button type="button" variant="secondary" onClick={resend} disabled={loading}>Reenviar código</Button>
              </div>
            </form>
          ) : (
            <form className={styles.form} onSubmit={submitDetails} noValidate>
              <TextField label="Teléfono" type="tel" value={details.phone} onChange={(event) => setDetails({ ...details, phone: event.target.value })} />
              <TextField label="Relación con la Pastoral" value={details.relation} onChange={(event) => setDetails({ ...details, relation: event.target.value })} />
              <Button type="submit" disabled={loading}>Enviar solicitud</Button>
            </form>
          )}
        </section>
      </main>
    </div>
  )
}
