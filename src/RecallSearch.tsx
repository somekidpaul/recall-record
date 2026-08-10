import { useCallback, useEffect, useId, useMemo, useRef, useState } from 'react'
import data from './data/recalls.json'
import { RecallRow, type RowView } from './RecallRow'
import {
  prepare, search, segments, titleFromUrl,
  type Hit, type Index, type Prepared, type Strength,
} from './search'

/**
 * The recall lookup, mounted in two places.
 *
 * On the essay it sits inside the biggest-recalls section: at rest it shows
 * that ranked list, and the moment anyone types it becomes search results in
 * the same rows. On /check it stands alone with no default list. One component
 * either way, because two implementations of the same list had already started
 * to drift, and the search results were the poorer of the two.
 *
 * Nothing here loads with the page. The index is fetched when the field is
 * opened, the photographs later still, when someone first opens a product.
 */

const INDEX_URL = '/search-index.json'
const IMAGES_URL = '/search-images.json'

type Load = 'idle' | 'loading' | 'ready' | 'error'

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

export default function RecallSearch({
  defaultList,
  defaultHeading,
  autoFocus = false,
}: {
  /** Shown when the field is empty. Omitted on /check, which starts blank. */
  defaultList?: RowView[]
  defaultHeading?: string
  autoFocus?: boolean
}) {
  const [query, setQuery] = useState(
    () => new URLSearchParams(location.search).get('q') ?? '',
  )
  const [prepared, setPrepared] = useState<Prepared[] | null>(null)
  const [images, setImages] = useState<string[] | null>(null)
  const [load, setLoad] = useState<Load>('idle')
  const [imgLoad, setImgLoad] = useState<Load>('idle')
  const [prefix, setPrefix] = useState('https://www.cpsc.gov/Recalls/')
  const [imgPrefix, setImgPrefix] = useState('https://www.cpsc.gov/')
  const [open, setOpen] = useState<string | null>(null)
  const [expanded, setExpanded] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)
  const uid = useId()

  const ensureIndex = useCallback(() => {
    setLoad((s) => {
      if (s !== 'idle') return s
      fetch(INDEX_URL)
        .then((r) => { if (!r.ok) throw new Error(String(r.status)); return r.json() as Promise<Index> })
        .then((idx) => { setPrefix(idx.prefix); setPrepared(prepare(idx)); setLoad('ready') })
        .catch(() => setLoad('error'))
      return 'loading'
    })
  }, [])

  /* Photographs are a third of a megabyte and most searches never open a
     product, so they wait for the first one that does. */
  const ensureImages = useCallback(() => {
    setImgLoad((s) => {
      if (s !== 'idle') return s
      fetch(IMAGES_URL)
        .then((r) => { if (!r.ok) throw new Error(String(r.status)); return r.json() })
        .then((d: { prefix: string; i: string[] }) => {
          setImgPrefix(d.prefix); setImages(d.i); setImgLoad('ready')
        })
        .catch(() => setImgLoad('error'))
      return 'loading'
    })
  }, [])

  useEffect(() => { if (query) { setExpanded(true); ensureIndex() } }, [query, ensureIndex])

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

  const searching = query.trim().length > 1
  const total = results ? results.hits.length : 0
  const counts = results?.counts

  /* The image array ships parallel to the index and in the same order, so a hit
     reaches its photograph by position. The hit carries that position, rather
     than the row being searched for by identity, which was a linear scan over
     9,944 records for every one of up to 40 rendered rows. */
  const toView = useCallback(
    (hit: Hit): RowView => ({
      key: hit.row.u || String(hit.i),
      date: hit.row.y,
      product: hit.row.n || titleFromUrl(hit.row.u),
      hazard: hit.row.h,
      url: hit.row.u ? prefix + hit.row.u : undefined,
      image: images?.[hit.i] ? imgPrefix + images[hit.i] : undefined,
    }),
    [prefix, images, imgPrefix],
  )

  const highlight = useCallback(
    (text: string) => (
      <>
        {segments(text, query).map((s, i) =>
          s.hit ? (
            <mark key={i} className="bg-transparent font-semibold text-[var(--color-signal)]">{s.s}</mark>
          ) : (
            <span key={i}>{s.s}</span>
          ),
        )}
      </>
    ),
    [query],
  )

  const toggle = (key: string) => {
    setOpen((k) => (k === key ? null : key))
    ensureImages()
  }

  return (
    <div>
      {/*
        THE FIELD OPENS, rather than being a button that goes somewhere.
        Closed it is a quiet line of type with a magnifier, which is all a
        browsing reader needs. Focus, or a click anywhere on it, and it grows
        into a real input on the signature easing. Grid rows animate the growth
        because height:auto cannot be transitioned, the same technique the
        disclosure panels use.
      */}
      <div
        className="search-shell"
        data-open={expanded}
        onClick={() => { setExpanded(true); ensureIndex(); inputRef.current?.focus() }}
      >
        <svg width="19" height="19" viewBox="0 0 20 20" fill="none" aria-hidden className="shrink-0 text-[var(--color-ink-faint)]">
          <circle cx="9" cy="9" r="6" stroke="currentColor" strokeWidth="1.8" />
          <path d="M13.5 13.5L17 17" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
        </svg>
        <label htmlFor={`q${uid}`} className="sr-only">
          Search recalls by product, brand or hazard
        </label>
        <input
          id={`q${uid}`}
          ref={inputRef}
          type="search"
          value={query}
          autoFocus={autoFocus}
          onFocus={() => { setExpanded(true); ensureIndex() }}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={expanded ? 'Graco stroller, button battery, space heater' : 'Search every recall since 1973'}
          autoComplete="off"
          className="w-full bg-transparent text-[17px] text-[var(--color-ink)] outline-none placeholder:text-[var(--color-ink-faint)] sm:text-[19px]"
        />
        {query && (
          <button
            type="button"
            onClick={(e) => { e.stopPropagation(); setQuery(''); inputRef.current?.focus() }}
            className="shrink-0 rounded-full px-3 py-1 text-[14px] text-[var(--color-ink-faint)] hover:text-[var(--color-ink)]"
          >
            Clear
          </button>
        )}
      </div>

      <p className="sr-only" role="status" aria-live="polite">
        {searching && results
          ? total === 0
            ? `No recalls match ${query}`
            : `${total} recalls match ${query}`
          : ''}
      </p>

      {load === 'loading' && searching && !prepared && (
        <p className="py-14 text-[17px] text-[var(--color-ink-faint)]">Loading the record…</p>
      )}

      {load === 'error' && (
        <p className="py-14 text-[17px] text-[var(--color-ink)]">
          The index did not load.{' '}
          <button type="button" onClick={() => { setLoad('idle'); ensureIndex() }} className="underline decoration-[var(--color-signal)] decoration-2 underline-offset-4">
            Try again
          </button>
          , or search directly at{' '}
          <a className="underline underline-offset-4" href="https://www.cpsc.gov/Recalls">cpsc.gov/Recalls</a>.
        </p>
      )}

      {/* At rest, whatever the host page wanted to show. */}
      {!searching && defaultList && (
        <>
          {defaultHeading && (
            <p className="m-0 mt-10 font-[family-name:var(--font-mono)] text-[13px] uppercase tracking-[0.14em] text-[var(--color-ink-faint)]">
              {defaultHeading}
            </p>
          )}
          <ol className="m-0 mt-5 list-none border-t border-[var(--color-rule)] p-0">
            {defaultList.map((r) => (
              <RecallRow
                key={r.key}
                row={r}
                open={open === r.key}
                onToggle={() => toggle(r.key)}
                panelId={`p${uid}-${r.key}`}
                imagesPending={imgLoad === 'loading'}
              />
            ))}
          </ol>
        </>
      )}

      {searching && results && total > 0 && (
        <section className="mt-10">
          <p className="m-0 text-[17px] text-[var(--color-ink-soft)]">
            <strong className="font-semibold text-[var(--color-ink)] tabular-nums">{total}</strong>{' '}
            {total === 1 ? 'notice mentions' : 'notices mention'}{' '}
            <span className="text-[var(--color-ink)]">“{query}”</span>.
          </p>

          {(['exact', 'strong', 'possible'] as Strength[]).map((g) => {
            const rows = results.hits.filter((h) => h.strength === g)
            if (!rows.length) return null
            return (
              <div key={g} className="mt-10">
                <div className="flex items-baseline gap-3 border-b border-[var(--color-rule)] pb-3">
                  <span aria-hidden className="inline-block size-2.5 shrink-0 rounded-full" style={{ background: TIER[g].color }} />
                  <h3 className="m-0 font-[family-name:var(--font-display)] text-[20px] font-normal tracking-tight text-[var(--color-ink)]">
                    {TIER[g].label}
                  </h3>
                  <span className="ml-auto font-[family-name:var(--font-mono)] text-[13px] text-[var(--color-ink-faint)] tabular-nums">
                    {counts?.[g]}
                  </span>
                </div>
                <p className="m-0 mt-3 max-w-[64ch] text-[15px] leading-[1.6] text-[var(--color-ink-faint)]">
                  {TIER[g].note}
                </p>
                <ul className="m-0 mt-4 list-none p-0">
                  {rows.map((h) => {
                    const v = toView(h)
                    return (
                      <RecallRow
                        key={v.key}
                        row={v}
                        open={open === v.key}
                        onToggle={() => toggle(v.key)}
                        panelId={`p${uid}-${v.key}`}
                        imagesPending={imgLoad === 'loading'}
                        highlight={highlight}
                      />
                    )
                  })}
                </ul>
              </div>
            )
          })}
          <Caveat />
        </section>
      )}

      {searching && results && total === 0 && (
        <NothingFound
          query={query}
          related={results.related.map(toView)}
          open={open}
          onToggle={toggle}
          uid={uid}
          imagesPending={imgLoad === 'loading'}
          highlight={highlight}
        />
      )}
    </div>
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
  query, related, open, onToggle, uid, imagesPending, highlight,
}: {
  query: string
  related: RowView[]
  open: string | null
  onToggle: (k: string) => void
  uid: string
  imagesPending: boolean
  highlight: (t: string) => React.ReactNode
}) {
  return (
    <section className="pt-10">
      <h3 className="m-0 max-w-[24ch] font-[family-name:var(--font-display)] text-[clamp(1.6rem,3.4vw,2.4rem)] font-normal leading-[1.15] tracking-[-0.015em]">
        No federal recall matches “{query}”.
      </h3>
      <p className="mt-6 mb-0 max-w-[52ch] text-[21px] leading-[1.5] text-[var(--color-ink)]">
        That is not the same as <strong className="font-semibold">“this product is safe.”</strong>
      </p>
      <p className="mt-5 mb-0 max-w-[62ch] text-[17px] leading-[1.65] text-[var(--color-ink-soft)]">
        I searched {data.corpusTotal.toLocaleString()} notices back to 1973, matching product
        names, notice titles and hazard descriptions.
      </p>

      <div className="mt-12 grid gap-x-12 gap-y-10 sm:grid-cols-2">
        <div>
          <h4 className="m-0 font-[family-name:var(--font-display)] text-[19px] font-normal tracking-tight text-[var(--color-ink)]">
            What this cannot see
          </h4>
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
          <h4 className="m-0 font-[family-name:var(--font-display)] text-[19px] font-normal tracking-tight text-[var(--color-ink)]">
            Worth doing next
          </h4>
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

      {related.length > 0 && (
        <div className="mt-16">
          <div className="flex items-baseline gap-3 border-b border-[var(--color-rule)] pb-3">
            <span aria-hidden className="inline-block size-2.5 shrink-0 rounded-full" style={{ background: 'var(--color-warn)' }} />
            <h4 className="m-0 font-[family-name:var(--font-display)] text-[20px] font-normal tracking-tight">
              Related notices
            </h4>
          </div>
          <p className="m-0 mt-3 max-w-[64ch] text-[15px] leading-[1.6] text-[var(--color-ink-faint)]">
            Nothing matched everything you typed. These match part of it, and are almost certainly
            a different product.
          </p>
          <ul className="m-0 mt-4 list-none p-0">
            {related.map((r) => (
              <RecallRow
                key={r.key}
                row={r}
                open={open === r.key}
                onToggle={() => onToggle(r.key)}
                panelId={`p${uid}-${r.key}`}
                imagesPending={imagesPending}
                highlight={highlight}
              />
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
    <p className="m-0 mt-14 max-w-[68ch] border-t border-[var(--color-rule)] pt-6 text-[15px] leading-[1.6] text-[var(--color-ink-faint)]">
      This searches what CPSC published, which is a notice written in prose rather than a product
      catalogue. A result here means a notice used these words. The absence of a result means no
      notice used these words, which is a smaller claim than safety.
    </p>
  )
}
