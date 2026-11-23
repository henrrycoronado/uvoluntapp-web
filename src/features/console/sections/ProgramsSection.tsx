import { type FormEvent, useState } from 'react'
import type { Capabilities } from '../../../shared/session/capabilities'
import { Button, ConfirmButton, ImageField } from '../../../shared/ui'
import { planningApi, type PlanningProgram, type ProgramDetails } from '../../planning/api'
import { programStatusLabels } from '../../planning/format'
import styles from '../console.module.css'
import planning from '../../planning/planning.module.css'
import { Feedback } from './Feedback'
import { Field } from './Field'
import { ReasonAction } from './ReasonAction'
import { useAction } from './useAction'
import { useLoad } from './useLoad'

/**
 * Programas (SCRUM-45, SCRUM-46): todos los líderes ven todos los programas; gestiona quien tiene `canManage`
 * (ADMIN o líder de programa asignado). Solo el ADMIN crea programas.
 */
export function ProgramsSection({ token, can }: { token: string; can: Capabilities }) {
  const [includeArchived, setIncludeArchived] = useState(false)
  const [programs, reload] = useLoad(() => planningApi.programs.list(token, includeArchived))
  const [selected, setSelected] = useState<string | null>(null)
  const [creating, setCreating] = useState(false)
  const { message, run } = useAction()

  if (programs.status === 'loading') return <p className={styles.muted}>Cargando programas…</p>
  if (programs.status === 'error') return <p role="alert" className={styles.alert}>{programs.message}</p>

  const items = programs.data.items
  const current = items.find((p) => p.id === selected) ?? null

  return (
    <div className={planning.split}>
      <section className={styles.panel} aria-label="Lista de programas">
        <div className={planning.toolbar}>
          <h2 className={styles.subheading}>Programas</h2>
          {can.isAdmin && !creating && (
            <Button size="sm" onClick={() => { setCreating(true); setSelected(null) }}>Nuevo programa</Button>
          )}
        </div>
        {can.isAdmin && (
          <label className={planning.check}>
            <input
              type="checkbox"
              checked={includeArchived}
              onChange={(e) => {
                setIncludeArchived(e.target.checked)
                reload()
              }}
            />
            Mostrar archivados
          </label>
        )}
        <Feedback message={message?.kind === 'error' ? message : null} />
        {items.length === 0 ? (
          <p className={styles.muted}>{can.isAdmin ? 'Aún no hay programas. Crea el primero.' : 'Aún no hay programas.'}</p>
        ) : (
          <ul className={planning.list}>
            {items.map((p) => (
              <li key={p.id}>
                <button
                  type="button"
                  className={p.id === selected ? planning.itemSelected : planning.itemButton}
                  aria-pressed={p.id === selected}
                  onClick={() => { setSelected(p.id); setCreating(false) }}
                >
                  <span className={planning.itemHead}>
                    <span className={planning.itemTitle}>{p.name}</span>
                    <span className={styles.actions}>
                      {p.canManage && <span className={styles.badgeEdit}>Gestionas</span>}
                      <span className={p.status === 'ACTIVE' ? planning.chipLive : planning.chip}>
                        {programStatusLabels[p.archivedAt ? 'ARCHIVED' : p.status]}
                      </span>
                    </span>
                  </span>
                  {p.description && <span className={planning.meta}>{p.description}</span>}
                </button>
              </li>
            ))}
          </ul>
        )}
      </section>

      {creating && (
        <section className={styles.panel} aria-label="Nuevo programa">
          <h2 className={styles.subheading}>Nuevo programa</h2>
          <p className={styles.muted}>Se crea en borrador. Actívalo cuando tenga su ficha completa.</p>
          <ProgramDetailsForm
            submitLabel="Crear programa"
            onCancel={() => setCreating(false)}
            onSubmit={(body) =>
              run(
                async () => {
                  const created = await planningApi.programs.create(token, body)
                  setSelected(created.id)
                },
                'Programa creado en borrador.',
                () => { setCreating(false); reload() },
              )
            }
          />
        </section>
      )}

      {!creating && current && <ProgramDetail key={current.id} token={token} program={current} onChanged={reload} onArchived={() => { setSelected(null); reload() }} />}
      {!creating && !current && (
        <section className={styles.panel}>
          <p className={styles.muted}>Elige un programa para ver su ficha, estado y periodos.</p>
        </section>
      )}
    </div>
  )
}

interface ProgramDetailProps {
  token: string
  program: PlanningProgram
  onChanged: () => void
  onArchived: () => void
}

function ProgramDetail({ token, program, onChanged, onArchived }: ProgramDetailProps) {
  const [periods] = useLoad(() => planningApi.programs.periods(token, program.id))
  const [editing, setEditing] = useState(false)
  const { message, run } = useAction()
  const archived = !!program.archivedAt
  const manage = program.canManage && !archived

  return (
    <section className={styles.panel} aria-label={`Programa ${program.name}`}>
      <div className={planning.toolbar}>
        <h2 className={styles.subheading}>{program.name}</h2>
        <span className={program.status === 'ACTIVE' ? planning.chipLive : planning.chip}>
          {programStatusLabels[archived ? 'ARCHIVED' : program.status]}
        </span>
      </div>
      {!program.canManage && <p className={styles.muted}>Solo consulta: este programa lo gestionan un ADMIN y sus líderes asignados.</p>}
      <Feedback message={message} />

      {editing ? (
        <ProgramDetailsForm
          initial={program}
          submitLabel="Guardar ficha"
          onCancel={() => setEditing(false)}
          onSubmit={(body) => run(() => planningApi.programs.update(token, program.id, body), 'Ficha actualizada.', () => { setEditing(false); onChanged() })}
        />
      ) : (
        <dl className={planning.facts}>
          <div><dt>Descripción</dt><dd>{program.description || '—'}</dd></div>
          <div><dt>Contacto</dt><dd>{program.contact || '—'}</dd></div>
          <div><dt>Horario de referencia</dt><dd>{program.referenceSchedule || '—'}</dd></div>
          <div><dt>Creado</dt><dd>{new Date(program.createdAt).toLocaleDateString('es-BO')}</dd></div>
        </dl>
      )}

      {!editing && <ImageField token={token} path={`/programs/${program.id}/cover`} label="Portada del programa" hasImage={!!program.imageUrl} canEdit={manage} onChanged={onChanged} />}
      {manage && !editing && (
        <div className={styles.actions}>
          <Button size="sm" variant="secondary" onClick={() => setEditing(true)}>Editar ficha</Button>
          {(program.status === 'DRAFT' || program.status === 'INACTIVE') && (
            <ConfirmButton
              label="Activar"
              confirmLabel="Confirmar activación"
              onConfirm={() => run(() => planningApi.programs.activate(token, program.id), 'Programa activo: ya aparece en el catálogo.', onChanged)}
            />
          )}
          {program.status === 'ACTIVE' && (
            <ConfirmButton
              label="Desactivar"
              confirmLabel="Confirmar desactivación"
              onConfirm={() => run(() => planningApi.programs.deactivate(token, program.id), 'Programa desactivado.', onChanged)}
            />
          )}
        </div>
      )}
      {manage && !editing && (
        <ReasonAction
          label="Archivar"
          confirmLabel="Confirmar archivo"
          onConfirm={(reason) => run(() => planningApi.programs.archive(token, program.id, reason), 'Programa archivado.', onArchived)}
        />
      )}
      {manage && <p className={styles.muted}>No se desactiva ni archiva un programa con actividades publicadas o en ejecución.</p>}

      <div className={planning.group}>
        <h3 className={planning.groupTitle}>Periodos académicos</h3>
        {periods.status === 'loading' && <p className={styles.muted}>Cargando periodos…</p>}
        {periods.status === 'error' && <p role="alert" className={styles.alert}>{periods.message}</p>}
        {periods.status === 'ready' &&
          (periods.data.length === 0 ? (
            <p className={styles.muted}>El programa se vincula a un periodo al crear su primera actividad en él.</p>
          ) : (
            <div className={styles.actions}>
              {periods.data.map((p) => <span key={p.id} className={planning.chip}>{p.label}</span>)}
            </div>
          ))}
      </div>
    </section>
  )
}

interface ProgramDetailsFormProps {
  initial?: PlanningProgram
  submitLabel: string
  onSubmit: (body: ProgramDetails) => Promise<void>
  onCancel: () => void
}

/** Ficha del programa: nombre, descripción, contacto y horario de referencia. */
function ProgramDetailsForm({ initial, submitLabel, onSubmit, onCancel }: ProgramDetailsFormProps) {
  const [name, setName] = useState(initial?.name ?? '')
  const [description, setDescription] = useState(initial?.description ?? '')
  const [contact, setContact] = useState(initial?.contact ?? '')
  const [schedule, setSchedule] = useState(initial?.referenceSchedule ?? '')
  const [busy, setBusy] = useState(false)
  const value = (v: string) => (v.trim() ? v.trim() : null)

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setBusy(true)
    try {
      await onSubmit({ name: name.trim(), description: value(description), contact: value(contact), referenceSchedule: value(schedule) })
    } finally {
      setBusy(false)
    }
  }

  return (
    <form className={planning.form} onSubmit={submit} aria-label="Ficha del programa">
      <Field label="Nombre">
        {(id) => <input id={id} className={styles.select} value={name} maxLength={150} required onChange={(e) => setName(e.target.value)} />}
      </Field>
      <Field label="Descripción (opcional)">
        {(id) => <textarea id={id} className={planning.textarea} value={description} maxLength={2000} onChange={(e) => setDescription(e.target.value)} />}
      </Field>
      <div className={planning.grid2}>
        <Field label="Contacto (opcional)">
          {(id) => (
            <input id={id} className={styles.select} value={contact} maxLength={300} placeholder="Correo o teléfono" onChange={(e) => setContact(e.target.value)} />
          )}
        </Field>
        <Field label="Horario de referencia (opcional)">
          {(id) => (
            <input id={id} className={styles.select} value={schedule} maxLength={500} placeholder="Ej.: sábados 9:00–12:00" onChange={(e) => setSchedule(e.target.value)} />
          )}
        </Field>
      </div>
      <div className={styles.actions}>
        <Button type="submit" disabled={busy || !name.trim()}>{busy ? 'Guardando…' : submitLabel}</Button>
        <Button type="button" variant="secondary" onClick={onCancel} disabled={busy}>Cancelar</Button>
      </div>
    </form>
  )
}
