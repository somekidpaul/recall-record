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

  it('newestRecallDate is the latest date in the feed', () => {
    const latest = raw
      .map((r) => r.RecallDate)
      .filter(Boolean)
      .sort()
      .at(-1)!
      .slice(0, 10)
    expect(data.newestRecallDate).toBe(latest)
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

  it('the claim "99% or more in every year since 2004" still holds', () => {
    /* /method states this outright as the reason the chart starts where it
       does. If CPSC's retailer coverage ever dips below it, that sentence
       becomes false and the window needs revisiting. */
    for (const s of data.series) {
      const inYear = raw.filter((r) => yearOf(r) === s.year)
      const withRetailer = inYear.filter((r) => retailerText(r).length > 0).length
      const pct = (withRetailer / inYear.length) * 100
      expect(pct, `year ${s.year} retailer coverage`).toBeGreaterThanOrEqual(99)
    }
  })

  it('"most recent" really is the ten newest records that have a photograph', () => {
    const newest = raw
      .filter((r) => (r.Images ?? [])[0]?.URL)
      .map((r) => (r.RecallDate ?? '').slice(0, 10))
      .sort()
      .reverse()
      .slice(0, 10)
    expect(data.recent.map((r) => r.date)).toEqual(newest)
  })
})
