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
  /** Ruta de la pantalla actual, por ejemplo ["Espacio personal", "Actividades"]. */
  breadcrumb?: string[]
  /** Persona y rol de la cuenta, a la derecha de la barra superior. */
  account?: { name: string; role?: string }
  children: ReactNode
}

/** Estructura común: barra lateral fija, barra superior con la ruta (prototipo) y contenido a la derecha. */
export function AppShell({ area, groups, active, onSelect, switchAction, breadcrumb, account, children }: AppShellProps) {
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
        <p className={styles.area}>{area} · UCB</p>
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
      <div className={styles.column}>
        {(breadcrumb || account) && (
          <header className={styles.topbar}>
            {breadcrumb && (
              <nav aria-label="Ruta" className={styles.breadcrumb}>
                {breadcrumb.map((part, i) => (
                  <span key={`${part}-${i}`} aria-current={i === breadcrumb.length - 1 ? 'page' : undefined} className={i === breadcrumb.length - 1 ? styles.crumbLast : styles.crumb}>
                    {i > 0 && <span aria-hidden="true" className={styles.sep}> / </span>}
                    {part}
                  </span>
                ))}
              </nav>
            )}
            {account && (
              <span className={styles.account}>
                {account.name}
                {account.role && <strong className={styles.role}>{account.role}</strong>}
              </span>
            )}
          </header>
        )}
        <main className={styles.main}>{children}</main>
      </div>
    </div>
  )
}
