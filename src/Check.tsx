import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import Controls from './Controls'
import data from './data/recalls.json'
import { prepare, search, segments, type Index, type Prepared, type Hit, type Strength } from './search'

/**
 * /check, the recall lookup.
 *
 * This page refuses to answer the question people actually arrive with. They
 * want "is this recalled, yes or no", and the federal record cannot support
 * that: 95.4% of recalls carry no barcode, so there is no way to match the item
 * in someone's hands. What it can support is "here is exactly what the record
 * does and does not say", which is the question this page answers instead.
 *
 * The empty state is the primary state. It is the most common result and the
 * only one that can get somebody hurt, because "no results" reads as "this is
 * safe" unless the page works hard to say otherwise. It was designed first and
 * everything else was fitted around it.
 */

const INDEX_URL = '/search-index.json'

type Load = 'idle' | 'loading' | 'ready' | 'error'

export default function Check() {
  const [query, setQuery] = useState(() => new URLSearchParams(location.search).get('q') ?? '')
  const [prepared, setPrepared] = useState<Prepared[] | null>(null)
  const [load, setLoad] = useState<Load>('idle')
  const [prefix, setPrefix] = useState('https://www.cpsc.gov/Recalls/')
  const inputRef = useRef<HTMLInputElement>(null)

  /**
   * Fetched on intent, never with the page.
   *
   * The index is 584KB brotli, which is nine times the rest of the site. Nobody
   * reading the essay should pay for a search they did not ask for, so it loads
   * on first focus or on arriving with a ?q= already set. By the time a word is
   * typed it is usually ready.
   */
  const ensureIndex = useCallback(() => {
    if (load !== 'idle') return
    setLoad('loading')
    fetch(INDEX_URL)
      .then((r) => {
        if (!r.ok) throw new Error(String(r.status))
        return r.json() as Promise<Index>
      })
      .then((idx) => {
        setPrefix(idx.prefix)
        setPrepared(prepare(idx))
        setLoad('ready')
      })
      .catch(() => setLoad('error'))
  }, [load])

  useEffect(() => {
    if (query) ensureIndex()
  }, [query, ensureIndex])

  /* index.html carries the essay's title, and both routes share that document,
     so this page has to name itself. The query goes in the title too, since a
     result is a thing people leave open in a tab. */
  useEffect(() => {
    document.title = query
      ? `“${query}”: check a product | The Recall Record`
      : 'Check a product for recalls | The Recall Record'
  }, [query])

  /* The query lives in the URL so a result can be sent to someone. replaceState
     rather than pushState, so typing does not bury the back button under one
     entry per keystroke. */
  useEffect(() => {
    const url = new URL(location.href)
    if (query) url.searchParams.set('q', query)
    else url.searchParams.delete('q')
    history.replaceState(null, '', url)
  }, [query])

  const results = useMemo(
    () => (prepared ? search(prepared, query) : null),
    [prepared, query],
  )

  const total = results ? results.counts.exact + results.counts.strong + results.counts.possible : 0
  const showing = results?.hits.length ?? 0

  return (
    <main className="mx-auto max-w-[1080px] px-6 pb-32 sm:px-10">
      <header className="flex flex-wrap items-center justify-between gap-x-8 gap-y-4 border-b border-[var(--color-rule)] py-5">
        <div className="flex items-center gap-5">
          <a href="/" className="m-0 font-[family-name:var(--font-display)] text-[22px] font-normal tracking-tight text-[var(--color-ink)]">
            The Recall Record
          </a>
          <Controls />
        </div>
        <a
          href="/"
          className="m-0 font-[family-name:var(--font-mono)] text-[13px] uppercase tracking-[0.14em] text-[var(--color-ink-faint)] hover:text-[var(--color-ink)]"
        >
          Read the record →
        </a>
      </header>

      <section className="pt-14 pb-10 sm:pt-20">
        <h1 className="m-0 max-w-[18ch] font-[family-name:var(--font-display)] text-[clamp(2.2rem,6vw,4rem)] font-normal leading-[1.05] tracking-[-0.02em]">
          Check a product.
        </h1>
        <p className="mt-6 mb-0 max-w-[54ch] text-[19px] leading-[1.6] text-[var(--color-ink-soft)]">
          Search {data.corpusTotal.toLocaleString()} federal recall notices going back to 1973.
          This searches the product name, the notice title and the hazard, because most recalls
          never put the hazard in the product name.
        </p>
      </section>

      <div className="sticky top-0 z-20 -mx-6 bg-[var(--color-paper)] px-6 py-4 sm:-mx-10 sm:px-10">
        <label htmlFor="q" className="sr-only">
          Search recalls by product, brand or hazard
        </label>
        <div className="flex items-center gap-3 rounded-full border border-[var(--color-rule)] bg-[var(--color-paper-sunk)] px-6 py-4 focus-within:border-[var(--color-ink-faint)]">
          <svg width="19" height="19" viewBox="0 0 20 20" fill="none" aria-hidden className="shrink-0 text-[var(--color-ink-faint)]">
            <circle cx="9" cy="9" r="6" stroke="currentColor" strokeWidth="1.8" />
            <path d="M13.5 13.5L17 17" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
          </svg>
          <input
            id="q"
            ref={inputRef}
            type="search"
            value={query}
            onFocus={ensureIndex}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Graco stroller, button battery, space heater"
            autoComplete="off"
            className="w-full bg-transparent text-[19px] text-[var(--color-ink)] outline-none placeholder:text-[var(--color-ink-faint)]"
          />
          {query && (
            <button
              type="button"
              onClick={() => { setQuery(''); inputRef.current?.focus() }}
              className="shrink-0 rounded-full px-3 py-1 text-[14px] text-[var(--color-ink-faint)] hover:text-[var(--color-ink)]"
            >
              Clear
            </button>
          )}
        </div>

        {/* Announced as the count changes, so the result is not visual only. */}
        <p className="sr-only" role="status" aria-live="polite">
          {results && query.length > 1
            ? total === 0
              ? `No recalls match ${query}`
              : `${total} recalls match ${query}`
            : ''}
        </p>
      </div>

      {load === 'loading' && !prepared && (
        <p className="py-16 text-[17px] text-[var(--color-ink-faint)]">Loading the record…</p>
      )}

      {load === 'error' && (
        <p className="py-16 text-[17px] text-[var(--color-ink)]">
          The index did not load.{' '}
          <button type="button" onClick={() => { setLoad('idle'); ensureIndex() }} className="underline decoration-[var(--color-signal)] decoration-2 underline-offset-4">
            Try again
          </button>
          , or search directly at{' '}
          <a className="underline underline-offset-4" href="https://www.cpsc.gov/Recalls">cpsc.gov/Recalls</a>.
        </p>
      )}

      {query.length < 2 && load !== 'loading' && <Resting />}

      {results && query.length > 1 && total > 0 && (
        <Found results={results} prefix={prefix} showing={showing} total={total} />
      )}

      {results && query.length > 1 && total === 0 && (
        <NothingFound results={results} prefix={prefix} query={query} />
      )}
    </main>
  )
}

/* ---------------------------------------------------------------------- */

/** Before anything is typed. Never an empty page, and never a fake one. */
function Resting() {
  const recent = data.biggest?.slice(0, 3) ?? []
  return (
    <section className="pt-10">
      <p className="m-0 font-[family-name:var(--font-mono)] text-[13px] uppercase tracking-[0.14em] text-[var(--color-ink-faint)]">
        Recently recalled
      </p>
      <ul className="m-0 mt-6 list-none border-t border-[var(--color-rule)] p-0">
        {recent.map((r) => (
          <li key={r.url || r.title} className="border-b border-[var(--color-rule)] py-5">
            <p className="m-0 font-[family-name:var(--font-mono)] text-[12px] uppercase tracking-[0.12em] text-[var(--color-ink-faint)] tabular-nums">
              {r.date}
              <span className="mx-2 opacity-50">/</span>
              <span className="text-[var(--color-signal)]">{r.units.toLocaleString()} units</span>
            </p>
            <p className="m-0 mt-1.5 text-[18px] leading-snug text-[var(--color-ink)]">{r.product}</p>
          </li>
        ))}
      </ul>
      <p className="m-0 mt-8 max-w-[60ch] text-[16px] leading-[1.6] text-[var(--color-ink-faint)]">
        Try a brand, a product type or a hazard. Broad words work better than exact model names,
        because the record rarely stores model numbers.
      </p>
    </section>
  )
}

/* ---------------------------------------------------------------------- */

const TIER: Record<Strength, { label: string; note: string; color: string }> = {
  exact: {
    label: 'This exact product',
    note: 'The barcode you entered appears on this recall notice.',
    color: 'var(--color-signal)',
  },
  strong: {
    label: 'Named in the recall',
    note: 'Your search appears in the recalled product’s own name.',
    color: 'var(--color-signal)',
  },
  possible: {
    label: 'Mentioned in the notice',
    note: 'Your search appears in the notice or the hazard, but not in the product name. These may be a different product.',
    color: 'var(--color-warn)',
  },
}

function Found({
  results, prefix, showing, total,
}: { results: ReturnType<typeof search>; prefix: string; showing: number; total: number }) {
  const groups: Strength[] = ['exact', 'strong', 'possible']
  return (
    <section className="pt-10">
      <p className="m-0 text-[17px] text-[var(--color-ink-soft)]">
        <strong className="font-semibold text-[var(--color-ink)] tabular-nums">{total}</strong>{' '}
        {total === 1 ? 'notice mentions' : 'notices mention'}{' '}
        <span className="text-[var(--color-ink)]">“{results.query}”</span>
        {showing < total && (
          <span className="text-[var(--color-ink-faint)]">, showing the {showing} most recent</span>
        )}
        .
      </p>

      {/* A hit in the hazard text is a far weaker claim than a hit in the
          product name, so the tiers never share a list. Presenting them as one
          ranking would dress a guess up as an answer. */}
      {groups.map((g) => {
        const rows = results.hits.filter((h) => h.strength === g)
        if (!rows.length) return null
        return (
          <div key={g} className="mt-12">
            <div className="flex items-baseline gap-3 border-b border-[var(--color-rule)] pb-3">
              <span aria-hidden className="inline-block size-2.5 shrink-0 rounded-full" style={{ background: TIER[g].color }} />
              <h2 className="m-0 font-[family-name:var(--font-display)] text-[20px] font-normal tracking-tight text-[var(--color-ink)]">
                {TIER[g].label}
              </h2>
              <span className="ml-auto font-[family-name:var(--font-mono)] text-[13px] text-[var(--color-ink-faint)] tabular-nums">
                {results.counts[g]}
              </span>
            </div>
            <p className="m-0 mt-3 max-w-[64ch] text-[15px] leading-[1.6] text-[var(--color-ink-faint)]">
              {TIER[g].note}
            </p>
            <ul className="m-0 mt-4 list-none p-0">
              {rows.map((h) => <ResultRow key={h.row.u || h.row.t} hit={h} prefix={prefix} query={results.query} />)}
            </ul>
          </div>
        )
      })}

      <Caveat />
    </section>
  )
}

function ResultRow({ hit, prefix, query }: { hit: Hit; prefix: string; query: string }) {
  const { row } = hit
  return (
    <li className="border-b border-[var(--color-rule)] py-5">
      <p className="m-0 font-[family-name:var(--font-mono)] text-[12px] uppercase tracking-[0.12em] text-[var(--color-ink-faint)] tabular-nums">
        {row.y}
      </p>
      <p className="m-0 mt-1.5 text-[18px] leading-snug text-[var(--color-ink)]">
        {segments(row.n || row.t, query).map((s, i) =>
          s.hit ? (
            <mark key={i} className="bg-transparent font-semibold text-[var(--color-signal)]">{s.s}</mark>
          ) : (
            <span key={i}>{s.s}</span>
          ),
        )}
      </p>
      {row.h && (
        <p className="m-0 mt-1.5 max-w-[74ch] text-[15px] leading-snug text-[var(--color-ink-faint)]">
          {segments(row.h, query).map((s, i) =>
            s.hit ? <mark key={i} className="bg-transparent font-semibold text-[var(--color-ink-soft)]">{s.s}</mark> : <span key={i}>{s.s}</span>,
          )}
        </p>
      )}
      {row.u && (
        <a
          href={prefix + row.u}
          target="_blank"
          rel="noreferrer"
          className="mt-3 inline-flex items-center gap-2 rounded-full border border-[var(--color-rule)] px-4 py-2 text-[14px] text-[var(--color-ink-soft)] transition-colors hover:border-[var(--color-ink-faint)] hover:text-[var(--color-ink)]"
          aria-label={`Read the CPSC notice for ${row.n || row.t}, opens in a new tab`}
        >
          Read the notice
          <svg width="12" height="12" viewBox="0 0 14 14" fill="none" aria-hidden className="shrink-0 opacity-70">
            <path d="M5.5 2.5H2.5v9h9v-3M8.5 2.5h3v3M11.5 2.5L6 8" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </a>
      )}
    </li>
  )
}

/* ---------------------------------------------------------------------- */

/**
 * THE IMPORTANT ONE.
 *
 * Zero results is the most common outcome of a search like this and the most
 * dangerous, because a person reads it as "this product is safe" when it means
 * "no notice used the words you typed". This state exists to close that gap,
 * so it says what was searched, states plainly what it cannot see, and gives
 * somewhere to go next. It is deliberately the largest type on the page.
 */
function NothingFound({
  results, prefix, query,
}: { results: ReturnType<typeof search>; prefix: string; query: string }) {
  return (
    <section className="pt-10">
      <h2 className="m-0 max-w-[24ch] font-[family-name:var(--font-display)] text-[clamp(1.6rem,3.4vw,2.4rem)] font-normal leading-[1.15] tracking-[-0.015em]">
        No federal recall matches “{query}”.
      </h2>
      <p className="mt-6 mb-0 max-w-[52ch] text-[21px] leading-[1.5] text-[var(--color-ink)]">
        That is not the same as{' '}
        <strong className="font-semibold">“this product is safe.”</strong>
      </p>
      <p className="mt-5 mb-0 max-w-[62ch] text-[17px] leading-[1.65] text-[var(--color-ink-soft)]">
        I searched {data.corpusTotal.toLocaleString()} notices back to 1973, matching product
        names, notice titles and hazard descriptions.
      </p>

      <div className="mt-12 grid gap-x-12 gap-y-10 sm:grid-cols-2">
        <div>
          <h3 className="m-0 font-[family-name:var(--font-display)] text-[19px] font-normal tracking-tight text-[var(--color-ink)]">
            What this cannot see
          </h3>
          <ul className="m-0 mt-4 list-none p-0 text-[16px] leading-[1.6] text-[var(--color-ink-soft)]">
            <li className="border-b border-dotted border-[var(--color-rule)] py-3">
              Products recalled under a different name than the one you typed
            </li>
            <li className="border-b border-dotted border-[var(--color-rule)] py-3">
              Anything a maker fixed quietly, without a federal recall
            </li>
            <li className="py-3">
              The exact item in your hands. Only{' '}
              <strong className="font-semibold text-[var(--color-ink)]">{data.upcCoverage}%</strong>{' '}
              of notices carry a barcode, so there is usually nothing to match against
            </li>
          </ul>
        </div>

        <div>
          <h3 className="m-0 font-[family-name:var(--font-display)] text-[19px] font-normal tracking-tight text-[var(--color-ink)]">
            Worth doing next
          </h3>
          <ul className="m-0 mt-4 list-none p-0 text-[16px] leading-[1.6] text-[var(--color-ink-soft)]">
            <li className="border-b border-dotted border-[var(--color-rule)] py-3">
              Try the brand on its own, or the product type on its own
            </li>
            <li className="border-b border-dotted border-[var(--color-rule)] py-3">
              Check the manufacturer’s own recall page
            </li>
            <li className="py-3">
              Report a problem at{' '}
              <a
                href="https://www.saferproducts.gov"
                target="_blank"
                rel="noreferrer"
                className="underline decoration-[var(--color-signal)] decoration-2 underline-offset-4 hover:text-[var(--color-ink)]"
              >
                SaferProducts.gov
              </a>
            </li>
          </ul>
        </div>
      </div>

      {results.related.length > 0 && (
        <div className="mt-16">
          <div className="flex items-baseline gap-3 border-b border-[var(--color-rule)] pb-3">
            <span aria-hidden className="inline-block size-2.5 shrink-0 rounded-full" style={{ background: 'var(--color-warn)' }} />
            <h3 className="m-0 font-[family-name:var(--font-display)] text-[20px] font-normal tracking-tight">
              Related notices
            </h3>
          </div>
          <p className="m-0 mt-3 max-w-[64ch] text-[15px] leading-[1.6] text-[var(--color-ink-faint)]">
            Nothing matched everything you typed. These match part of it, and are almost certainly
            a different product.
          </p>
          <ul className="m-0 mt-4 list-none p-0">
            {results.related.map((h) => (
              <ResultRow key={h.row.u || h.row.t} hit={h} prefix={prefix} query={query} />
            ))}
          </ul>
        </div>
      )}

      <Caveat />
    </section>
  )
}

/** Shown under every result state, because the limit applies to all of them. */
function Caveat() {
  return (
    <p className="m-0 mt-16 max-w-[68ch] border-t border-[var(--color-rule)] pt-6 text-[15px] leading-[1.6] text-[var(--color-ink-faint)]">
      This searches what CPSC published, which is a notice written in prose rather than a product
      catalogue. A result here means a notice used these words. The absence of a result means no
      notice used these words, which is a smaller claim than safety.{' '}
      <a className="underline underline-offset-4 hover:text-[var(--color-ink)]" href="/">
        How this data works
      </a>
      .
    </p>
  )
}
