import { type FormEvent, useState } from 'react'
import { AppHeader } from '../../app/AppHeader'
import { useCurrentUser } from '../../shared/session/useCurrentUser'
import { Button, TextField } from '../../shared/ui'
import { describe } from '../console/sections/useAction'
import { useLoad } from '../console/sections/useLoad'
import { profileApi, type ProfileView } from '../profile/api'
import { homeApi } from './api'
import styles from './home.module.css'

const statusLabels: Record<string, string> = {
  ACTIVE: 'Activa',
  PENDING_APPROVAL: 'Pendiente de aprobación',
  SUSPENDED: 'Suspendida',
  REJECTED: 'Rechazada',
}
const roleLabels: Record<string, string> = {
  ADMIN: 'Administrador',
  PROGRAM_LEADER: 'Líder de programa',
  OPERATIONAL_LEADER: 'Líder operativo',
}

export function HomePage() {
  const [user, reloadUser] = useCurrentUser()

  if (user.status === 'loading') return <main className={styles.page}><p className={styles.muted}>Cargando…</p></main>
  if (user.status === 'error') return <main className={styles.page}><p role="alert" className={styles.alert}>{user.message}</p></main>

  return (
    <>
      <AppHeader showConsole={user.can.canOpenConsole} current="inicio" />
      <main className={styles.page}>
        <section className={styles.hero}>
          <p className={styles.greeting}>Hola, {user.profile.firstName || 'voluntario'}.</p>
          <h1 className={styles.title}>Voluntariado de la Pastoral Universitaria UCB</h1>
          <p className={styles.lead}>
            Aquí encuentras los programas de voluntariado, tus datos y, pronto, tus inscripciones y registros.
          </p>
        </section>

        <section className={styles.pair} aria-label="Misión y visión">
          <article className={styles.card}>
            <h2 className={styles.cardTitle}>Misión</h2>
            <p className={styles.placeholder}>Texto pendiente: aquí va la misión oficial de la Pastoral Universitaria.</p>
          </article>
          <article className={styles.card}>
            <h2 className={styles.cardTitle}>Visión</h2>
            <p className={styles.placeholder}>Texto pendiente: aquí va la visión oficial de la Pastoral Universitaria.</p>
          </article>
        </section>

        <Programs token={user.session.accessToken} reviewer={user.can.canOpenConsole} />

        <section className={styles.pair}>
          <ProfileCard token={user.session.accessToken} profile={user.profile} onSaved={reloadUser} />
          <article className={styles.card}>
            <h2 className={styles.cardTitle}>Mis registros</h2>
            <ul className={styles.emptyList}>
              <li>Inscripciones: todavía no tienes.</li>
              <li>Registros de asistencia: todavía no tienes.</li>
              <li>Reportes personales: todavía no tienes.</li>
            </ul>
            <p className={styles.muted}>Esta sección se completa con los próximos módulos.</p>
          </article>
        </section>
      </main>
    </>
  )
}

function Programs({ token, reviewer }: { token: string; reviewer: boolean }) {
  const [programs] = useLoad(() => homeApi.programs(token))
  return (
    <section aria-labelledby="programs-title" className={styles.block}>
      <h2 id="programs-title" className={styles.sectionTitle}>Programas</h2>
      {programs.status === 'loading' && <p className={styles.muted}>Cargando programas…</p>}
      {programs.status === 'error' && <p role="alert" className={styles.alert}>{programs.message}</p>}
      {programs.status === 'ready' && (
        programs.data.items.length === 0 ? (
          <p className={styles.muted}>Aún no hay programas publicados.</p>
        ) : (
          <div className={styles.grid}>
            {programs.data.items.map((p) => (
              <article key={p.id} className={styles.program}>
                <h3 className={styles.programName}>{p.name}</h3>
                {p.description && <p className={styles.muted}>{p.description}</p>}
                {reviewer && p.status !== 'ACTIVE' && <span className={styles.badge}>{p.status === 'DRAFT' ? 'Borrador' : p.status}</span>}
                <p className={styles.activities}>Actividades: se publican con el módulo de actividades.</p>
              </article>
            ))}
          </div>
        )
      )}
    </section>
  )
}

function ProfileCard({ token, profile, onSaved }: { token: string; profile: ProfileView; onSaved: () => void }) {
  const [form, setForm] = useState({ firstName: profile.firstName, lastName: profile.lastName, phone: profile.phone ?? '' })
  const [message, setMessage] = useState<{ kind: 'ok' | 'error'; text: string } | null>(null)
  const [saving, setSaving] = useState(false)

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
    <article className={styles.card}>
      <h2 className={styles.cardTitle}>Mi perfil</h2>
      <dl className={styles.facts}>
        <div><dt>Correo</dt><dd>{profile.email}</dd></div>
        <div><dt>Correo institucional</dt><dd>{profile.institutionalEmail ?? 'Sin verificar'}</dd></div>
        <div><dt>Cuenta</dt><dd>{statusLabels[profile.accountStatus] ?? profile.accountStatus}</dd></div>
        <div>
          <dt>Roles</dt>
          <dd>{profile.roles.length === 0 ? 'Voluntario' : profile.roles.filter((r) => !r.revokedAt).map((r) => roleLabels[r.role] ?? r.role).join(', ')}</dd>
        </div>
      </dl>
      {message && <p role={message.kind === 'error' ? 'alert' : 'status'} className={message.kind === 'error' ? styles.alert : styles.success}>{message.text}</p>}
      <form className={styles.form} onSubmit={save} aria-label="Editar mi perfil">
        <TextField label="Nombres" value={form.firstName} onChange={(e) => setForm({ ...form, firstName: e.target.value })} required />
        <TextField label="Apellidos" value={form.lastName} onChange={(e) => setForm({ ...form, lastName: e.target.value })} required />
        <TextField label="Teléfono" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
        <Button type="submit" variant="primary" disabled={saving}>{saving ? 'Guardando…' : 'Guardar cambios'}</Button>
      </form>
    </article>
  )
}
