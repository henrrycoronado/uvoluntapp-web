import { imageSrc } from '../../shared/api/http'
import type { CatalogActivity, Enrollment } from './api'
import styles from './detail.module.css'
import { EnrollmentPanel } from './EnrollmentPanel'
import { activityStatusLabels, formatDateTime, modalityLabels } from './format'

interface ActivityDetailViewProps {
  activity: CatalogActivity
  periodLabel?: string
  token?: string
  mine: Enrollment[]
  onLogin?: () => void
  onChanged: () => void
  onBack: () => void
}

const capacityText = (a: CatalogActivity) => {
  if (!a.requiresRegistration) return 'No aplica'
  if (a.participation.groups.length > 0) return 'Disponibilidad por grupo'
  return a.capacity ? `${a.capacity} cupos` : 'Sin límite de cupo'
}

/** Detalle de una actividad (prototipo 05A a 05D): ficha en tarjetas, condiciones de participación e inscripción. */
export function ActivityDetailView({ activity: a, periodLabel, token, mine, onLogin, onChanged, onBack }: ActivityDetailViewProps) {
  const cancelled = a.status === 'CANCELLED'
  return (
    <article className={styles.stack} aria-label={`Actividad ${a.title}`}>
      <button type="button" className={styles.back} onClick={onBack}>← Actividades disponibles</button>
      <div>
        <h1 className={styles.title}>{a.title}</h1>
        <p className={styles.subtitle}>
          {a.programName ?? (a.groupLabel ? `Actividad libre · ${a.groupLabel}` : 'Actividad libre')} · {modalityLabels[a.modality]}
        </p>
      </div>
      {a.imageUrl && <img className={styles.banner} src={imageSrc(a.imageUrl, false)} alt={`Imagen de ${a.title}`} />}

      <div className={styles.layout}>
        <div className={styles.stack}>
          <section className={styles.card} aria-labelledby="about">
            <h2 id="about" className={styles.cardTitle}>Acerca de la actividad</h2>
            {a.description && <p className={styles.hint}>{a.description}</p>}
            <h3 className={styles.sectionTitle}>Fecha y horario</h3>
            <dl className={styles.facts}>
              <div><dt>Inicio</dt><dd>{formatDateTime(a.startsAt)}</dd></div>
              <div><dt>Fin</dt><dd>{formatDateTime(a.endsAt)}</dd></div>
              <div><dt>Período académico</dt><dd>{periodLabel ?? '—'}</dd></div>
              <div><dt>Modalidad del evento</dt><dd>{modalityLabels[a.modality]}</dd></div>
              {a.expectedHours != null && <div><dt>Horas previstas</dt><dd>{a.expectedHours} h (informativas)</dd></div>}
            </dl>
          </section>

          <section className={styles.card} aria-labelledby="place">
            <h2 id="place" className={styles.cardTitle}>Lugar y ubicación</h2>
            <p className={styles.sectionTitle}>{a.modality === 'VIRTUAL' ? 'Actividad virtual' : (a.location ?? 'Lugar por confirmar')}</p>
            {a.modality === 'HYBRID' && <p className={styles.hint}>También se puede participar en línea; el enlace se comparte con quienes se inscriben.</p>}
            {a.participation.latitude != null && a.participation.longitude != null && (
              <p className={styles.hint}>Coordenadas del lugar: {a.participation.latitude}, {a.participation.longitude}</p>
            )}
          </section>
        </div>

        <aside className={styles.card} aria-labelledby="conditions">
          <h2 id="conditions" className={styles.cardTitle}>Condiciones de participación</h2>
          <dl className={styles.factsOne}>
            <div><dt>Estado</dt><dd className={cancelled ? undefined : styles.ok}>{activityStatusLabels[a.status]}{a.status === 'PUBLISHED' ? ' · activa' : ''}</dd></div>
            <div><dt>Inscripción</dt><dd>{a.requiresRegistration ? 'Con inscripción previa' : 'Sin inscripción previa'}</dd></div>
            <div><dt>Cupos</dt><dd>{capacityText(a)}</dd></div>
            <div><dt>Requisitos</dt><dd>{a.participationConditions || 'Ninguna'}</dd></div>
            {a.requiresRegistration && a.participation.groups.length > 0 && (
              <div>
                <dt>Multi-registro</dt>
                <dd className={a.participation.allowMultipleGroups ? styles.ok : undefined}>{a.participation.allowMultipleGroups ? 'Habilitado' : 'No'}</dd>
                {a.participation.allowMultipleGroups && (
                  <p className={styles.hint}>Puedes inscribirte en varios grupos de esta actividad si sus horarios no se solapan y tienen cupo.</p>
                )}
              </div>
            )}
          </dl>
          <EnrollmentPanel activity={a} token={token} mine={mine} onLogin={onLogin} onChanged={onChanged} />
        </aside>
      </div>
    </article>
  )
}
