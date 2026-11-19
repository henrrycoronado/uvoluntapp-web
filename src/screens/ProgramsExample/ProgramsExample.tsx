import { useState } from 'react'
import {
  BrandBanner,
  Button,
  LoadingState,
  ErrorState,
  EmptyState,
  AccessDenied,
} from '../../ui'
import styles from './ProgramsExample.module.css'

type ScreenState = 'loading' | 'empty' | 'error' | 'denied' | 'data'

const MOCK_PROGRAMS = [
  {
    id: '1',
    title: 'Voluntariado Comunitario 2026',
    status: 'ACTIVE',
    description: 'Programa de apoyo a comunidades vulnerables.',
  },
  {
    id: '2',
    title: 'Tutorías Académicas',
    status: 'DRAFT',
    description: 'Tutorías para estudiantes de primer año.',
  },
  {
    id: '3',
    title: 'Medioambiente y Reciclaje',
    status: 'ACTIVE',
    description: 'Concientización y acción ecológica en campus.',
  },
]

/**
 * Example screen: Programs list.
 * Demonstrates all four required states: loading, empty, error, access denied,
 * plus the happy-path data state. Used for validation of the design system.
 */
export function ProgramsExample() {
  const [state, setState] = useState<ScreenState>('data')

  return (
    <div className={styles.page}>
      <BrandBanner />

      <div className={styles.content}>
        <div className={styles.header}>
          <h2 className={styles.title}>Programas</h2>
          <div className={styles.controls}>
            <Button
              size="sm"
              variant={state === 'data' ? 'primary' : 'secondary'}
              onClick={() => setState('data')}
            >
              Datos
            </Button>
            <Button
              size="sm"
              variant={state === 'loading' ? 'primary' : 'secondary'}
              onClick={() => setState('loading')}
            >
              Carga
            </Button>
            <Button
              size="sm"
              variant={state === 'empty' ? 'primary' : 'secondary'}
              onClick={() => setState('empty')}
            >
              Vacío
            </Button>
            <Button
              size="sm"
              variant={state === 'error' ? 'primary' : 'secondary'}
              onClick={() => setState('error')}
            >
              Error
            </Button>
            <Button
              size="sm"
              variant={state === 'denied' ? 'primary' : 'secondary'}
              onClick={() => setState('denied')}
            >
              Denegado
            </Button>
          </div>
        </div>

        {state === 'loading' && (
          <LoadingState message="Cargando programas…" />
        )}

        {state === 'error' && (
          <ErrorState
            title="Error al cargar programas"
            message="No se pudo conectar con el servidor. Revisa tu conexión e intenta de nuevo."
            action={
              <Button variant="secondary" onClick={() => setState('data')}>
                Reintentar
              </Button>
            }
          />
        )}

        {state === 'empty' && (
          <EmptyState
            title="Sin programas"
            message="Todavía no se ha creado ningún programa de voluntariado."
          />
        )}

        {state === 'denied' && (
          <AccessDenied
            title="Acceso denegado"
            message="No tienes permiso para ver la lista de programas. Contacta a un administrador."
          />
        )}

        {state === 'data' && (
          <div className={styles.list}>
            {MOCK_PROGRAMS.map((p) => (
              <div key={p.id} className={styles.card}>
                <div className={styles['card-title']}>
                  {p.title}
                  {' '}
                  <span className={styles.badge}>{p.status}</span>
                </div>
                <p className={styles['card-meta']}>{p.description}</p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
