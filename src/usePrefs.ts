import { useCallback, useSyncExternalStore } from 'react'

/**
 * Theme and motion preferences.
 *
 * Both live as data attributes on <html>, stamped by the inline script in
 * index.html before first paint. This hook reads and writes that same
 * attribute rather than keeping a parallel copy in React state, so there is
 * exactly one source of truth and no chance of the two disagreeing.
 */

type Theme = 'light' | 'dark' | 'system'
type Motion = 'full' | 'reduced'

const root = () => document.documentElement

const listeners = new Set<() => void>()
const emit = () => listeners.forEach((l) => l())
const subscribe = (l: () => void) => {
  listeners.add(l)
  return () => listeners.delete(l)
}

const readTheme = (): Theme => (root().getAttribute('data-theme') as Theme) ?? 'system'
const readMotion = (): Motion => (root().getAttribute('data-motion') as Motion) ?? 'reduced'

export function useTheme() {
  const theme = useSyncExternalStore(subscribe, readTheme, () => 'system' as Theme)

  const setTheme = useCallback((next: Theme) => {
    if (next === 'system') {
      root().removeAttribute('data-theme')
      localStorage.removeItem('rr-theme')
    } else {
      root().setAttribute('data-theme', next)
      localStorage.setItem('rr-theme', next)
    }
    emit()
  }, [])

  /** What the user is actually looking at right now, system preference included. */
  const resolved: Exclude<Theme, 'system'> =
    theme === 'system'
      ? window.matchMedia('(prefers-color-scheme: dark)').matches
        ? 'dark'
        : 'light'
      : theme

  return { theme, resolved, setTheme }
}

/**
 * Live media query, for the cases CSS genuinely cannot reach.
 *
 * The chart needs this because `viewBox` is an SVG attribute, not a style, so
 * no media query can change it. Everything inside the chart is expressed in
 * viewBox units, which means the whole coordinate system has to change to give
 * a phone a readable layout. That is a render decision, so it belongs here.
 *
 * Anything that CAN be done in CSS still is.
 */
export function useMediaQuery(query: string) {
  return useSyncExternalStore(
    useCallback(
      (notify: () => void) => {
        const m = window.matchMedia(query)
        m.addEventListener('change', notify)
        return () => m.removeEventListener('change', notify)
      },
      [query],
    ),
    () => window.matchMedia(query).matches,
    () => false,
  )
}

export function useMotion() {
  const motion = useSyncExternalStore(subscribe, readMotion, () => 'reduced' as Motion)

  const setMotion = useCallback((next: Motion) => {
    root().setAttribute('data-motion', next)
    localStorage.setItem('rr-motion', next)
    emit()
  }, [])

  /** True when the OS asked for less motion, so the UI can say so honestly. */
  const systemPrefersReduced =
    typeof window !== 'undefined' &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches

  return { motion, setMotion, systemPrefersReduced }
}
