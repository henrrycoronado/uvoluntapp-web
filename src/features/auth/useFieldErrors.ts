import { useState } from 'react'

type Rules<K extends string> = Record<K, () => string | undefined>

/**
 * Errores por campo: se muestran al salir del campo o al enviar.
 * submit() devuelve true si todo es válido; si no, enfoca el primer campo con error.
 */
export function useFieldErrors<K extends string>(rules: Rules<K>) {
  const [touched, setTouched] = useState<Partial<Record<K, boolean>>>({})
  const [submitted, setSubmitted] = useState(false)
  const keys = Object.keys(rules) as K[]

  const errorOf = (key: K) => (submitted || touched[key] ? rules[key]() : undefined)

  return {
    error: errorOf,
    blur: (key: K) => () => setTouched((current) => ({ ...current, [key]: true })),
    submit(form: HTMLFormElement): boolean {
      setSubmitted(true)
      const invalid = keys.find((key) => rules[key]())
      if (invalid) {
        form.querySelector<HTMLElement>(`[name="${invalid}"]`)?.focus()
        return false
      }
      return true
    },
  }
}
