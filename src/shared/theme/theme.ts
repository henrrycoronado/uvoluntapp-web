import { useEffect, useState } from 'react'

export type Theme = 'dark' | 'light'
const KEY = 'uvoluntapp.theme'

function readTheme(): Theme {
  try {
    return localStorage.getItem(KEY) === 'light' ? 'light' : 'dark'
  } catch {
    return 'dark'
  }
}

/** Tema de la interfaz guardado en el navegador de cada persona. */
export function useTheme(): [Theme, () => void] {
  const [theme, setTheme] = useState<Theme>(readTheme)

  useEffect(() => {
    document.documentElement.dataset.theme = theme
    try {
      localStorage.setItem(KEY, theme)
    } catch {
      // Sin almacenamiento disponible: el tema vale solo para esta sesión.
    }
  }, [theme])

  return [theme, () => setTheme((current) => (current === 'dark' ? 'light' : 'dark'))]
}
