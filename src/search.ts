/**
 * Search over the CPSC recall index.
 *
 * The whole design of this file follows from one measured fact: matching on
 * product names alone returns ZERO results for "button battery" when three
 * recalls exist, zero for "drowning" against 116, and two for "tip-over"
 * against 123. CPSC writes product names as catalogue entries ("Laziza
 * Dressers"), so the hazard almost never appears in them.
 *
 * So the haystack spans the product name, the notice title and the hazard. The
 * title is not stored separately; it lives inside the URL slug the index has to
 * carry anyway, see `norm` below.
 *
 * But a hit in the hazard text is a much weaker claim than a hit in the product
 * name, and flattening the two into one ranked list would present a guess as an
 * answer. Every result therefore carries HOW it was found, and the page renders
 * the tiers apart.
 */

export type Row = {
  /** Product name(s), joined. */
  n: string
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

export type Hit = { row: Row; strength: Strength; i: number }

export type Results = {
  query: string
  /** CAPPED at `limit`. Never report this as "how many recalls matched". */
  hits: Hit[]
  /**
   * How many records actually matched, before the cap.
   *
   * This did not exist, and its absence was a real defect rather than a missing
   * nicety. The page read the number of RENDERED rows and printed it as the
   * finding, so a search for "stroller" announced "40 notices mention
   * 'stroller'" when 111 did. 40 was the render limit.
   *
   * It also contradicted itself on screen, because the per-tier `counts` below
   * were tallied on the full set: the summary said 40 and a group heading a
   * dozen lines lower said 111.
   *
   * A page whose entire argument is that a truncated view must not be presented
   * as a complete one cannot round its own search results down in silence.
   */
  total: number
  /** Only populated when `hits` is empty: records sharing SOME of the terms. */
  related: Hit[]
  /** Tallied on the FULL match set, not on the capped `hits`. */
  counts: Record<Strength, number>
}

/**
 * PUNCTUATION BECOMES SPACE, on the haystack and the query alike.
 *
 * The notice title is not stored. It arrives inside the URL slug, which the
 * index has to carry anyway so results can link out, and shipping both was
 * paying twice for the same words. But a slug writes "Fisher-Price" as
 * "Fisher Price", so matching raw text lost 63% of the hits for a hyphenated
 * query.
 *
 * Normalising both sides fixes that and is better than what it replaced:
 * "tip-over" and "tip over" now return the same 191 notices, where before they
 * returned 123 and 82 depending on which way the reader happened to type it.
 */
const norm = (s: string) => s.toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim()

/** The slug carries the notice title. Strip the leading year to read it back. */
export const titleFromUrl = (u: string) => u.replace(/^\d{4}\//, '').replace(/-+/g, ' ').trim()

/**
 * Prepared haystacks, computed once per index load rather than per keystroke.
 * 9,944 records is small enough that plain substring matching stays well under
 * a frame, so there is no inverted index to keep in sync and nothing to get
 * subtly wrong about stemming.
 */
export type Prepared = {
  row: Row
  name: string
  rest: string
  upc: string
  /** Position in the index, so results can reach the parallel image array
      without a linear scan per rendered row. */
  i: number
}

export function prepare(index: Index): Prepared[] {
  return index.rows.map((row, i) => ({
    row,
    i,
    name: norm(row.n),
    rest: norm(`${titleFromUrl(row.u)} ${row.h}`),
    upc: row.c ?? '',
  }))
}

/** A digit run long enough to be a real barcode rather than a model number. */
const looksLikeUPC = (q: string) => /^\d{8,14}$/.test(q.replace(/[\s-]/g, ''))

export function search(prepared: Prepared[], rawQuery: string, limit = 40): Results {
  const query = norm(rawQuery)
  const empty: Results = { query, hits: [], total: 0, related: [], counts: { exact: 0, strong: 0, possible: 0 } }
  if (query.length < 2) return empty

  const terms = query.split(' ').filter(Boolean)
  const hits: Hit[] = []

  // A barcode is the only identifier that can confirm the exact item, so it is
  // checked first and on its own. It almost never fires: CPSC records a UPC on
  // about one recall in twenty.
  if (looksLikeUPC(query)) {
    const digits = query.replace(/[\s-]/g, '')
    for (const p of prepared) {
      if (p.upc && p.upc.includes(digits)) hits.push({ row: p.row, strength: 'exact', i: p.i })
    }
    if (hits.length) {
      /* Not sliced: a barcode match is by definition a handful of records, so
         total and hits.length are the same number here. Stated explicitly
         rather than left implicit, because this is the second return path and
         the first one is where the count bug lived. */
      return { query, hits, total: hits.length, related: [], counts: tally(hits) }
    }
  }

  for (const p of prepared) {
    const inName = terms.every((t) => p.name.includes(t))
    if (inName) {
      hits.push({ row: p.row, strength: 'strong', i: p.i })
      continue
    }
    // Every term present, but spread across the notice rather than the name.
    if (terms.every((t) => p.name.includes(t) || p.rest.includes(t))) {
      hits.push({ row: p.row, strength: 'possible', i: p.i })
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
        related.push({ row: p.row, strength: 'possible', i: p.i })
      }
    }
    related = related.slice(0, 12)
  }

  /* `total` and `counts` are both taken from `hits` BEFORE the slice. The
     rendered list is capped for the browser's sake; the reported number is not. */
  return { query, hits: hits.slice(0, limit), total: hits.length, related, counts: tally(hits) }
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
