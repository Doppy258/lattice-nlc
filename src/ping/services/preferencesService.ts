/**
 * preferencesService — small UI preferences persisted locally and applied to
 * the document root. Currently just a manual reduced-motion override (on top of
 * the OS `prefers-reduced-motion` media query handled in globals.css).
 */

const KEY = 'ping.prefs.v1'

export type Preferences = {
  reducedMotion: boolean
}

const DEFAULTS: Preferences = { reducedMotion: false }

export function loadPreferences(): Preferences {
  if (typeof window === 'undefined') return DEFAULTS
  try {
    const raw = window.localStorage.getItem(KEY)
    if (raw) return { ...DEFAULTS, ...(JSON.parse(raw) as Partial<Preferences>) }
  } catch {
    /* ignore */
  }
  return DEFAULTS
}

function apply(prefs: Preferences): void {
  if (typeof document === 'undefined') return
  document.documentElement.classList.toggle('reduce-motion', prefs.reducedMotion)
}

/** Read stored prefs and apply them — call once at app startup. */
export function applyPreferences(): void {
  apply(loadPreferences())
}

export function setReducedMotion(value: boolean): void {
  const next: Preferences = { ...loadPreferences(), reducedMotion: value }
  try {
    window.localStorage.setItem(KEY, JSON.stringify(next))
  } catch {
    /* ignore */
  }
  apply(next)
}
