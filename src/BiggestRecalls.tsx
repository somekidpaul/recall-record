import { useRef, useState } from 'react'
import data from './data/recalls.json'

const year = data.series.at(-1)!.year

/** Arrow leaving a box. The conventional mark for "this leaves the site". */
function ExternalIcon() {
  return (
    <svg width="12" height="12" viewBox="0 0 14 14" fill="none" aria-hidden className="shrink-0 opacity-70">
      <path
        d="M5.5 2.5H2.5v9h9v-3M8.5 2.5h3v3M11.5 2.5L6 8"
        stroke="currentColor"
        strokeWidth="1.4"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

/** US households, 2024 American Community Survey. Used only for scale, and cited. */
const US_HOUSEHOLDS = 132_216_000

/**
 * The largest recalls of the year, by units, as a ranked list.
 *
 * This was a card grid first and the grid was wrong. Hazard text in the source
 * runs from 139 to 506 characters, so every card was a different height and the
 * section read as ragged rather than designed. A list fixes that structurally:
 * each row is one line of description regardless of how much text exists behind
 * it, and the rest is available on demand.
 *
 * Two honest constraints stay visible. The unit count is prose in the source
 * ("About 1,719,995"), so the parsed figure sits beside the string it came from
 * in the expanded view. And several notices also cover Canada, excluded here so
 * the number matches the rest of the page.
 */
/** Shown at rest. The rest are one click away rather than a scroll away. */
const INITIAL = 5

export default function BiggestRecalls() {
  const [open, setOpen] = useState<number | null>(null)
  const [showAll, setShowAll] = useState(false)
  const btnRef = useRef<HTMLButtonElement>(null)
  const biggest = data.biggest
  if (!biggest?.length) return null

  /**
   * Collapsing removes five rows from the flow, so the button the reader just
   * pressed slides up the page and the methodology section rises under the
   * cursor. Measured: the button travelled 1062px.
   *
   * PINNED ACROSS THE WHOLE ANIMATION, not corrected after it. The first
   * attempt measured the button on the next frame and scrolled by the
   * difference, which did nothing, because the rows collapse through a 380ms
   * grid-template-rows transition. Two frames in, nothing has moved yet, so the
   * correction was always zero and the page slid anyway. Verified on the live
   * site before rewriting it.
   *
   * So the loop runs for the length of the transition and re-pins every frame.
   * The button holds its exact viewport position and the list closes upward
   * into it, which is the thing the reader actually asked for by pressing it.
   *
   * Only on collapse. Expanding inserts rows above the button and pushes it
   * down, but the reader is looking at the newly revealed rows, which is where
   * they should be.
   */
  const toggleAll = () => {
    if (!showAll) {
      setShowAll(true)
      return
    }
    const anchor = btnRef.current?.getBoundingClientRect().top ?? 0
    setShowAll(false)

    /* Comfortably past --dur-base (380ms), so the last frame of the collapse is
       still pinned. */
    const until = performance.now() + 460
    const pin = () => {
      const el = btnRef.current
      if (!el) return
      const drift = el.getBoundingClientRect().top - anchor
      if (drift !== 0) window.scrollBy({ top: drift, behavior: 'instant' as ScrollBehavior })
      if (performance.now() < until) requestAnimationFrame(pin)
    }
    requestAnimationFrame(pin)
  }

  const head = biggest.slice(0, INITIAL)
  const tail = biggest.slice(INITIAL)

  /* One row, shared by the first five and the revealed rest, so the two halves
     of the list cannot drift apart. */
  const renderRow = (r: (typeof biggest)[number], i: number) => {
    const isOpen = open === i
    const panelId = `recall-panel-${i}`
    return (
            <li key={r.url || r.title} className="border-b border-[var(--color-rule)]">
              <div className="grid grid-cols-[2.5rem_1fr] items-center gap-x-4 py-5 sm:grid-cols-[3rem_1fr_auto] sm:gap-x-6">
                <span className="self-start font-[family-name:var(--font-display)] text-[26px] leading-none text-[var(--color-ink-faint)] tabular-nums sm:text-[30px]">
                  {String(i + 1).padStart(2, '0')}
                </span>

                <div className="min-w-0">
                  <p className="m-0 font-[family-name:var(--font-mono)] text-[12px] uppercase tracking-[0.12em] text-[var(--color-ink-faint)] tabular-nums">
                    {r.date}
                    <span className="mx-2 opacity-50">/</span>
                    <span className="text-[var(--color-signal)]">
                      {r.units.toLocaleString()} units
                    </span>
                  </p>
                  <p className="m-0 mt-1.5 truncate text-[18px] leading-snug text-[var(--color-ink)]">
                    {r.product}
                  </p>
                  {/* Clamped to one line. This is the whole reason the section is
                      a list: every row is the same height no matter how much
                      hazard text the source happens to carry. */}
                  <p className="m-0 mt-1 line-clamp-1 text-[15px] leading-snug text-[var(--color-ink-faint)]">
                    {r.hazard}
                  </p>
                </div>

                <div className="col-start-2 mt-3 flex flex-wrap gap-2 sm:col-auto sm:mt-0 sm:justify-self-end">
                  <button
                    type="button"
                    onClick={() => setOpen(isOpen ? null : i)}
                    aria-expanded={isOpen}
                    aria-controls={panelId}
                    className="rounded-full border border-[var(--color-rule)] px-4 py-2 text-[14px] whitespace-nowrap text-[var(--color-ink-soft)] transition-colors hover:border-[var(--color-ink-faint)] hover:text-[var(--color-ink)]"
                  >
                    {isOpen ? 'Hide product' : 'View product'}
                  </button>
                  {r.url && (
                    /* Opens in a new tab, and says so.
                       Best practice is normally to leave the choice to the
                       reader, because forcing a tab takes away the back button.
                       The exception is exactly this case: leaving mid-task, from
                       a page the reader is partway through, to a third-party
                       site. Losing an expanded row and their scroll position to
                       read one notice is the worse trade. The rule when you do
                       force it is that you must signal it, hence the icon, and
                       the accessible name spells it out. rel="noreferrer" is
                       required alongside target="_blank" so the opened page
                       cannot reach back through window.opener. */
                    <a
                      href={r.url}
                      target="_blank"
                      rel="noreferrer"
                      aria-label={`Read the CPSC notice for ${r.product}, opens in a new tab`}
                      className="flex items-center gap-2 rounded-full border border-[var(--color-rule)] px-4 py-2 text-[14px] whitespace-nowrap text-[var(--color-ink-soft)] transition-colors hover:border-[var(--color-ink-faint)] hover:text-[var(--color-ink)]"
                    >
                      Read the notice
                      <ExternalIcon />
                    </a>
                  )}
                </div>
              </div>

              {/* Always rendered, height driven by CSS. Rendering it
                  conditionally made opening animate and closing snap, because
                  an unmounted element cannot transition. */}
              <div className="disclosure" data-open={isOpen} id={panelId} aria-hidden={!isOpen}>
                <div>
                <div className="grid gap-x-10 gap-y-6 pb-8 sm:grid-cols-[minmax(0,18rem)_1fr] sm:pl-[4.5rem]">
                  {/* Capped at 260px. Measured across all ten: heights run 150
                      to 892px and ratios 0.63 to 2.52, so uncapped the tall
                      skinny bottle at #2 towered over everything else. At 260
                      every landscape image fills the column and lands under the
                      cap, and the outlier stops dominating. */}
                  <img
                    src={r.image}
                    alt={r.imageCaption || r.product}
                    className="max-h-[260px] w-full rounded-xl border border-[var(--color-rule)] bg-[var(--color-paper-sunk)] object-contain p-4"
                  />
                  <div>
                    <p className="m-0 text-[17px] leading-[1.65] text-[var(--color-ink-soft)]">
                      {r.hazard}
                    </p>
                    <p className="m-0 mt-4 text-[16px] leading-[1.6] text-[var(--color-ink-soft)]">
                      Enough for one in every{' '}
                      <strong className="font-semibold text-[var(--color-ink)] tabular-nums">
                        {Math.round(US_HOUSEHOLDS / r.units).toLocaleString()}
                      </strong>{' '}
                      American households.
                    </p>
                    {r.retailerText && (
                      <p className="m-0 mt-4 text-[15px] leading-[1.6] text-[var(--color-ink-faint)]">
                        {r.retailerText}
                      </p>
                    )}
                    <p className="m-0 mt-4 border-t border-[var(--color-rule)] pt-3 font-[family-name:var(--font-mono)] text-[12px] leading-snug text-[var(--color-ink-faint)]">
                      Count read from: “{r.unitsRaw}”
                    </p>
                  </div>
                </div>
                </div>
              </div>
            </li>
    )
  }

  return (
    <section className="border-t border-[var(--color-rule)] py-20">
      <h3 className="m-0 max-w-[26ch] font-[family-name:var(--font-display)] text-[clamp(1.7rem,3.6vw,2.6rem)] font-normal leading-[1.12] tracking-[-0.015em]">
        The biggest recalls of {year}.
      </h3>
      <p className="mt-5 mb-12 max-w-[56ch] text-[19px] leading-[1.6] text-[var(--color-ink-soft)]">
        The {biggest.length} biggest by number of items pulled. Every photo is the government's
        own, published with the notice and free for anyone to use, which is why this page has
        pictures at all. Open a row to read what went wrong.
      </p>

      <ol className="m-0 list-none border-t border-[var(--color-rule)] p-0">
        {head.map(renderRow)}
      </ol>
      {/* The remaining rows live in the same disclosure component the panels
          use, so revealing them reads as one motion language with everything
          else on the page rather than a separate trick. */}
      <div className="disclosure" data-open={showAll} aria-hidden={!showAll}>
        <div>
          <ol start={INITIAL + 1} className="m-0 list-none p-0">
            {tail.map((r, i) => renderRow(r, i + INITIAL))}
          </ol>
        </div>
      </div>

      {tail.length > 0 && (
        <button
          type="button"
          ref={btnRef}
          onClick={toggleAll}
          aria-expanded={showAll}
          className="no-print mt-8 flex items-center gap-2.5 rounded-full border border-[var(--color-rule)] px-5 py-2.5 text-[15px] text-[var(--color-ink-soft)] transition-colors hover:border-[var(--color-ink-faint)] hover:text-[var(--color-ink)]"
        >
          {showAll ? 'Show fewer' : `Show all ${biggest.length}`}
          <svg width="13" height="13" viewBox="0 0 14 14" fill="none" className="chev" data-open={showAll} aria-hidden>
            <path d="M2.5 5L7 9.5L11.5 5" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>
      )}

      <p className="m-0 mt-10 max-w-[64ch] text-[15px] leading-[1.6] text-[var(--color-ink-faint)]">
        Counts are US only. A few of these recalls also cover Canada, and those numbers are left
        out so they line up with the rest of this page. The household comparison uses{' '}
        {US_HOUSEHOLDS.toLocaleString()} US households from the 2024 American Community Survey.
      </p>
    </section>
  )
}
