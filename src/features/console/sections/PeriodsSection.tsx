import { type FormEvent, useState } from 'react'
import { Button, ConfirmButton } from '../../../shared/ui'
import { planningApi, type Period } from '../../planning/api'
import styles from '../console.module.css'
import { Feedback } from './Feedback'
import { Field } from './Field'
import { useAction } from './useAction'
import { useLoad } from './useLoad'

const date = new Intl.DateTimeFormat('es-BO', { dateStyle: 'medium' })

/** Sugerencia para el sucesor: "2026-2" pasa a "2027-1" y "2027-1" a "2027-2". Es solo un punto de partida editable. */
export function suggestSuccessor(label: string): string {
  const match = /^(\d{4})-([12])$/.exec(label.trim())
  if (!match) return ''
  const year = Number(match[1])
  return match[2] === '1' ? `${year}-2` : `${year + 1}-1`
}

/** Periodos académicos: solo el ADMIN edita el activo y lo cierra abriendo el sucesor en una sola operación. */
export function PeriodsSection({ token }: { token: string }) {
  const [periods, reload] = useLoad(() => planningApi.academicPeriods.list(token))
  const { message, run } = useAction()

  if (periods.status === 'loading') return <p className={styles.muted}>Cargando periodos…</p>
  if (periods.status === 'error') return <p role="alert" className={styles.alert}>{periods.message}</p>

  const active = periods.data.find((p) => p.status === 'ACTIVE')
  const closed = periods.data.filter((p) => p.status !== 'ACTIVE')

  return (
    <div className={styles.panel}>
      <Feedback message={message} />
      {active ? (
        <ActivePeriod key={active.id} token={token} period={active} run={run} onChanged={reload} />
      ) : (
        <p className={styles.muted}>No hay un periodo activo.</p>
      )}
      {closed.length > 0 && (
        <section aria-label="Periodos cerrados">
          <h2 className={styles.subheading}>Periodos cerrados</h2>
          <ul>
            {closed.map((p) => (
              <li key={p.id}>{p.label} · desde {date.format(new Date(p.startDate))}{p.endDate ? ` hasta ${date.format(new Date(p.endDate))}` : ''}</li>
            ))}
          </ul>
        </section>
      )}
    </div>
  )
}

function ActivePeriod({ token, period, run, onChanged }: { token: string; period: Period; run: ReturnType<typeof useAction>['run']; onChanged: () => void }) {
  const [label, setLabel] = useState(period.label)
  const [endDate, setEndDate] = useState(period.endDate?.slice(0, 10) ?? '')
  const [successor, setSuccessor] = useState(suggestSuccessor(period.label))
  const [error, setError] = useState<string | null>(null)

  function save(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!label.trim()) return setError('El nombre del periodo es obligatorio.')
    if (endDate && endDate < period.startDate.slice(0, 10)) return setError('El fin no puede ser anterior al inicio.')
    setError(null)
    void run(() => planningApi.academicPeriods.edit(token, period.id, { label: label.trim(), endDate: endDate || null }), 'Periodo actualizado.', onChanged)
  }

  const successorInvalid = !successor.trim() || successor.trim().toLowerCase() === label.trim().toLowerCase()

  return (
    <>
      <section aria-label="Periodo activo">
        <h2 className={styles.subheading}>Periodo activo: {period.label}</h2>
        <p className={styles.muted}>Desde {date.format(new Date(period.startDate))}. Toda actividad nueva nace en este periodo.</p>
        <form className={styles.formRow} onSubmit={save} noValidate>
          <Field label="Nombre">{(id) => <input id={id} className={styles.select} value={label} maxLength={50} onChange={(e) => setLabel(e.target.value)} />}</Field>
          <Field label="Fin previsto (opcional)">{(id) => <input id={id} type="date" className={styles.select} value={endDate} onChange={(e) => setEndDate(e.target.value)} />}</Field>
          <Button type="submit" variant="secondary">Guardar</Button>
        </form>
        {error && <p role="alert" className={styles.alert}>{error}</p>}
      </section>

      <section aria-label="Cierre del periodo">
        <h2 className={styles.subheading}>Cerrar periodo</h2>
        <p className={styles.muted}>
          El cierre es manual y abre el sucesor en una sola operación. Se bloquea si quedan actividades en borrador, publicadas o en curso.
        </p>
        <div className={styles.formRow}>
          <Field label="Nombre del periodo sucesor">
            {(id) => <input id={id} className={styles.select} value={successor} maxLength={50} placeholder="Ej.: 2027-1" onChange={(e) => setSuccessor(e.target.value)} />}
          </Field>
          <ConfirmButton
            label="Cerrar periodo"
            confirmLabel="Confirmar cierre"
            variant="danger"
            disabled={successorInvalid}
            onConfirm={() => run(() => planningApi.academicPeriods.close(token, period.id, successor.trim()), `Periodo cerrado. Ahora está activo ${successor.trim()}.`, onChanged)}
          />
        </div>
        {successorInvalid && <p className={styles.muted}>Escribe un nombre distinto al del periodo actual.</p>}
      </section>
    </>
  )
}
