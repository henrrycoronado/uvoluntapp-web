import { useEffect, useState } from 'react'

/** Navegación mínima por ruta, sin dependencias externas. */
export function navigate(path: string): void {
  window.history.pushState({}, '', path)
  window.dispatchEvent(new PopStateEvent('popstate'))
}

export function usePathname(): string {
  const [pathname, setPathname] = useState(window.location.pathname)

  useEffect(() => {
    const onChange = () => setPathname(window.location.pathname)
    // Un efecto hijo pudo navegar antes de suscribirse: sincroniza con la ruta actual.
    onChange()
    window.addEventListener('popstate', onChange)
    return () => window.removeEventListener('popstate', onChange)
  }, [])

  return pathname
}
