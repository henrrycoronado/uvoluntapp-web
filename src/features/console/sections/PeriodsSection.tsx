import { type FormEvent, useState } from 'react'
import { Button, ConfirmButton } from '../../../shared/ui'
import { planningApi, type Period } from '../../planning/api'
import detail from '../../planning/detail.module.css'
import styles from '../console.module.css'
import { Feedback } from './Feedback'
import { Field } from './Field'
import { useAction } from './useAction'
import { useLoad } from './useLoad'

const date = new Intl.DateTimeFormat('es-BO', { dateStyle: 'medium' })

/**
 * Sugerencia para el sucesor. El sistema usa códigos como "2026-II": el primer semestre pasa al segundo del mismo año
 * y el segundo al primero del año siguiente. También entiende "2026-2". Es solo un punto de partida editable.
 */
export function suggestSuccessor(label: string): string {
  const match = /^(\d{4})-(I{1,2}|[12])$/i.exec(label.trim())
  if (!match) return ''
  const year = Number(match[1])
  const roman = /^I/i.test(match[2])
  const first = match[2] === '1' || match[2].toUpperCase() === 'I'
  const term = (n: 1 | 2) => (roman ? (n === 1 ? 'I' : 'II') : String(n))
  return first ? `${year}-${term(2)}` : `${year + 1}-${term(1)}`
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
    if (!label.trim()) return setError('El código del periodo es obligatorio.')
    if (endDate && endDate < period.startDate.slice(0, 10)) return setError('La fecha final no puede ser anterior al inicio.')
    setError(null)
    void run(() => planningApi.academicPeriods.edit(token, period.id, { label: label.trim(), endDate: endDate || null }), 'Periodo actualizado.', onChanged)
  }

  const successorInvalid = !successor.trim() || successor.trim().toLowerCase() === label.trim().toLowerCase()

  // Disposición del prototipo "Cierre y apertura de período": tarjetas a la izquierda y validaciones a la derecha.
  return (
    <div className={detail.layout}>
      <div className={detail.stack}>
        <section className={detail.card} aria-labelledby="active-period">
          <h2 id="active-period" className={detail.cardTitle}>Período académico activo</h2>
          <p className={detail.hint}>Los períodos son recursos globales, con un único ACTIVE.</p>
          <form onSubmit={save} noValidate className={detail.stack}>
            <div className={detail.facts}>
              <Field label="Código único">{(id) => <input id={id} className={styles.select} value={label} maxLength={50} onChange={(e) => setLabel(e.target.value)} />}</Field>
              <Field label="Estado">{(id) => <input id={id} className={styles.select} value="ACTIVE" readOnly />}</Field>
              <Field label="Inicio">{(id) => <input id={id} className={styles.select} value={date.format(new Date(period.startDate))} readOnly />}</Field>
              <Field label="Fecha final">{(id) => <input id={id} type="date" className={styles.select} value={endDate} onChange={(e) => setEndDate(e.target.value)} />}</Field>
            </div>
            <p className={detail.hint}>La fecha final es opcional y no debe ser anterior al inicio.</p>
            {error && <p role="alert" className={styles.alert}>{error}</p>}
            <div className={styles.actions}>
              <Button type="submit" variant="secondary">Guardar cambios</Button>
            </div>
          </form>
        </section>

        <section className={detail.card} aria-label="Cierre del periodo">
          <h2 className={detail.cardTitle}>Cierre y sucesión</h2>
          <p className={detail.hint}>Revisión transaccional antes de cerrar y generar el siguiente período.</p>
          <div className={detail.facts}>
            <Field label="Código sucesor">
              {(id) => <input id={id} className={styles.select} value={successor} maxLength={50} placeholder="Ej.: 2027-I" onChange={(e) => setSuccessor(e.target.value)} />}
            </Field>
            <Field label="Inicio sucesor">{(id) => <input id={id} className={styles.select} value="Día de cierre" readOnly />}</Field>
            <Field label="Fin sucesor">{(id) => <input id={id} className={styles.select} value="Sin fecha (NULL)" readOnly />}</Field>
            <Field label="Actividades en ejecución">{(id) => <input id={id} className={styles.select} value="Debe ser 0" readOnly />}</Field>
          </div>
          {successorInvalid && <p className={detail.hint}>Escribe un código distinto al del periodo actual.</p>}
          <div className={styles.actions}>
            <ConfirmButton
              label="Cerrar y abrir sucesor"
              confirmLabel="Confirmar cierre"
              variant="primary"
              disabled={successorInvalid}
              onConfirm={() => run(() => planningApi.academicPeriods.close(token, period.id, successor.trim()), `Periodo cerrado. Ahora está activo ${successor.trim()}.`, onChanged)}
            />
          </div>
        </section>
      </div>

      <aside className={detail.card} aria-label="Validaciones">
        <h2 className={detail.cardTitle}>Validaciones</h2>
        <p className={detail.hint}>No se permite cerrar mientras existan actividades en borrador, publicadas o en ejecución, revisiones y evaluaciones pendientes.</p>
        <p className={detail.hint}>El cierre y la creación del sucesor ACTIVE son una única transacción.</p>
        <p className={detail.hint}>Los períodos cerrados y sus relaciones históricas son inmutables.</p>
      </aside>
    </div>
  )
}
