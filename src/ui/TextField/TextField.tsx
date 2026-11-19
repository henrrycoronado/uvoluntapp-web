import { type InputHTMLAttributes, forwardRef, useId } from 'react'
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

export const TextField = forwardRef<HTMLInputElement, TextFieldProps>(
  function TextField({ label, error, hint, className, ...rest }, ref) {
    const id = useId()
    const errorId = `${id}-error`
    const hintId = `${id}-hint`

    const inputCls = [
      styles.input,
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
        <input
          ref={ref}
          id={id}
          className={inputCls}
          aria-invalid={error ? true : undefined}
          aria-describedby={
            [error ? errorId : '', hint ? hintId : '']
              .filter(Boolean)
              .join(' ') || undefined
          }
          {...rest}
        />
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
