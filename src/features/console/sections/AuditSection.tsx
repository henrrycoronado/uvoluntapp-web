import { consoleApi } from '../api'
import styles from '../console.module.css'
import { useLoad } from './useLoad'

const actionLabels: Record<string, string> = {
  ROLE_ASSIGNED: 'Rol asignado',
  ROLE_REVOKED: 'Rol revocado',
  ACCOUNT_APPROVED: 'Cuenta aprobada',
  ACCOUNT_REJECTED: 'Cuenta rechazada',
  ACCOUNT_REAPPLIED: 'Nueva solicitud tras rechazo',
  ACCOUNT_VERIFIED: 'Cuenta verificada',
  ACCOUNT_UNVERIFIED: 'Cuenta sin verificar por cambio de correo',
  ACCESS_EMAIL_REPLACED_BY_ADMIN: 'Correo de acceso cambiado por un administrador',
  ACCOUNT_STATUS_CHANGED: 'Estado de cuenta cambiado',
  ADMIN_GRANT_REQUESTED: 'Promoción a ADMIN solicitada',
  FOUNDER_ADMIN_PROVISIONED: 'Administrador inicial creado',
  PROFILE_UPDATED: 'Perfil actualizado',
  ACCESS_EMAIL_CHANGED: 'Correo de acceso cambiado',
  INSTITUTIONAL_EMAIL_VERIFIED: 'Correo institucional verificado',
  PASSWORD_RESET: 'Contraseña restablecida',
  PASSWORD_CREATED: 'Contraseña creada',
}

const resourceLabels: Record<string, string> = {
  USER: 'Cuenta',
  ROLE_ASSIGNMENT: 'Asignación de rol',
  ACCOUNT_APPROVAL_REQUEST: 'Solicitud de aprobación',
  ADMIN_GRANT: 'Promoción a ADMIN',
  PROGRAM: 'Programa',
  ACTIVITY: 'Actividad',
}

function detailText(details: Record<string, unknown> | null | undefined): string {
  if (!details) return ''
  const reason = details.reason
  if (typeof reason === 'string' && reason) return `Motivo: ${reason}`
  if (typeof details.newStatus === 'string') return `${String(details.previousStatus)} → ${details.newStatus}`
  if (Array.isArray(details.fields)) return `Campos: ${details.fields.join(', ')}`
  return ''
}

export function AuditSection({ token }: { token: string }) {
  const [data] = useLoad(() => Promise.all([consoleApi.audit.list(token), consoleApi.users.list(token)]))

  if (data.status === 'loading') return <div className={styles.panel}><p className={styles.muted}>Cargando auditoría…</p></div>
  if (data.status === 'error') return <div className={styles.panel}><p role="alert" className={styles.alert}>{data.message}</p></div>

  const [events, users] = data.data
  const actorName = (id?: string | null) => {
    if (!id) return 'Sistema'
    const user = users.items.find((u) => u.id === id)
    return user ? `${user.firstName} ${user.lastName}` : 'Persona'
  }

  return (
    <div className={styles.panel}>
      {events.items.length === 0 ? (
        <p className={styles.muted}>Aún no hay operaciones registradas.</p>
      ) : (
        <table className={styles.table}>
          <thead>
            <tr>
              <th>Fecha</th>
              <th>Responsable</th>
              <th>Operación</th>
              <th>Recurso</th>
              <th>Detalle</th>
            </tr>
          </thead>
          <tbody>
            {events.items.map((e) => (
              <tr key={e.id}>
                <td>{new Date(e.createdAt).toLocaleString('es-BO')}</td>
                <td>{actorName(e.actorId)}</td>
                <td>{actionLabels[e.action] ?? e.action}</td>
                <td>{resourceLabels[e.entityType] ?? e.entityType}</td>
                <td className={styles.muted}>{detailText(e.details)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  )
}
