/**
 * Design tokens — Uvoluntapp
 *
 * Brand source: Figma CJhE8ZHBPPTeTzyJNgBQLV, coord/brand/tokens.md.
 * All visual constants live here. Components in src/ui/ consume these tokens
 * via CSS custom properties injected by tokens.css.
 * Nothing outside src/ui/ should define its own colours or spacing.
 *
 * Typography: "Alan Sans" is not freely licensed for web embedding.
 * Using Inter (OFL) as fallback. See report for details.
 */

/* ── Brand colors ─────────────────────────────────────── */

export const brand = {
  bg: '#1e1e1e',
  accent: '#ffc100',
  text: '#ffffff',
} as const

/* ── Extended palette ─────────────────────────────────── */

export const colors = {
  bg: '#1e1e1e',
  bgRaised: '#2a2a2a',
  bgSurface: '#333333',
  accent: '#ffc100',
  text: '#ffffff',
  textMuted: '#a0a0a0',
  textOnAccent: '#1e1e1e',

  success: '#22c55e',
  successMuted: '#15803d',
  warning: '#f59e0b',
  warningMuted: '#b45309',
  error: '#ef4444',
  errorMuted: '#b91c1c',
  errorBg: 'rgba(239, 68, 68, 0.1)',

  focusRing: 'rgba(255, 193, 0, 0.5)',
} as const

/* ── Spacing (4-px grid) ────────────────────────────── */

export const spacing = {
  0: '0',
  1: '0.25rem',
  2: '0.5rem',
  3: '0.75rem',
  4: '1rem',
  5: '1.25rem',
  6: '1.5rem',
  8: '2rem',
  10: '2.5rem',
  12: '3rem',
  16: '4rem',
} as const

/* ── Typography ─────────────────────────────────────── */

export const fontFamily = {
  sans: "'Inter', system-ui, -apple-system, sans-serif",
  mono: "'JetBrains Mono', ui-monospace, monospace",
} as const

export const fontSize = {
  xs: '0.75rem',
  sm: '0.875rem',
  base: '1rem',
  lg: '1.125rem',
  xl: '1.25rem',
  '2xl': '1.5rem',
  '3xl': '1.875rem',
} as const

export const fontWeight = {
  normal: '400',
  medium: '500',
  semibold: '600',
  bold: '700',
} as const

export const lineHeight = {
  tight: '1.25',
  normal: '1.5',
  relaxed: '1.75',
} as const

/* ── Radii ──────────────────────────────────────────── */

export const radii = {
  sm: '0.25rem',
  md: '0.375rem',
  lg: '0.5rem',
  xl: '0.75rem',
  full: '9999px',
} as const

/* ── Shadows ────────────────────────────────────────── */

export const shadows = {
  sm: '0 1px 2px 0 rgb(0 0 0 / 0.25)',
  md: '0 4px 6px -1px rgb(0 0 0 / 0.3), 0 2px 4px -2px rgb(0 0 0 / 0.2)',
} as const
