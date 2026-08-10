import { useEffect } from 'react'
import Controls from './Controls'
import RecallSearch from './RecallSearch'
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
  useEffect(() => {
    document.title = 'Check a product for recalls | The Recall Record'
  }, [])

  return (
    <main className="mx-auto max-w-[1080px] px-6 pb-32 sm:px-10">
      <header className="flex flex-wrap items-center justify-between gap-x-4 gap-y-3 border-b border-[var(--color-rule)] py-4 sm:gap-x-8 sm:py-5">
        <div className="flex items-center gap-3 sm:gap-5">
          <a
            href="/"
            className="m-0 font-[family-name:var(--font-display)] text-[19px] font-normal tracking-tight text-[var(--color-ink)] sm:text-[22px]"
          >
            The Recall Record
          </a>
          <Controls />
        </div>
        {/* Arrow alone on a phone. Measured at 375px: the title and theme pill
            are 262px of a 327px masthead, and "Read the record →" is another
            151px, so 413 wrapped it onto a second row. The label returns at
            sm. */}
        <a
          href="/"
          aria-label="Back to the record"
          className="m-0 flex items-center gap-2 font-[family-name:var(--font-mono)] text-[12px] uppercase tracking-[0.14em] text-[var(--color-ink-faint)] hover:text-[var(--color-ink)] sm:text-[13px]"
        >
          <svg width="15" height="15" viewBox="0 0 16 16" fill="none" aria-hidden className="shrink-0">
            <path d="M13 8H3M7 3.5L2.5 8l4.5 4.5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          <span className="hidden sm:inline">Read the record</span>
        </a>
      </header>

      <section className="pt-14 pb-8 sm:pt-20">
        <h1 className="m-0 max-w-[18ch] font-[family-name:var(--font-display)] text-[clamp(2.2rem,6vw,4rem)] font-normal leading-[1.05] tracking-[-0.02em]">
          Check a product.
        </h1>
        <p className="mt-6 mb-0 max-w-[54ch] text-[19px] leading-[1.6] text-[var(--color-ink-soft)]">
          Search {data.corpusTotal.toLocaleString()} federal recall notices going back to 1973.
          This looks at the product name, the notice title and the hazard, because most recalls
          never put the hazard in the product name.
        </p>
      </section>

      <RecallSearch autoFocus />
    </main>
  )
}
