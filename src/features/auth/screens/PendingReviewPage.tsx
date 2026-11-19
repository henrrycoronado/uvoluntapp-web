import { navigate } from '../../../app/navigation'
import { Button } from '../../../shared/ui'
import { AuthLayout } from '../AuthLayout'
import styles from '../auth.module.css'

export function PendingReviewPage() {
  return (
    <AuthLayout title="Solicitud enviada">
      <p className={styles.success} role="status">
        Un administrador de la Pastoral revisará tu cuenta. Te avisaremos por correo cuando esté lista; mientras tanto no
        podrás iniciar sesión.
      </p>
      <Button variant="secondary" onClick={() => navigate('/acceso')}>Volver al inicio de sesión</Button>
    </AuthLayout>
  )
}
