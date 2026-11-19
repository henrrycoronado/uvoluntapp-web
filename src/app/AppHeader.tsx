import { authApi } from '../features/auth/api'
import { clearSession, readSession } from '../features/auth/session'
import { useTheme } from '../shared/theme/theme'
import { Button } from '../shared/ui'
import styles from './AppHeader.module.css'
import { navigate } from './navigation'

interface AppHeaderProps {
  /** Muestra el acceso a la consola (roles distintos de voluntario). */
  showConsole: boolean
  current: 'inicio' | 'consola'
}

export function AppHeader({ showConsole, current }: AppHeaderProps) {
  const [theme, toggleTheme] = useTheme()

  async function logout() {
    const session = readSession()
    if (session) {
      await authApi.logout(session.accessToken, session.refreshToken).catch(() => undefined)
    }
    clearSession()
    navigate('/acceso')
  }

  return (
    <header className={styles.header}>
      <button type="button" className={styles.brand} onClick={() => navigate('/inicio')}>
        <img src="/brand/logo-small.svg" alt="" width={22} height={26} />
        <span>
          U-Volunt<span className={styles.accent}>App</span>
        </span>
      </button>
      <nav className={styles.nav} aria-label="Navegación principal">
        <Button size="sm" variant="secondary" onClick={toggleTheme}>
          {theme === 'dark' ? 'Tema claro' : 'Tema oscuro'}
        </Button>
        {showConsole && current === 'inicio' && (
          <Button size="sm" variant="primary" onClick={() => navigate('/consola')}>Consola Uvoluntapp</Button>
        )}
        {current === 'consola' && (
          <Button size="sm" variant="secondary" onClick={() => navigate('/inicio')}>Volver al inicio</Button>
        )}
        <Button size="sm" variant="secondary" onClick={logout}>Cerrar sesión</Button>
      </nav>
    </header>
  )
}
