import { useState } from 'react'
import { Button, ConfirmButton } from '../../../shared/ui'
import { consoleApi } from '../api'
import styles from '../console.module.css'
import { Field } from './Field'
import { Feedback } from './Feedback'
import { ReasonAction } from './ReasonAction'
import { useAction } from './useAction'
import { useLoad } from './useLoad'

const statusLabels = { PENDING: 'Pendiente', APPROVED: 'Aprobada', REJECTED: 'Rechazada' } as const

export function AdminGrantsSection({ token, selfId }: { token: string; selfId: string }) {
  const [data, reload] = useLoad(() => Promise.all([consoleApi.grants.list(token), consoleApi.users.list(token)]))
  const { message, run } = useAction()
  const [beneficiaryId, setBeneficiaryId] = useState('')

  if (data.status === 'loading') return <div className={styles.panel}><p className={styles.muted}>Cargando solicitudes…</p></div>
  if (data.status === 'error') return <div className={styles.panel}><p role="alert" className={styles.alert}>{data.message}</p></div>

  const [grants, users] = data.data
  const name = (id: string) => {
    const user = users.items.find((u) => u.id === id)
    return user ? `${user.firstName} ${user.lastName}` : 'Persona'
  }

  return (
    <div className={styles.panel}>
      <p className={styles.muted}>
        Un nuevo ADMIN necesita la aprobación de dos administradores distintos, y ninguno puede ser la persona promovida.
      </p>
      <form
        className={styles.formRow}
        aria-label="Solicitar promoción a administrador"
        onSubmit={(event) => {
          event.preventDefault()
          void run(() => consoleApi.grants.create(token, beneficiaryId), 'Solicitud creada. Falta la aprobación de dos administradores.', () => {
            setBeneficiaryId('')
            reload()
          })
        }}
      >
        <Field label="Persona a promover">
          {(id) => (
            <select id={id} className={styles.select} value={beneficiaryId} onChange={(e) => setBeneficiaryId(e.target.value)} required>
            <option value="">Elige una persona activa</option>
            {users.items
              .filter((u) => u.accountStatus === 'ACTIVE' && u.id !== selfId)
              .map((u) => (
                <option key={u.id} value={u.id}>{u.firstName} {u.lastName} · {u.email}</option>
              ))}
          </select>
          )}
        </Field>
        <Button type="submit" variant="primary" disabled={!beneficiaryId}>Solicitar promoción</Button>
      </form>
      <Feedback message={message} />
      {grants.items.length === 0 ? (
        <p className={styles.muted}>No hay solicitudes de promoción.</p>
      ) : (
        <table className={styles.table}>
          <thead>
            <tr>
              <th>Persona</th>
              <th>Solicitó</th>
              <th>Estado</th>
              <th>Aprobaciones</th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {grants.items.map((g) => (
              <tr key={g.id}>
                <td>{name(g.beneficiaryId)}</td>
                <td>{name(g.requestedBy)}</td>
                <td>{statusLabels[g.status]}</td>
                <td>{g.approvals.length} de 2</td>
                <td className={styles.actions}>
                  {g.status === 'PENDING' && !g.approvals.some((a) => a.adminId === selfId) && (
                    <ConfirmButton
                      label="Aprobar"
                      confirmLabel="Confirmar aprobación"
                      variant="primary"
                      onConfirm={() => run(() => consoleApi.grants.approve(token, g.id), 'Aprobación registrada.', reload)}
                    />
                  )}
                  {g.status === 'PENDING' && (
                    <ReasonAction
                      label="Rechazar"
                      confirmLabel="Confirmar rechazo"
                      onConfirm={(reason) => run(() => consoleApi.grants.reject(token, g.id, reason), 'Solicitud rechazada.', reload)}
                    />
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  )
}
