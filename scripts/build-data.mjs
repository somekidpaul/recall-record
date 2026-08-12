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
const SITE = 'https://recallrecord.com'

/**
 * TWO WINDOWS, and each is set by the field it describes rather than by taste.
 *
 * CHART_FIRST_YEAR = 2004. The chart measures exactly one field, the retailer
 * sentence, and that field is populated on 99%+ of recalls in every year from
 * 2004 onward, in the same prose format it uses today. Verified year by year.
 * Before that it is mostly blank, so counting "recalls naming Amazon" there
 * would measure the field's own emptiness.
 *
 * This used to be 2015, justified in a comment as "Amazon's retail presence is
 * only meaningful from here". That is a story, not a measurement, and starting
 * a trend line at the point the trend begins is the single most damaging thing
 * a reader can catch a chart doing. Amazon is 0.0% in 2004, so the longer run
 * is also the more honest one.
 *
 * COVERAGE_FIRST_YEAR = 2015, deliberately different. The field-coverage
 * section describes what the records contain NOW, and averaging it across 2004
 * would misreport rather than inform: RemedyOptions did not exist before 2009
 * (0% for 2004-2008, 93%+ from 2011), so a blended figure would read "partly
 * filled in" when the truth is "the field was invented mid-window".
 */
const CHART_FIRST_YEAR = 2004
const COVERAGE_FIRST_YEAR = 2015

/**
 * The window used for ratio comparisons.
 *
 * "Amazon grew 4.1x while online selling grew 1.7x" needs both baselines to be
 * large enough for a ratio to mean anything. Against the 2004 baseline Amazon
 * is 0.0%, so the multiplier is undefined and every figure derived from it is
 * noise. The comparison therefore stays pinned to 2015 while the chart shows
 * the longer history, and the page says so rather than quietly mixing them.
 */
const RATIO_FIRST_YEAR = 2015

/**
 * The remedy words CPSC actually uses, as a whitelist.
 *
 * RemedyOptions is meant to be a tidy enum and mostly is, but the raw feed
 * contains at least one entry holding a full remedy paragraph and one reading
 * just "R". Matching against a known set keeps a malformed record from putting
 * a paragraph into a badge, and keeps an unrecognised value out rather than
 * guessing at it.
 */
const REMEDY_TAGS = new Set([
  'Refund',
  'Repair',
  'Replace',
  'Dispose',
  'New Instructions',
  'Inspect',
  'Label',
  'No Remedy Available',
])

/**
 * The full remedy, for the twenty records shipped as lists.
 *
 * CPSC writes this as an instruction to the reader ("Consumers should stop
 * using the charger immediately... Contact A2batt to receive a full refund"),
 * which is the single most useful sentence in a recall notice and the one thing
 * the lookup never showed. Both the prose and the one-word tag are returned:
 * the tag drives a badge, the prose is the answer.
 */
const remedyOf = (r) => ({
  remedy: ((r.Remedies ?? [])[0]?.Name ?? '').trim(),
  remedyOption:
    (r.RemedyOptions ?? [])
      .map((o) => (typeof o === 'string' ? o : o?.Option))
      .find((o) => REMEDY_TAGS.has(o)) ?? '',
})

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
    if (!/^\d{4}$/.test(y) || Number(y) < CHART_FIRST_YEAR) continue
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

    /**
     * THE SHARPEST FORM OF THE COUNTERARGUMENT, and the reason the longer
     * window is worth having.
     *
     * "Everyone shops online now" was previously answered with a pair of
     * multipliers: Amazon grew 4.1x, online selling overall grew 1.7x. That
     * works, but it asks the reader to hold two ratios in their head, and it
     * collapses entirely against the 2004 baseline where Amazon is 0.0% and
     * the multiplier is undefined.
     *
     * This asks the question directly instead. Among recalls that WERE sold
     * online, what share name Amazon? If the answer rises, Amazon is taking
     * share inside e-commerce rather than riding it, and the growth of online
     * shopping cannot be the explanation. No ratio, no baseline problem.
     *
     * It runs 0.0% in 2004 to 70.1% in 2026.
     */
    const onlineBlobs = blobs.filter(ONLINE_DEFS.mid)

    /**
     * COUNTRY OF ORIGIN, CROSS-TABBED AGAINST THE AMAZON MEASURE.
     *
     * ManufacturerCountries is populated on 98.6% to 100% of recalls in every
     * year since 2015 and was previously read only to draw a coverage ring.
     * Split the same way the chart splits, it carries a second finding: in 2026
     * 95.2% of the recalls naming Amazon alone are Chinese-made, against 66.8%
     * of everything else. The gap is positive in all twelve years measured.
     *
     * WHAT THIS IS NOT. It is a correlation, and the page has to say so as
     * loudly as it says the number. The likely mechanism is that a marketplace
     * of third-party sellers carries more direct-from-manufacturer importers
     * than a shelf at Target does, which is a fact about how the two channels
     * are structured, not evidence that one causes unsafe manufacturing.
     *
     * Coverage is emitted alongside so the page can never quote a share without
     * being able to say what it is a share OF.
     */
    const soleOf = (b) => b.includes('amazon') && !OTHER_RETAILERS.some((o) => b.includes(o))
    const known = recalls
      .map((r, i) => ({ r, sole: soleOf(blobs[i]) }))
      .filter(({ r }) => (r.ManufacturerCountries ?? []).some((c) => c?.Country))
    const isChina = ({ r }) =>
      (r.ManufacturerCountries ?? []).some((c) => (c?.Country ?? '') === 'China')
    const soleKnown = known.filter((x) => x.sole)
    const restKnown = known.filter((x) => !x.sole)

    const origin = {
      coverage: pct(known.length, n),
      soleN: soleKnown.length,
      restN: restKnown.length,
      soleChina: soleKnown.length ? pct(soleKnown.filter(isChina).length, soleKnown.length) : null,
      restChina: restKnown.length ? pct(restKnown.filter(isChina).length, restKnown.length) : null,
    }

    return {
      year: Number(year),
      origin,
      recalls: n,
      retailerFieldPopulated: pct(blobs.filter((b) => b.length > 0).length, n),
      retailers,
      amazonOnly: pct(amazonOnly, n),
      amazonOnlyCount: amazonOnly,
      online,
      medianDescriptionChars: lens[Math.floor(lens.length / 2)] ?? null,
      amazonAmongShort: pct(short.filter((b) => b.includes('amazon')).length, short.length),
      amazonOfOnline: pct(onlineBlobs.filter((b) => b.includes('amazon')).length, onlineBlobs.length),
      onlineCount: onlineBlobs.length,
      shortCount: short.length,
    }
  })

  /**
   * WHY THE WINDOW STARTS WHERE IT DOES, computed rather than asserted.
   *
   * The corpus reaches back to 1973, which invites the fair question of why a
   * page about it only looks at part. The answer has two halves and only one of
   * them is a constraint:
   *
   *   1. A constraint. The Retailers field, the single field this entire piece
   *      rests on, is essentially absent before 2001. Measuring "share of
   *      recalls naming Amazon" against a decade where almost no recall names
   *      any retailer would be measuring the field's own emptiness.
   *
   *   2. A choice. From 2001 the field is populated on 99%+ of records and the
   *      prose format is the same one it uses today, so the data would support
   *      starting earlier.
   *
   * Publishing both halves is the point. A cutoff presented as forced, when it
   * was chosen, is exactly the kind of quiet thumb on the scale this page is
   * about. Every figure here is measured so the claim cannot drift.
   */
  const perYear = new Map()
  for (const r of all) {
    const y = Number((r.RecallDate ?? '').slice(0, 4))
    if (!Number.isInteger(y)) continue
    if (!perYear.has(y)) perYear.set(y, [])
    perYear.get(y).push(r)
  }
  const allYears = [...perYear.keys()].sort((a, b) => a - b)
  const populated = (rs) => pct(rs.filter((r) => retailerText(r).length > 0).length, rs.length)

  // First year the field is reliable, and reliable in every year after it, so a
  // single good year early on cannot be mistaken for the start of the record.
  const firstReliableYear = allYears.find(
    (y, i) => allYears.slice(i).every((z) => (populated(perYear.get(z)) ?? 0) >= 99),
  )
  const preReliable = all.filter(
    (r) => Number((r.RecallDate ?? '').slice(0, 4)) < firstReliableYear,
  )
  const reliableStartRows = perYear.get(firstReliableYear)

  const windowContext = {
    corpusFirstYear: allYears[0],
    firstReliableYear,
    preReliableRecalls: preReliable.length,
    preReliableRetailerPct: populated(preReliable),
    amazonAtReliableStart: pct(
      reliableStartRows.filter((r) => retailerText(r).includes('amazon')).length,
      reliableStartRows.length,
    ),
    analyzedFrom: CHART_FIRST_YEAR,
  }

  // Field coverage, published on the methodology page including the failures.
  const scope = all.filter((r) => Number((r.RecallDate ?? '').slice(0, 4)) >= COVERAGE_FIRST_YEAR)
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
        ...remedyOf(r),
      }
    })
    .filter(Boolean)
    .sort((a, b) => b.units - a.units)
    .slice(0, 10)

  /**
   * The ten most recent recalls, full stop.
   *
   * /check used to build this list by taking `biggest` and re-sorting it by
   * date, which is not the same thing and was quietly wrong. `biggest` is the
   * ten LARGEST recalls of the year by units; sorting those by date gives the
   * most recent members of a set chosen for size. On the data at time of
   * writing that produced Aug 6, Jul 30, Jul 9, Jul 2 and Apr 30 under a
   * heading that said "Most recent recalls", with hundreds of genuinely more
   * recent recalls missing because they were not big enough to make a list the
   * reader was never shown.
   *
   * This one is sorted by date across the whole working set and nothing else.
   *
   * Units are optional here, unlike in `biggest`. NumberOfUnits is prose and
   * does not always parse, and dropping a recall from a recency list because
   * its unit count is unreadable would reintroduce exactly the kind of silent
   * selection this is fixing. RecallRow already guards on `units != null`.
   * Images are required, which costs nothing: coverage.images is 100%.
   */
  const recent = scope
    .map((r) => {
      const products = r.Products ?? []
      const image = (r.Images ?? [])[0]
      if (!image?.URL) return null
      const units = products.map((p) => parseUnits(p.NumberOfUnits)).filter((n) => n != null)
      const max = units.length ? Math.max(...units) : null
      return {
        title: r.Title ?? '',
        product: products[0]?.Name ?? '',
        units: max,
        unitsRaw:
          max == null
            ? ''
            : products.find((p) => parseUnits(p.NumberOfUnits) === max)?.NumberOfUnits ?? '',
        date: (r.RecallDate ?? '').slice(0, 10),
        image: image.URL.replace(/ /g, '%20'),
        imageCaption: image.Caption ?? '',
        url: r.URL ?? '',
        retailerText: (r.Retailers ?? [])[0]?.Name ?? '',
        hazard: (r.Hazards ?? [])[0]?.Name ?? '',
        ...remedyOf(r),
      }
    })
    .filter(Boolean)
    .sort((a, b) => b.date.localeCompare(a.date))
    .slice(0, 10)

  const dates = scope.map((r) => r.RecallDate).filter(Boolean).sort()

  /* How much of the latest year is actually in hand, so the page can state the
     partial-year caveat precisely instead of just waving at it. */
  const newest = dates.at(-1) ?? null
  const latestYear = series.at(-1)
  const monthsElapsed = newest ? Number(newest.slice(5, 7)) : null

  /* No build timestamp in the payload, deliberately. It made every run differ
     from the last, so the weekly job committed every week whether or not a
     single figure had moved. The data vintage is newestRecallDate and the run
     time is the commit date; a field that only records "I ran" is noise that
     defeats change detection. */
  return {
    partialYear: latestYear
      ? { year: latestYear.year, throughDate: newest?.slice(0, 10) ?? null, monthsElapsed }
      : null,
    source: API,
    license: 'US Government public domain',
    corpusTotal: all.length,
    windowContext,
    /* Quoted on /check as the reason it cannot confirm the exact item someone
       is holding. Computed, because a hand-typed "about 4%" is precisely the
       kind of figure that goes quietly wrong. */
    upcCoverage: pct(all.filter((r) => (r.ProductUPCs ?? []).length > 0).length, all.length),
    firstYear: CHART_FIRST_YEAR,
    coverageFirstYear: COVERAGE_FIRST_YEAR,
    ratioFirstYear: RATIO_FIRST_YEAR,
    newestRecallDate: dates.at(-1)?.slice(0, 10) ?? null,
    series,
    coverage,
    trend,
    manufacturerTest,
    biggest,
    recent,
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
/* The origin split ships in the download too. A reader who wants to check the
   second finding should not have to re-derive it from the raw feed when the
   page is asking them to believe it. */
const cols = ['year', 'recalls', 'amazon', 'amazonOnly', 'amazonOnlyCount',
  'walmart', 'target', 'homeDepot', 'ebay', 'soldOnline',
  'chinaAmazonOnly', 'chinaOthers', 'originCoverage']
const csv = [
  cols.join(','),
  ...data.series.map((d) => [
    d.year, d.recalls, d.retailers.amazon, d.amazonOnly, d.amazonOnlyCount,
    d.retailers.walmart, d.retailers.target, d.retailers.homeDepot,
    d.retailers.ebay, d.online.mid,
    d.origin?.soleChina ?? '', d.origin?.restChina ?? '', d.origin?.coverage ?? '',
  ].join(',')),
].join('\n')
await writeFile(join(ROOT, 'public', 'recall-data.csv'), csv + '\n')

/**
 * SEARCH INDEX for /check, shipped as its own file and fetched on demand.
 *
 * WHICH FIELDS, and this was measured rather than guessed. Searching product
 * names alone returns ZERO results for "button battery", a hazard that kills
 * children, when three recalls exist. It also returns zero for "drowning"
 * against 100, and two for "tip-over" against 118. Product names are written
 * as catalogue entries ("Laziza Dressers"), so the hazard almost never appears
 * in them.
 *
 * Adding the notice title and the hazard closes nearly all of that gap.
 * Measured across a dozen realistic consumer queries, Description on top of
 * those adds only a few percent more while nearly doubling the payload, so it
 * is left out. The title arrives for free inside the URL slug, see below.
 *
 * WHICH YEARS: all of them, back to 1973. Trimming to 2005 would have saved
 * about 150KB and silently dropped 2,900 recalls. Old recalls are the ones that
 * matter most here, because the products people are unsure about are the
 * hand-me-down crib and the garage-sale heater.
 *
 * NOT BUNDLED. This never loads with the page. It is fetched when someone
 * first focuses the search field, so the essay costs nothing to read.
 */
const URL_PREFIX = 'https://www.cpsc.gov/Recalls/'
const clean = (s) =>
  (s ?? '').replace(/<[^>]*>/g, ' ').replace(/&#?\w+;/g, ' ').replace(/\s+/g, ' ').trim()

const searchIndex = raw
  .filter((r) => /^\d{4}/.test(r.RecallDate ?? ''))
  .sort((a, b) => (b.RecallDate ?? '').localeCompare(a.RecallDate ?? ''))
  .map((r) => {
    const url = r.URL ?? ''
    /*
     * NO TITLE FIELD, and it is not an omission.
     *
     * A CPSC recall URL is the notice title slugified:
     *   2026/A2batt-Recalls-EEMB-Lithium-Coin-Battery-Chargers-Due-to-Risk-...
     * The URL has to ship anyway so results can link out, so shipping the
     * title beside it was paying twice for the same words. Dropping it cut the
     * payload 20%.
     *
     * The catch was punctuation: the slug turns "Fisher-Price" into
     * "Fisher Price", so a hyphenated query lost 63% of its hits. Normalising
     * punctuation to spaces on BOTH the haystack and the query fixes that and
     * is an improvement in its own right, since "tip-over" and "tip over" now
     * both return 191 where they used to return 123 and 82. Measured after the
     * change, the worst remaining loss is 3% on very broad hazard words.
     */
    const row = {
      n: (r.Products ?? []).map((p) => p.Name).filter(Boolean).join(' | ').slice(0, 110),
      /* 260, not 150. The hazard is the payload of a search result, and it is
         what the expanded row shows in full. Median hazard length is 118 and
         the 90th percentile is 261, so this holds nine in ten complete for
         29KB. The old 150 cut most of them mid-sentence. */
      h: (r.Hazards ?? []).map((x) => clean(x.Name)).join('; ').slice(0, 260),
      y: (r.RecallDate ?? '').slice(0, 10),
      u: url.startsWith(URL_PREFIX) ? url.slice(URL_PREFIX.length) : url,
    }
    // Present on only ~3.5% of recent recalls, but where it exists it is the
    // one identifier that can confirm the exact item, so it is worth the bytes.
    const upcs = (r.ProductUPCs ?? []).map((x) => x?.UPC).filter(Boolean)
    if (upcs.length) row.c = upcs.join(' ')

    /**
     * THE REMEDY TAG, not the remedy prose, and the difference is the payload.
     *
     * Someone who finds their own product in this list needs to know what to do
     * about it, and until now the page told them the hazard and nothing else.
     * The full instruction lives in `Remedies` and is genuinely useful, but it
     * runs a 300-character median across 9,944 records, which is roughly 3MB
     * before compression. That is four times the entire current index to serve
     * a field most searches never read.
     *
     * `RemedyOptions` is the same fact in one word (Refund, Repair, Replace),
     * so the index carries the word and the expanded row links to the notice
     * for the detail. The full prose IS shipped for the twenty records on the
     * essay and /check lists, where it costs nothing.
     *
     * Filtered against a known set, because the field is not clean: one 2020+
     * record has the entire remedy paragraph stuffed into it and another just
     * says "R".
     */
    const opt = (r.RemedyOptions ?? [])
      .map((o) => (typeof o === 'string' ? o : o?.Option))
      .find((o) => REMEDY_TAGS.has(o))
    if (opt) row.o = opt
    return row
  })

await writeFile(
  join(ROOT, 'public', 'search-index.json'),
  JSON.stringify({ prefix: URL_PREFIX, rows: searchIndex }),
)

/**
 * PRODUCT PHOTOGRAPHS, in their own file and loaded later than everything else.
 *
 * A search result should be able to open the same way a row in the biggest-
 * recalls list opens, photograph included. Putting the image path in the search
 * index costs 100KB compressed, which would undo the work that just took the
 * index from 858KB to 676KB on the wire.
 *
 * So they ship separately, as an array parallel to the index and in the same
 * order, and nothing fetches it until someone actually opens a product. Most
 * people who search never open one, and they never pay for this. It compresses
 * to about 93KB because the paths share a long common prefix.
 *
 * An empty string means CPSC published no photograph for that recall, which is
 * true of 1,720 of the 9,944.
 */
const IMAGE_PREFIX = 'https://www.cpsc.gov/'
await writeFile(
  join(ROOT, 'public', 'search-images.json'),
  JSON.stringify({
    prefix: IMAGE_PREFIX,
    i: raw
      .filter((r) => /^\d{4}/.test(r.RecallDate ?? ''))
      .sort((a, b) => (b.RecallDate ?? '').localeCompare(a.RecallDate ?? ''))
      .map((r) => {
        const u = (r.Images ?? [])[0]?.URL
        if (!u) return ''
        return u.startsWith(IMAGE_PREFIX) ? u.slice(IMAGE_PREFIX.length) : u
      }),
  }),
)

/* The sitemap is generated, not hand-written. It was static, and the weekly
   workflow staged it expecting a change, so its lastmod would have frozen at
   the date it was first written while the data underneath kept moving. A
   sitemap that lies about freshness is worse than no sitemap. */
await writeFile(
  join(ROOT, 'public', 'sitemap.xml'),
  `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url>
    <loc>${SITE}/</loc>
    <lastmod>${data.newestRecallDate}</lastmod>
    <changefreq>weekly</changefreq>
  </url>
  <url>
    <loc>${SITE}/check</loc>
    <lastmod>${data.newestRecallDate}</lastmod>
    <changefreq>weekly</changefreq>
  </url>
  <url>
    <loc>${SITE}/method</loc>
    <lastmod>${data.newestRecallDate}</lastmod>
    <changefreq>weekly</changefreq>
  </url>
</urlset>
`,
)
await writeFile(join(ROOT, 'public', 'robots.txt'), `User-agent: *\nAllow: /\n\nSitemap: ${SITE}/sitemap.xml\n`)

/* The share-card alt text carries live figures, so it was hand-written and it
   drifted: it still said 61.2% a week after the chart had moved to 60.9%. Every
   other number on this page is computed, and this one had no business being the
   exception. Generated from the same series the chart draws.

   A silent no-op would recreate the original bug, so a miss is fatal. */
{
  const f = data.series[0]
  const l = data.series.at(-1)
  const alt =
    `A line chart showing the share of US product recalls that name Amazon as ` +
    `the only store, rising from ${f.amazonOnly}% in ${f.year} to ${l.amazonOnly}% ` +
    `in ${l.year} while Walmart, Target and Home Depot stay flat.`
  const HTML = join(ROOT, 'index.html')
  const html = await readFile(HTML, 'utf8')
  const re = /(<meta property="og:image:alt" content=")[^"]*(")/
  if (!re.test(html)) {
    console.error('\n  FAIL: og:image:alt not found in index.html.')
    process.exit(1)
  }
  await writeFile(HTML, html.replace(re, `$1${alt}$2`))
}

const latest = data.series.at(-1)
console.log(`\n  ${data.corpusTotal} recalls, ${data.series.length} years, newest ${data.newestRecallDate}`)
console.log(`  ${latest.year}: Amazon named in ${latest.retailers.amazon}%, sole retailer in ${latest.amazonOnly}%`)
console.log(`  wrote ${OUT}\n`)
