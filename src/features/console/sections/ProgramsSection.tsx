import { type FormEvent, useState } from 'react'
import type { Capabilities } from '../../../shared/session/capabilities'
import { Button, ConfirmButton, ImageField, ProtectedImage, uploadImage, validateImage } from '../../../shared/ui'
import { planningApi, type PlanningProgram, type ProgramDetails } from '../../planning/api'
import detail from '../../planning/detail.module.css'
import { programStatusLabels } from '../../planning/format'
import planning from '../../planning/planning.module.css'
import styles from '../console.module.css'
import page from '../programs.module.css'
import { Feedback } from './Feedback'
import { Field } from './Field'
import { ReasonAction } from './ReasonAction'
import { useAction } from './useAction'
import { useLoad } from './useLoad'

type View = { kind: 'list' } | { kind: 'new' } | { kind: 'detail'; id: string }

const statusClass = (p: PlanningProgram) => (p.archivedAt ? page.statusOther : p.status === 'ACTIVE' ? page.statusActive : p.status === 'DRAFT' ? page.statusDraft : page.statusOther)
const statusText = (p: PlanningProgram) => programStatusLabels[p.archivedAt ? 'ARCHIVED' : p.status].toUpperCase()

/**
 * Gestión de programas (prototipo): lista con cifras, filtros y tarjetas, y una ficha aparte para crear o editar.
 * Todos los líderes ven los programas; gestiona quien tiene `canManage`. Solo el ADMIN crea programas.
 */
export function ProgramsSection({ token, can }: { token: string; can: Capabilities }) {
  const [includeArchived, setIncludeArchived] = useState(false)
  const [programs, reload] = useLoad(() => planningApi.programs.list(token, includeArchived))
  const [view, setView] = useState<View>({ kind: 'list' })
  const { message, run } = useAction()

  if (programs.status === 'loading') return <p className={styles.muted}>Cargando programas…</p>
  if (programs.status === 'error') return <p role="alert" className={styles.alert}>{programs.message}</p>

  const items = programs.data.items
  const back = () => { setView({ kind: 'list' }); reload() }

  if (view.kind === 'new') {
    return (
      <ProgramFicha
        token={token}
        onBack={back}
        onCreate={(body, cover) =>
          run(async () => {
            const created = await planningApi.programs.create(token, body)
            if (cover) await uploadImage(token, `/programs/${created.id}/cover`, cover)
          }, 'Programa creado en borrador.', back)
        }
        message={message}
      />
    )
  }
  const current = view.kind === 'detail' ? items.find((p) => p.id === view.id) : undefined
  if (view.kind === 'detail' && current) {
    return <ProgramFicha token={token} program={current} onBack={back} onChanged={reload} onArchived={back} />
  }

  return (
    <ProgramsList
      token={token}
      can={can}
      items={items}
      includeArchived={includeArchived}
      onIncludeArchived={(v) => { setIncludeArchived(v); reload() }}
      onOpen={(id) => setView({ kind: 'detail', id })}
      onCreate={() => setView({ kind: 'new' })}
    />
  )
}

function ProgramsList({ token, can, items, includeArchived, onIncludeArchived, onOpen, onCreate }: {
  token: string
  can: Capabilities
  items: PlanningProgram[]
  includeArchived: boolean
  onIncludeArchived: (value: boolean) => void
  onOpen: (id: string) => void
  onCreate: () => void
}) {
  const [status, setStatus] = useState('')
  const [scope, setScope] = useState('')
  const [text, setText] = useState('')
  const [applied, setApplied] = useState('')

  const live = items.filter((p) => !p.archivedAt)
  const count = (s: string) => live.filter((p) => p.status === s).length
  const shown = items.filter((p) => {
    if (status === 'ARCHIVED' ? !p.archivedAt : status && (p.archivedAt || p.status !== status)) return false
    if (scope === 'mine' && !p.canManage) return false
    return !applied.trim() || p.name.toLowerCase().includes(applied.trim().toLowerCase())
  })

  return (
    <>
      <div className={page.pageHead}>
        <div>
          <h1 className={styles.heading}>Gestión de programas</h1>
          <p className={styles.summary}>Crear programas en borrador, editar y activar los asignados. Sin vincular programas directamente a períodos.</p>
        </div>
        {can.isAdmin && <Button onClick={onCreate}>Crear programa</Button>}
      </div>

      <div className={page.stats} role="group" aria-label="Resumen de programas">
        <div className={page.stat}><span className={page.statLabel}>Programas</span><span className={page.statValue}>{live.length}</span><span className={page.statNote}>Registrados</span></div>
        <div className={page.stat}><span className={page.statLabel}>Activos</span><span className={page.statValue}>{count('ACTIVE')}</span><span className={page.statNote}>Visibles públicamente</span></div>
        <div className={page.stat}><span className={page.statLabel}>Borradores</span><span className={page.statValue}>{count('DRAFT')}</span><span className={page.statNote}>No visibles</span></div>
        <div className={page.stat}><span className={page.statLabel}>Inactivos</span><span className={page.statValue}>{count('INACTIVE')}</span><span className={page.statNote}>Con historial</span></div>
      </div>

      <form className={page.filters} role="search" aria-label="Filtrar programas" onSubmit={(e) => { e.preventDefault(); setApplied(text) }}>
        <label className={page.filterField}>
          Estado
          <select className={styles.select} value={status} onChange={(e) => setStatus(e.target.value)}>
            <option value="">Todos</option>
            <option value="ACTIVE">Activo</option>
            <option value="DRAFT">Borrador</option>
            <option value="INACTIVE">Inactivo</option>
            {includeArchived && <option value="ARCHIVED">Archivado</option>}
          </select>
        </label>
        <label className={page.filterField}>
          Buscar
          <input className={styles.select} maxLength={150} value={text} placeholder="Nombre del programa" onChange={(e) => setText(e.target.value)} />
        </label>
        <label className={page.filterField}>
          Ámbito
          <select className={styles.select} value={scope} onChange={(e) => setScope(e.target.value)}>
            <option value="">Todos</option>
            <option value="mine">Los que gestiono</option>
          </select>
        </label>
        <Button type="submit">Buscar</Button>
        {can.isAdmin && (
          <label className={planning.check}>
            <input type="checkbox" checked={includeArchived} onChange={(e) => onIncludeArchived(e.target.checked)} />
            Mostrar archivados
          </label>
        )}
      </form>

      <section aria-labelledby="by-status" className={styles.panel}>
        <h2 id="by-status" className={page.sectionTitle}>Programas por estado</h2>
        <p className={styles.muted}>Selecciona una tarjeta para abrir su ficha.</p>
        {shown.length === 0 ? (
          <p className={styles.muted}>{items.length === 0 ? (can.isAdmin ? 'Aún no hay programas. Crea el primero.' : 'Aún no hay programas.') : 'Ningún programa coincide con los filtros.'}</p>
        ) : (
          <ul className={page.cardGrid}>
            {shown.map((p) => (
              <li key={p.id} className={page.pcard}>
                <ProtectedImage token={token} path={`/programs/${p.id}/cover`} enabled={!!p.imageUrl} alt={`Portada de ${p.name}`} className={page.pimg} fallbackClassName={page.pimgEmpty} />
                <div className={page.pmeta}>
                  <span className={statusClass(p)}>{statusText(p)}</span>
                  <button type="button" className={page.manage} onClick={() => onOpen(p.id)} aria-label={`${p.canManage ? 'Gestionar' : 'Ver'} ${p.name}`}>
                    {p.canManage ? 'Gestionar' : 'Ver ficha'} →
                  </button>
                </div>
                <h3 className={page.pname}>{p.name}</h3>
                <p className={page.pnote}>{p.referenceSchedule || p.contact || p.description || 'Sin datos de contacto'}</p>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className={page.rules} aria-label="Reglas y restricciones">
        <h2 className={styles.subheading}>Reglas y restricciones</h2>
        <p className={styles.muted}>ADMIN crea programas. Un PROGRAM_LEADER solo edita, activa o desactiva los de su ámbito. No se archiva con actividades publicadas o en ejecución.</p>
      </section>
    </>
  )
}

interface FichaProps {
  token: string
  program?: PlanningProgram
  onBack: () => void
  onChanged?: () => void
  onArchived?: () => void
  onCreate?: (body: ProgramDetails, cover: File | null) => Promise<void>
  message?: { kind: 'ok' | 'error'; text: string } | null
}

/** Ficha y edición de programa (prototipo): identidad, responsables y alcance, y las reglas a la derecha. */
function ProgramFicha({ token, program, onBack, onChanged, onArchived, onCreate, message }: FichaProps) {
  const creating = !program
  const [name, setName] = useState(program?.name ?? '')
  const [description, setDescription] = useState(program?.description ?? '')
  const [contact, setContact] = useState(program?.contact ?? '')
  const [schedule, setSchedule] = useState(program?.referenceSchedule ?? '')
  const [cover, setCover] = useState<File | null>(null)
  const [coverError, setCoverError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)
  const action = useAction()
  const [periods] = useLoad(() => (program ? planningApi.programs.periods(token, program.id) : Promise.resolve([])))
  const archived = !!program?.archivedAt
  const manage = creating || (!!program?.canManage && !archived)
  const value = (v: string) => (v.trim() ? v.trim() : null)

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!name.trim()) return
    const body: ProgramDetails = { name: name.trim(), description: value(description), contact: value(contact), referenceSchedule: value(schedule) }
    setBusy(true)
    try {
      if (creating) await onCreate?.(body, cover)
      else if (program) await action.run(() => planningApi.programs.update(token, program.id, body), 'Ficha actualizada.', onChanged)
    } finally {
      setBusy(false)
    }
  }

  const stateLine = program ? `${programStatusLabels[archived ? 'ARCHIVED' : program.status]} (${archived ? 'ARCHIVED' : program.status})` : 'Borrador (DRAFT)'

  return (
    <div className={detail.stack}>
      <button type="button" className={detail.back} onClick={onBack}>← Programas</button>
      <div>
        <h1 className={styles.heading}>Ficha y edición de programa</h1>
        <p className={styles.summary}>ADMIN crea programas; los líderes solo editan el suyo. Sin asociación programa-período.</p>
      </div>
      {!creating && !program?.canManage && <p className={styles.muted}>Solo consulta: este programa lo gestionan un ADMIN y sus líderes asignados.</p>}
      <Feedback message={message ?? (action.message?.kind === 'error' || action.message?.kind === 'ok' ? action.message : null)} />

      <form onSubmit={submit} aria-label="Ficha del programa" noValidate>
        <div className={detail.layout}>
          <div className={detail.stack}>
            <section className={detail.card} aria-labelledby="identity">
              <h2 id="identity" className={detail.cardTitle}>Identidad del programa</h2>
              <p className={detail.hint}>Información que visualizarán los participantes cuando se active.</p>
              <div className={page.fieldGrid}>
                <Field label="Nombre *">
                  {(id) => <input id={id} className={styles.select} value={name} maxLength={150} required disabled={!manage} onChange={(e) => setName(e.target.value)} />}
                </Field>
                <Field label="Estado actual">
                  {(id) => <input id={id} className={`${styles.select} ${page.readonly}`} value={stateLine} readOnly />}
                </Field>
                <div className={page.fieldFull}>
                  <Field label="Descripción pública">
                    {(id) => <textarea id={id} className={planning.textarea} value={description} maxLength={2000} disabled={!manage} onChange={(e) => setDescription(e.target.value)} />}
                  </Field>
                </div>
                <Field label="Contacto">
                  {(id) => <input id={id} className={styles.select} value={contact} maxLength={300} placeholder="Correo o teléfono" disabled={!manage} onChange={(e) => setContact(e.target.value)} />}
                </Field>
                <Field label="Horario de referencia">
                  {(id) => <input id={id} className={styles.select} value={schedule} maxLength={500} placeholder="Ej.: sábados 9:00–12:00" disabled={!manage} onChange={(e) => setSchedule(e.target.value)} />}
                </Field>
                <div className={page.fieldFull}>
                  <p className={detail.sectionTitle}>Portada</p>
                  {creating ? (
                    <>
                      <input
                        type="file"
                        accept="image/jpeg,image/png,image/webp"
                        aria-label="Adjuntar imagen de portada"
                        onChange={(e) => {
                          const file = e.target.files?.[0] ?? null
                          const invalid = file ? validateImage(file) : null
                          setCoverError(invalid)
                          setCover(invalid ? null : file)
                        }}
                      />
                      {coverError && <p role="alert" className={styles.alert}>{coverError}</p>}
                    </>
                  ) : (
                    program && <ImageField token={token} path={`/programs/${program.id}/cover`} label="Portada del programa" hasImage={!!program.imageUrl} canEdit={manage} onChanged={() => onChanged?.()} />
                  )}
                  <p className={detail.hint}>Una portada opcional; formatos validados antes de publicar.</p>
                </div>
              </div>
            </section>

            <section className={detail.card} aria-labelledby="scope">
              <h2 id="scope" className={detail.cardTitle}>Responsables y alcance</h2>
              <p className={detail.hint}>Los líderes se asignan mediante permisos contextuales (N:M), no en una columna de programa.</p>
              <div className={page.fieldGrid}>
                <Field label="Liderazgo">{(id) => <input id={id} className={`${styles.select} ${page.readonly}`} value={creating ? 'Se asignará tras crear el programa' : 'Equipo del programa'} readOnly />}</Field>
                <Field label="Ámbito">{(id) => <input id={id} className={`${styles.select} ${page.readonly}`} value="Programa · recursos asociados" readOnly />}</Field>
              </div>
              {!creating && (
                <div>
                  <p className={detail.sectionTitle}>Periodos académicos con actividades</p>
                  {periods.status === 'ready' && (periods.data.length === 0
                    ? <p className={detail.hint}>El programa aparece en un periodo cuando tiene actividades en él.</p>
                    : <p>{periods.data.map((p) => p.label).join(' · ')}</p>)}
                </div>
              )}
            </section>

            <div className={styles.actions}>
              {manage && <Button type="submit" disabled={busy || !name.trim()}>{busy ? 'Guardando…' : creating ? 'Crear programa' : 'Guardar cambios'}</Button>}
              <Button type="button" variant="secondary" onClick={onBack} disabled={busy}>{manage ? 'Cancelar' : 'Volver'}</Button>
            </div>
          </div>

          <aside className={detail.card} aria-label="Validaciones y reglas">
            <h2 className={detail.cardTitle}>Validaciones y reglas</h2>
            <p>No hay asociación directa entre programas y períodos.</p>
            <p className={detail.hint}>No asignar roles administrativos automáticamente al crear un programa.</p>
            <p className={detail.hint}>La publicación y activación se controla por estado y permisos.</p>
          </aside>
        </div>
      </form>

      {program && manage && (
        <section className={detail.card} aria-label="Estado del programa">
          <h2 className={detail.cardTitle}>Estado del programa</h2>
          <div className={styles.actions}>
            {(program.status === 'DRAFT' || program.status === 'INACTIVE') && (
              <ConfirmButton
                label="Activar"
                confirmLabel="Confirmar activación"
                onConfirm={() => action.run(() => planningApi.programs.activate(token, program.id), 'Programa activo: ya aparece en el catálogo.', onChanged)}
              />
            )}
            {program.status === 'ACTIVE' && (
              <ConfirmButton
                label="Desactivar"
                confirmLabel="Confirmar desactivación"
                onConfirm={() => action.run(() => planningApi.programs.deactivate(token, program.id), 'Programa desactivado.', onChanged)}
              />
            )}
            <ReasonAction
              label="Archivar"
              confirmLabel="Confirmar archivo"
              onConfirm={(reason) => action.run(() => planningApi.programs.archive(token, program.id, reason), 'Programa archivado.', onArchived)}
            />
          </div>
          <p className={detail.hint}>No se desactiva ni archiva un programa con actividades publicadas o en ejecución.</p>
        </section>
      )}
    </div>
  )
}
