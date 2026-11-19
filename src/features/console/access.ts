import type { Capabilities } from '../../shared/session/capabilities'

/** edit: gestiona · review: solo consulta · none: no ve la sección. */
export type Access = 'edit' | 'review' | 'none'

export interface SectionDefinition {
  id: string
  title: string
  summary: string
  /** Qué módulo la entrega. Las del módulo 1 ya funcionan. */
  module: 'Módulo 1' | 'Módulo 2' | 'Módulo 3' | 'Módulo 4' | 'Módulo 5' | 'Módulo 6'
  access: (can: Capabilities) => Access
}

const leaderReview = (can: Capabilities): Access => (can.isAdmin || can.isProgramLeader ? 'edit' : can.isOperationalLeader ? 'review' : 'none')

/** Matriz de acceso por rol. ADMIN gestiona todo; el líder de programa lo suyo; el operativo revisa. */
export const sections: SectionDefinition[] = [
  {
    id: 'usuarios',
    title: 'Usuarios',
    summary: 'Cuentas, estados y bajas.',
    module: 'Módulo 1',
    access: (can) => (can.isAdmin ? 'edit' : can.isProgramLeader || can.isOperationalLeader ? 'review' : 'none'),
  },
  {
    id: 'aprobaciones',
    title: 'Aprobación de cuentas',
    summary: 'Solicitudes de cuentas externas.',
    module: 'Módulo 1',
    access: (can) => (can.isAdmin ? 'edit' : 'none'),
  },
  {
    id: 'asignaciones',
    title: 'Roles y permisos',
    summary: 'Asignación y revocación de roles por programa.',
    module: 'Módulo 1',
    access: (can) => (can.isAdmin || can.isProgramLeader ? 'edit' : can.isOperationalLeader ? 'review' : 'none'),
  },
  {
    id: 'administradores',
    title: 'Administradores',
    summary: 'Promociones a ADMIN con doble aprobación.',
    module: 'Módulo 1',
    access: (can) => (can.isAdmin ? 'edit' : 'none'),
  },
  {
    id: 'auditoria',
    title: 'Auditoría',
    summary: 'Registro de operaciones sensibles.',
    module: 'Módulo 1',
    access: (can) => (can.isAdmin ? 'review' : 'none'),
  },
  { id: 'programas', title: 'Programas', summary: 'Fichas, estados y periodos.', module: 'Módulo 2', access: leaderReview },
  { id: 'actividades', title: 'Actividades', summary: 'Calendario, cupos y estados.', module: 'Módulo 2', access: leaderReview },
  {
    id: 'agregacion',
    title: 'Agregación a programas',
    summary: 'Personas y responsables por programa.',
    module: 'Módulo 2',
    access: leaderReview,
  },
  {
    id: 'inscripciones',
    title: 'Inscripciones',
    summary: 'Solicitudes de participación.',
    module: 'Módulo 3',
    access: leaderReview,
  },
  {
    id: 'registros',
    title: 'Registros',
    summary: 'Entradas y salidas en actividades activas.',
    module: 'Módulo 3',
    access: (can) => (can.isAdmin || can.isProgramLeader || can.isOperationalLeader ? 'edit' : 'none'),
  },
  { id: 'compromisos', title: 'Compromisos', summary: 'Horas comprometidas.', module: 'Módulo 4', access: leaderReview },
  { id: 'seguimientos', title: 'Seguimientos', summary: 'Acompañamiento de voluntarios.', module: 'Módulo 4', access: leaderReview },
  { id: 'planificacion', title: 'Planificación', summary: 'Planes por periodo.', module: 'Módulo 4', access: leaderReview },
  {
    id: 'reportes',
    title: 'Reportes e IA',
    summary: 'Reportes y asistentes de IA.',
    module: 'Módulo 5',
    access: (can) => (can.isAdmin || can.isProgramLeader ? 'edit' : 'none'),
  },
  {
    id: 'financiero',
    title: 'Financiero',
    summary: 'Presupuestos y gastos.',
    module: 'Módulo 6',
    access: (can) => (can.isAdmin ? 'edit' : can.isProgramLeader ? 'review' : 'none'),
  },
]

export function visibleSections(can: Capabilities): (SectionDefinition & { level: Access })[] {
  return sections.map((s) => ({ ...s, level: s.access(can) })).filter((s) => s.level !== 'none')
}
