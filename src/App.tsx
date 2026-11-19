import { useState } from 'react'
import { LoginScreen, OtpScreen, RegisterScreen } from './screens/Access'

export default function App() {
  const [route, setRoute] = useState(window.location.pathname)
  const [registration, setRegistration] = useState({ email: '', firstName: '', lastName: '' })

  if (route === '/register') {
    return <RegisterScreen onRegistered={(value) => { setRegistration(value); setRoute('/verify-otp') }} />
  }
  if (route === '/verify-otp') {
    return <OtpScreen {...registration} onVerified={() => setRoute('/login')} />
  }
  return <LoginScreen />
}
