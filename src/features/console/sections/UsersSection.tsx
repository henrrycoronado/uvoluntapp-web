import { useState } from 'react'
import { Button, ConfirmButton } from '../../../shared/ui'
import type { Access } from '../access'
import { consoleApi } from '../api'
import styles from '../console.module.css'
import { Field } from './Field'
import { Feedback } from './Feedback'
import { ChangeEmailAction } from './ChangeEmailAction'
import { ReasonAction } from './ReasonAction'
import { useAction } from './useAction'
import { useLoad } from './useLoad'
import { LIMITS } from '../../auth/validation'

const statusLabels: Record<string, string> = {
  ACTIVE: 'Activa',
  PENDING_APPROVAL: 'Pendiente de aprobación',
  PENDING_VERIFICATION: 'Pendiente de verificación',
  SUSPENDED: 'Suspendida',
  REJECTED: 'Rechazada',
  PRE_REGISTERED: 'Prerregistrada',
}

export function UsersSection({ token, access }: { token: string; access: Access }) {
  const [search, setSearch] = useState('')
  const [applied, setApplied] = useState('')
  const [users, reload] = useLoad(() => consoleApi.users.list(token, applied))
  const { message, run } = useAction()
  const canEdit = access === 'edit'

  return (
    <div className={styles.panel}>
      <form
        className={styles.formRow}
        onSubmit={(event) => {
          event.preventDefault()
          setApplied(search)
          reload()
        }}
      >
        <Field label="Buscar por correo">
          {(id) => (
            <input id={id} className={styles.select} maxLength={LIMITS.email} value={search} onChange={(event) => setSearch(event.target.value)} />
          )}
        </Field>
        <Button type="submit" variant="secondary">Buscar</Button>
      </form>
      <Feedback message={message} />
      {users.status === 'loading' && <p className={styles.muted}>Cargando usuarios…</p>}
      {users.status === 'error' && <p role="alert" className={styles.alert}>{users.message}</p>}
      {users.status === 'ready' && (
        users.data.items.length === 0 ? (
          <p className={styles.muted}>No hay usuarios con ese criterio.</p>
        ) : (
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Nombre</th>
                <th>Correo</th>
                <th>Estado</th>
                <th>Verificación</th>
                {canEdit && <th>Acciones</th>}
              </tr>
            </thead>
            <tbody>
              {users.data.items.map((user) => (
                <tr key={user.id}>
                  <td>{user.firstName} {user.lastName}</td>
                  <td>{user.email}</td>
                  <td>{statusLabels[user.accountStatus] ?? user.accountStatus}</td>
                  <td>{user.verifiedAt ? 'Verificada' : 'Sin verificar'}</td>
                  {canEdit && (
                    <td className={styles.actions}>
                      {(user.accountStatus === 'ACTIVE' || user.accountStatus === 'SUSPENDED') && (
                        <ChangeEmailAction
                          currentEmail={user.email}
                          onConfirm={(newEmail, reason) =>
                            run(
                              () => consoleApi.users.changeEmail(token, user.id, newEmail, reason),
                              'Correo actualizado. La persona debe recuperar su contraseña con el correo nuevo.',
                              reload,
                            )
                          }
                        />
                      )}
                      {user.accountStatus === 'ACTIVE' && (
                        <ReasonAction
                          label="Dar de baja"
                          confirmLabel="Confirmar baja"
                          onConfirm={(reason) => run(() => consoleApi.users.suspend(token, user.id, reason), 'Cuenta suspendida.', reload)}
                        />
                      )}
                      {user.accountStatus === 'SUSPENDED' && (
                        <ConfirmButton
                          label="Reactivar"
                          confirmLabel="Confirmar reactivación"
                          onConfirm={() => run(() => consoleApi.users.reactivate(token, user.id), 'Cuenta reactivada.', reload)}
                        />
                      )}
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        )
      )}
    </div>
  )
}
