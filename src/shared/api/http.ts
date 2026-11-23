export interface ProblemDetails {
  type: string
  title: string
  status: number
  detail?: string
  /** Campos extra del Problem Details (por ejemplo accountStatus o reapplyAvailableAt). */
  [extension: string]: unknown
}

export class ApiError extends Error {
  readonly status: number
  readonly problem: ProblemDetails

  constructor(problem: ProblemDetails) {
    super(problem.detail ?? problem.title)
    this.name = 'ApiError'
    this.status = problem.status
    this.problem = problem
  }
}

const baseUrl = import.meta.env.VITE_API_BASE_URL ?? '/api/v1'

interface RequestOptions {
  method?: 'GET' | 'POST' | 'PATCH' | 'PUT' | 'DELETE'
  body?: unknown
  token?: string
}

/** Cuerpo multipart (por ejemplo, la carga de una imagen). */
export const isForm = (body: unknown): body is FormData => typeof FormData !== 'undefined' && body instanceof FormData

/** Recibe el token rechazado y devuelve uno vigente, o null si la sesión ya no se puede renovar. */
type TokenRefresher = (rejectedToken: string) => Promise<string | null>

let refresher: TokenRefresher | null = null

/** La sesión registra aquí cómo renovar el token de acceso cuando vence. */
export function setTokenRefresher(fn: TokenRefresher | null): void {
  refresher = fn
}

async function send(path: string, options: RequestOptions, token?: string): Promise<Response> {
  const headers: Record<string, string> = { Accept: 'application/json' }
  // Con FormData el navegador fija el Content-Type con su boundary.
  if (options.body !== undefined && !isForm(options.body)) headers['Content-Type'] = 'application/json'
  if (token) headers.Authorization = `Bearer ${token}`

  // credentials: la cookie de prueba del registro debe llegar a complete-registration.
  return fetch(`${baseUrl}${path}`, {
    method: options.method ?? 'GET',
    headers,
    credentials: 'include',
    body: options.body === undefined ? undefined : isForm(options.body) ? options.body : JSON.stringify(options.body),
  })
}

function parse(text: string): unknown {
  if (!text) return undefined
  try {
    return JSON.parse(text)
  } catch {
    return undefined
  }
}

/** Cliente HTTP mínimo: JSON, Bearer con renovación automática y errores como ApiError (Problem Details). */
export async function request<T>(path: string, options: RequestOptions = {}): Promise<T> {
  let response = await send(path, options, options.token)

  if (response.status === 401 && options.token && refresher) {
    const renewed = await refresher(options.token)
    if (renewed) response = await send(path, options, renewed)
  }

  const data = parse(await response.text())

  if (!response.ok) {
    const problem = data as ProblemDetails | undefined
    throw new ApiError(
      problem && typeof problem.status === 'number'
        ? problem
        : { type: 'about:blank', title: 'No se pudo completar la operación.', status: response.status },
    )
  }

  return data as T
}

/** URL de una imagen pública del catálogo a partir del `imageUrl` relativo que entrega la API. */
export function imageSrc(imageUrl: string | null | undefined, thumbnail = true): string | undefined {
  if (!imageUrl) return undefined
  return `${baseUrl}${imageUrl.replace(/^\/api\/v1/, '')}${thumbnail ? '?thumbnail=true' : ''}`
}

/** Descarga una imagen protegida (el servidor responde con una redirección a una URL temporal). */
export async function fetchImage(path: string, token?: string): Promise<Blob | null> {
  const response = await fetch(`${baseUrl}${path}`, { headers: token ? { Authorization: `Bearer ${token}` } : undefined, credentials: 'include' })
  return response.ok ? response.blob() : null
}
