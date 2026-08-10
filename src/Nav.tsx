import { useState } from 'react'
import Controls from './Controls'

/**
 * The masthead, shared by all three pages.
 *
 * WHY THE SEARCH NAVIGATES RATHER THAN FILTERING IN PLACE. Two measured facts
 * decide it. The header is `position: static`, so it scrolls away: a field that
 * typed into results further down the page would be gone by the time those
 * results arrived. And there are three pages now, only one of which has
 * anywhere to put results, so an in-place search would behave differently
 * depending on where you happened to be standing. A search in a global nav has
 * to work the same everywhere, which means it goes somewhere.
 *
 * So it submits to /check, which is what that page is for, and the query lives
 * in the URL where it can be shared and where the back button understands it.
 *
 * The input itself only appears from md up. Below that the masthead has room
 * for a logo, a theme control and one icon, and no more: measured at 375px it
 * is 327px wide and the title with the theme pill already takes 262 of it.
 */

const LINKS = [
  { href: '/', label: 'The record' },
  { href: '/method', label: 'How it was counted' },
  { href: '/check', label: 'Check a product' },
]

export default function Nav({ current }: { current: '/' | '/method' | '/check' }) {
  const [q, setQ] = useState('')

  return (
    <header className="border-b border-[var(--color-rule)] py-4 sm:py-5">
      <div className="flex flex-wrap items-center justify-between gap-x-6 gap-y-3">
        {current === '/' ? (
          <h1 className="m-0 font-[family-name:var(--font-display)] text-[19px] font-normal tracking-tight sm:text-[22px]">
            The Recall Record
          </h1>
        ) : (
          <a
            href="/"
            className="m-0 font-[family-name:var(--font-display)] text-[19px] font-normal tracking-tight text-[var(--color-ink)] sm:text-[22px]"
          >
            The Recall Record
          </a>
        )}

        <div className="flex items-center gap-3">
          {current !== '/check' && (
            <form
              action="/check"
              method="get"
              className="hidden md:block"
              onSubmit={(e) => {
                if (!q.trim()) e.preventDefault()
              }}
            >
              <label htmlFor="nav-q" className="sr-only">
                Search every recall
              </label>
              <div className="flex items-center gap-2 rounded-full border border-[var(--color-rule)] bg-[var(--color-paper-sunk)] px-3.5 py-1.5 transition-colors focus-within:border-[var(--color-ink-faint)]">
                {/* A real submit button, not decoration. A form with no submit
                    button relies on implicit submission, which the spec only
                    guarantees for a single blocking field and which nothing
                    else here would catch if it broke. It also gives the mouse
                    something to press. */}
                <button
                  type="submit"
                  aria-label="Search"
                  className="-my-1 -ml-1 flex shrink-0 items-center rounded-full p-1 text-[var(--color-ink-faint)] transition-colors hover:text-[var(--color-ink)]"
                >
                  <svg width="15" height="15" viewBox="0 0 20 20" fill="none" aria-hidden>
                    <circle cx="9" cy="9" r="6" stroke="currentColor" strokeWidth="1.9" />
                    <path d="M13.5 13.5L17 17" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" />
                  </svg>
                </button>
                <input
                  id="nav-q"
                  name="q"
                  type="search"
                  value={q}
                  onChange={(e) => setQ(e.target.value)}
                  placeholder="Search every recall"
                  autoComplete="off"
                  className="w-[168px] bg-transparent text-[14px] text-[var(--color-ink)] outline-none placeholder:text-[var(--color-ink-faint)]"
                />
              </div>
            </form>
          )}

          {/* Below md the field does not fit, so the icon carries it. Same
              destination either way. */}
          {current !== '/check' && (
            <a
              href="/check"
              aria-label="Search every recall"
              className="flex size-9 items-center justify-center rounded-full border border-[var(--color-rule)] text-[var(--color-ink-soft)] transition-colors hover:border-[var(--color-ink-faint)] hover:text-[var(--color-ink)] md:hidden"
            >
              <svg width="15" height="15" viewBox="0 0 20 20" fill="none" aria-hidden>
                <circle cx="9" cy="9" r="6" stroke="currentColor" strokeWidth="1.9" />
                <path d="M13.5 13.5L17 17" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" />
              </svg>
            </a>
          )}

          <Controls />
        </div>

        {/* Its own row below md, inline above it. basis-full is what forces the
            break, so the wrap is a decision rather than an accident of widths. */}
        <nav
          aria-label="Sections"
          className="order-last flex basis-full flex-wrap items-center gap-x-5 gap-y-2 md:order-none md:basis-auto"
        >
          {LINKS.map((l) => {
            const here = l.href === current
            return (
              <a
                key={l.href}
                href={l.href}
                aria-current={here ? 'page' : undefined}
                className={`font-[family-name:var(--font-mono)] text-[12px] uppercase tracking-[0.12em] transition-colors sm:text-[13px] ${
                  here
                    ? 'text-[var(--color-ink)] underline decoration-[var(--color-signal)] decoration-2 underline-offset-[6px]'
                    : 'text-[var(--color-ink-faint)] hover:text-[var(--color-ink)]'
                }`}
              >
                {l.label}
              </a>
            )
          })}
        </nav>
      </div>
    </header>
  )
}
