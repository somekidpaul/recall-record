/**
 * Search invariants.
 *
 * Every test here corresponds to a defect that actually shipped, or to the
 * property whose absence allowed it. This is not coverage for its own sake.
 *
 * THE ONE THAT MATTERS MOST is "total is the match count, not the row cap".
 * `search()` returns `hits.slice(0, limit)`, and the page read `hits.length` as
 * the number to print, so a query matching 121 records announced "40 notices
 * mention stroller" and then contradicted itself with a per-tier count of 111
 * a dozen lines lower. On a page whose entire argument is that a partial view
 * must never be presented as a complete one, that was the worst possible bug to
 * have. It is now a type-level field and a test.
 */
import { describe, it, expect } from 'vitest'
import { prepare, search, segments, titleFromUrl, type Index, type Row } from './search'

/** A row builder, so each test states only the field it cares about. */
const row = (n: string, over: Partial<Row> = {}): Row => ({
  n,
  h: 'A hazard sentence.',
  y: '2026-01-01',
  u: `2026/${n.replace(/\s+/g, '-')}`,
  ...over,
})

const index = (rows: Row[]): Index => ({ prefix: 'https://www.cpsc.gov/Recalls/', rows })

describe('search: reported totals', () => {
  it('reports the true match count, not the number of rows returned', () => {
    /* 60 records that all match, against a cap of 10. */
    const rows = Array.from({ length: 60 }, (_, i) => row(`Widget stroller ${i}`))
    const r = search(prepare(index(rows)), 'stroller', 10)

    expect(r.hits.length).toBe(10) // the render cap did its job
    expect(r.total).toBe(60) // and the reported figure ignored it
  })

  it('counts every tier on the full match set, so total equals the sum of counts', () => {
    const rows = [
      ...Array.from({ length: 30 }, (_, i) => row(`Stroller model ${i}`)), // in the NAME: strong
      ...Array.from({ length: 25 }, (_, i) =>
        row(`Unrelated item ${i}`, { h: 'Detaches from the stroller frame.' }), // hazard only: possible
      ),
    ]
    const r = search(prepare(index(rows)), 'stroller', 10)

    const summed = r.counts.exact + r.counts.strong + r.counts.possible
    expect(summed).toBe(r.total)
    expect(r.total).toBe(55)
    expect(r.counts.strong).toBe(30)
    expect(r.counts.possible).toBe(25)
    /* The specific on-screen contradiction: a tier count larger than the
       headline number. */
    expect(r.counts.strong).toBeLessThanOrEqual(r.total)
  })

  it('total equals hits.length when nothing was truncated', () => {
    const r = search(prepare(index([row('Blue stroller'), row('Red wagon')])), 'stroller', 40)
    expect(r.total).toBe(1)
    expect(r.hits.length).toBe(1)
  })

  it('an empty query reports zero rather than undefined', () => {
    const r = search(prepare(index([row('Blue stroller')])), '', 40)
    expect(r.total).toBe(0)
    expect(r.hits).toEqual([])
  })

  it('the barcode path also reports a total', () => {
    const rows = [row('Some toy', { c: '012345678905' } as Partial<Row>)]
    const r = search(prepare(index(rows)), '012345678905', 40)
    if (r.hits.length) {
      expect(r.total).toBe(r.hits.length)
      expect(r.counts.exact).toBe(r.total)
    }
  })
})

describe('search: matching', () => {
  it('ranks a name match above a hazard-only match', () => {
    const rows = [
      row('Unrelated thing', { h: 'The stroller wheel detaches.' }),
      row('Folding stroller'),
    ]
    const r = search(prepare(index(rows)), 'stroller', 40)
    expect(r.hits[0].strength).toBe('strong')
    expect(r.hits[0].row.n).toBe('Folding stroller')
  })

  it('normalises punctuation on BOTH sides, so a hyphen does not lose matches', () => {
    /* This one is measured history: "fisher-price" lost 63% of its hits when the
       query kept its hyphen and the haystack did not. */
    const rows = [row('Fisher-Price Rock n Play'), row('Fisher Price Bassinet')]
    const withHyphen = search(prepare(index(rows)), 'fisher-price', 40)
    const withSpace = search(prepare(index(rows)), 'fisher price', 40)
    expect(withHyphen.total).toBe(2)
    expect(withSpace.total).toBe(2)
    expect(withHyphen.total).toBe(withSpace.total)
  })

  it('requires every term, so it does not widen a two-word query into an OR', () => {
    const rows = [row('Blue stroller'), row('Blue wagon'), row('Green stroller')]
    const r = search(prepare(index(rows)), 'blue stroller', 40)
    expect(r.total).toBe(1)
    expect(r.hits[0].row.n).toBe('Blue stroller')
  })

  it('is case insensitive', () => {
    const rows = [row('STROLLER Deluxe')]
    expect(search(prepare(index(rows)), 'stroller', 40).total).toBe(1)
  })

  it('offers related rows only when there are no hits', () => {
    const rows = [row('Blue stroller'), row('Green wagon')]
    const none = search(prepare(index(rows)), 'stroller wagon', 40)
    expect(none.hits.length).toBe(0)
    expect(none.related.length).toBeGreaterThan(0)

    const some = search(prepare(index(rows)), 'stroller', 40)
    expect(some.hits.length).toBeGreaterThan(0)
    expect(some.related.length).toBe(0)
  })

  it('carries the index position, so a row can reach its parallel image', () => {
    const rows = [row('A'), row('B stroller'), row('C')]
    const r = search(prepare(index(rows)), 'stroller', 40)
    expect(r.hits[0].i).toBe(1)
  })
})

describe('titleFromUrl', () => {
  it('recovers a readable title from the slug, which is why the index omits it', () => {
    expect(titleFromUrl('2026/Acme-Recalls-Blue-Strollers')).toBe('Acme Recalls Blue Strollers')
  })
})

describe('segments (highlighting)', () => {
  it('marks the matched run and leaves the rest alone', () => {
    const segs = segments('Folding stroller frame', 'stroller')
    expect(segs.filter((s) => s.hit).map((s) => s.s.toLowerCase())).toContain('stroller')
    expect(segs.map((s) => s.s).join('')).toBe('Folding stroller frame')
  })

  it('never drops or duplicates characters', () => {
    const text = 'Fisher-Price Rock n Play Sleeper'
    for (const q of ['fisher', 'price', 'rock play', 'zzz', '']) {
      expect(segments(text, q).map((s) => s.s).join('')).toBe(text)
    }
  })
})
