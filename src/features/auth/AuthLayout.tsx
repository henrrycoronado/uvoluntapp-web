import type { ReactNode } from 'react'
import { navigate } from '../../app/navigation'
import styles from './auth.module.css'

type PromoVariant = 'login' | 'register'

/** Textos del panel visual del prototipo (acceso y registro tienen mensajes distintos). */
const promos: Record<PromoVariant, { image: string; kicker: string; heading: string; text: string; foot: string }> = {
  login: {
    image: '/brand/auth-login.png',
    kicker: 'Somos Pastoral Universitaria',
    heading: 'Tu tiempo puede transformar vidas.',
    text: 'Descubre experiencias de servicio que conectan a las personas con su comunidad.',
    foot: 'Universidad Católica Boliviana · Santa Cruz',
  },
  register: {
    image: '/brand/auth-register.png',
    kicker: 'Voluntariado UCB',
    heading: 'Tu historia aquí puede comenzar.',
    text: 'Forma parte de proyectos, encuentros y acciones que crean un impacto real.',
    foot: 'Una comunidad que aprende y sirve',
  },
}

interface AuthLayoutProps {
  title: string
  description?: string
  /** Etiqueta pequeña sobre el título, por ejemplo "ACCESO A TU CUENTA". */
  eyebrow?: string
  variant?: PromoVariant
  children: ReactNode
}

/** Estructura de las pantallas de acceso (prototipo AUTH): cabecera, panel visual a la izquierda y formulario a la derecha. */
export function AuthLayout({ title, description, eyebrow, variant = 'login', children }: AuthLayoutProps) {
  const promo = promos[variant]
  return (
    <div className={styles.shell}>
      <header className={styles.top}>
        <a className={styles.wordmark} href="/" onClick={(e) => { e.preventDefault(); navigate('/') }} aria-label="U-VOLUNTAPP, inicio">
          <img src="/brand/logo-small.svg" alt="" width={36} height={43} />
          <span>U-VOLUNTAPP</span>
        </a>
        <button type="button" className={styles.back} onClick={() => navigate('/')}>
          <span aria-hidden="true">←</span> Volver a explorar actividades
        </button>
      </header>

      <main className={styles.page}>
        <section className={styles.brand} aria-label="Uvoluntapp">
          <img className={styles.photo} src={promo.image} alt="" />
          <div className={styles.message}>
            <span className={styles.accentBar} aria-hidden="true" />
            <p className={styles.kicker}>{promo.kicker}</p>
            <p className={styles.heading}>{promo.heading}</p>
            <p className={styles.promoText}>{promo.text}</p>
            <p className={styles.foot}>{promo.foot}</p>
          </div>
        </section>
        <section className={styles.panel}>
          <div className={styles.card}>
            {eyebrow && <p className={styles.eyebrow}>{eyebrow}</p>}
            <h1 className={styles.title}>{title}</h1>
            {description && <p className={styles.description}>{description}</p>}
            {children}
          </div>
        </section>
      </main>

      <footer className={styles.minFoot}>U-VOLUNTAPP · Pastoral Universitaria · UCB Santa Cruz</footer>
    </div>
  )
}
