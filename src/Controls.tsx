import { useTheme } from './usePrefs'

const THEMES = [
  { key: 'light', label: 'Light' },
  { key: 'system', label: 'System' },
  { key: 'dark', label: 'Dark' },
] as const

export default function Controls() {
  const { theme, setTheme } = useTheme()

  /* Sized to sit level with the rest of the masthead. It was 27px tall next to
     a 40px menu button, which read as an afterthought rather than a control. */
  return (
    <div className="no-print flex items-center gap-3">
      {/*
        The pill is one element that slides, not three that light up. It is the
        same object moving, which is what makes the control read as a physical
        switch rather than three separate buttons.
      */}
      <div
        role="group"
        aria-label="Colour theme"
        className="relative grid grid-cols-3 rounded-full border border-[var(--color-rule)] p-[3px]"
      >
        <span
          aria-hidden
          className="pill absolute inset-y-0.5 left-0.5 rounded-full bg-[var(--color-ink)]"
          style={{
            width: `calc((100% - 0.25rem) / 3)`,
            transform: `translateX(${THEMES.findIndex((t) => t.key === theme) * 100}%)`,
          }}
        />
        {THEMES.map((t) => {
          const on = theme === t.key
          return (
            <button
              key={t.key}
              type="button"
              onClick={() => setTheme(t.key)}
              aria-pressed={on}
              title={`${t.label} theme`}
              className={`relative z-10 flex items-center justify-center rounded-full px-3 py-1.5 text-[12px] transition-colors duration-150 ${
                on ? 'text-[var(--color-paper)]' : 'text-[var(--color-ink-faint)] hover:text-[var(--color-ink)]'
              }`}
            >
              <Glyph kind={t.key} />
              <span className="sr-only">{t.label}</span>
            </button>
          )
        })}
      </div>
    </div>
  )
}

function Glyph({ kind }: { kind: 'light' | 'system' | 'dark' }) {
  const common = { width: 13, height: 13, viewBox: '0 0 16 16', 'aria-hidden': true } as const
  if (kind === 'light') {
    return (
      <svg {...common} fill="none" stroke="currentColor" strokeWidth="1.5">
        <circle cx="8" cy="8" r="3" />
        <path d="M8 1v1.5M8 13.5V15M15 8h-1.5M2.5 8H1M12.9 3.1l-1 1M4.1 11.9l-1 1M12.9 12.9l-1-1M4.1 4.1l-1-1" strokeLinecap="round" />
      </svg>
    )
  }
  if (kind === 'dark') {
    return (
      <svg {...common} fill="none" stroke="currentColor" strokeWidth="1.5">
        <path d="M13.5 9.5A6 6 0 016.5 2.5a6 6 0 107 7z" strokeLinejoin="round" />
      </svg>
    )
  }
  return (
    <svg {...common} fill="none" stroke="currentColor" strokeWidth="1.5">
      <circle cx="8" cy="8" r="6" />
      <path d="M8 2a6 6 0 000 12z" fill="currentColor" stroke="none" />
    </svg>
  )
}
