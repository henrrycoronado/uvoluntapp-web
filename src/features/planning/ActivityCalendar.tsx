import { useMemo, useState } from 'react'
import { Button } from '../../shared/ui'
import styles from './planning.module.css'

interface CalendarItem {
  id: string
  title: string
  startsAt: string
  status: string
}

interface ActivityCalendarProps {
  items: CalendarItem[]
  onOpen?: (id: string) => void
}

const weekdays = ['lun', 'mar', 'mié', 'jue', 'vie', 'sáb', 'dom']
const monthFormat = new Intl.DateTimeFormat('es-BO', { month: 'long', year: 'numeric' })
const timeFormat = new Intl.DateTimeFormat('es-BO', { hour: '2-digit', minute: '2-digit' })

const monthTitle = (date: Date) => {
  const text = monthFormat.format(date)
  return text.charAt(0).toUpperCase() + text.slice(1)
}

const dayKey = (date: Date) => `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`

/** Calendario mensual: misma fuente que la lista (SCRUM-52). En pantallas angostas se usa la lista. */
export function ActivityCalendar({ items, onOpen }: ActivityCalendarProps) {
  const first = items.length ? new Date(Math.min(...items.map((i) => new Date(i.startsAt).getTime()))) : new Date()
  const [month, setMonth] = useState(() => new Date(first.getFullYear(), first.getMonth(), 1))

  const days = useMemo(() => {
    const start = new Date(month)
    start.setDate(1 - ((month.getDay() + 6) % 7))
    return Array.from({ length: 42 }, (_, i) => new Date(start.getFullYear(), start.getMonth(), start.getDate() + i))
  }, [month])

  const byDay = useMemo(() => {
    const map = new Map<string, CalendarItem[]>()
    for (const item of [...items].sort((a, b) => a.startsAt.localeCompare(b.startsAt))) {
      const key = dayKey(new Date(item.startsAt))
      map.set(key, [...(map.get(key) ?? []), item])
    }
    return map
  }, [items])

  const today = dayKey(new Date())
  const shift = (delta: number) => setMonth((m) => new Date(m.getFullYear(), m.getMonth() + delta, 1))

  return (
    <div className={styles.group}>
      <div className={styles.monthNav}>
        <Button size="sm" variant="secondary" onClick={() => shift(-1)} aria-label="Mes anterior">‹</Button>
        <span className={styles.monthLabel} aria-live="polite">{monthTitle(month)}</span>
        <Button size="sm" variant="secondary" onClick={() => shift(1)} aria-label="Mes siguiente">›</Button>
      </div>
      <div className={styles.calendar} role="grid" aria-label={`Calendario de ${monthFormat.format(month)}`}>
        {weekdays.map((d) => (
          <div key={d} className={styles.weekday} role="columnheader">{d}</div>
        ))}
        {days.map((day) => {
          const key = dayKey(day)
          const className = key === today ? styles.dayToday : day.getMonth() === month.getMonth() ? styles.day : styles.dayOutside
          return (
            <div key={key} className={className} role="gridcell">
              <span className={styles.dayNumber}>{day.getDate()}</span>
              {(byDay.get(key) ?? []).map((item) => (
                <button
                  key={item.id}
                  type="button"
                  className={item.status === 'IN_PROGRESS' ? styles.eventLive : styles.event}
                  title={item.title}
                  onClick={() => onOpen?.(item.id)}
                >
                  {timeFormat.format(new Date(item.startsAt))} {item.title}
                </button>
              ))}
            </div>
          )
        })}
      </div>
    </div>
  )
}
