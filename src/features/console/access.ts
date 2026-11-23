import type { Capabilities } from '../../shared/session/capabilities'

/** edit: gestiona · review: solo consulta · none: no ve la sección. */
export type Access = 'edit' | 'review' | 'none'

export type Feature = 'Resumen' | 'Personas y accesos' | 'Programas' | 'Participación' | 'Gestión'

export const featureOrder: Feature[] = ['Resumen', 'Personas y accesos', 'Programas', 'Participación', 'Gestión']

export interface SectionDefinition {
  id: string
  title: string
  summary: string
  feature: Feature
  /** true cuando la sección ya funciona contra la API; false cuando llega con un módulo posterior. */
  live: boolean
  module?: string
  /** Lo que la persona podrá hacer según su nivel, para las secciones que aún no están activas. */
  plans?: { edit: string[]; review: string[] }
  access: (can: Capabilities) => Access
}

const managersEditOperativeReviews = (can: Capabilities): Access =>
  can.isAdmin || can.isProgramLeader ? 'edit' : can.isOperationalLeader ? 'review' : 'none'

/** Matriz de acceso por rol. ADMIN gestiona todo; el líder de programa lo que se le asigna; el operativo revisa y registra. */
export const sections: SectionDefinition[] = [
  {
    id: 'resumen',
    title: 'Resumen',
    summary: 'Lo que requiere tu atención hoy.',
    feature: 'Resumen',
    live: true,
    access: (can) => (can.canOpenConsole ? 'review' : 'none'),
  },
  {
    id: 'usuarios',
    title: 'Usuarios',
    summary: 'Cuentas registradas, su estado y bajas.',
    feature: 'Personas y accesos',
    live: true,
    access: (can) => (can.isAdmin ? 'edit' : can.isProgramLeader || can.isOperationalLeader ? 'review' : 'none'),
  },
  {
    id: 'aprobaciones',
    title: 'Aprobación de cuentas',
    summary: 'Solicitudes de personas con correo externo.',
    feature: 'Personas y accesos',
    live: true,
    access: (can) => (can.isAdmin ? 'edit' : 'none'),
  },
  {
    id: 'asignaciones',
    title: 'Roles y permisos',
    summary: 'Quién lidera cada programa y quién apoya como operativo.',
    feature: 'Personas y accesos',
    live: true,
    access: (can) => (can.isAdmin || can.isProgramLeader ? 'edit' : can.isOperationalLeader ? 'review' : 'none'),
  },
  {
    id: 'administradores',
    title: 'Administradores',
    summary: 'Promociones a administrador con doble aprobación.',
    feature: 'Personas y accesos',
    live: true,
    access: (can) => (can.isAdmin ? 'edit' : 'none'),
  },
  {
    id: 'auditoria',
    title: 'Auditoría',
    summary: 'Registro de operaciones sensibles.',
    feature: 'Personas y accesos',
    live: true,
    access: (can) => (can.isAdmin ? 'review' : 'none'),
  },
  {
    id: 'programas',
    title: 'Programas',
    summary: 'Programas que gestionas y los que puedes consultar.',
    feature: 'Programas',
    live: true,
    access: managersEditOperativeReviews,
  },
  {
    id: 'actividades',
    title: 'Actividades',
    summary: 'Calendario, cupos y estados de cada actividad.',
    feature: 'Programas',
    live: true,
    access: managersEditOperativeReviews,
  },
  {
    id: 'agregacion',
    title: 'Agregación a programas',
    summary: 'Equipo de líderes de cada programa y sus delegaciones.',
    feature: 'Programas',
    live: true,
    access: managersEditOperativeReviews,
  },
  {
    id: 'periodos',
    title: 'Periodos',
    summary: 'Periodo académico activo, cierre y apertura del siguiente.',
    feature: 'Programas',
    live: true,
    access: (can) => (can.isAdmin ? 'edit' : 'none'),
  },
  {
    id: 'inscripciones',
    title: 'Inscripciones',
    summary: 'Inscritos por actividad y por turno.',
    feature: 'Participación',
    live: true,
    access: managersEditOperativeReviews,
  },
  {
    id: 'registros',
    title: 'Registros',
    summary: 'Entradas y salidas en actividades activas.',
    feature: 'Participación',
    live: false,
    module: 'Módulo 3',
    plans: {
      edit: ['Registrar entradas y salidas en actividades activas', 'Corregir registros con motivo'],
      review: ['Consultar la asistencia por actividad'],
    },
    access: (can) => (can.isAdmin || can.isProgramLeader || can.isOperationalLeader ? 'edit' : 'none'),
  },
  {
    id: 'compromisos',
    title: 'Compromisos',
    summary: 'Horas comprometidas por voluntario.',
    feature: 'Participación',
    live: false,
    module: 'Módulo 4',
    plans: { edit: ['Definir y ajustar compromisos de horas'], review: ['Consultar avance de compromisos'] },
    access: managersEditOperativeReviews,
  },
  {
    id: 'seguimientos',
    title: 'Seguimientos',
    summary: 'Acompañamiento de cada voluntario.',
    feature: 'Participación',
    live: false,
    module: 'Módulo 4',
    plans: { edit: ['Registrar observaciones y acuerdos'], review: ['Consultar el historial de acompañamiento'] },
    access: managersEditOperativeReviews,
  },
  {
    id: 'planificacion',
    title: 'Planificación',
    summary: 'Planes de trabajo por periodo académico.',
    feature: 'Gestión',
    live: false,
    module: 'Módulo 4',
    plans: { edit: ['Planificar periodos y metas por programa'], review: ['Consultar planes vigentes'] },
    access: managersEditOperativeReviews,
  },
  {
    id: 'reportes',
    title: 'Reportes e IA',
    summary: 'Reportes de participación y asistentes de IA.',
    feature: 'Gestión',
    live: false,
    module: 'Módulo 5',
    plans: { edit: ['Generar reportes por programa y periodo', 'Usar asistentes de IA para análisis'], review: [] },
    access: (can) => (can.isAdmin || can.isProgramLeader ? 'edit' : 'none'),
  },
  {
    id: 'financiero',
    title: 'Financiero',
    summary: 'Presupuestos y gastos por programa.',
    feature: 'Gestión',
    live: false,
    module: 'Módulo 6',
    plans: { edit: ['Registrar presupuestos y gastos'], review: ['Consultar el estado financiero de tus programas'] },
    access: (can) => (can.isAdmin ? 'edit' : can.isProgramLeader ? 'review' : 'none'),
  },
]

export type VisibleSection = SectionDefinition & { level: Access }

export function visibleSections(can: Capabilities): VisibleSection[] {
  return sections.map((s) => ({ ...s, level: s.access(can) })).filter((s) => s.level !== 'none')
}

/** Secciones visibles agrupadas por feature, en el orden de la consola. */
export function groupedSections(can: Capabilities): { feature: Feature; sections: VisibleSection[] }[] {
  const visible = visibleSections(can)
  return featureOrder
    .map((feature) => ({ feature, sections: visible.filter((s) => s.feature === feature) }))
    .filter((group) => group.sections.length > 0)
}
