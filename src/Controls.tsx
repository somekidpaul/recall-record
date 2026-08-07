import { useMotion, useTheme } from './usePrefs'

const THEMES = [
  { key: 'light', label: 'Light' },
  { key: 'system', label: 'System' },
  { key: 'dark', label: 'Dark' },
] as const

export default function Controls() {
  const { theme, setTheme } = useTheme()
  const { motion, setMotion, systemPrefersReduced } = useMotion()

  return (
    <div className="no-print flex items-center gap-3">
      {/*
        The pill is one element that slides, not three that light up. It is the
        same object moving, which is what makes the control read as a physical
        switch rather than three separate buttons. Snappy on purpose: 170ms with
        a small overshoot. Under reduce-motion it jumps, no transition at all.
      */}
      <div
        role="group"
        aria-label="Colour theme"
        className="relative grid grid-cols-3 rounded-full border border-[var(--color-rule)] p-0.5"
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
              className={`relative z-10 flex items-center justify-center rounded-full px-2.5 py-1 text-[12px] transition-colors duration-150 ${
                on ? 'text-[var(--color-paper)]' : 'text-[var(--color-ink-faint)] hover:text-[var(--color-ink)]'
              }`}
            >
              <Glyph kind={t.key} />
              <span className="sr-only">{t.label}</span>
            </button>
          )
        })}
      </div>

      <button
        type="button"
        onClick={() => setMotion(motion === 'full' ? 'reduced' : 'full')}
        aria-pressed={motion === 'full'}
        title={
          motion === 'full'
            ? 'Animation on. Click to reduce motion.'
            : systemPrefersReduced
              ? 'Reduced motion, matching your system setting. Click to enable animation anyway.'
              : 'Reduced motion. Click to enable animation.'
        }
        className={`flex items-center gap-2 rounded-full border px-3 py-1.5 text-[12px] transition-colors ${
          motion === 'full'
            ? 'border-[var(--color-ink)] text-[var(--color-ink)]'
            : 'border-[var(--color-rule)] text-[var(--color-ink-faint)] hover:text-[var(--color-ink)]'
        }`}
      >
        <svg width="13" height="13" viewBox="0 0 16 16" fill="none" aria-hidden>
          <path
            d="M1.5 11.5C4 11.5 4 4.5 8 4.5s4 7 6.5 7"
            stroke="currentColor"
            strokeWidth="1.6"
            strokeLinecap="round"
            strokeDasharray={motion === 'full' ? undefined : '2.5 2.5'}
          />
        </svg>
        <span className="font-[family-name:var(--font-mono)] uppercase tracking-[0.1em]">
          {motion === 'full' ? 'Motion' : 'Still'}
        </span>
      </button>
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
