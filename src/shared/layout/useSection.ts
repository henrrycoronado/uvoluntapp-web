import { useState } from 'react'

/** Sección activa guardada en ?seccion= para poder volver o compartir el enlace. */
export function useSection(path: string, validIds: string[], fallback: string): [string, (id: string) => void] {
  const [chosen, setChosen] = useState<string | null>(() => new URLSearchParams(window.location.search).get('seccion'))
  const select = (id: string) => {
    setChosen(id)
    window.history.replaceState({}, '', `${path}?seccion=${id}`)
    window.scrollTo({ top: 0 })
  }
  // La sección por defecto se resuelve con los datos ya cargados, no al montar.
  return [chosen && validIds.includes(chosen) ? chosen : fallback, select]
}
