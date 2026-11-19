import { type FormEvent, useState } from 'react'
import { activeRolesByRank, roleLabels } from '../../shared/session/roles'
import { useTheme } from '../../shared/theme/theme'
import { Button, TextField } from '../../shared/ui'
import { logout } from '../auth/logout'
import { describe } from '../console/sections/useAction'
import { profileApi, type ProfileView } from './api'
import styles from './profile.module.css'

const statusLabels: Record<string, string> = {
  ACTIVE: 'Activa',
  PENDING_APPROVAL: 'Pendiente de aprobación',
  SUSPENDED: 'Suspendida',
  REJECTED: 'Rechazada',
}

interface ProfileSectionProps {
  token: string
  profile: ProfileView
  onSaved: () => void
}

/** Perfil compartido por el espacio general y la consola: datos, tema y cierre de sesión. */
export function ProfileSection({ token, profile, onSaved }: ProfileSectionProps) {
  const [theme, toggleTheme] = useTheme()
  const [form, setForm] = useState({ firstName: profile.firstName, lastName: profile.lastName, phone: profile.phone ?? '' })
  const [message, setMessage] = useState<{ kind: 'ok' | 'error'; text: string } | null>(null)
  const [saving, setSaving] = useState(false)
  const activeRoles = activeRolesByRank(profile.roles)

  async function save(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setSaving(true)
    setMessage(null)
    try {
      await profileApi.update(token, { firstName: form.firstName, lastName: form.lastName, phone: form.phone || null })
      setMessage({ kind: 'ok', text: 'Datos actualizados.' })
      onSaved()
    } catch (caught) {
      setMessage({ kind: 'error', text: describe(caught) })
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className={styles.layout}>
      <section className={styles.card} aria-labelledby="profile-data">
        <h2 id="profile-data" className={styles.title}>Mis datos</h2>
        <dl className={styles.facts}>
          <div><dt>Correo</dt><dd>{profile.email}</dd></div>
          <div><dt>Correo institucional</dt><dd>{profile.institutionalEmail ?? 'Sin verificar'}</dd></div>
          <div><dt>Cuenta</dt><dd>{statusLabels[profile.accountStatus] ?? profile.accountStatus}</dd></div>
          <div>
            <dt>Roles</dt>
            <dd>{activeRoles.length === 0 ? 'Voluntario' : ['Voluntario', ...activeRoles.map((r) => roleLabels[r.role] ?? r.role)].join(', ')}</dd>
          </div>
        </dl>
        {message && (
          <p role={message.kind === 'error' ? 'alert' : 'status'} className={message.kind === 'error' ? styles.alert : styles.success}>
            {message.text}
          </p>
        )}
        <form className={styles.form} onSubmit={save} aria-label="Editar mis datos">
          <TextField label="Nombres" value={form.firstName} onChange={(e) => setForm({ ...form, firstName: e.target.value })} required />
          <TextField label="Apellidos" value={form.lastName} onChange={(e) => setForm({ ...form, lastName: e.target.value })} required />
          <TextField label="Teléfono" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
          <Button type="submit" variant="primary" disabled={saving}>{saving ? 'Guardando…' : 'Guardar cambios'}</Button>
        </form>
      </section>

      <section className={styles.card} aria-labelledby="profile-preferences">
        <h2 id="profile-preferences" className={styles.title}>Preferencias</h2>
        <div className={styles.themeRow} role="group" aria-label="Tema">
          <button type="button" className={theme === 'dark' ? styles.optionActive : styles.option} aria-pressed={theme === 'dark'} onClick={() => theme !== 'dark' && toggleTheme()}>
            Oscuro
          </button>
          <button type="button" className={theme === 'light' ? styles.optionActive : styles.option} aria-pressed={theme === 'light'} onClick={() => theme !== 'light' && toggleTheme()}>
            Claro
          </button>
        </div>
        <h2 className={styles.title}>Sesión</h2>
        <Button variant="secondary" onClick={() => void logout()}>Cerrar sesión</Button>
      </section>
    </div>
  )
}
