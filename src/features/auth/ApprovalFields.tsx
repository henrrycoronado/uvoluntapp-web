import { TextField } from '../../shared/ui'
import styles from './auth.module.css'
import type { useFieldErrors } from './useFieldErrors'
import { LIMITS } from './validation'

export interface ApprovalValues {
  firstName: string
  lastName: string
  phone: string
  relationWithPastoral: string
}

type Fields = ReturnType<typeof useFieldErrors<keyof ApprovalValues>>

interface ApprovalFieldsProps {
  values: ApprovalValues
  fields: Fields
  onChange: (values: ApprovalValues) => void
}

/** Datos que revisa el administrador para aprobar una cuenta con correo externo. */
export function ApprovalFields({ values, fields, onChange }: ApprovalFieldsProps) {
  const bind = (name: keyof ApprovalValues) => ({
    name,
    value: values[name],
    error: fields.error(name),
    onBlur: fields.blur(name),
    onChange: (event: { target: { value: string } }) => onChange({ ...values, [name]: event.target.value }),
  })

  return (
    <>
      <div className={styles.row}>
        <TextField label="Nombres" maxLength={LIMITS.personName} autoComplete="given-name" required {...bind('firstName')} />
        <TextField label="Apellidos" maxLength={LIMITS.personName} autoComplete="family-name" required {...bind('lastName')} />
      </div>
      <TextField label="Teléfono" maxLength={LIMITS.phone} type="tel" inputMode="tel" autoComplete="tel" required {...bind('phone')} />
      <TextField
        label="Relación con la Pastoral"
        hint="Por ejemplo: exalumna, familiar de un estudiante, voluntario de parroquia."
        maxLength={200}
        required
        {...bind('relationWithPastoral')}
      />
    </>
  )
}
