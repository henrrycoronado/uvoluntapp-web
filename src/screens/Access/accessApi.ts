export interface RegisterRequest {
  email: string
  password: string
  firstName: string
  lastName: string
}

export interface CompleteRegistrationRequest {
  email: string
  firstName: string
  lastName: string
  phone: string
  relationWithPastoral: string
}

export interface ProblemDetails {
  type: string
  title: string
  status: number
  detail?: string
  errors?: Record<string, string[]>
}

export interface TokenResponse {
  accessToken: string
  refreshToken: string
  expiresAt: string
}

export interface VerifyOtpResponse {
  accountStatus: 'ACTIVE' | 'PENDING_APPROVAL'
  requiresApprovalData: boolean
  tokens?: TokenResponse
}

export const apiBaseUrl = import.meta.env.VITE_API_BASE_URL ?? ''

const wait = () => new Promise((resolve) => setTimeout(resolve, 120))

function problem(detail: string): ProblemDetails {
  return {
    type: 'https://uvoluntapp.invalid/problems/auth',
    title: 'No se pudo completar la solicitud',
    status: 422,
    detail,
  }
}

export async function register(
  request: RegisterRequest,
): Promise<{ requiresOtp: boolean; message: string }> {
  await wait()
  if (request.email.includes('error')) {
    throw problem('Revisa los datos ingresados e intenta de nuevo.')
  }
  return {
    requiresOtp: true,
    message: 'Si los datos son válidos, recibirás un código de verificación.',
  }
}

export async function verifyOtp(
  email: string,
  code: string,
): Promise<VerifyOtpResponse> {
  await wait()
  if (code === '000000') {
    throw {
      ...problem('El código expiró. Solicita uno nuevo para continuar.'),
      status: 409,
    } satisfies ProblemDetails
  }
  if (code === '999999') {
    throw {
      ...problem('Agotaste los intentos permitidos. Solicita un nuevo código.'),
      status: 429,
    } satisfies ProblemDetails
  }
  if (code !== '123456') {
    throw {
      ...problem('El código no es válido.'),
      status: 422,
    } satisfies ProblemDetails
  }
  const institutional = email.toLowerCase().endsWith('@ucb.edu.bo')
  return {
    accountStatus: institutional ? 'ACTIVE' : 'PENDING_APPROVAL',
    requiresApprovalData: !institutional,
    tokens: institutional
      ? {
          accessToken: 'mock-access-token',
          refreshToken: 'mock-refresh-token',
          expiresAt: new Date(Date.now() + 3600000).toISOString(),
        }
      : undefined,
  }
}

export async function completeRegistration(
  request: CompleteRegistrationRequest,
): Promise<{ message: string }> {
  await wait()
  if (request.phone === '000000000') {
    throw problem('No se pudo crear la solicitud de aprobación.')
  }
  return { message: 'Tu solicitud fue enviada para aprobación.' }
}

export async function login(
  email: string,
  password: string,
): Promise<TokenResponse> {
  await wait()
  if (email.includes('error') || password === 'incorrecta') {
    throw {
      ...problem('El correo o la contraseña no son válidos.'),
      status: 401,
    } satisfies ProblemDetails
  }
  return {
    accessToken: 'mock-access-token',
    refreshToken: 'mock-refresh-token',
    expiresAt: new Date(Date.now() + 3600000).toISOString(),
  }
}

export async function resendOtp(email: string): Promise<{ message: string }> {
  await wait()
  if (!email) {
    throw problem('No se pudo reenviar el código.')
  }
  return { message: 'Si el registro existe, recibirás un nuevo código.' }
}

export function problemMessage(error: unknown, fallback: string): string {
  if (
    typeof error === 'object' &&
    error !== null &&
    'detail' in error &&
    typeof error.detail === 'string'
  ) {
    return error.detail
  }
  return fallback
}
