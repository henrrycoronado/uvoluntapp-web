import { useEffect } from 'react'
import { navigate, usePathname } from './app/navigation'
import { CompleteGoogleProfilePage } from './features/auth/screens/CompleteGoogleProfilePage'
import { CompleteRegistrationPage } from './features/auth/screens/CompleteRegistrationPage'
import { CreatePasswordPage } from './features/auth/screens/CreatePasswordPage'
import { ForgotPasswordPage } from './features/auth/screens/ForgotPasswordPage'
import { LoginPage } from './features/auth/screens/LoginPage'
import { OtpPage } from './features/auth/screens/OtpPage'
import { PendingReviewPage } from './features/auth/screens/PendingReviewPage'
import { ReapplyPage } from './features/auth/screens/ReapplyPage'
import { RegisterPage } from './features/auth/screens/RegisterPage'
import { ResetPasswordPage } from './features/auth/screens/ResetPasswordPage'
import { ConsolePage } from './features/console/ConsolePage'
import { HomePage } from './features/home/HomePage'
import { LandingPage } from './features/landing/LandingPage'
import { readSession } from './features/auth/session'
import { useTheme } from './shared/theme/theme'

function Redirect({ to }: { to: string }) {
  useEffect(() => navigate(to), [to])
  return null
}

export default function App() {
  const pathname = usePathname()
  useTheme()

  // Con sesión abierta, la landing y las pantallas de acceso llevan directo al espacio de la persona.
  const publicOnly = [
    '/',
    '/acceso',
    '/registro',
    '/verificar',
    '/completar-registro',
    '/completar-perfil',
    '/crear-contrasena',
    '/recuperar',
    '/nueva-solicitud',
    '/en-revision',
  ]
  if (readSession() && publicOnly.includes(pathname)) {
    return <Redirect to="/inicio" />
  }

  switch (pathname) {
    case '/acceso':
      return <LoginPage />
    case '/registro':
      return <RegisterPage />
    case '/verificar':
      return <OtpPage />
    case '/completar-registro':
      return <CompleteRegistrationPage />
    case '/completar-perfil':
      return <CompleteGoogleProfilePage />
    case '/crear-contrasena':
      return <CreatePasswordPage />
    case '/recuperar':
      return <ForgotPasswordPage />
    case '/restablecer':
      return <ResetPasswordPage />
    case '/nueva-solicitud':
      return <ReapplyPage />
    case '/en-revision':
      return <PendingReviewPage />
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
