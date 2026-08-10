/**
 * Search over the CPSC recall index.
 *
 * The whole design of this file follows from one measured fact: matching on
 * product names alone returns ZERO results for "button battery" when three
 * recalls exist, zero for "drowning" against 116, and two for "tip-over"
 * against 123. CPSC writes product names as catalogue entries ("Laziza
 * Dressers"), so the hazard almost never appears in them.
 *
 * So the haystack spans name, title and hazard. But a hit in the hazard text is
 * a much weaker claim than a hit in the product name, and flattening the two
 * into one ranked list would present a guess as an answer. Every result
 * therefore carries HOW it was found, and the page renders the tiers apart.
 */

export type Row = {
  /** Product name(s), joined. */
  n: string
  /** Recall notice title. */
  t: string
  /** Hazard description. */
  h: string
  /** Recall date, YYYY-MM-DD. */
  y: string
  /** URL path, relative to the prefix stored alongside. */
  u: string
  /** UPCs, space separated. Present on about 4.6% of records. */
  c?: string
}

export type Index = { prefix: string; rows: Row[] }

/** How a record was matched. Ordered strongest first, and rendered separately. */
export type Strength = 'exact' | 'strong' | 'possible'

export type Hit = { row: Row; strength: Strength }

export type Results = {
  query: string
  hits: Hit[]
  /** Only populated when `hits` is empty: records sharing SOME of the terms. */
  related: Hit[]
  counts: Record<Strength, number>
}

const norm = (s: string) => s.toLowerCase().replace(/\s+/g, ' ').trim()

/**
 * Prepared haystacks, computed once per index load rather than per keystroke.
 * 9,944 records is small enough that plain substring matching stays well under
 * a frame, so there is no inverted index to keep in sync and nothing to get
 * subtly wrong about stemming.
 */
export type Prepared = { row: Row; name: string; rest: string; upc: string }

export function prepare(index: Index): Prepared[] {
  return index.rows.map((row) => ({
    row,
    name: norm(row.n),
    rest: norm(`${row.t} ${row.h}`),
    upc: row.c ?? '',
  }))
}

/** A digit run long enough to be a real barcode rather than a model number. */
const looksLikeUPC = (q: string) => /^\d{8,14}$/.test(q.replace(/[\s-]/g, ''))

export function search(prepared: Prepared[], rawQuery: string, limit = 40): Results {
  const query = norm(rawQuery)
  const empty: Results = { query, hits: [], related: [], counts: { exact: 0, strong: 0, possible: 0 } }
  if (query.length < 2) return empty

  const terms = query.split(' ').filter(Boolean)
  const hits: Hit[] = []

  // A barcode is the only identifier that can confirm the exact item, so it is
  // checked first and on its own. It almost never fires: CPSC records a UPC on
  // about one recall in twenty.
  if (looksLikeUPC(query)) {
    const digits = query.replace(/[\s-]/g, '')
    for (const p of prepared) {
      if (p.upc && p.upc.includes(digits)) hits.push({ row: p.row, strength: 'exact' })
    }
    if (hits.length) {
      return { query, hits, related: [], counts: tally(hits) }
    }
  }

  for (const p of prepared) {
    const inName = terms.every((t) => p.name.includes(t))
    if (inName) {
      hits.push({ row: p.row, strength: 'strong' })
      continue
    }
    // Every term present, but spread across the notice rather than the name.
    if (terms.every((t) => p.name.includes(t) || p.rest.includes(t))) {
      hits.push({ row: p.row, strength: 'possible' })
    }
  }

  // Rows arrive newest first from the build, so a stable sort by tier alone
  // keeps recency inside each tier without a second comparison.
  const rank: Record<Strength, number> = { exact: 0, strong: 1, possible: 2 }
  hits.sort((a, b) => rank[a.strength] - rank[b.strength])

  /*
   * Nothing matched every term. Rather than an empty page, fall back to records
   * matching ANY term, clearly labelled as related. This is the difference
   * between "I found nothing" and "I found nothing, and here is the nearest
   * thing the record does contain", which is the more honest answer and the
   * more useful one.
   */
  let related: Hit[] = []
  if (!hits.length && terms.length > 1) {
    for (const p of prepared) {
      if (terms.some((t) => t.length > 2 && (p.name.includes(t) || p.rest.includes(t)))) {
        related.push({ row: p.row, strength: 'possible' })
      }
    }
    related = related.slice(0, 12)
  }

  return { query, hits: hits.slice(0, limit), related, counts: tally(hits) }
}

function tally(hits: Hit[]): Record<Strength, number> {
  const c: Record<Strength, number> = { exact: 0, strong: 0, possible: 0 }
  for (const h of hits) c[h.strength]++
  return c
}

/** Case-insensitive term highlighting, returned as segments so React can style them. */
export function segments(text: string, query: string): Array<{ s: string; hit: boolean }> {
  const terms = norm(query).split(' ').filter((t) => t.length > 1)
  if (!terms.length) return [{ s: text, hit: false }]
  const escaped = terms.map((t) => t.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'))
  const re = new RegExp(`(${escaped.join('|')})`, 'ig')
  return text
    .split(re)
    .filter((s) => s !== '')
    .map((s) => ({ s, hit: terms.includes(s.toLowerCase()) }))
}
