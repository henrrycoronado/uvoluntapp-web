import { useState } from 'react'
import type { Capabilities } from '../../../shared/session/capabilities'
import { Button, ConfirmButton } from '../../../shared/ui'
import { ActivityForm } from '../../planning/ActivityForm'
import { planningApi, type Activity, type ActivityStatus, type ConflictWarning, type Period, type PlanningProgram } from '../../planning/api'
import { activityStatusLabels, formatSchedule, fromLocalInput, modalityLabels, toLocalInput } from '../../planning/format'
import planning from '../../planning/planning.module.css'
import { consoleApi } from '../api'
import styles from '../console.module.css'
import { Feedback } from './Feedback'
import { Field } from './Field'
import { ReasonAction } from './ReasonAction'
import { useAction } from './useAction'
import { useLoad } from './useLoad'

const statusChip: Record<ActivityStatus, string> = {
  DRAFT: planning.chipWarning,
  PUBLISHED: planning.chipPublic,
  IN_PROGRESS: planning.chipLive,
  FINISHED: planning.chip,
  CANCELLED: planning.chip,
}

interface ActivityDetailProps {
  token: string
  activity: Activity
  can: Capabilities
  programs: PlanningProgram[]
  periods: Period[]
  onChanged: () => void
  onRemoved: () => void
}

/** Detalle de una actividad con las acciones que permite su estado y el rol (el servidor decide siempre). */
export function ActivityDetail({ token, activity: a, can, programs, periods, onChanged, onRemoved }: ActivityDetailProps) {
  const [editing, setEditing] = useState(false)
  const { message, run } = useAction()
  const manage = a.canManage
  const period = periods.find((p) => p.id === a.periodId)

  return (
    <section className={styles.panel} aria-label={`Actividad ${a.title}`}>
      <div className={planning.toolbar}>
        <h2 className={styles.subheading}>{a.title}</h2>
        <span className={statusChip[a.status]}>{activityStatusLabels[a.status]}</span>
      </div>
      <p className={styles.muted}>
        {a.programName ?? `Actividad libre${a.groupLabel ? ` · ${a.groupLabel}` : ''}`}
        {period ? ` · Periodo ${period.label}` : ''}
      </p>
      {!manage && <p className={styles.muted}>Solo consulta: la gestionan un ADMIN y los líderes responsables.</p>}
      <Feedback message={message} />

      {editing ? (
        <ActivityForm
          activity={a}
          programs={programs.filter((p) => p.canManage)}
          canCreateFree={can.isAdmin}
          periods={periods}
          onCancel={() => setEditing(false)}
          checkConflicts={({ plan }) =>
            planningApi.activities
              .checkConflicts(token, { activityId: a.id, startsAt: plan.startsAt, endsAt: plan.endsAt, location: plan.location })
              .then((r) => r.conflicts)
          }
          onSubmit={({ plan }) => run(() => planningApi.activities.update(token, a.id, plan), 'Actividad actualizada.', () => { setEditing(false); onChanged() })}
        />
      ) : (
        <>
          <dl className={planning.facts}>
            <div><dt>Horario</dt><dd>{formatSchedule(a.startsAt, a.endsAt)}</dd></div>
            <div><dt>Modalidad</dt><dd>{modalityLabels[a.modality]}</dd></div>
            {a.location && <div><dt>Lugar</dt><dd>{a.location}</dd></div>}
            {a.meetingUrl && <div><dt>Enlace</dt><dd>{a.meetingUrl}</dd></div>}
            <div>
              <dt>Registro previo</dt>
              <dd>{a.requiresRegistration ? `Sí · ${a.capacity ? `cupo ${a.capacity}` : 'sin límite de cupo'}` : 'No'}</dd>
            </div>
            {a.expectedHours != null && <div><dt>Horas previstas</dt><dd>{a.expectedHours} h</dd></div>}
            {a.periodicityNote && <div><dt>Periodicidad</dt><dd>{a.periodicityNote}</dd></div>}
            {a.participationConditions && <div><dt>Condiciones</dt><dd>{a.participationConditions}</dd></div>}
            {a.cancellationReason && <div><dt>Motivo de cancelación</dt><dd>{a.cancellationReason}</dd></div>}
          </dl>
          {a.description && <p className={styles.muted}>{a.description}</p>}
        </>
      )}

      {manage && !editing && (
        <div className={styles.actions}>
          {a.status !== 'FINISHED' && a.status !== 'CANCELLED' && (
            <Button size="sm" variant="secondary" onClick={() => setEditing(true)}>Editar</Button>
          )}
          {a.status === 'DRAFT' && (
            <ConfirmButton
              label="Publicar"
              confirmLabel="Confirmar publicación"
              variant="primary"
              onConfirm={() => run(() => planningApi.activities.publish(token, a.id), 'Actividad publicada: ya aparece en el catálogo.', onChanged)}
            />
          )}
          {a.status === 'IN_PROGRESS' && (
            <ConfirmButton
              label="Finalizar"
              confirmLabel="Confirmar finalización"
              onConfirm={() => run(() => planningApi.activities.finish(token, a.id), 'Actividad finalizada.', onChanged)}
            />
          )}
          {a.status === 'DRAFT' && (
            <ConfirmButton
              label="Descartar borrador"
              confirmLabel="Confirmar descarte"
              onConfirm={() => run(() => planningApi.activities.discard(token, a.id), 'Borrador descartado.', onRemoved)}
            />
          )}
        </div>
      )}
      {manage && !editing && (a.status === 'DRAFT' || a.status === 'PUBLISHED') && (
        <ReasonAction
          label="Cancelar actividad"
          confirmLabel="Confirmar cancelación"
          onConfirm={(reason) => run(() => planningApi.activities.cancel(token, a.id, reason), 'Actividad cancelada.', onChanged)}
        />
      )}
      {manage && a.status === 'DRAFT' && (
        <p className={styles.muted}>Para publicar, el programa debe estar activo y la actividad tener lugar o enlace según su modalidad.</p>
      )}

      {manage && a.status === 'PUBLISHED' && !editing && <RescheduleForm key={`form-${a.startsAt}`} token={token} activity={a} onDone={onChanged} report={run} />}
      <RescheduleHistory key={`history-${a.startsAt}`} token={token} activityId={a.id} />
      {a.canMove && !editing && <MoveForm token={token} activity={a} programs={programs} onDone={onChanged} />}
      {manage && <Delegations key={a.programId ?? 'libre'} token={token} activity={a} can={can} />}
    </section>
  )
}

/** Reprogramar (SCRUM-51): primero se revisan los conflictos y luego se confirma con motivo. */
function RescheduleForm({ token, activity, onDone, report }: { token: string; activity: Activity; onDone: () => void; report: ReturnType<typeof useAction>['run'] }) {
  const [startsAt, setStartsAt] = useState(toLocalInput(activity.startsAt))
  const [endsAt, setEndsAt] = useState(toLocalInput(activity.endsAt))
  const [reason, setReason] = useState('')
  const [conflicts, setConflicts] = useState<ConflictWarning[] | null>(null)
  const { message, run } = useAction()

  const invalid = !startsAt || !endsAt || new Date(endsAt) <= new Date(startsAt)
  const unchanged = startsAt === toLocalInput(activity.startsAt) && endsAt === toLocalInput(activity.endsAt)
  const reset = (fn: (v: string) => void) => (v: string) => {
    fn(v)
    setConflicts(null)
  }

  return (
    <div className={planning.fieldset} role="group" aria-label="Reprogramar">
      <h3 className={planning.groupTitle}>Reprogramar</h3>
      <div className={planning.grid2}>
        <Field label="Nuevo inicio">
          {(id) => <input id={id} type="datetime-local" className={styles.select} value={startsAt} onChange={(e) => reset(setStartsAt)(e.target.value)} />}
        </Field>
        <Field label="Nuevo fin">
          {(id) => <input id={id} type="datetime-local" className={styles.select} value={endsAt} min={startsAt} onChange={(e) => reset(setEndsAt)(e.target.value)} />}
        </Field>
      </div>
      {invalid && <p className={styles.alert}>El fin debe ser posterior al inicio.</p>}
      {conflicts === null ? (
        <div>
          <Button
            size="sm"
            variant="secondary"
            disabled={invalid || unchanged}
            onClick={() =>
              run(async () => {
                const result = await planningApi.activities.checkConflicts(token, {
                  activityId: activity.id,
                  startsAt: fromLocalInput(startsAt),
                  endsAt: fromLocalInput(endsAt),
                  location: activity.location,
                })
                setConflicts(result.conflicts)
              }, 'Conflictos revisados.')
            }
          >
            Revisar conflictos
          </Button>
        </div>
      ) : (
        <>
          {conflicts.length === 0 ? (
            <p role="status" className={styles.success}>Sin conflictos de líderes ni de lugar.</p>
          ) : (
            <ul className={planning.warnings} aria-label="Advertencias de conflicto">
              {conflicts.map((c) => <li key={`${c.type}-${c.conflictingActivityId}`}>{c.message}</li>)}
            </ul>
          )}
          <Field label="Motivo de la reprogramación">
            {(id) => <input id={id} className={styles.select} value={reason} maxLength={500} onChange={(e) => setReason(e.target.value)} />}
          </Field>
          <div>
            <ConfirmButton
              label="Reprogramar"
              confirmLabel={conflicts.length ? 'Reprogramar de todos modos' : 'Confirmar reprogramación'}
              disabled={!reason.trim() || invalid}
              onConfirm={() =>
                report(
                  () => planningApi.activities.reschedule(token, activity.id, { reason: reason.trim(), newStartsAt: fromLocalInput(startsAt), newEndsAt: fromLocalInput(endsAt) }),
                  'Actividad reprogramada.',
                  onDone,
                )
              }
            />
          </div>
        </>
      )}
      <Feedback message={message} />
    </div>
  )
}

function RescheduleHistory({ token, activityId }: { token: string; activityId: string }) {
  const [history] = useLoad(() => planningApi.activities.reschedules(token, activityId))
  if (history.status !== 'ready' || history.data.length === 0) return null
  return (
    <div className={planning.group}>
      <h3 className={planning.groupTitle}>Historial de reprogramaciones</h3>
      <ul className={planning.list}>
        {history.data.map((r) => (
          <li key={r.id} className={planning.item}>
            <span className={planning.meta}>
              <span>{new Date(r.createdAt).toLocaleString('es-BO', { dateStyle: 'short', timeStyle: 'short' })}</span>
              <span>De {formatSchedule(r.previousStartsAt, r.previousEndsAt)} a {formatSchedule(r.newStartsAt, r.newEndsAt)}</span>
            </span>
            <span>{r.reason}</span>
          </li>
        ))}
      </ul>
    </div>
  )
}

/** Mover a otro programa o volverla libre (SCRUM-123). Solo ADMIN; revoca las asignaciones sobre la actividad. */
function MoveForm({ token, activity, programs, onDone }: { token: string; activity: Activity; programs: PlanningProgram[]; onDone: () => void }) {
  const destinations = programs.filter((p) => !p.archivedAt && p.id !== activity.programId)
  const [target, setTarget] = useState('')
  const { message, run } = useAction()
  const FREE = '__libre__'

  return (
    <div className={planning.fieldset} role="group" aria-label="Mover actividad">
      <h3 className={planning.groupTitle}>Mover actividad</h3>
      <p className={styles.muted}>Las delegaciones y líderes asignados a esta actividad se revocan al moverla.</p>
      <div className={styles.actions}>
        <Field label="Destino">
          {(id) => (
            <select id={id} className={styles.select} value={target} onChange={(e) => setTarget(e.target.value)}>
              <option value="">Elige un destino</option>
              {activity.programId && <option value={FREE}>Actividad libre (sin programa)</option>}
              {destinations.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
            </select>
          )}
        </Field>
        {target && (
          <ReasonAction
            label="Mover"
            confirmLabel="Confirmar cambio"
            onConfirm={(reason) =>
              run(() => planningApi.activities.move(token, activity.id, target === FREE ? null : target, reason), 'Actividad movida.', () => { setTarget(''); onDone() })
            }
          />
        )}
      </div>
      <Feedback message={message} />
    </div>
  )
}

/**
 * Responsables de la actividad. De programa: se delegan líderes operativos que ya pertenecen al programa (SCRUM-122).
 * Libre: el ADMIN asigna un líder de programa como responsable.
 */
function Delegations({ token, activity, can }: { token: string; activity: Activity; can: Capabilities }) {
  if (activity.programId) return <ProgramDelegations token={token} activity={activity} programId={activity.programId} />
  return can.isAdmin ? <FreeActivityLeaders token={token} activity={activity} /> : null
}

function ProgramDelegations({ token, activity, programId }: { token: string; activity: Activity; programId: string }) {
  const [team, reload] = useLoad(() => planningApi.programs.team(token, programId))
  const [userId, setUserId] = useState('')
  const { message, run } = useAction()

  if (team.status === 'loading') return <p className={styles.muted}>Cargando equipo…</p>
  if (team.status === 'error') return <p role="alert" className={styles.alert}>{team.message}</p>

  const delegated = team.data.filter((m) => m.scope === 'ACTIVITY' && m.scopeId === activity.id)
  const candidates = team.data.filter(
    (m) => m.role === 'OPERATIONAL_LEADER' && m.scope === 'PROGRAM' && !delegated.some((d) => d.userId === m.userId),
  )

  return (
    <div className={planning.fieldset} role="group" aria-label="Líderes operativos delegados">
      <h3 className={planning.groupTitle}>Líderes operativos delegados</h3>
      {delegated.length === 0 ? (
        <p className={styles.muted}>Nadie delegado todavía. Los delegados marcarán y revisarán la asistencia (módulo 3).</p>
      ) : (
        <ul className={planning.list}>
          {delegated.map((m) => (
            <li key={m.assignmentId} className={planning.itemHead}>
              <span>{m.fullName} · {m.email}</span>
              <ConfirmButton
                label="Revocar"
                confirmLabel="Confirmar revocación"
                onConfirm={() => run(() => planningApi.delegations.revoke(token, m.assignmentId), 'Delegación revocada.', reload)}
              />
            </li>
          ))}
        </ul>
      )}
      {candidates.length === 0 ? (
        <p className={styles.muted}>Para delegar, primero suma líderes operativos al programa en “Agregación a programas”.</p>
      ) : (
        <div className={styles.actions}>
          <Field label="Líder operativo del programa">
            {(id) => (
              <select id={id} className={styles.select} value={userId} onChange={(e) => setUserId(e.target.value)}>
                <option value="">Elige una persona</option>
                {candidates.map((m) => <option key={m.userId} value={m.userId}>{m.fullName}</option>)}
              </select>
            )}
          </Field>
          <Button
            size="sm"
            disabled={!userId}
            onClick={() =>
              run(
                () => planningApi.delegations.assign(token, { userId, role: 'OPERATIONAL_LEADER', scope: 'ACTIVITY', scopeId: activity.id }),
                'Líder operativo delegado.',
                () => { setUserId(''); reload() },
              )
            }
          >
            Delegar
          </Button>
        </div>
      )}
      <Feedback message={message} />
    </div>
  )
}

function FreeActivityLeaders({ token, activity }: { token: string; activity: Activity }) {
  const [data, reload] = useLoad(() => Promise.all([consoleApi.roles.list(token), consoleApi.users.list(token)]))
  const [userId, setUserId] = useState('')
  const { message, run } = useAction()

  if (data.status === 'loading') return <p className={styles.muted}>Cargando responsables…</p>
  if (data.status === 'error') return <p role="alert" className={styles.alert}>{data.message}</p>

  const [roles, users] = data.data
  const name = (id: string) => {
    const u = users.items.find((x) => x.id === id)
    return u ? `${u.firstName} ${u.lastName}` : 'Persona'
  }
  const leaders = roles.items.filter((r) => r.scope === 'ACTIVITY' && r.scopeId === activity.id && !r.revokedAt)
  const candidates = users.items.filter((u) => u.accountStatus === 'ACTIVE' && !leaders.some((l) => l.userId === u.id))

  return (
    <div className={planning.fieldset} role="group" aria-label="Líderes responsables">
      <h3 className={planning.groupTitle}>Líderes responsables</h3>
      {leaders.length === 0 ? (
        <p className={styles.muted}>Sin líder asignado: por ahora la gestionan solo los ADMIN.</p>
      ) : (
        <ul className={planning.list}>
          {leaders.map((r) => (
            <li key={r.id} className={planning.itemHead}>
              <span>{name(r.userId)}</span>
              <ConfirmButton
                label="Revocar"
                confirmLabel="Confirmar revocación"
                onConfirm={() => run(() => planningApi.delegations.revoke(token, r.id), 'Asignación revocada.', reload)}
              />
            </li>
          ))}
        </ul>
      )}
      <div className={styles.actions}>
        <Field label="Asignar líder de programa">
          {(id) => (
            <select id={id} className={styles.select} value={userId} onChange={(e) => setUserId(e.target.value)}>
              <option value="">Elige una persona</option>
              {candidates.map((u) => <option key={u.id} value={u.id}>{u.firstName} {u.lastName} · {u.email}</option>)}
            </select>
          )}
        </Field>
        <Button
          size="sm"
          disabled={!userId}
          onClick={() =>
            run(
              () => planningApi.delegations.assign(token, { userId, role: 'PROGRAM_LEADER', scope: 'ACTIVITY', scopeId: activity.id }),
              'Líder asignado a la actividad.',
              () => { setUserId(''); reload() },
            )
          }
        >
          Asignar
        </Button>
      </div>
      <Feedback message={message} />
    </div>
  )
}
