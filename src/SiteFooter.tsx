import data from './data/recalls.json'

/**
 * The provenance block, in one place.
 *
 * This markup existed twice, byte for byte, in App.tsx and Method.tsx, with the
 * two asset paths written out in both. It also did not exist at all on /check,
 * which is the page most likely to be found cold: a stranger who lands there
 * from a search engine got no byline, no CPSC attribution, no downloads and
 * none of the "no tracking, no cookies, no accounts" line. Three copies of a
 * thing that should be one is how the fourth copy goes missing.
 */

const BUTTON =
  'rounded-full border border-[var(--color-rule)] px-5 py-2.5 text-[15px] text-[var(--color-ink-soft)] transition-colors hover:border-[var(--color-ink-faint)] hover:text-[var(--color-ink)]'

export function DataDownloads() {
  return (
    <div className="no-print flex flex-wrap gap-3">
      <a href="/recall-data.csv" download className={BUTTON}>
        Download CSV
      </a>
      <a href="/recall-data.json" download className={BUTTON}>
        JSON
      </a>
      {/* Not the API endpoint. That is a 27MB JSON document, and pointing a
          phone at it from the one control a sceptical reader is most likely to
          press is a hung tab. The endpoint is named in full in ProvenanceNote
          below, where reading it costs nothing. */}
      <a href="https://www.cpsc.gov/Recalls" className={BUTTON}>
        Go to CPSC recalls
      </a>
    </div>
  )
}

export function ProvenanceNote() {
  return (
    <p className="m-0 mt-10 measure text-[15px] text-[var(--color-ink-faint)]">
      Free government data. No tracking, no cookies, no accounts. Every number here is calculated
      straight from the source when the page is built, so it cannot drift out of sync. That source
      is the CPSC Recalls API,{' '}
      <span className="break-all font-[family-name:var(--font-mono)] text-[13px]">{data.source}</span>
      , about 27MB of JSON.
    </p>
  )
}
