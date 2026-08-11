import RecallSearch from './RecallSearch'
import type { RowView } from './RecallRow'
import data from './data/recalls.json'

const year = data.series.at(-1)!.year

/**
 * The biggest recalls of the year, and the way into every other one.
 *
 * This was a fixed top ten with a "show all" toggle, and the lookup lived on a
 * separate page with its own plainer rows. Two lists of the same object, drawn
 * two different ways, and the one you reached by searching for your own product
 * was the poorer of the two.
 *
 * So the list and the search are one thing now. At rest it is the ranked ten.
 * Type, and the same rows become results. Nothing is fetched until the field is
 * touched, so a reader who only wants the essay pays nothing for a tool they
 * never opened.
 */
export default function BiggestRecalls() {
  const biggest = data.biggest
  if (!biggest?.length) return null

  const rows: RowView[] = biggest.map((r, i) => ({
    key: r.url || r.title || String(i),
    rank: i + 1,
    date: r.date,
    product: r.product,
    hazard: r.hazard,
    url: r.url || undefined,
    image: r.image || undefined,
    units: r.units,
    unitsRaw: r.unitsRaw || undefined,
    retailerText: r.retailerText || undefined,
  }))

  return (
    <section className="border-t border-[var(--color-rule)] py-20">
      <h3 className="m-0 max-w-[26ch] font-[family-name:var(--font-display)] text-[clamp(1.7rem,3.6vw,2.6rem)] font-normal leading-[1.22] tracking-[-0.015em] sm:leading-[1.14]">
        The biggest recalls of {year}.
      </h3>
      <p className="mt-5 mb-10 max-w-[62ch] text-[19px] leading-[1.6] text-[var(--color-ink-soft)]">
        The {biggest.length} biggest by number of items pulled. Every photo is the government's
        own, published with the notice and free for anyone to use. Open a row to read what went
        wrong.
      </p>

      <a
        href="/check"
        className="mb-10 inline-flex items-center gap-2.5 rounded-full border border-[var(--color-rule)] px-5 py-3 text-[16px] text-[var(--color-ink-soft)] transition-colors hover:border-[var(--color-ink-faint)] hover:text-[var(--color-ink)]"
      >
        Search all {data.corpusTotal.toLocaleString()} recalls, back to 1973
        <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden className="shrink-0">
          <path d="M3 7h8M7.5 3.5L11 7l-3.5 3.5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </a>

      <RecallSearch defaultList={rows} showField={false} />

      <p className="m-0 mt-12 max-w-[72ch] text-[15px] leading-[1.6] text-[var(--color-ink-faint)]">
        Counts are US only. A few of these recalls also cover Canada, and those numbers are left
        out so they line up with the rest of this page. The household comparison uses{' '}
        {(132216000).toLocaleString()} US households from the 2024 American Community Survey.
      </p>
    </section>
  )
}
