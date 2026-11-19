import { useEffect } from 'react'
import { navigate, usePathname } from './app/navigation'
import { LoginPage } from './features/auth/screens/LoginPage'
import { OtpPage } from './features/auth/screens/OtpPage'
import { RegisterPage } from './features/auth/screens/RegisterPage'
import { ConsolePage } from './features/console/ConsolePage'
import { HomePage } from './features/home/HomePage'
import { LandingPage } from './features/landing/LandingPage'
import { useTheme } from './shared/theme/theme'

function Redirect({ to }: { to: string }) {
  useEffect(() => navigate(to), [to])
  return null
}

export default function App() {
  const pathname = usePathname()
  useTheme()

  switch (pathname) {
    case '/acceso':
      return <LoginPage />
    case '/registro':
      return <RegisterPage />
    case '/verificar':
      return <OtpPage />
    case '/inicio':
      return <HomePage />
    case '/consola':
      return <ConsolePage />
    case '/perfil':
      return <Redirect to="/inicio?seccion=perfil" />
    default:
      return <LandingPage />
  }
}
