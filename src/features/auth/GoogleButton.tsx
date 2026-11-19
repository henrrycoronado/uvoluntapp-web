import { useEffect, useRef } from 'react'

interface GoogleCredentialResponse {
  credential: string
}

interface GoogleIdentity {
  accounts: {
    id: {
      initialize: (options: { client_id: string; callback: (response: GoogleCredentialResponse) => void }) => void
      renderButton: (element: HTMLElement, options: Record<string, string | number>) => void
    }
  }
}

declare global {
  interface Window {
    google?: GoogleIdentity
  }
}

const SCRIPT_ID = 'google-identity-services'
const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID as string | undefined

function loadScript(): Promise<void> {
  if (window.google) return Promise.resolve()
  const existing = document.getElementById(SCRIPT_ID) as HTMLScriptElement | null
  return new Promise((resolve, reject) => {
    const script = existing ?? document.createElement('script')
    script.addEventListener('load', () => resolve())
    script.addEventListener('error', () => reject(new Error('No se pudo cargar Google.')))
    if (!existing) {
      script.id = SCRIPT_ID
      script.src = 'https://accounts.google.com/gsi/client'
      script.async = true
      document.head.appendChild(script)
    }
  })
}

/** Botón oficial de Google. Entrega el id_token a onCredential; la sesión la abre la API. */
export function GoogleButton({ onCredential, onError }: { onCredential: (idToken: string) => void; onError: (message: string) => void }) {
  const container = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!clientId) return
    let active = true
    loadScript()
      .then(() => {
        if (!active || !container.current || !window.google) return
        window.google.accounts.id.initialize({ client_id: clientId, callback: (response) => onCredential(response.credential) })
        window.google.accounts.id.renderButton(container.current, {
          theme: 'outline',
          size: 'large',
          text: 'continue_with',
          shape: 'rectangular',
          locale: 'es',
          width: 320,
        })
      })
      .catch(() => active && onError('No pudimos cargar el acceso con Google. Usa tu correo y contraseña.'))
    return () => {
      active = false
    }
  }, [onCredential, onError])

  if (!clientId) return null
  return <div ref={container} aria-label="Continuar con Google" />
}
