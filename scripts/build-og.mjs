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

const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">
  <rect width="${W}" height="${H}" fill="#100c0a"/>
  <text x="${PAD}" y="86" fill="#fb7a52" font-family="Menlo,monospace" font-size="20" letter-spacing="3">THE RECALL RECORD</text>
  <text x="${PAD}" y="176" fill="#f4f1ee" font-family="Iowan Old Style,Palatino,Georgia,serif" font-size="62">Half of US product recalls</text>
  <text x="${PAD}" y="242" fill="#f4f1ee" font-family="Iowan Old Style,Palatino,Georgia,serif" font-size="62">now name only Amazon.</text>

  <path d="${line((s) => s.retailers.walmart)}" fill="none" stroke="#8fa8c8" stroke-width="3"/>
  <path d="${line((s) => s.retailers.target)}" fill="none" stroke="#7fb6bd" stroke-width="3"/>
  <path d="${line((s) => s.retailers.homeDepot)}" fill="none" stroke="#84bb93" stroke-width="3"/>
  <path d="${line((s) => s.retailers.amazon)}" fill="none" stroke="#fb7a52" stroke-width="7" stroke-linecap="round" stroke-linejoin="round"/>
  <circle cx="${x(last.year).toFixed(1)}" cy="${y(last.retailers.amazon).toFixed(1)}" r="9" fill="#fb7a52"/>

  <text x="${x(last.year) + 24}" y="${y(last.retailers.amazon) - 6}" fill="#fb7a52" font-family="Menlo,monospace" font-size="30" font-weight="bold">${last.retailers.amazon}%</text>
  <text x="${x(last.year) + 24}" y="${y(last.retailers.amazon) + 24}" fill="#9b8f86" font-family="Menlo,monospace" font-size="19">Amazon</text>
  <text x="${PAD}" y="${PLOT_B + 34}" fill="#9b8f86" font-family="Menlo,monospace" font-size="19">${first.retailers.amazon}% in ${first.year}, ${last.retailers.amazon}% in ${last.year}</text>

  <text x="${PAD}" y="${H - 44}" fill="#9b8f86" font-family="Menlo,monospace" font-size="19">${d.corpusTotal.toLocaleString()} CPSC recalls · data through ${d.newestRecallDate}</text>
  <text x="${W - PAD}" y="${H - 44}" fill="#9b8f86" font-family="Menlo,monospace" font-size="19" text-anchor="end">somekidpaul.com</text>
</svg>`

await writeFile(join(ROOT, 'public/og.svg'), svg)
await run('rsvg-convert', ['-w', String(W), '-h', String(H), '-o', join(ROOT, 'public/og.png'), join(ROOT, 'public/og.svg')])
console.log(`  og.png rendered ${W}x${H}: Amazon ${first.retailers.amazon}% -> ${last.retailers.amazon}%`)
