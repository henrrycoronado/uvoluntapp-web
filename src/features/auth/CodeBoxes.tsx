import { type ClipboardEvent, type KeyboardEvent, useRef } from 'react'
import styles from './auth.module.css'

interface CodeBoxesProps {
  value: string
  onChange: (value: string) => void
  length?: number
  label: string
}

/** Código de un solo uso en casillas separadas (prototipo): avanza solo, admite pegar y retroceder con Backspace. */
export function CodeBoxes({ value, onChange, length = 6, label }: CodeBoxesProps) {
  const refs = useRef<(HTMLInputElement | null)[]>([])
  const digits = Array.from({ length }, (_, i) => value[i] ?? '')

  const setAt = (index: number, digit: string) => {
    const next = digits.slice()
    next[index] = digit
    onChange(next.join('').slice(0, length))
  }

  function onInput(index: number, raw: string) {
    const clean = raw.replace(/\D/g, '')
    if (!clean) return setAt(index, '')
    setAt(index, clean.slice(-1))
    if (index < length - 1) refs.current[index + 1]?.focus()
  }

  function onKeyDown(index: number, event: KeyboardEvent<HTMLInputElement>) {
    if (event.key === 'Backspace' && !digits[index] && index > 0) {
      setAt(index - 1, '')
      refs.current[index - 1]?.focus()
    }
    if (event.key === 'ArrowLeft' && index > 0) refs.current[index - 1]?.focus()
    if (event.key === 'ArrowRight' && index < length - 1) refs.current[index + 1]?.focus()
  }

  function onPaste(event: ClipboardEvent<HTMLInputElement>) {
    const pasted = event.clipboardData.getData('text').replace(/\D/g, '').slice(0, length)
    if (!pasted) return
    event.preventDefault()
    onChange(pasted)
    refs.current[Math.min(pasted.length, length - 1)]?.focus()
  }

  return (
    <div role="group" aria-label={label} className={styles.codeRow}>
      {digits.map((digit, i) => (
        <input
          key={i}
          ref={(el) => { refs.current[i] = el }}
          className={styles.codeBox}
          inputMode="numeric"
          autoComplete={i === 0 ? 'one-time-code' : 'off'}
          maxLength={1}
          value={digit}
          aria-label={`${label}, dígito ${i + 1} de ${length}`}
          autoFocus={i === 0}
          onChange={(e) => onInput(i, e.target.value)}
          onKeyDown={(e) => onKeyDown(i, e)}
          onPaste={onPaste}
        />
      ))}
    </div>
  )
}
