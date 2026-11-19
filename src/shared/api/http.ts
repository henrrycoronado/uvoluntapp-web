export interface ProblemDetails {
  type: string
  title: string
  status: number
  detail?: string
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

/** Cliente HTTP mínimo: JSON, Bearer y errores como ApiError (Problem Details del backend). */
export async function request<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const headers: Record<string, string> = { Accept: 'application/json' }
  if (options.body !== undefined) headers['Content-Type'] = 'application/json'
  if (options.token) headers.Authorization = `Bearer ${options.token}`

  const response = await fetch(`${baseUrl}${path}`, {
    method: options.method ?? 'GET',
    headers,
    body: options.body === undefined ? undefined : JSON.stringify(options.body),
  })

  const text = await response.text()
  const data: unknown = text ? JSON.parse(text) : undefined

  if (!response.ok) {
    const fallback: ProblemDetails = {
      type: 'about:blank',
      title: 'No se pudo completar la operación.',
      status: response.status,
    }
    throw new ApiError((data as ProblemDetails | undefined) ?? fallback)
  }

  return data as T
}
