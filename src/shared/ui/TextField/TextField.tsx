import { type InputHTMLAttributes, forwardRef, useId, useState } from 'react'
import styles from './TextField.module.css'

export interface TextFieldProps
  extends Omit<InputHTMLAttributes<HTMLInputElement>, 'id'> {
  /** Visible label (required for accessibility). */
  label: string
  /** Validation error message. */
  error?: string
  /** Help hint shown below the input. */
  hint?: string
}

function EyeIcon({ open }: { open: boolean }) {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M2 12s3.6-7 10-7 10 7 10 7-3.6 7-10 7S2 12 2 12Z" />
      <circle cx="12" cy="12" r="3" />
      {!open && <path d="M4 4l16 16" />}
    </svg>
  )
}

export const TextField = forwardRef<HTMLInputElement, TextFieldProps>(
  function TextField({ label, error, hint, className, type, ...rest }, ref) {
    const id = useId()
    const errorId = `${id}-error`
    const hintId = `${id}-hint`
    const [revealed, setRevealed] = useState(false)
    const isPassword = type === 'password'

    const inputCls = [
      styles.input,
      isPassword ? styles['input-with-action'] : undefined,
      error ? styles['input-error'] : undefined,
      className,
    ]
      .filter(Boolean)
      .join(' ')

    return (
      <div className={styles.field}>
        <label className={styles.label} htmlFor={id}>
          {label}
        </label>
        <div className={styles.control}>
          <input
            ref={ref}
            id={id}
            type={isPassword && revealed ? 'text' : type}
            className={inputCls}
            aria-invalid={error ? true : undefined}
            aria-describedby={
              [error ? errorId : '', hint ? hintId : '']
                .filter(Boolean)
                .join(' ') || undefined
            }
            {...rest}
          />
          {isPassword && (
            <button
              type="button"
              className={styles.reveal}
              aria-label={revealed ? 'Ocultar contraseña' : 'Mostrar contraseña'}
              aria-pressed={revealed}
              aria-controls={id}
              onClick={() => setRevealed((value) => !value)}
            >
              <EyeIcon open={revealed} />
            </button>
          )}
        </div>
        {error && (
          <span id={errorId} className={styles['error-text']} role="alert">
            {error}
          </span>
        )}
        {hint && !error && (
          <span id={hintId} className={styles['hint-text']}>
            {hint}
          </span>
        )}
      </div>
    )
  },
)
