/**
 * Renders the Open Graph card from the same JSON the page uses, so the shared
 * preview can never disagree with the article. Run after `npm run data`.
 */
import { readFile, writeFile } from 'node:fs/promises'
import { execFile } from 'node:child_process'
import { promisify } from 'node:util'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const run = promisify(execFile)
const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..')
const d = JSON.parse(await readFile(join(ROOT, 'src/data/recalls.json'), 'utf8'))

const first = d.series[0]
const last = d.series.at(-1)
const W = 1200, H = 630
const PAD = 72, PLOT_L = PAD, PLOT_R = W - PAD - 190
const PLOT_T = 300, PLOT_B = H - 108
const x = (y) => PLOT_L + ((y - first.year) / (last.year - first.year)) * (PLOT_R - PLOT_L)
const y = (v) => PLOT_B - (v / 90) * (PLOT_B - PLOT_T)
const line = (pick) =>
  d.series.map((s, i) => `${i ? 'L' : 'M'}${x(s.year).toFixed(1)},${y(pick(s)).toFixed(1)}`).join(' ')

/**
 * THE CARD WAS ARGUING WITH ITSELF, and this is the surface strangers see first.
 *
 * It drew and printed `retailers.amazon`, the share of recalls that name Amazon
 * AT ALL, under a headline reading "now name only Amazon", which is the other
 * measure entirely. So the card said "only Amazon" and showed 60.9%, a figure
 * for a claim it was not making. The site's own headline number is 49.6%.
 *
 * Everything here is now the sole-retailer measure: the same number as the
 * headline, the chart's opening state, and the sentence on the card.
 *
 * The headline word is derived for the same reason it is derived on the page.
 * It was hardcoded to "Half" against a figure that reads 49.6% and will cross
 * fifty in both directions, so the card would have gone quietly wrong on a
 * Friday rebuild with nobody watching. Understating is the safe direction.
 */
const headlineWord = last.amazonOnly >= 50 ? 'Half' : 'Nearly half'

const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">
  <rect width="${W}" height="${H}" fill="#100c0a"/>
  <text x="${PAD}" y="86" fill="#fb7a52" font-family="Menlo,monospace" font-size="20" letter-spacing="3">THE RECALL RECORD</text>
  <text x="${PAD}" y="176" fill="#f4f1ee" font-family="Iowan Old Style,Palatino,Georgia,serif" font-size="62">${headlineWord} of US recalls now</text>
  <text x="${PAD}" y="242" fill="#f4f1ee" font-family="Iowan Old Style,Palatino,Georgia,serif" font-size="62">name only Amazon.</text>

  <path d="${line((s) => s.retailers.walmart)}" fill="none" stroke="#8fa8c8" stroke-width="3"/>
  <path d="${line((s) => s.retailers.target)}" fill="none" stroke="#7fb6bd" stroke-width="3"/>
  <path d="${line((s) => s.retailers.homeDepot)}" fill="none" stroke="#84bb93" stroke-width="3"/>
  <path d="${line((s) => s.amazonOnly)}" fill="none" stroke="#fb7a52" stroke-width="7" stroke-linecap="round" stroke-linejoin="round"/>
  <circle cx="${x(last.year).toFixed(1)}" cy="${y(last.amazonOnly).toFixed(1)}" r="9" fill="#fb7a52"/>

  <text x="${x(last.year) + 24}" y="${y(last.amazonOnly) - 6}" fill="#fb7a52" font-family="Menlo,monospace" font-size="30" font-weight="bold">${last.amazonOnly}%</text>
  <text x="${x(last.year) + 24}" y="${y(last.amazonOnly) + 24}" fill="#9b8f86" font-family="Menlo,monospace" font-size="19">Amazon</text>
  <text x="${PAD}" y="${PLOT_B + 34}" fill="#9b8f86" font-family="Menlo,monospace" font-size="19">${first.amazonOnly}% in ${first.year}, ${last.amazonOnly}% in ${last.year}</text>

  <text x="${PAD}" y="${H - 44}" fill="#9b8f86" font-family="Menlo,monospace" font-size="19">${d.corpusTotal.toLocaleString()} CPSC recalls · data through ${d.newestRecallDate}</text>
  <text x="${W - PAD}" y="${H - 44}" fill="#9b8f86" font-family="Menlo,monospace" font-size="19" text-anchor="end">somekidpaul.com</text>
</svg>`

await writeFile(join(ROOT, 'public/og.svg'), svg)

/*
 * The PNG needs a rasteriser, and a missing binary must not take the data
 * refresh down with it. CI installs librsvg2-bin; if it is absent anywhere
 * else the SVG is still written and the previous PNG stays in place, which is
 * a stale social card rather than a failed build. Cosmetic asset, real data.
 */
try {
  await run('rsvg-convert', ['-w', String(W), '-h', String(H), '-o', join(ROOT, 'public/og.png'), join(ROOT, 'public/og.svg')])
  console.log(`  og.png rendered ${W}x${H}: Amazon-only ${first.amazonOnly}% -> ${last.amazonOnly}%`)
} catch (err) {
  if (err.code === 'ENOENT') {
    console.warn('  rsvg-convert not found. og.svg written, og.png left as-is.')
  } else {
    throw err
  }
}
