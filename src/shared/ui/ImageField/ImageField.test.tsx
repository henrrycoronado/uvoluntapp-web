import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { ImageField, validateImage } from './ImageField'

describe('ImageField', () => {
  afterEach(() => vi.unstubAllGlobals())

  it('valida formato y peso antes de subir', () => {
    expect(validateImage({ type: 'image/png', size: 1000 })).toBeNull()
    expect(validateImage({ type: 'image/gif', size: 1000 })).toMatch(/JPG, PNG o WebP/)
    expect(validateImage({ type: 'image/webp', size: 6 * 1024 * 1024 })).toMatch(/5 MB/)
  })

  it('sin imagen ofrece subir y envía el archivo por PUT multipart', async () => {
    const fetchMock = vi.fn(async () => new Response(null, { status: 204 }))
    vi.stubGlobal('fetch', fetchMock)
    const onChanged = vi.fn()
    render(<ImageField token="t" path="/programs/p1/cover" label="Portada" hasImage={false} canEdit onChanged={onChanged} />)

    expect(screen.getByText('Sin imagen.')).toBeInTheDocument()
    const file = new File(['x'], 'p.png', { type: 'image/png' })
    await userEvent.upload(screen.getByLabelText('Subir Portada'), file)

    await waitFor(() => expect(onChanged).toHaveBeenCalled())
    const [url, init] = fetchMock.mock.calls[0] as unknown as [string, RequestInit]
    expect(url).toContain('/programs/p1/cover')
    expect(init.method).toBe('PUT')
    expect(init.body).toBeInstanceOf(FormData)
    expect((init.headers as Record<string, string>)['Content-Type']).toBeUndefined()
  })

  it('rechaza un archivo que no es imagen sin llamar a la API', async () => {
    const fetchMock = vi.fn()
    vi.stubGlobal('fetch', fetchMock)
    render(<ImageField token="t" path="/programs/p1/cover" label="Portada" hasImage={false} canEdit onChanged={vi.fn()} />)
    await userEvent.upload(screen.getByLabelText('Subir Portada'), new File(['x'], 'a.pdf', { type: 'application/pdf' }), { applyAccept: false })
    expect(await screen.findByRole('alert')).toHaveTextContent(/JPG, PNG o WebP/)
    expect(fetchMock).not.toHaveBeenCalled()
  })

  it('sin permiso de edición no muestra controles', () => {
    vi.stubGlobal('fetch', vi.fn(async () => new Response(null, { status: 404 })))
    render(<ImageField token="t" path="/programs/p1/cover" label="Portada" hasImage canEdit={false} onChanged={vi.fn()} />)
    expect(screen.queryByLabelText(/Reemplazar|Subir/)).toBeNull()
    expect(screen.queryByRole('button', { name: 'Quitar imagen' })).toBeNull()
  })
})
