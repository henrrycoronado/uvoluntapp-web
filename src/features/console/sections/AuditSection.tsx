import { consoleApi } from '../api'
import styles from '../console.module.css'
import { useLoad } from './useLoad'

const actionLabels: Record<string, string> = {
  ROLE_ASSIGNED: 'Rol asignado',
  ROLE_REVOKED: 'Rol revocado',
  ACCOUNT_APPROVED: 'Cuenta aprobada',
  ACCOUNT_REJECTED: 'Cuenta rechazada',
  ACCOUNT_STATUS_CHANGED: 'Estado de cuenta cambiado',
  ADMIN_GRANT_REQUESTED: 'Promoción a ADMIN solicitada',
}

export function AuditSection({ token }: { token: string }) {
  const [events] = useLoad(() => consoleApi.audit.list(token))

  return (
    <div className={styles.panel}>
      {events.status === 'loading' && <p className={styles.muted}>Cargando auditoría…</p>}
      {events.status === 'error' && <p role="alert" className={styles.alert}>{events.message}</p>}
      {events.status === 'ready' && (
        events.data.items.length === 0 ? (
          <p className={styles.muted}>Aún no hay operaciones registradas.</p>
        ) : (
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Fecha</th>
                <th>Operación</th>
                <th>Recurso</th>
              </tr>
            </thead>
            <tbody>
              {events.data.items.map((e) => (
                <tr key={e.id}>
                  <td>{new Date(e.createdAt).toLocaleString('es-BO')}</td>
                  <td>{actionLabels[e.action] ?? e.action}</td>
                  <td>{e.entityType}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )
      )}
    </div>
  )
}
