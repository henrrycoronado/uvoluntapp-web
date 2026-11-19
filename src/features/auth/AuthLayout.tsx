import type { ReactNode } from 'react'
import { BrandBanner } from '../../shared/ui'
import styles from './auth.module.css'

interface AuthLayoutProps {
  title: string
  description?: string
  children: ReactNode
}

export function AuthLayout({ title, description, children }: AuthLayoutProps) {
  return (
    <main className={styles.page}>
      <section className={styles.brand} aria-label="Uvoluntapp">
        <BrandBanner />
        <p className={styles.tagline}>Voluntariado de la Pastoral Universitaria UCB</p>
      </section>
      <section className={styles.panel}>
        <div className={styles.card}>
          <h2 className={styles.title}>{title}</h2>
          {description && <p className={styles.description}>{description}</p>}
          {children}
        </div>
      </section>
    </main>
  )
}
