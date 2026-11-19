import type { ReactNode } from 'react'
import styles from './AppShell.module.css'

export interface ShellNavItem {
  id: string
  label: string
}

export interface ShellNavGroup {
  label?: string
  items: ShellNavItem[]
}

interface AppShellProps {
  /** Nombre del espacio: "Mi espacio" o "Consola". */
  area: string
  groups: ShellNavGroup[]
  active: string
  onSelect: (id: string) => void
  /** Botón que cambia de espacio (a la consola o de vuelta). */
  switchAction?: { label: string; onClick: () => void }
  children: ReactNode
}

/** Estructura común: barra lateral fija con su propio desplazamiento y contenido a la derecha. Sin barra superior. */
export function AppShell({ area, groups, active, onSelect, switchAction, children }: AppShellProps) {
  const item = (nav: ShellNavItem) => (
    <button
      key={nav.id}
      type="button"
      className={nav.id === active ? styles.itemActive : styles.item}
      aria-current={nav.id === active ? 'page' : undefined}
      onClick={() => onSelect(nav.id)}
    >
      {nav.label}
    </button>
  )

  return (
    <div className={styles.shell}>
      <aside className={styles.sidebar}>
        <div className={styles.brand}>
          <img src="/brand/logo-small.svg" alt="" width={22} height={26} />
          <span>
            U-Volunt<span className={styles.accent}>App</span>
          </span>
        </div>
        <p className={styles.area}>{area}</p>
        <nav className={styles.nav} aria-label={`Secciones de ${area.toLowerCase()}`}>
          {groups.map((group, index) => (
            <div key={group.label ?? index} className={styles.group}>
              {group.label && <p className={styles.groupLabel}>{group.label}</p>}
              {group.items.map(item)}
            </div>
          ))}
        </nav>
        <div className={styles.footer}>
          {item({ id: 'perfil', label: 'Perfil' })}
          {switchAction && (
            <button type="button" className={styles.switch} onClick={switchAction.onClick}>
              {switchAction.label}
            </button>
          )}
        </div>
      </aside>
      <main className={styles.main}>{children}</main>
    </div>
  )
}
