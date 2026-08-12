/**
 * Real HTML per route, written after `vite build`.
 *
 * THE BUG THIS FIXES.
 *
 * There is one index.html, and vercel.json rewrote /check and /method to it.
 * That is the ordinary way to serve a client-routed app and it is fine for
 * humans, because React swaps the body and Check/Method set document.title on
 * mount. It is not fine for anything that reads the document instead of running
 * it.
 *
 * Every route shipped the HOME page's <head>. Measured on the live site, all
 * three URLs returned:
 *
 *   <link rel="canonical" href="https://recallrecord.com/">
 *
 * A canonical is not a hint, it is a declaration that this URL is a duplicate
 * of that one. So /check and /method were each telling Google, in the only
 * language Google trusts for this, "do not index me, index the homepage
 * instead" — while sitemap.xml listed all three as separate pages. The two
 * signals contradicted each other, and canonical wins.
 *
 * They also inherited the home page's title, description, og:title,
 * og:description, og:image:alt and the JSON-LD Dataset block. A link to /check
 * posted anywhere unfurled as the Amazon headline, and the one page on the site
 * that is a usable tool described itself as an essay about Amazon.
 *
 * document.title in a useEffect does not solve this. It runs after the document
 * is parsed, fixes exactly one tag, and social scrapers do not execute JS at
 * all.
 *
 * WHAT THIS DOES.
 *
 * Copies dist/index.html once per route and rewrites the head. The rewrites
 * assert: if a pattern stops matching because index.html changed, the build
 * fails loudly here rather than silently shipping the home page's metadata
 * again. That is the same rule build-data.mjs follows for og:image:alt.
 */
import { readFile, writeFile } from 'node:fs/promises'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..')
const DIST = join(ROOT, 'dist')
const SITE = 'https://recallrecord.com'

const data = JSON.parse(await readFile(join(ROOT, 'src', 'data', 'recalls.json'), 'utf8'))
const corpus = data.corpusTotal.toLocaleString()

const ROUTES = [
  {
    file: 'check.html',
    path: '/check',
    title: `Check a product for recalls | The Recall Record`,
    description: `Search ${corpus} US federal product recall notices going back to 1973, by product name, notice title or hazard. Free government data, with the gaps in it stated plainly.`,
    ogTitle: 'Check a product for recalls',
    ogDescription: `Search ${corpus} federal recall notices back to 1973. It also says what the record cannot tell you: only ${data.upcCoverage}% of notices carry a barcode.`,
    imageAlt:
      'A search field for looking up US product recall notices by product name, title or hazard.',
  },
  {
    file: 'method.html',
    path: '/method',
    title: 'How this was counted | The Recall Record',
    description: `Why this chart starts in ${data.firstYear}, what "names Amazon" actually measures, how the finding could have been fake, and how complete every field in the federal record is.`,
    ogTitle: 'How this was counted, and where it falls short',
    ogDescription: `Why the chart starts in ${data.firstYear}, what the number does and does not mean, and the one claim this evidence will not support.`,
    imageAlt:
      'Coverage rings showing how completely each field in the CPSC recall record is filled in.',
  },
]

const html = await readFile(join(DIST, 'index.html'), 'utf8')

/**
 * ESCAPE BEFORE SUBSTITUTING, and this is not defensive tidiness.
 *
 * The /method description reads: what "names Amazon" actually measures. Those
 * are real double quotes, and they went into a double-quoted HTML attribute
 * verbatim:
 *
 *   content="Why this chart starts in 2004, what "names Amazon" actually ..."
 *
 * Which closes the attribute at the third quote. Every parser then read the
 * page description as the seven words before it, and the rest became stray
 * attributes on the meta tag. It looked fine in the source file and fine in the
 * browser, because nothing renders a meta description, so the only way to catch
 * it was to grep the built HTML and notice the tag no longer matched.
 *
 * Escaping every value means a future description can contain whatever
 * punctuation it needs without anyone having to remember this.
 */
const esc = (s) =>
  String(s)
    .replace(/&/g, '&amp;')
    .replace(/"/g, '&quot;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')

/** Replace exactly once, or fail the build saying which pattern went stale. */
function sub(source, pattern, replacement, what, route) {
  const matches = source.match(pattern)
  if (!matches) {
    console.error(`\n  FAIL: could not rewrite ${what} for ${route}.`)
    console.error('  index.html changed shape. Update the pattern in scripts/build-routes.mjs.')
    process.exit(1)
  }
  return source.replace(pattern, replacement)
}

for (const r of ROUTES) {
  let out = html
  out = sub(out, /<title>[^<]*<\/title>/, `<title>${esc(r.title)}</title>`, '<title>', r.path)
  out = sub(
    out,
    /(<meta\s+name="description"\s+content=")[^"]*(")/,
    `$1${esc(r.description)}$2`,
    'meta description',
    r.path,
  )
  out = sub(
    out,
    /(<link rel="canonical" href=")[^"]*(")/,
    `$1${SITE}${r.path}$2`,
    'canonical',
    r.path,
  )
  out = sub(
    out,
    /(<meta property="og:url" content=")[^"]*(")/,
    `$1${SITE}${r.path}$2`,
    'og:url',
    r.path,
  )
  out = sub(
    out,
    /(<meta property="og:title" content=")[^"]*(")/,
    `$1${esc(r.ogTitle)}$2`,
    'og:title',
    r.path,
  )
  out = sub(
    out,
    /(<meta\s+property="og:description"\s+content=")[^"]*(")/,
    `$1${esc(r.ogDescription)}$2`,
    'og:description',
    r.path,
  )
  out = sub(
    out,
    /(<meta name="twitter:title" content=")[^"]*(")/,
    `$1${esc(r.ogTitle)}$2`,
    'twitter:title',
    r.path,
  )
  out = sub(
    out,
    /(<meta\s+name="twitter:description"\s+content=")[^"]*(")/,
    `$1${esc(r.ogDescription)}$2`,
    'twitter:description',
    r.path,
  )
  out = sub(
    out,
    /(<meta property="og:image:alt" content=")[^"]*(")/,
    `$1${esc(r.imageAlt)}$2`,
    'og:image:alt',
    r.path,
  )

  /* og:type stays "article" on the essay and becomes "website" on the two
     utility pages, which is what they are. */
  out = out.replace(
    /(<meta property="og:type" content=")article(")/,
    `$1website$2`,
  )

  /* The JSON-LD describes the retailer dataset, which is the home page's
     subject. Leaving it verbatim on /check would claim that page IS the
     dataset. Only the url is repointed; the description of the data is still
     true, and `mainEntityOfPage` is what ties it to the right document. */
  out = out.replace(
    /("url":\s*")https:\/\/recallrecord\.com\/(")/,
    `$1${SITE}${r.path}$2`,
  )

  /*
   * READ BACK WHAT WAS WRITTEN AND CHECK IT SURVIVED.
   *
   * The first version of this guard counted quotes per meta tag on the theory
   * that a broken one would be odd. It does not work, and falsifying it is what
   * showed that: the actual broken tag reads
   *
   *   content="... what "names Amazon" actually ..."
   *
   * which is FOUR quotes for that attribute, an even number, so the guard
   * passed while the bug was live. A check that cannot fail on the bug it was
   * written for is worse than no check, because it reports safety.
   *
   * This reads each value back out with the same pattern a parser would use and
   * compares it to what was meant to go in. If an early quote truncated it, the
   * round trip loses text and the build stops. That fails on the real bug,
   * verified by putting the bug back.
   */
  const roundTrip = [
    ['<title>', /<title>([^<]*)<\/title>/, esc(r.title)],
    ['description', /name="description"\s+content="([^"]*)"/, esc(r.description)],
    ['og:title', /og:title" content="([^"]*)"/, esc(r.ogTitle)],
    ['og:description', /og:description"\s+content="([^"]*)"/, esc(r.ogDescription)],
    ['og:image:alt', /og:image:alt" content="([^"]*)"/, esc(r.imageAlt)],
  ]
  for (const [what, pattern, expected] of roundTrip) {
    const got = (out.match(pattern) ?? [])[1]
    if (got !== expected) {
      console.error(`\n  FAIL: ${what} did not survive being written into ${r.file}.`)
      console.error(`    expected: ${String(expected).slice(0, 100)}`)
      console.error(`    got     : ${String(got).slice(0, 100)}`)
      console.error('  Usually an unescaped quote closing the attribute early.')
      process.exit(1)
    }
  }

  await writeFile(join(DIST, r.file), out)
  console.log(`  wrote dist/${r.file}  canonical ${SITE}${r.path}  ${roundTrip.length} fields verified`)
}

console.log(`\n  ${ROUTES.length} route documents written.\n`)
