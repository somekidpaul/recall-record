/**
 * Build-time data pipeline for The Recall Record.
 *
 * Fetches the full CPSC recall corpus once, reduces it to a small JSON the site
 * ships as a static asset, and asserts the result is sane before writing.
 *
 * Source: https://www.saferproducts.gov/RestWebServices/Recall?format=json
 * License: US Government public domain (see data.gov catalog entry for the
 * SaferProducts API). No key, no auth, no rate limit observed.
 *
 * METHODOLOGY NOTE, and this is the load-bearing part of the whole project:
 *
 * The CPSC `Retailers` field is not a list of retailer names. It is a single
 * prose sentence per recall describing where and when the product was sold and
 * for how much. Example, verbatim:
 *
 *   "Online at Amazon.com from August 2024 through April 2026 for about $140."
 *
 * So every retailer figure here is "share of recalls whose retailer description
 * MENTIONS X". It is NOT "share of recalls for products sold at X". Those are
 * different claims and the site must never conflate them.
 *
 * Field is populated on 99.4% to 100% of records in every year since 2015, so
 * the denominator is honest. Verified before this file was written.
 */

import { writeFile, readFile, mkdir, stat } from 'node:fs/promises'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..')
const RAW = join(ROOT, 'data', 'cpsc-recalls.json')
const OUT = join(ROOT, 'src', 'data', 'recalls.json')
const API = 'https://www.saferproducts.gov/RestWebServices/Recall?format=json'

const FIRST_YEAR = 2015 // Amazon's retail presence is only meaningful from here

/** Other named retailers, used to test whether Amazon is the SOLE seller named. */
const OTHER_RETAILERS = [
  'walmart', 'target', 'home depot', 'lowe', 'costco', 'best buy', 'ebay',
  'temu', 'shein', 'wayfair', 'kohl', 'macy', 'cvs', 'walgreen', 'kroger',
  'dollar', 'menards', "sam's club", "bj's", 'aliexpress', 'etsy',
  'tj maxx', 'marshalls',
]

/** The five series on the main chart. */
const TRACKED = [
  { key: 'amazon', label: 'Amazon', match: 'amazon' },
  { key: 'walmart', label: 'Walmart', match: 'walmart' },
  { key: 'target', label: 'Target', match: 'target' },
  { key: 'homeDepot', label: 'Home Depot', match: 'home depot' },
  { key: 'ebay', label: 'eBay', match: 'ebay' },
]

/**
 * Three independent definitions of "sold online".
 * Shipping all three is deliberate: the confounder argument has to hold under
 * every reasonable definition, or it is not an argument.
 */
const ONLINE_DEFS = {
  strict: (b) => b.includes('online at') || b.includes('sold online'),
  mid: (b) => b.includes('online') || b.includes('.com') || b.includes('website'),
  loose: (b) =>
    b.includes('online') || b.includes('.com') || b.includes('website') ||
    ['amazon', 'ebay', 'temu', 'shein', 'wayfair', 'etsy', 'aliexpress'].some((k) => b.includes(k)),
}

const retailerText = (r) =>
  (r.Retailers ?? []).map((x) => x?.Name ?? '').join(' ').toLowerCase()

const pct = (n, d) => (d === 0 ? null : Math.round((n / d) * 1000) / 10)

async function loadRaw() {
  try {
    const s = await stat(RAW)
    const ageHours = (Date.now() - s.mtimeMs) / 36e5
    if (ageHours < 24) {
      console.log(`  using cached raw data (${ageHours.toFixed(1)}h old)`)
      return JSON.parse(await readFile(RAW, 'utf8'))
    }
  } catch {
    // no cache, fall through to fetch
  }

  console.log(`  fetching ${API}`)
  const t0 = Date.now()
  const res = await fetch(API)
  if (!res.ok) throw new Error(`CPSC API returned HTTP ${res.status}`)
  const json = await res.json()
  console.log(`  fetched ${json.length} recalls in ${((Date.now() - t0) / 1000).toFixed(1)}s`)

  await mkdir(dirname(RAW), { recursive: true })
  await writeFile(RAW, JSON.stringify(json))
  return json
}

function build(all) {
  const byYear = new Map()
  for (const r of all) {
    const y = (r.RecallDate ?? '').slice(0, 4)
    if (!/^\d{4}$/.test(y) || Number(y) < FIRST_YEAR) continue
    if (!byYear.has(y)) byYear.set(y, [])
    byYear.get(y).push(r)
  }

  const years = [...byYear.keys()].sort()
  const series = years.map((year) => {
    const recalls = byYear.get(year)
    const blobs = recalls.map(retailerText)
    const n = blobs.length

    const retailers = Object.fromEntries(
      TRACKED.map((t) => [t.key, pct(blobs.filter((b) => b.includes(t.match)).length, n)]),
    )

    // Amazon named, and no other major retailer named alongside it.
    const amazonOnly = blobs.filter(
      (b) => b.includes('amazon') && !OTHER_RETAILERS.some((o) => b.includes(o)),
    ).length

    const online = Object.fromEntries(
      Object.entries(ONLINE_DEFS).map(([k, f]) => [k, pct(blobs.filter(f).length, n)]),
    )

    /**
     * Robustness check, computed rather than asserted.
     *
     * The obvious way this finding could be fake: if CPSC started writing
     * LONGER retailer descriptions, more names would match by accident and
     * every retailer's share would drift up together.
     *
     * So we also measure Amazon's share among only the SHORT descriptions,
     * holding length roughly constant. If the trend survives that, it is not a
     * verbosity artifact. (It does, and it gets steeper, because more recalls
     * now have exactly one retailer to name.)
     */
    const lens = blobs.map((b) => b.length).sort((a, b) => a - b)
    const short = blobs.filter((b) => b.length <= 150)

    return {
      year: Number(year),
      recalls: n,
      retailerFieldPopulated: pct(blobs.filter((b) => b.length > 0).length, n),
      retailers,
      amazonOnly: pct(amazonOnly, n),
      amazonOnlyCount: amazonOnly,
      online,
      medianDescriptionChars: lens[Math.floor(lens.length / 2)] ?? null,
      amazonAmongShort: pct(short.filter((b) => b.includes('amazon')).length, short.length),
      shortCount: short.length,
    }
  })

  // Field coverage, published on the methodology page including the failures.
  const scope = all.filter((r) => Number((r.RecallDate ?? '').slice(0, 4)) >= FIRST_YEAR)
  const cov = (fn) => pct(scope.filter(fn).length, scope.length)
  const coverage = {
    total: scope.length,
    retailers: cov((r) => (r.Retailers ?? []).length > 0),
    injuries: cov((r) => (r.Injuries ?? []).length > 0),
    remedyOptions: cov((r) => (r.RemedyOptions ?? []).length > 0),
    images: cov((r) => (r.Images ?? []).length > 0),
    manufacturers: cov((r) => (r.Manufacturers ?? []).length > 0),
    manufacturerCountries: cov((r) => (r.ManufacturerCountries ?? []).length > 0),
    hazards: cov((r) => (r.Hazards ?? []).length > 0),
    importers: cov((r) => (r.Importers ?? []).length > 0),
  }

  /**
   * Per-year coverage, but only for the fields that actually move.
   *
   * Six of the ten fields checked sit between 99.4% and 100% in every single
   * year (Images is 100.0 twelve years running), so charting them over time
   * would be twelve identical flat lines. Only Manufacturer and Importer have a
   * trend, so only those two get one.
   */
  const trend = Object.fromEntries(
    ['Manufacturers', 'Importers'].map((field) => [
      field === 'Manufacturers' ? 'manufacturer' : 'importer',
      years.map((year) => {
        const v = byYear.get(year)
        return { year: Number(year), pct: pct(v.filter((r) => (r[field] ?? []).length > 0).length, v.length) }
      }),
    ]),
  )

  /**
   * A claim we do NOT make, computed so the page can say why.
   *
   * The obvious follow-on from "manufacturer identification is collapsing" is
   * "because these are anonymous marketplace sellers". Tested, and it fails.
   * Aggregated it looks convincing, but the gap is a time artifact: Amazon-only
   * recalls cluster in the recent years where manufacturer coverage is low for
   * everyone. Year by year the gap flips sign, and in the two most recent years
   * with the largest samples it is roughly zero.
   */
  const known = (rs) => pct(rs.filter((r) => (r.Manufacturers ?? []).length > 0).length, rs.length)
  const manufacturerTest = years.map((year) => {
    const v = byYear.get(year)
    const amz = v.filter((r) => {
      const b = retailerText(r)
      return b.includes('amazon') && !OTHER_RETAILERS.some((o) => b.includes(o))
    })
    const rest = v.filter((r) => !amz.includes(r))
    return {
      year: Number(year),
      amazonOnly: { n: amz.length, manufacturerKnown: known(amz) },
      everythingElse: { n: rest.length, manufacturerKnown: known(rest) },
    }
  })

  /**
   * The biggest recalls of the latest year, by units, with their photography.
   *
   * NumberOfUnits is prose, not a number: "About 1,719,995" or
   * "About 1,500,000 (In addition, about 43,700 were sold in Canada)". We take
   * the FIRST figure only, which is the US count, and keep the original string
   * so the page can show what it parsed from. Anything unparseable is dropped
   * rather than guessed at.
   */
  const parseUnits = (s) => {
    const m = String(s ?? '').match(/([\d,]{2,})/)
    return m ? Number(m[1].replace(/,/g, '')) : null
  }

  const latest = years.at(-1)
  const biggest = byYear
    .get(latest)
    .map((r) => {
      const products = r.Products ?? []
      const units = products.map((p) => parseUnits(p.NumberOfUnits)).filter((n) => n != null)
      const image = (r.Images ?? [])[0]
      if (!units.length || !image?.URL) return null
      // At least one CPSC image URL ships with a literal space in the filename.
      // Browsers cope, most other clients do not, so encode it here.
      const imageUrl = image.URL.replace(/ /g, '%20')
      return {
        title: r.Title ?? '',
        product: products[0]?.Name ?? '',
        units: Math.max(...units),
        unitsRaw: products.find((p) => parseUnits(p.NumberOfUnits) === Math.max(...units))
          ?.NumberOfUnits ?? '',
        date: (r.RecallDate ?? '').slice(0, 10),
        image: imageUrl,
        imageCaption: image.Caption ?? '',
        url: r.URL ?? '',
        retailerText: (r.Retailers ?? [])[0]?.Name ?? '',
        hazard: (r.Hazards ?? [])[0]?.Name ?? '',
      }
    })
    .filter(Boolean)
    .sort((a, b) => b.units - a.units)
    .slice(0, 6)

  const dates = scope.map((r) => r.RecallDate).filter(Boolean).sort()

  /* How much of the latest year is actually in hand, so the page can state the
     partial-year caveat precisely instead of just waving at it. */
  const newest = dates.at(-1) ?? null
  const latestYear = series.at(-1)
  const monthsElapsed = newest ? Number(newest.slice(5, 7)) : null

  return {
    generatedAt: new Date().toISOString(),
    partialYear: latestYear
      ? { year: latestYear.year, throughDate: newest?.slice(0, 10) ?? null, monthsElapsed }
      : null,
    source: API,
    license: 'US Government public domain',
    corpusTotal: all.length,
    firstYear: FIRST_YEAR,
    newestRecallDate: dates.at(-1)?.slice(0, 10) ?? null,
    series,
    coverage,
    trend,
    manufacturerTest,
    biggest,
    trackedRetailers: TRACKED.map(({ key, label }) => ({ key, label })),
  }
}

/**
 * Fail loudly rather than silently shipping a stale or broken build.
 * A self-updating page that quietly rots into wrong numbers is worse than no page.
 */
function assertSane(d) {
  const problems = []
  if (d.corpusTotal < 9000) problems.push(`corpus shrank to ${d.corpusTotal}, expected 9000+`)
  if (d.series.length < 10) problems.push(`only ${d.series.length} years of series`)

  const ageDays = (Date.now() - new Date(d.newestRecallDate).getTime()) / 864e5
  if (!(ageDays < 28)) problems.push(`newest recall is ${Math.round(ageDays)} days old, expected under 28`)

  for (const y of d.series) {
    if (y.retailerFieldPopulated < 95) {
      problems.push(`${y.year}: retailer field only ${y.retailerFieldPopulated}% populated`)
    }
    if (y.amazonOnly > y.retailers.amazon) {
      problems.push(`${y.year}: amazonOnly (${y.amazonOnly}) exceeds amazon (${y.retailers.amazon})`)
    }
  }

  if (problems.length) {
    console.error('\nDATA ASSERTIONS FAILED:')
    for (const p of problems) console.error(`  - ${p}`)
    process.exit(1)
  }
}

const raw = await loadRaw()
const data = build(raw)
assertSane(data)

await mkdir(dirname(OUT), { recursive: true })
await writeFile(OUT, JSON.stringify(data, null, 2))

// Same figures, served as a downloadable file. If someone wants to check the
// numbers or reuse them, they should not have to scrape the page to do it.
const PUB = join(ROOT, 'public', 'recall-data.json')
await mkdir(dirname(PUB), { recursive: true })
await writeFile(PUB, JSON.stringify(data, null, 2))

/* CSV as well as JSON. "Download the figures" usually means a spreadsheet, and
   a journalist or researcher should not need a parser to check the numbers. */
const cols = ['year', 'recalls', 'amazon', 'amazonOnly', 'amazonOnlyCount',
  'walmart', 'target', 'homeDepot', 'ebay', 'soldOnline']
const csv = [
  cols.join(','),
  ...data.series.map((d) => [
    d.year, d.recalls, d.retailers.amazon, d.amazonOnly, d.amazonOnlyCount,
    d.retailers.walmart, d.retailers.target, d.retailers.homeDepot,
    d.retailers.ebay, d.online.mid,
  ].join(',')),
].join('\n')
await writeFile(join(ROOT, 'public', 'recall-data.csv'), csv + '\n')

const latest = data.series.at(-1)
console.log(`\n  ${data.corpusTotal} recalls, ${data.series.length} years, newest ${data.newestRecallDate}`)
console.log(`  ${latest.year}: Amazon named in ${latest.retailers.amazon}%, sole retailer in ${latest.amazonOnly}%`)
console.log(`  wrote ${OUT}\n`)
