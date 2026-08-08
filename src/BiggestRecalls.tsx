import { useState } from 'react'
import data from './data/recalls.json'

const year = data.series.at(-1)!.year

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
export default function BiggestRecalls() {
  const [open, setOpen] = useState<number | null>(null)
  const biggest = data.biggest
  if (!biggest?.length) return null

  return (
    <section className="border-t border-[var(--color-rule)] py-20">
      <h3 className="m-0 max-w-[26ch] font-[family-name:var(--font-display)] text-[clamp(1.7rem,3.6vw,2.6rem)] font-normal leading-[1.12] tracking-[-0.015em]">
        The biggest recalls of {year}.
      </h3>
      <p className="mt-5 mb-12 max-w-[56ch] text-[19px] leading-[1.6] text-[var(--color-ink-soft)]">
        The ten largest by units. Every photograph is the government's own, published with the
        notice and in the public domain, which is why this page has pictures at all. Open a row
        for the full hazard description.
      </p>

      <ol className="m-0 list-none border-t border-[var(--color-rule)] p-0">
        {biggest.map((r, i) => {
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
                    <a
                      href={r.url}
                      className="rounded-full border border-[var(--color-rule)] px-4 py-2 text-[14px] whitespace-nowrap text-[var(--color-ink-soft)] transition-colors hover:border-[var(--color-ink-faint)] hover:text-[var(--color-ink)]"
                    >
                      Read the notice
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
                      Units parsed from: “{r.unitsRaw}”
                    </p>
                  </div>
                </div>
                </div>
              </div>
            </li>
          )
        })}
      </ol>

      <p className="m-0 mt-10 max-w-[64ch] text-[15px] leading-[1.6] text-[var(--color-ink-faint)]">
        Unit counts are US only. Several of these notices also cover Canada, and those figures are
        excluded so the number matches the rest of this page. Household scale uses{' '}
        {US_HOUSEHOLDS.toLocaleString()} US households from the 2024 American Community Survey.
      </p>
    </section>
  )
}
