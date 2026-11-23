import { type ChangeEvent, useEffect, useState } from 'react'
import { fetchImage, request } from '../../api/http'
import { ConfirmButton } from '../ConfirmButton'
import styles from './ImageField.module.css'

export const IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp']
export const IMAGE_MAX_BYTES = 5 * 1024 * 1024

/** Reglas del cliente antes de subir; el servidor valida de nuevo formato, dimensiones y contenido. */
export function validateImage(file: Pick<File, 'type' | 'size'>): string | null {
  if (!IMAGE_TYPES.includes(file.type)) return 'Usa una imagen JPG, PNG o WebP.'
  if (file.size > IMAGE_MAX_BYTES) return 'La imagen pesa más de 5 MB.'
  return null
}

/** Descarga una imagen protegida y la expone como URL de objeto; null mientras carga o si no hay imagen. */
export function useProtectedImage(path: string, token: string, enabled: boolean, version = 0): string | null {
  const [url, setUrl] = useState<string | null>(null)
  useEffect(() => {
    if (!enabled) {
      setUrl(null)
      return
    }
    let active = true
    let objectUrl: string | null = null
    fetchImage(`${path}?thumbnail=true`, token)
      .then((blob) => {
        if (!active || !blob || typeof URL.createObjectURL !== 'function') return
        objectUrl = URL.createObjectURL(blob)
        setUrl(objectUrl)
      })
      .catch(() => active && setUrl(null))
    return () => {
      active = false
      if (objectUrl && typeof URL.revokeObjectURL === 'function') URL.revokeObjectURL(objectUrl)
    }
  }, [path, token, enabled, version])
  return url
}

/** Sube (o reemplaza) una imagen del recurso por multipart. */
export async function uploadImage(token: string, path: string, file: File): Promise<void> {
  const body = new FormData()
  body.append('file', file)
  await request<void>(path, { method: 'PUT', body, token })
}

interface ImageFieldProps {
  token: string
  /** Ruta de la API del recurso, por ejemplo `/programs/{id}/cover`. */
  path: string
  label: string
  hasImage: boolean
  canEdit: boolean
  onChanged: () => void
}

/** Vista previa, carga, sustitución y retiro de una imagen del recurso (R2 vía la API). */
export function ImageField({ token, path, label, hasImage, canEdit, onChanged }: ImageFieldProps) {
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)
  const [version, setVersion] = useState(0)
  const preview = useProtectedImage(path, token, hasImage, version)

  async function upload(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0]
    event.target.value = ''
    if (!file) return
    const invalid = validateImage(file)
    if (invalid) return setError(invalid)
    setError(null)
    setBusy(true)
    try {
      await uploadImage(token, path, file)
      setVersion((v) => v + 1)
      onChanged()
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'No pudimos subir la imagen.')
    } finally {
      setBusy(false)
    }
  }

  async function remove() {
    setError(null)
    try {
      await request<void>(path, { method: 'DELETE', token })
      setVersion((v) => v + 1)
      onChanged()
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'No pudimos quitar la imagen.')
    }
  }

  return (
    <div className={styles.field} role="group" aria-label={label}>
      {preview ? <img className={styles.preview} src={preview} alt={label} /> : <p className={styles.empty}>{hasImage ? 'Cargando imagen…' : 'Sin imagen.'}</p>}
      {canEdit && (
        <div className={styles.actions}>
          <label className={styles.upload}>
            <span className={styles.visually}>{hasImage ? `Reemplazar ${label}` : `Subir ${label}`}</span>
            <input type="file" accept={IMAGE_TYPES.join(',')} disabled={busy} onChange={upload} aria-label={hasImage ? `Reemplazar ${label}` : `Subir ${label}`} />
          </label>
          {hasImage && <ConfirmButton label="Quitar imagen" confirmLabel="Confirmar" onConfirm={remove} />}
        </div>
      )}
      {busy && <p role="status" className={styles.empty}>Subiendo…</p>}
      {error && <p role="alert" className={styles.error}>{error}</p>}
    </div>
  )
}


/** Imagen protegida con marcador de posición (tarjetas y listas de la consola). */
export function ProtectedImage({ token, path, enabled, alt, className, fallbackClassName }: {
  token: string
  path: string
  enabled: boolean
  alt: string
  className?: string
  fallbackClassName?: string
}) {
  const url = useProtectedImage(path, token, enabled)
  return url ? <img className={className} src={url} alt={alt} loading="lazy" /> : <span className={fallbackClassName} aria-hidden="true" />
}
