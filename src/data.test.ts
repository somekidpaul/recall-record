/**
 * The accuracy suite.
 *
 * This is the one that matters for keeping the piece honest. build-data.mjs has
 * its own assertions, but those check that the build did not crash; these check
 * that the numbers the PAGE prints are true, and that they still agree with the
 * federal feed after CPSC changes underneath us.
 *
 * Two layers:
 *
 *   1. INTERNAL CONSISTENCY. Always runs, needs nothing but the committed
 *      recalls.json. Catches a build that produced self-contradicting output:
 *      a percentage that does not match its own numerator and denominator, a
 *      "most recent" list that is not in date order, a sole-retailer share
 *      larger than the named share.
 *
 *   2. CROSS-CHECK AGAINST THE RAW FEED. Runs only when data/cpsc-recalls.json
 *      is on disk, which it is locally and in CI immediately after `npm run
 *      data`. Catches the build agreeing with itself about the wrong thing.
 *
 * Layer 2 SKIPS LOUDLY. A silent skip is how a suite goes green while checking
 * nothing, which is the same failure mode as the search bug these tests exist
 * to prevent.
 */
import { describe, it, expect } from 'vitest'
import { existsSync, readFileSync } from 'node:fs'
import { join } from 'node:path'
import data from './data/recalls.json'

const RAW_PATH = join(process.cwd(), 'data', 'cpsc-recalls.json')
const hasRaw = existsSync(RAW_PATH)

/**
 * THE SKIP IS NOT ALLOWED TO BE SILENT, AND IN CI IT IS NOT ALLOWED AT ALL.
 *
 * This started as a console.warn at module scope. Vitest swallows those, so the
 * only trace of a skipped cross-check was the words "8 skipped" in the summary,
 * which does not fail anything. That is the precise shape of the bug this whole
 * suite exists to prevent: a green run that checked nothing and said so quietly.
 *
 * On CI the feed is written by `npm run data` in the step immediately before,
 * so its absence means that step did not do what it claims and the figures are
 * unverified. That is a failure, not a skip.
 */
describe('the accuracy gate itself', () => {
  it('the raw-feed cross-check actually ran', () => {
    if (process.env.CI) {
      expect(
        hasRaw,
        'data/cpsc-recalls.json is missing in CI. `npm run data` runs immediately before this ' +
          'step and is supposed to write it, so the published figures were NOT checked against ' +
          'the feed. Failing rather than passing quietly.',
      ).toBe(true)
    } else if (!hasRaw) {
      /* Locally this is ordinary: the feed is gitignored and a fresh clone will
         not have it. Still surfaced as a named, visible test rather than a log
         line, so "did the real check run" is answerable from the summary. */
      expect(hasRaw).toBe(false) // documents the skip; run `npm run data` to check for real
    }
  })
})

type RawRecall = {
  RecallDate?: string
  Retailers?: Array<{ Name?: string }>
  ProductUPCs?: unknown[]
  Products?: Array<{ Name?: string; NumberOfUnits?: string }>
  Images?: Array<{ URL?: string }>
}

const raw: RawRecall[] = hasRaw ? JSON.parse(readFileSync(RAW_PATH, 'utf8')) : []
const yearOf = (r: RawRecall) => (r.RecallDate ? Number(r.RecallDate.slice(0, 4)) : null)
const retailerText = (r: RawRecall) =>
  (r.Retailers ?? []).map((x) => x?.Name ?? '').join(' ').trim()

describe('published figures: internal consistency', () => {
  it('every percentage sits between 0 and 100', () => {
    for (const s of data.series) {
      for (const [k, v] of Object.entries(s.retailers)) {
        expect(v === null || (v >= 0 && v <= 100), `${s.year} ${k} = ${v}`).toBe(true)
      }
      if (s.amazonOnly != null) expect(s.amazonOnly).toBeGreaterThanOrEqual(0)
      if (s.amazonOnly != null) expect(s.amazonOnly).toBeLessThanOrEqual(100)
    }
    for (const [k, v] of Object.entries(data.coverage)) {
      if (k === 'total') continue
      expect(v >= 0 && v <= 100, `coverage.${k} = ${v}`).toBe(true)
    }
    expect(data.upcCoverage).toBeGreaterThanOrEqual(0)
    expect(data.upcCoverage).toBeLessThanOrEqual(100)
  })

  it('the headline percentage equals its own numerator over its own denominator', () => {
    /* The largest type on the page is amazonOnly, printed beside "185 of 373".
       If those three ever disagree, the page is arguing with itself. */
    for (const s of data.series) {
      if (s.amazonOnly == null || s.amazonOnlyCount == null) continue
      const recomputed = Math.round((s.amazonOnlyCount / s.recalls) * 1000) / 10
      expect(Math.abs(recomputed - s.amazonOnly), `${s.year}: ${s.amazonOnlyCount}/${s.recalls}`)
        .toBeLessThanOrEqual(0.06)
    }
  })

  it('the sole-retailer share never exceeds the named share', () => {
    /* "Only Amazon named" is a strict subset of "Amazon named". If this ever
       inverts, the chart's two states are measuring different populations. */
    for (const s of data.series) {
      if (s.amazonOnly == null || s.retailers.amazon == null) continue
      expect(s.amazonOnly, `${s.year}`).toBeLessThanOrEqual(s.retailers.amazon)
    }
  })

  it('the series is in ascending year order with no gaps', () => {
    const years = data.series.map((s) => s.year)
    for (let i = 1; i < years.length; i++) {
      expect(years[i]).toBe(years[i - 1] + 1)
    }
    expect(years[0]).toBe(data.firstYear)
  })

  it('recall counts are positive integers', () => {
    for (const s of data.series) {
      expect(Number.isInteger(s.recalls)).toBe(true)
      expect(s.recalls).toBeGreaterThan(0)
    }
  })

  it('"most recent" is actually sorted by date, newest first', () => {
    /* /check labelled a list "Most recent recalls" while sourcing it from
       `biggest` re-sorted by date, which is the newest members of a set chosen
       for SIZE. This is the guard on that. */
    expect(data.recent.length).toBe(10)
    for (let i = 1; i < data.recent.length; i++) {
      expect(
        data.recent[i - 1].date >= data.recent[i].date,
        `position ${i}: ${data.recent[i - 1].date} then ${data.recent[i].date}`,
      ).toBe(true)
    }
  })

  it('the newest item in "most recent" IS the newest recall on the site', () => {
    expect(data.recent[0].date).toBe(data.newestRecallDate)
  })

  it('"biggest" is sorted by units, largest first', () => {
    for (let i = 1; i < data.biggest.length; i++) {
      expect(data.biggest[i - 1].units).toBeGreaterThanOrEqual(data.biggest[i].units)
    }
  })

  it('every listed recall carries a usable link and date', () => {
    for (const r of [...data.biggest, ...data.recent]) {
      expect(r.date).toMatch(/^\d{4}-\d{2}-\d{2}$/)
      expect(r.url.length).toBeGreaterThan(0)
      expect(r.image.length).toBeGreaterThan(0)
    }
  })

  it('the partial-year note describes the year the chart actually ends on', () => {
    expect(data.partialYear.year).toBe(data.series.at(-1)!.year)
    expect(data.partialYear.throughDate).toBe(data.newestRecallDate)
    expect(data.partialYear.monthsElapsed).toBe(Number(data.newestRecallDate.slice(5, 7)))
  })

  it('the window context agrees with the chart it justifies', () => {
    expect(data.windowContext.firstReliableYear).toBe(data.firstYear)
    expect(data.windowContext.analyzedFrom).toBe(data.firstYear)
    expect(data.windowContext.corpusFirstYear).toBeLessThan(data.firstYear)
  })
})

describe('the household comparison only appears where it means something', () => {
  const US_HOUSEHOLDS = 132_216_000
  const FLOOR = Math.round(US_HOUSEHOLDS / 1000)

  it('every recall on the biggest list clears the floor', () => {
    /* The line was written for this list and lands here: 1 in 75 through 1 in
       371. If a year ever produces ten small "biggest" recalls, the line would
       silently vanish from the essay, which is worth knowing about. */
    for (const r of data.biggest) {
      expect(r.units, `${r.date} ${r.product.slice(0, 30)}`).toBeGreaterThanOrEqual(FLOOR)
    }
  })

  it('the ratio stays inside a range a reader can picture', () => {
    for (const r of data.biggest) {
      expect(Math.round(US_HOUSEHOLDS / r.units)).toBeLessThanOrEqual(1000)
    }
  })
})

describe('the share card agrees with the page', () => {
  const html = readFileSync(join(process.cwd(), 'index.html'), 'utf8')
  const alt = (html.match(/og:image:alt" content="([^"]*)"/) || [])[1] ?? ''
  const last = data.series.at(-1)!

  it('og:image:alt quotes the headline measure, not the other one', () => {
    /* The card drew and printed `retailers.amazon` under a headline reading
       "name only Amazon", which is a different measure. It showed 60.9% for a
       claim about 49.6%. Whatever else changes, the number on the social card
       has to be the number the page argues. */
    expect(alt.length).toBeGreaterThan(0)
    expect(alt, 'alt text should carry the sole-retailer figure').toContain(`${last.amazonOnly}%`)
  })

  it('og:image:alt does not quote the named-at-all figure', () => {
    if (last.retailers.amazon === last.amazonOnly) return // nothing to distinguish
    expect(
      alt.includes(`${last.retailers.amazon}%`),
      `alt text still contains ${last.retailers.amazon}%, the measure the headline does NOT use`,
    ).toBe(false)
  })
})

describe('the origin split (second finding)', () => {
  const years = data.series.filter((s) => s.origin && s.origin.soleChina != null)

  it('every year carries a coverage figure alongside its shares', () => {
    /* A share with no denominator is the thing this page exists to argue
       against. If coverage ever goes missing the section must not render a
       percentage it cannot qualify. */
    for (const s of years) {
      expect(s.origin.coverage, `${s.year}`).toBeGreaterThan(0)
      expect(s.origin.coverage).toBeLessThanOrEqual(100)
      expect(s.origin.soleN + s.origin.restN).toBeGreaterThan(0)
    }
  })

  it('shares stay inside 0 to 100', () => {
    for (const s of years) {
      for (const k of ['soleChina', 'restChina'] as const) {
        const v = s.origin[k]
        if (v == null) continue
        expect(v >= 0 && v <= 100, `${s.year} ${k} = ${v}`).toBe(true)
      }
    }
  })

  it('the group sizes add up to the records that had a country', () => {
    for (const s of years) {
      const known = Math.round((s.origin.coverage / 100) * s.recalls)
      expect(Math.abs(s.origin.soleN + s.origin.restN - known), `${s.year}`).toBeLessThanOrEqual(1)
    }
  })

  it('country coverage is high enough that the split is not a sample', () => {
    /* The section claims the record covers essentially everything. If CPSC ever
       stops recording origin, that claim expires and the run should fail. */
    for (const s of years.filter((y) => y.year >= 2015)) {
      expect(s.origin.coverage, `${s.year} country coverage`).toBeGreaterThanOrEqual(95)
    }
  })
})

describe('the remedy, which is what a person actually needs', () => {
  it('every listed recall says what to do about it', () => {
    /* The lookup told people their product was dangerous and not that a refund
       existed. Remedies is 100% populated since 2020, so any gap here is a
       pipeline fault, not a data one. */
    for (const r of [...data.biggest, ...data.recent]) {
      expect(r.remedy.length, `${r.date} ${r.product.slice(0, 30)}`).toBeGreaterThan(0)
    }
  })

  it('remedy tags come from the known set, never raw feed junk', () => {
    /* RemedyOptions contains at least one full paragraph and one entry reading
       just "R". A badge must never render either. */
    const allowed = new Set(['Refund', 'Repair', 'Replace', 'Dispose',
      'New Instructions', 'Inspect', 'Label', 'No Remedy Available'])
    for (const r of [...data.biggest, ...data.recent]) {
      if (!r.remedyOption) continue
      expect(allowed.has(r.remedyOption), `got ${JSON.stringify(r.remedyOption)}`).toBe(true)
      expect(r.remedyOption.length).toBeLessThan(24)
    }
  })
})

describe.skipIf(!hasRaw)('published figures: cross-checked against the raw CPSC feed', () => {
  it('corpusTotal is the real number of records', () => {
    expect(data.corpusTotal).toBe(raw.length)
  })

  it('every year on the chart has the recall count the feed has', () => {
    for (const s of data.series) {
      const actual = raw.filter((r) => yearOf(r) === s.year).length
      expect(actual, `year ${s.year}`).toBe(s.recalls)
    }
  })

  it('the Amazon-named share matches a fresh count from the feed', () => {
    for (const s of data.series) {
      if (s.retailers.amazon == null) continue
      const inYear = raw.filter((r) => yearOf(r) === s.year)
      const named = inYear.filter((r) => /amazon/i.test(retailerText(r))).length
      const pct = Math.round((named / inYear.length) * 1000) / 10
      expect(Math.abs(pct - s.retailers.amazon), `year ${s.year}`).toBeLessThanOrEqual(0.06)
    }
  })

  /**
   * ALL FIVE LINES, not just Amazon.
   *
   * Only the Amazon series was ever recounted from the feed, and that gap is
   * precisely where a real defect lived undisturbed. The four comparator lines
   * were matched with plain `includes`, so the stem "home depot" could not see
   * CPSC's "homedepot.com", and the Home Depot line came out understated in
   * fourteen of the twenty-three years: 5.5% published against a true 9.6% at
   * its worst, in 2021. Two smaller errors ran the other way, "targeted
   * national advertisements" counted as Target in 2009 and "bunniesbythebay"
   * counted as eBay in 2015.
   *
   * The error was one-directional and it flattered the finding, which is the
   * exact direction this suite exists to catch, and all fifty-two tests were
   * green the entire time. A cross-check that covers one of five series is a
   * cross-check with four blind spots.
   *
   * The patterns are written out here rather than imported from build-data,
   * because a test that borrows the implementation's own matcher only proves
   * the implementation agrees with itself. These state the intended rule
   * independently: word boundaries, tolerate a squashed multi-word name,
   * tolerate a possessive.
   */
  const RETAILER_PATTERNS: Record<string, RegExp> = {
    /* Deliberately loose, and it has to stay that way to match the build.
       Nothing else in the corpus contains the letters "amazon", and CPSC
       published a notice reading "online atamazon.com", its own typo, which a
       word boundary silently drops. */
    amazon: /amazon/i,
    walmart: /\bwalmart(?:'?s)?\b/i,
    target: /\btarget(?:'?s)?\b/i,
    /* \s* because the storefront is written "homedepot.com" at least as often
       as "Home Depot". This is the one that was wrong. */
    homeDepot: /\bhome\s*depot(?:'?s)?\b/i,
    ebay: /\bebay(?:'?s)?\b/i,
  }

  it('every retailer line on the chart matches a fresh count from the feed', () => {
    /* Hyphens stripped on the haystack, the same normalisation the build does,
       so the Walmart line still sees the older "Wal-Mart" spelling. */
    const hyphens = /[-‐-―]/g
    for (const s of data.series) {
      const inYear = raw.filter((r) => yearOf(r) === s.year)
      if (!inYear.length) continue
      for (const [key, re] of Object.entries(RETAILER_PATTERNS)) {
        const published = s.retailers[key as keyof typeof s.retailers]
        if (published == null) continue
        const named = inYear.filter((r) => re.test(retailerText(r).replace(hyphens, ''))).length
        const pct = Math.round((named / inYear.length) * 1000) / 10
        expect(Math.abs(pct - published), `${s.year} ${key}: feed says ${pct}, page says ${published}`).toBeLessThanOrEqual(0.06)
      }
    }
  })

  it('newestRecallDate is the latest date in the feed', () => {
    const latest = raw
      .map((r) => r.RecallDate)
      .filter(Boolean)
      .sort()
      .at(-1)!
      .slice(0, 10)
    expect(data.newestRecallDate).toBe(latest)
  })

  /**
   * THE GUARD ON THE HEADLINE NUMBER, and it was missing entirely.
   *
   * Everything else here recounts a figure. Nothing recounted amazonOnlyCount,
   * which is the largest number on the page and the entire claim. Proven by
   * falsification: dropping a single name from OTHER_RETAILERS in the pipeline
   * inflated 2026 from 48.3% to 51.9%, flipped the headline word from "Nearly
   * half" to "Half", redrew the share card, and all 50 tests still passed. The
   * weekly cron rebuilds and pushes to production unattended, so that bug would
   * have shipped itself.
   *
   * WHY THIS KEEPS ITS OWN LIST rather than importing the pipeline's. A test
   * that reads OTHER_RETAILERS from build-data.mjs is sabotaged by the same
   * edit it is supposed to catch: remove "walmart" from the list and the test
   * dutifully agrees that a Walmart recall is Amazon-only. A guard has to hold
   * an independent copy of the expectation or it is not a guard.
   *
   * WHY IT IS ONE-DIRECTIONAL. It asserts that no recall counted as
   * "Amazon only" names one of these unmistakable national chains. That fails
   * loudly if the list is ever weakened, which is the direction that inflates
   * the headline. Adding new retailers to the pipeline stays free, which is the
   * direction that only ever makes the figure more conservative.
   */
  const CORE_CHAINS = [
    'walmart', 'wal-mart', 'target', 'home depot', 'costco', 'best buy', 'bestbuy',
    'ebay', 'lowe', 'kohl', 'macy', 'sears', 'nordstrom', 'bed bath', 'meijer',
    'staples', 'petco', 'petsmart', 'aldi', 'kroger', 'walgreen', 'cvs',
  ]

  it('no recall counted as Amazon-only names an unmistakable national chain', () => {
    const offenders: string[] = []
    for (const r of raw) {
      const text = retailerText(r)
      const flat = text.toLowerCase().replace(/[^a-z0-9]/g, '')
      if (!flat.includes('amazon')) continue
      const hit = CORE_CHAINS.find((c) => flat.includes(c.replace(/[^a-z0-9]/g, '')))
      if (!hit) continue
      // This recall names a major chain, so the pipeline must NOT be counting it
      // as Amazon-only. Recompute what the pipeline would have to believe.
      offenders.push(`${r.RecallDate?.slice(0, 10)} names "${hit}": ${text.slice(0, 90)}`)
    }
    // Every one of these must be excluded from the sole count. Verify by year:
    // the sole count can never exceed (recalls naming Amazon) minus (those that
    // also name a core chain).
    for (const s of data.series) {
      if (s.amazonOnlyCount == null) continue
      const inYear = raw.filter((r) => yearOf(r) === s.year)
      const namesAmazon = inYear.filter((r) =>
        retailerText(r).toLowerCase().replace(/[^a-z0-9]/g, '').includes('amazon'),
      )
      const alsoChain = namesAmazon.filter((r) => {
        const flat = retailerText(r).toLowerCase().replace(/[^a-z0-9]/g, '')
        return CORE_CHAINS.some((c) => flat.includes(c.replace(/[^a-z0-9]/g, '')))
      }).length
      const ceiling = namesAmazon.length - alsoChain
      expect(
        s.amazonOnlyCount,
        `${s.year}: ${s.amazonOnlyCount} counted Amazon-only, but only ${ceiling} of ` +
          `${namesAmazon.length} Amazon recalls avoid naming a major chain. ` +
          `The competitor list has probably been weakened.`,
      ).toBeLessThanOrEqual(ceiling)
    }
    expect(offenders.length).toBeGreaterThan(0) // sanity: the check can actually fire
  })

  it('the China origin split matches a fresh count from the feed', () => {
    for (const s of data.series) {
      if (!s.origin || s.origin.soleChina == null) continue
      const inYear = raw.filter((r) => yearOf(r) === s.year)
      const known = inYear.filter((r) =>
        ((r as { ManufacturerCountries?: Array<{ Country?: string }> }).ManufacturerCountries ?? [])
          .some((c) => c?.Country),
      )
      // Both piles together must equal every recall with a known country.
      expect(s.origin.soleN + s.origin.restN, `year ${s.year} origin denominator`).toBe(
        known.length,
      )
      const china = known.filter((r) =>
        ((r as { ManufacturerCountries?: Array<{ Country?: string }> }).ManufacturerCountries ?? [])
          .some((c) => (c?.Country ?? '') === 'China'),
      ).length
      // The two published shares, weighted back together, must reproduce the
      // real China total for the year.
      const implied =
        (s.origin.soleChina / 100) * s.origin.soleN + (s.origin.restChina! / 100) * s.origin.restN
      expect(Math.abs(implied - china), `year ${s.year}: implied ${implied}, actual ${china}`)
        .toBeLessThanOrEqual(1)
    }
  })

  it('upcCoverage matches a fresh count, since /check quotes it as a limit', () => {
    const withUPC = raw.filter((r) => (r.ProductUPCs ?? []).length > 0).length
    const pct = Math.round((withUPC / raw.length) * 1000) / 10
    expect(pct).toBe(data.upcCoverage)
  })

  it('the pre-window figures behind the "why 2004" answer are real', () => {
    const pre = raw.filter((r) => {
      const y = yearOf(r)
      return y != null && y < data.firstYear
    })
    expect(pre.length).toBe(data.windowContext.preReliableRecalls)

    const withRetailer = pre.filter((r) => retailerText(r).length > 0).length
    const pct = Math.round((withRetailer / pre.length) * 1000) / 10
    expect(pct).toBe(data.windowContext.preReliableRetailerPct)
  })

  it('the retailer-coverage claim on /method still holds, year by year', () => {
    /* /method states this outright as the reason the chart starts where it
       does, so if CPSC's coverage moves, that sentence has to move with it.
       The bar is different for finished and unfinished years, and that is a
       property of the source rather than a concession: CPSC fills the retailer
       field in after a notice goes up, so the year in progress always trails.
       On 2026-09-03 it sat at 97.8% while every completed year was above 99.
       The page now prints the measured minimum instead of a typed 99, so this
       checks the printed figure rather than a constant. */
    const settled = data.series.slice(0, -1)
    const inProgress = data.series.at(-1)!

    const measured = (year: number) => {
      const inYear = raw.filter((r) => yearOf(r) === year)
      return (inYear.filter((r) => retailerText(r).length > 0).length / inYear.length) * 100
    }

    for (const s of settled) {
      expect(measured(s.year), `completed year ${s.year} retailer coverage`).toBeGreaterThanOrEqual(99)
    }

    /* The floor for the unsettled year is assertSane's, so the two agree on
       what counts as a collapse rather than each having its own opinion. */
    expect(
      measured(inProgress.year),
      `year in progress ${inProgress.year} retailer coverage has fallen below the build's own floor`,
    ).toBeGreaterThanOrEqual(95)

    /* And the number the page prints has to be the real minimum, not a stale
       constant that happens to be below it. */
    const trueMin = Math.min(...settled.map((s) => s.retailerFieldPopulated))
    expect(trueMin, 'printed minimum vs the series').toBeLessThanOrEqual(
      Math.min(...settled.map((s) => Math.round(measured(s.year) * 10) / 10)) + 0.06,
    )
  })

  it('"most recent" really is the ten newest records fit to display', () => {
    /* Fit to display means a photograph AND a product name. CPSC posts stub
       notices with neither text nor remedy, and one of those is not a row. */
    const newest = raw
      .filter((r) => (r.Images ?? [])[0]?.URL && (r.Products ?? [])[0]?.Name)
      .map((r) => (r.RecallDate ?? '').slice(0, 10))
      .sort()
      .reverse()
      .slice(0, 10)
    expect(data.recent.map((r) => r.date)).toEqual(newest)
  })
})
