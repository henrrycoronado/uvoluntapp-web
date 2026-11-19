import { type FormEvent, useMemo, useState } from 'react'
import type { ProfileView } from '../../profile/api'
import type { Capabilities } from '../../../shared/session/capabilities'
import { activeRolesByRank } from '../../../shared/session/roles'
import { Button, ConfirmButton } from '../../../shared/ui'
import type { Access } from '../access'
import { consoleApi, type NewRoleAssignment, type Program, type RoleAssignment, type UserSummary } from '../api'
import styles from '../console.module.css'
import { Field } from './Field'
import { Feedback } from './Feedback'
import { useAction } from './useAction'
import { useLoad } from './useLoad'

const roleLabels: Record<string, string> = {
  ADMIN: 'Administrador',
  PROGRAM_LEADER: 'Líder de programa',
  OPERATIONAL_LEADER: 'Líder operativo',
}

interface RolesSectionProps {
  token: string
  access: Access
  can: Capabilities
  profile: ProfileView
}

export function RolesSection({ token, access, can, profile }: RolesSectionProps) {
  if (access === 'review') {
    return <OwnRoles profile={profile} />
  }
  if (!can.isAdmin && can.ledProgramIds.length === 0) {
    return (
      <div className={styles.panel}>
        <p className={styles.muted}>
          Eres líder de programa, pero todavía no tienes programas asignados. Cuando un administrador te asigne uno, aquí podrás gestionar sus líderes operativos.
        </p>
      </div>
    )
  }
  return <ManageRoles token={token} can={can} />
}

/** El líder operativo revisa sus propios roles; no gestiona asignaciones. */
function OwnRoles({ profile }: { profile: ProfileView }) {
  return (
    <div className={styles.panel}>
      <p className={styles.muted}>Como líder operativo puedes revisar tus roles. La gestión la hacen el ADMIN y el líder de programa.</p>
      <ul>
        {activeRolesByRank(profile.roles).map((r) => (
          <li key={r.id}>{roleLabels[r.role] ?? r.role} · {r.scope === 'GLOBAL' ? 'Sin programa asignado' : 'Programa'}</li>
        ))}
      </ul>
    </div>
  )
}

function ManageRoles({ token, can }: { token: string; can: Capabilities }) {
  const [data, reload] = useLoad(() =>
    Promise.all([consoleApi.roles.list(token), consoleApi.users.list(token), consoleApi.programs.list(token)]),
  )
  const { message, run } = useAction()

  if (data.status === 'loading') return <div className={styles.panel}><p className={styles.muted}>Cargando roles…</p></div>
  if (data.status === 'error') return <div className={styles.panel}><p role="alert" className={styles.alert}>{data.message}</p></div>

  const [roles, users, programs] = data.data
  const userName = (id: string) => {
    const user = users.items.find((u) => u.id === id)
    return user ? `${user.firstName} ${user.lastName}` : 'Persona'
  }
  const programName = (id?: string | null) => programs.items.find((p) => p.id === id)?.name ?? 'Programa'
  const canRevoke = (r: RoleAssignment) =>
    !r.revokedAt && (can.isAdmin || (r.role === 'OPERATIONAL_LEADER' && !!r.scopeId && can.ledProgramIds.includes(r.scopeId)))

  return (
    <div className={styles.panel}>
      <AssignForm
        can={can}
        users={users.items.filter((u) => u.accountStatus === 'ACTIVE')}
        programs={can.isAdmin ? programs.items : programs.items.filter((p) => can.ledProgramIds.includes(p.id))}
        onAssign={(body) => run(() => consoleApi.roles.create(token, body), 'Rol asignado.', reload)}
      />
      <Feedback message={message} />
      {roles.items.length === 0 ? (
        <p className={styles.muted}>Todavía no hay asignaciones.</p>
      ) : (
        <table className={styles.table}>
          <thead>
            <tr>
              <th>Persona</th>
              <th>Rol</th>
              <th>Ámbito</th>
              <th>Estado</th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {roles.items.map((r) => (
              <tr key={r.id}>
                <td>{userName(r.userId)}</td>
                <td>{roleLabels[r.role] ?? r.role}</td>
                <td>{r.scope === 'GLOBAL' ? (r.role === 'ADMIN' ? 'Global' : 'Sin programa asignado') : programName(r.scopeId)}</td>
                <td>{assignmentState(r)}</td>
                <td>
                  {canRevoke(r) && (
                    <ConfirmButton
                      label="Revocar"
                      confirmLabel="Confirmar revocación"
                      onConfirm={() => run(() => consoleApi.roles.revoke(token, r.id), 'Rol revocado.', reload)}
                    />
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  )
}

function assignmentState(r: RoleAssignment): string {
  if (r.revokedAt) return 'Revocado'
  if (!r.validUntil) return 'Vigente'
  const until = new Date(r.validUntil)
  const date = until.toLocaleDateString('es-BO')
  return until < new Date() ? `Vencido el ${date}` : `Vigente hasta el ${date}`
}

interface AssignFormProps {
  can: Capabilities
  users: UserSummary[]
  programs: Program[]
  onAssign: (body: NewRoleAssignment) => Promise<void>
}

function AssignForm({ can, users, programs, onAssign }: AssignFormProps) {
  const roleOptions = useMemo(
    () => (can.isAdmin ? (['PROGRAM_LEADER', 'OPERATIONAL_LEADER'] as const) : (['OPERATIONAL_LEADER'] as const)),
    [can.isAdmin],
  )
  const [userId, setUserId] = useState('')
  const [role, setRole] = useState<NewRoleAssignment['role']>(roleOptions[0])
  const [programId, setProgramId] = useState('')
  const [until, setUntil] = useState('')

  const allowNoProgram = can.isAdmin && role === 'PROGRAM_LEADER'
  const today = new Date().toISOString().slice(0, 10)

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    await onAssign({
      userId,
      role,
      scope: programId ? 'PROGRAM' : 'GLOBAL',
      scopeId: programId || null,
      // La vigencia cubre el día elegido completo.
      validUntil: until ? new Date(`${until}T23:59:59`).toISOString() : null,
    })
  }

  return (
    <form className={styles.formRow} onSubmit={submit} aria-label="Asignar rol">
      <Field label="Persona">
        {(id) => (
          <select id={id} className={styles.select} value={userId} onChange={(e) => setUserId(e.target.value)} required>
            <option value="">Elige una persona</option>
            {users.map((u) => (
              <option key={u.id} value={u.id}>{u.firstName} {u.lastName} · {u.email}</option>
            ))}
          </select>
        )}
      </Field>
      <Field label="Rol">
        {(id) => (
          <select id={id} className={styles.select} value={role} onChange={(e) => setRole(e.target.value as NewRoleAssignment['role'])}>
            {roleOptions.map((r) => (
              <option key={r} value={r}>{roleLabels[r]}</option>
            ))}
          </select>
        )}
      </Field>
      <Field label="Programa">
        {(id) => (
          <select id={id} className={styles.select} value={programId} onChange={(e) => setProgramId(e.target.value)} required={!allowNoProgram}>
            <option value="">{allowNoProgram ? 'Sin programa por ahora' : 'Elige un programa'}</option>
            {programs.map((p) => (
              <option key={p.id} value={p.id}>{p.name}</option>
            ))}
          </select>
        )}
      </Field>
      <Field label="Vigente hasta (opcional)">
        {(id) => <input id={id} type="date" className={styles.select} min={today} value={until} onChange={(e) => setUntil(e.target.value)} />}
      </Field>
      <Button type="submit" variant="primary" disabled={!userId || (!allowNoProgram && !programId)}>
        Asignar
      </Button>
    </form>
  )
}
