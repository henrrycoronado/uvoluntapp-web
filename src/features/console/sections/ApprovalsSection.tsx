import { ConfirmButton } from '../../../shared/ui'
import { consoleApi } from '../api'
import styles from '../console.module.css'
import { Feedback } from './Feedback'
import { ReasonAction } from './ReasonAction'
import { useAction } from './useAction'
import { useLoad } from './useLoad'

export function ApprovalsSection({ token }: { token: string }) {
  const [requests, reload] = useLoad(() => consoleApi.approvals.list(token))
  const { message, run } = useAction()

  return (
    <div className={styles.panel}>
      <p className={styles.muted}>
        Las cuentas con correo @ucb.edu.bo se activan solas al verificar el correo. Aquí llegan las cuentas externas.
      </p>
      <Feedback message={message} />
      {requests.status === 'loading' && <p className={styles.muted}>Cargando solicitudes…</p>}
      {requests.status === 'error' && <p role="alert" className={styles.alert}>{requests.message}</p>}
      {requests.status === 'ready' && (
        requests.data.items.length === 0 ? (
          <p className={styles.muted}>No hay solicitudes pendientes.</p>
        ) : (
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Persona</th>
                <th>Relación con la Pastoral</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {requests.data.items.map((r) => (
                <tr key={r.id}>
                  <td>
                    {r.firstName} {r.lastName}
                    <br />
                    <span className={styles.muted}>{r.email}{r.phone ? ` · ${r.phone}` : ''}</span>
                  </td>
                  <td>{r.relationWithPastoral}</td>
                  <td className={styles.actions}>
                    <ConfirmButton
                      label="Aprobar"
                      confirmLabel="Confirmar aprobación"
                      variant="primary"
                      onConfirm={() => run(() => consoleApi.approvals.approve(token, r.id), 'Cuenta aprobada.', reload)}
                    />
                    <ReasonAction
                      label="Rechazar"
                      confirmLabel="Confirmar rechazo"
                      onConfirm={(reason) => run(() => consoleApi.approvals.reject(token, r.id, reason), 'Solicitud rechazada.', reload)}
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )
      )}
    </div>
  )
}
