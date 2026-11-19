import { useState } from 'react'
import type { Capabilities } from '../../../shared/session/capabilities'
import { Button, ConfirmButton } from '../../../shared/ui'
import { planningApi, type PlanningProgram, type TeamMember } from '../../planning/api'
import planning from '../../planning/planning.module.css'
import type { Access } from '../access'
import { consoleApi } from '../api'
import styles from '../console.module.css'
import { Feedback } from './Feedback'
import { Field } from './Field'
import { useAction } from './useAction'
import { useLoad } from './useLoad'

const roleLabels = { PROGRAM_LEADER: 'Líder de programa', OPERATIONAL_LEADER: 'Líder operativo' } as const

/**
 * Agregación a programas (SCRUM-122): equipo de líderes de cada programa. El ADMIN asigna líderes de programa;
 * el ADMIN y el líder del programa asignan líderes operativos. Toda asignación se revoca con efecto inmediato.
 */
export function TeamSection({ token, can, access }: { token: string; can: Capabilities; access: Access }) {
  const [programs] = useLoad(() => planningApi.programs.list(token))
  const [programId, setProgramId] = useState('')

  if (programs.status === 'loading') return <p className={styles.muted}>Cargando programas…</p>
  if (programs.status === 'error') return <p role="alert" className={styles.alert}>{programs.message}</p>

  const items = programs.data.items
  const program = items.find((p) => p.id === programId)

  return (
    <div className={styles.panel}>
      <Field label="Programa">
        {(id) => (
          <select id={id} className={styles.select} value={programId} onChange={(e) => setProgramId(e.target.value)}>
            <option value="">Elige un programa</option>
            {items.map((p) => <option key={p.id} value={p.id}>{p.name}{p.canManage ? ' · gestionas' : ''}</option>)}
          </select>
        )}
      </Field>
      {items.length === 0 && <p className={styles.muted}>Aún no hay programas.</p>}
      {program ? (
        <Team key={program.id} token={token} program={program} can={can} editable={access === 'edit' && program.canManage} />
      ) : (
        items.length > 0 && <p className={styles.muted}>Elige un programa para ver su equipo.</p>
      )}
    </div>
  )
}

function Team({ token, program, can, editable }: { token: string; program: PlanningProgram; can: Capabilities; editable: boolean }) {
  const [team, reload] = useLoad(() => planningApi.programs.team(token, program.id))
  // Nombres de quien asignó; si la persona no puede listar usuarios, la columna queda sin nombre.
  const [people] = useLoad(() => consoleApi.users.list(token).catch(() => null))
  const { message, run } = useAction()
  const grantedBy = (id?: string | null) => {
    const u = people.status === 'ready' ? people.data?.items.find((x) => x.id === id) : undefined
    return u ? `${u.firstName} ${u.lastName}` : '—'
  }

  if (team.status === 'loading') return <p className={styles.muted}>Cargando equipo…</p>
  if (team.status === 'error') return <p role="alert" className={styles.alert}>{team.message}</p>

  const members = team.data.filter((m) => m.scope === 'PROGRAM')
  const delegations = team.data.filter((m) => m.scope === 'ACTIVITY')
  const canRevoke = (m: TeamMember) => editable && (can.isAdmin || m.role === 'OPERATIONAL_LEADER')
  const revoke = (m: TeamMember) => run(() => planningApi.delegations.revoke(token, m.assignmentId), 'Asignación revocada.', reload)

  return (
    <>
      {!editable && <p className={styles.muted}>Solo consulta: el equipo lo gestionan un ADMIN y los líderes de este programa.</p>}
      <Feedback message={message} />
      {members.length === 0 ? (
        <p className={styles.muted}>El programa aún no tiene líderes asignados.</p>
      ) : (
        <table className={styles.table}>
          <thead>
            <tr>
              <th>Persona</th>
              <th>Rol</th>
              <th>Vigencia</th>
              <th>Asignado por</th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {members.map((m) => (
              <tr key={m.assignmentId}>
                <td>{m.fullName}<br /><span className={styles.muted}>{m.email}</span></td>
                <td>{roleLabels[m.role]}</td>
                <td>{m.validUntil ? `Hasta el ${new Date(m.validUntil).toLocaleDateString('es-BO')}` : 'Sin vencimiento'}</td>
                <td>{grantedBy(m.grantedBy)}</td>
                <td>{canRevoke(m) && <ConfirmButton label="Revocar" confirmLabel="Confirmar revocación" onConfirm={() => revoke(m)} />}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      {delegations.length > 0 && (
        <div className={planning.group}>
          <h3 className={planning.groupTitle}>Delegaciones a actividades</h3>
          <ul className={planning.list}>
            {delegations.map((m) => (
              <li key={m.assignmentId} className={planning.itemHead}>
                <span>{m.fullName} · {m.activityTitle ?? 'Actividad'}</span>
                {canRevoke(m) && <ConfirmButton label="Revocar" confirmLabel="Confirmar revocación" onConfirm={() => revoke(m)} />}
              </li>
            ))}
          </ul>
        </div>
      )}

      {editable && <AddMember token={token} program={program} can={can} existing={members} onAdded={reload} run={run} />}
    </>
  )
}

interface AddMemberProps {
  token: string
  program: PlanningProgram
  can: Capabilities
  existing: TeamMember[]
  onAdded: () => void
  run: ReturnType<typeof useAction>['run']
}

function AddMember({ token, program, can, existing, onAdded, run }: AddMemberProps) {
  const [users] = useLoad(() => consoleApi.users.list(token))
  const roles = can.isAdmin ? (['OPERATIONAL_LEADER', 'PROGRAM_LEADER'] as const) : (['OPERATIONAL_LEADER'] as const)
  const [role, setRole] = useState<TeamMember['role']>(roles[0])
  const [userId, setUserId] = useState('')

  if (users.status !== 'ready') return users.status === 'error' ? <p role="alert" className={styles.alert}>{users.message}</p> : null

  const candidates = users.data.items.filter((u) => u.accountStatus === 'ACTIVE' && !existing.some((m) => m.userId === u.id && m.role === role))

  return (
    <form
      className={styles.formRow}
      aria-label="Sumar al equipo"
      onSubmit={(e) => {
        e.preventDefault()
        void run(
          () => planningApi.delegations.assign(token, { userId, role, scope: 'PROGRAM', scopeId: program.id }),
          `${roleLabels[role]} sumado al programa.`,
          () => { setUserId(''); onAdded() },
        )
      }}
    >
      <Field label="Persona">
        {(id) => (
          <select id={id} className={styles.select} value={userId} onChange={(e) => setUserId(e.target.value)} required>
            <option value="">Elige una persona</option>
            {candidates.map((u) => <option key={u.id} value={u.id}>{u.firstName} {u.lastName} · {u.email}</option>)}
          </select>
        )}
      </Field>
      <Field label="Rol en el programa">
        {(id) => (
          <select id={id} className={styles.select} value={role} onChange={(e) => setRole(e.target.value as TeamMember['role'])}>
            {roles.map((r) => <option key={r} value={r}>{roleLabels[r]}</option>)}
          </select>
        )}
      </Field>
      <Button type="submit" disabled={!userId}>Sumar al equipo</Button>
    </form>
  )
}
