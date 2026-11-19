import styles from './BrandBanner.module.css'

export function BrandBanner() {
  return (
    <div className={styles.banner}>
      <img
        src="/brand/logo-full.svg"
        alt="U-VoluntApp logo"
        className={styles.logo}
      />
      <img
        src="/brand/divider.svg"
        alt=""
        className={styles.divider}
        aria-hidden="true"
      />
      <h1 className={styles.title}>
        <span className={styles['title-white']}>U-Volunt</span>
        <span className={styles['title-accent']}>App</span>
      </h1>
    </div>
  )
}
