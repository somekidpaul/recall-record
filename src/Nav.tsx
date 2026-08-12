import { useEffect, useRef, useState } from 'react'
import Controls from './Controls'

/**
 * The masthead. Identical on all three pages, with no conditionals.
 *
 * ONE ROW, WHICH FORCES A MENU BUTTON ON PHONES. Measured at 375px the content
 * column is 327px, and the logo with the theme control beside it already takes
 * 262 of that. Three links are 373px of text before any gaps, and shortening
 * them to "Record / Method / Check" still needs 489px all in. Three text links
 * cannot share a row with a logo and a theme control at phone width under any
 * labelling, which is why the whole industry reaches for a menu here. Logo,
 * theme and a button come to 310 and fit.
 *
 * NO SEARCH FIELD. The third link says "Check a product" and that page IS the
 * search, so a box beside it said the same thing twice. It was also the direct
 * cause of both faults in the previous version: it forced a second row, and
 * hiding it on /check shifted that page's links out of line with the others.
 * With it gone the nav renders the same everywhere.
 */

const LINKS = [
  { href: '/', label: 'The record' },
  { href: '/method', label: 'How it was counted' },
  { href: '/check', label: 'Check a product' },
]

export default function Nav({ current }: { current: '/' | '/method' | '/check' }) {
  const [open, setOpen] = useState(false)
  const panelRef = useRef<HTMLDivElement>(null)
  const buttonRef = useRef<HTMLButtonElement>(null)

  /* Escape closes, and focus goes back to the control that opened it rather
     than to the top of the document. */
  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setOpen(false)
        buttonRef.current?.focus()
      }
    }
    const onClick = (e: MouseEvent) => {
      const t = e.target as Node
      if (!panelRef.current?.contains(t) && !buttonRef.current?.contains(t)) setOpen(false)
    }
    document.addEventListener('keydown', onKey)
    document.addEventListener('mousedown', onClick)
    return () => {
      document.removeEventListener('keydown', onKey)
      document.removeEventListener('mousedown', onClick)
    }
  }, [open])

  return (
    /*
      Sticky, so any page is one tap from any other.
      It needs its own opaque background: the page scrolls underneath, and
      without one the type would run through it. z-30 clears the chart tooltip,
      which sits at z-10.
    */
    <>
    {/*
      SKIP LINK. Visually hidden until focused, which is the whole point: it is
      the first thing a keyboard reaches and invisible to everyone else.

      Without it, every page begins with the wordmark, a three-way theme
      control and three nav links, so a keyboard or screen-reader user tabbed
      through six controls to reach the article, on every page, every time. The
      target carries tabIndex -1 so focus actually lands there rather than
      scrolling the page and leaving focus behind in the header, which is the
      usual way this gets implemented wrong.
    */}
    <a
      href="#content"
      className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-50 focus:rounded-full focus:bg-[var(--color-signal)] focus:px-5 focus:py-3 focus:text-[15px] focus:font-semibold focus:text-[var(--color-paper)]"
    >
      Skip to content
    </a>
    <header className="sticky top-0 z-30 border-b border-[var(--color-rule)] bg-[var(--color-paper)]">
      <div className="flex items-center justify-between gap-x-6 py-3.5 sm:py-4">
        <div className="flex items-center gap-3 sm:gap-4">
          {/* A SPAN ON THE HOME PAGE, NOT AN H1.

              This used to be an <h1> on `/` only, which put the site's name at
              the top of the outline and pushed the actual headline down to an
              <h2>. /check and /method meanwhile each had a real <h1> of their
              own, so the three routes disagreed about what a first-level
              heading is for: two used it for the page, one for the masthead.

              A masthead is a wordmark that happens to be set in type. The h1
              belongs to whatever the page is about, which on `/` is the
              sentence about Amazon. */}
          {current === '/' ? (
            <span className="m-0 font-[family-name:var(--font-display)] text-[19px] font-normal tracking-tight sm:text-[22px]">
              The Recall Record
            </span>
          ) : (
            <a
              href="/"
              className="m-0 font-[family-name:var(--font-display)] text-[19px] font-normal tracking-tight text-[var(--color-ink)] sm:text-[22px]"
            >
              The Recall Record
            </a>
          )}
          <Controls />
        </div>

        {/* Desktop: the links themselves, on the right. */}
        <nav aria-label="Sections" className="hidden items-center gap-x-6 md:flex">
          {LINKS.map((l) => (
            <NavLink key={l.href} {...l} current={current} />
          ))}
        </nav>

        {/* Phone: the same links behind a button, because they do not fit. */}
        <button
          ref={buttonRef}
          type="button"
          onClick={() => setOpen((v) => !v)}
          aria-expanded={open}
          aria-controls="nav-panel"
          aria-label={open ? 'Close menu' : 'Open menu'}
          className="flex size-10 shrink-0 items-center justify-center rounded-full border border-[var(--color-rule)] text-[var(--color-ink-soft)] transition-colors hover:border-[var(--color-ink-faint)] hover:text-[var(--color-ink)] md:hidden"
        >
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden>
            {open ? (
              <path d="M4 4l8 8M12 4l-8 8" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
            ) : (
              <path d="M2.5 5h11M2.5 11h11" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
            )}
          </svg>
        </button>
      </div>

      {/* Always rendered, height driven by CSS, so it animates closed as well
          as open. The same grid technique the disclosures use. */}
      <div
        ref={panelRef}
        id="nav-panel"
        className="disclosure md:hidden"
        data-open={open}
        aria-hidden={!open}
      >
        <div>
          <nav aria-label="Sections" className="flex flex-col gap-1 pb-4">
            {LINKS.map((l) => (
              <a
                key={l.href}
                href={l.href}
                aria-current={l.href === current ? 'page' : undefined}
                className={`rounded-lg px-3 py-3 font-[family-name:var(--font-mono)] text-[13px] uppercase tracking-[0.12em] transition-colors ${
                  l.href === current
                    ? 'bg-[var(--color-paper-sunk)] text-[var(--color-ink)]'
                    : 'text-[var(--color-ink-faint)] hover:bg-[var(--color-paper-sunk)] hover:text-[var(--color-ink)]'
                }`}
              >
                {l.label}
              </a>
            ))}
          </nav>
        </div>
      </div>
    </header>
    {/* The skip target, immediately after the masthead so it lands at the top
        of the page's own content on all three routes. */}
    <div id="content" tabIndex={-1} />
    </>
  )
}

function NavLink({ href, label, current }: { href: string; label: string; current: string }) {
  const here = href === current
  return (
    <a
      href={href}
      aria-current={here ? 'page' : undefined}
      className={`relative whitespace-nowrap font-[family-name:var(--font-mono)] text-[13px] uppercase tracking-[0.12em] transition-colors ${
        here ? 'text-[var(--color-ink)]' : 'text-[var(--color-ink-faint)] hover:text-[var(--color-ink)]'
      }`}
    >
      {label}
      {/* A real element rather than a text-decoration. That started out because
          only an element can carry a view-transition-name, and the bar used to
          slide between pages; the slide is gone but the element stays, since it
          also gives exact control over thickness and offset that
          `underline-offset` does not. */}
      {here && <span className="nav-indicator" aria-hidden />}
    </a>
  )
}
