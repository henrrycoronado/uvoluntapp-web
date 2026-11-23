import { type FormEvent, useState } from 'react'
import { ApiError } from '../../shared/api/http'
import { Button, TextField } from '../../shared/ui'
import { logout } from '../auth/logout'
import { commonMessage } from '../auth/messages'
import { codeError, emailError, isInstitutional } from '../auth/validation'
import { LIMITS } from '../auth/validation'
import { profileApi, type ProfileView } from './api'
import styles from './profile.module.css'

type Feedback = { kind: 'ok' | 'error'; text: string } | null

function errorText(caught: unknown, codeStep: boolean): string {
  if (caught instanceof ApiError && caught.status === 401) return 'La contraseña no es correcta.'
  if (caught instanceof ApiError && caught.status === 422) {
    return codeStep ? 'El código es incorrecto o ya venció.' : 'No se puede usar ese correo. Prueba con otro.'
  }
  if (caught instanceof ApiError && caught.status === 409) return 'No se puede usar ese correo. Prueba con otro.'
  return commonMessage(caught)
}

function FeedbackLine({ feedback }: { feedback: Feedback }) {
  if (!feedback) return null
  return (
    <p role={feedback.kind === 'error' ? 'alert' : 'status'} className={feedback.kind === 'error' ? styles.alert : styles.success}>
      {feedback.text}
    </p>
  )
}

/** Cambio del correo de acceso: contraseña + código al correo nuevo. Al confirmar se cierran todas las sesiones. */
function AccessEmail({ token, profile }: { token: string; profile: ProfileView }) {
  const [step, setStep] = useState<'idle' | 'request' | 'verify'>('idle')
  const [form, setForm] = useState({ email: '', password: '', code: '' })
  const [feedback, setFeedback] = useState<Feedback>(null)
  const [busy, setBusy] = useState(false)

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setFeedback(null)
    const invalid = step === 'request' ? emailError(form.email) ?? (form.password ? undefined : 'Escribe tu contraseña actual.') : codeError(form.code)
    if (invalid) {
      setFeedback({ kind: 'error', text: invalid })
      return
    }
    setBusy(true)
    try {
      if (step === 'request') {
        await profileApi.changeEmail(token, form.email.trim(), form.password)
        setForm((current) => ({ ...current, password: '' }))
        setStep('verify')
        setFeedback({ kind: 'ok', text: `Enviamos un código a ${form.email.trim()}.` })
      } else {
        await profileApi.verifyEmailChange(token, form.code)
        // El servidor revocó todas las sesiones: hay que volver a entrar con el correo nuevo.
        await logout()
      }
    } catch (caught) {
      setFeedback({ kind: 'error', text: errorText(caught, step === 'verify') })
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className={styles.block}>
      <div className={styles.blockHead}>
        <div>
          <h3 className={styles.subtitle}>Correo de acceso</h3>
          <p className={styles.muted}>{profile.email}</p>
        </div>
        {step === 'idle' && (
          <Button variant="secondary" size="sm" onClick={() => setStep('request')}>Cambiar</Button>
        )}
      </div>
      <FeedbackLine feedback={feedback} />
      {step !== 'idle' && (
        <form className={styles.form} onSubmit={submit} noValidate aria-label="Cambiar correo de acceso">
          {step === 'request' ? (
            <>
              <TextField label="Correo nuevo" maxLength={LIMITS.email} type="email" autoComplete="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} required />
              <TextField label="Contraseña actual" maxLength={LIMITS.password} type="password" autoComplete="current-password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} required />
              <p className={styles.muted}>
                Al confirmar el correo nuevo se cerrarán todas tus sesiones. Si no es un correo @ucb.edu.bo, tu cuenta quedará
                sin verificar hasta que un administrador la revise.
              </p>
            </>
          ) : (
            <TextField label="Código" inputMode="numeric" autoComplete="one-time-code" maxLength={6} value={form.code} onChange={(e) => setForm({ ...form, code: e.target.value.replace(/\D/g, '') })} required />
          )}
          <div className={styles.actionsRow}>
            <Button type="submit" variant="primary" size="sm" disabled={busy}>
              {busy ? 'Enviando…' : step === 'request' ? 'Enviar código' : 'Confirmar correo'}
            </Button>
            <Button type="button" variant="secondary" size="sm" onClick={() => { setStep('idle'); setFeedback(null) }}>Cancelar</Button>
          </div>
        </form>
      )}
    </div>
  )
}

/** Correo institucional: habilita compromisos de horas a una cuenta externa, sin nueva aprobación. */
function InstitutionalEmail({ token, profile, onSaved }: { token: string; profile: ProfileView; onSaved: () => void }) {
  const verified = Boolean(profile.institutionalEmail && profile.institutionalEmailVerifiedAt)
  const [step, setStep] = useState<'idle' | 'request' | 'verify'>('idle')
  const [form, setForm] = useState({ email: '', code: '' })
  const [feedback, setFeedback] = useState<Feedback>(null)
  const [busy, setBusy] = useState(false)

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setFeedback(null)
    const invalid =
      step === 'request'
        ? emailError(form.email) ?? (isInstitutional(form.email) ? undefined : 'Usa tu correo @ucb.edu.bo.')
        : codeError(form.code)
    if (invalid) {
      setFeedback({ kind: 'error', text: invalid })
      return
    }
    setBusy(true)
    try {
      if (step === 'request') {
        await profileApi.setInstitutionalEmail(token, form.email.trim())
        setStep('verify')
        setFeedback({ kind: 'ok', text: `Enviamos un código a ${form.email.trim()}.` })
      } else {
        await profileApi.verifyInstitutionalEmail(token, form.code)
        setStep('idle')
        setFeedback({ kind: 'ok', text: 'Correo institucional verificado.' })
        onSaved()
      }
    } catch (caught) {
      setFeedback({ kind: 'error', text: errorText(caught, step === 'verify') })
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className={styles.block}>
      <div className={styles.blockHead}>
        <div>
          <h3 className={styles.subtitle}>Correo institucional</h3>
          <p className={styles.muted}>{verified ? `${profile.institutionalEmail} · verificado` : 'Sin verificar. Lo necesitas para comprometer horas de voluntariado.'}</p>
        </div>
        {!verified && step === 'idle' && (
          <Button variant="secondary" size="sm" onClick={() => setStep('request')}>Verificar</Button>
        )}
      </div>
      <FeedbackLine feedback={feedback} />
      {step !== 'idle' && (
        <form className={styles.form} onSubmit={submit} noValidate aria-label="Verificar correo institucional">
          {step === 'request' ? (
            <TextField label="Correo @ucb.edu.bo" maxLength={LIMITS.email} type="email" autoComplete="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} required />
          ) : (
            <TextField label="Código" inputMode="numeric" autoComplete="one-time-code" maxLength={6} value={form.code} onChange={(e) => setForm({ ...form, code: e.target.value.replace(/\D/g, '') })} required />
          )}
          <div className={styles.actionsRow}>
            <Button type="submit" variant="primary" size="sm" disabled={busy}>
              {busy ? 'Enviando…' : step === 'request' ? 'Enviar código' : 'Verificar'}
            </Button>
            <Button type="button" variant="secondary" size="sm" onClick={() => { setStep('idle'); setFeedback(null) }}>Cancelar</Button>
          </div>
        </form>
      )}
    </div>
  )
}

export function EmailSettings({ token, profile, onSaved }: { token: string; profile: ProfileView; onSaved: () => void }) {
  return (
    <section className={styles.card} aria-labelledby="profile-emails">
      <h2 id="profile-emails" className={styles.title}>Correos</h2>
      <AccessEmail token={token} profile={profile} />
      <InstitutionalEmail token={token} profile={profile} onSaved={onSaved} />
    </section>
  )
}
