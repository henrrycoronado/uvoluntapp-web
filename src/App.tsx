import { RegisterPage } from './features/auth/screens/RegisterPage'
import { LoginPage } from './features/auth/screens/LoginPage'
import { OtpPage } from './features/auth/screens/OtpPage'
import { ProfilePage } from './features/profile/screens/ProfilePage'
import { usePathname } from './app/navigation'

export default function App() {
  const pathname = usePathname()

  switch (pathname) {
    case '/registro':
      return <RegisterPage />
    case '/verificar':
      return <OtpPage />
    case '/perfil':
      return <ProfilePage />
    default:
      return <LoginPage />
  }
}
