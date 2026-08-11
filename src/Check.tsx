import { useEffect } from 'react'
import Nav from './Nav'
import RecallSearch from './RecallSearch'
import type { RowView } from './RecallRow'
import data from './data/recalls.json'

/**
 * /check, the lookup on its own.
 *
 * Same component the essay hosts inside its recall list, mounted here with no
 * default list and the field already focused. It exists as a separate route so
 * a result has a URL worth sending to someone, and so the tool can be linked to
 * without asking anyone to read an argument first.
 *
 * It refuses the question people actually arrive with. They want "is this
 * recalled, yes or no", and the federal record cannot support that: barcodes
 * are on a twentieth of notices, so there is no way to match the item in
 * someone's hands. What it can support is "here is what the record does and
 * does not say", and the zero-results state is built first because it is both
 * the most common answer and the only one that can get somebody hurt.
 */
export default function Check() {
  /* data.biggest is the year's largest by units and already carries photographs
     and unit counts, so the resting list costs nothing extra to render. Sorted
     by date here rather than by size, because "most recent" is what a person
     opening a lookup wants to see. */
  const recent: RowView[] = [...(data.biggest ?? [])]
    .sort((a, b) => b.date.localeCompare(a.date))
    .slice(0, 5)
    .map((r, i) => ({
      key: r.url || r.title || String(i),
      date: r.date,
      product: r.product,
      hazard: r.hazard,
      url: r.url || undefined,
      image: r.image || undefined,
      units: r.units,
      unitsRaw: r.unitsRaw || undefined,
      retailerText: r.retailerText || undefined,
    }))

  useEffect(() => {
    document.title = 'Check a product for recalls | The Recall Record'
  }, [])

  return (
    <main className="mx-auto max-w-[1080px] px-6 pb-32 sm:px-10">
      <Nav current="/check" />

      <section className="pt-14 pb-8 sm:pt-20">
        <h1 className="m-0 max-w-[18ch] font-[family-name:var(--font-display)] text-[clamp(2.2rem,6vw,4rem)] font-normal leading-[1.16] tracking-[-0.02em] sm:leading-[1.06]">
          Check a product.
        </h1>
        <p className="mt-6 mb-0 max-w-[62ch] text-[19px] leading-[1.6] text-[var(--color-ink-soft)]">
          Search {data.corpusTotal.toLocaleString()} federal recall notices going back to 1973.
          This looks at the product name, the notice title and the hazard, because most recalls
          never put the hazard in the product name.
        </p>
      </section>

      {/* The most recent recalls, shown until someone types. A search page that
          opens on an empty field asks the reader to guess what it holds; this
          answers that before they ask, and it is the same rows a search
          returns, so nothing about the page changes shape when they start. */}
      <RecallSearch autoFocus defaultList={recent} defaultHeading="Most recent recalls" />
    </main>
  )
}
