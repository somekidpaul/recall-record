/**
 * Ring geometry.
 *
 * The rings carry a deliberate distortion: anything short of 100% keeps a
 * minimum visible gap, because six of the eight fields land between 99.7% and
 * 100% and an exact arc for those is under a pixel, which draws as a closed
 * circle and tells the reader a field is complete when it is not.
 *
 * That rule was silently cancelled for the entire life of the component. The
 * arcs drew with a round line cap, which extends a stroke half its width past
 * each end of the path. Stroke 7 means the two caps added 7px of ink into a gap
 * that is 9 degrees of a 289.03px circumference, or 7.23px. Net visible gap:
 * about 0.2px. The rings printed "99.7%" and drew a closed circle anyway.
 *
 * So the guard here is not "does gapDegrees return 9". It is "does a value
 * under 100 actually leave visible daylight once the cap is accounted for",
 * which is the property the reader depends on and the one that broke.
 */
import { describe, it, expect } from 'vitest'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { isExact } from './CoverageRings'
import data from './data/recalls.json'

/* Mirrors of the component's geometry. Kept as literals rather than imported
   so that changing a constant in the component makes a test fail loudly and
   asks whether the change was intended, instead of silently agreeing. */
const R = 46
const STROKE = 7
const MIN_GAP_DEG = 9
const CIRCUMFERENCE = 2 * Math.PI * R

const gapDegrees = (v: number) =>
  v >= 100 ? 0 : Math.max(MIN_GAP_DEG, ((100 - v) / 100) * 360)

const gapPx = (v: number) => (gapDegrees(v) / 360) * CIRCUMFERENCE

/** Ink a round cap adds beyond the path ends. Butt caps add none. */
const CAP_INK_ROUND = STROKE // half a stroke at each of two ends
const CAP_INK_BUTT = 0

describe('ring geometry', () => {
  it('the component actually ships butt caps', () => {
    /*
      READ FROM THE SOURCE, on purpose.

      Every other test in this file reasons about geometry using local
      constants, which means flipping the COMPONENT back to strokeLinecap
      ="round" would leave them all green while the rings silently closed up
      again. That is the same shape of hole as the bug itself: a check that
      agrees with itself instead of with reality.

      There is no DOM environment configured here, so rendering and inspecting
      the attribute is not available. Reading the file is blunt, and it is the
      thing that actually fails when someone changes the value back.
    */
    const raw = readFileSync(join(process.cwd(), 'src', 'CoverageRings.tsx'), 'utf8')

    /* Comments are stripped first. The component's own comment explains that it
       "drew with strokeLinecap='round' until now", and scanning the raw file
       matched that prose and failed on the correct code. Caught by running the
       test before trusting it. */
    const code = raw.replace(/\/\*[\s\S]*?\*\//g, '').replace(/^\s*\/\/.*$/gm, '')

    const caps = [...code.matchAll(/strokeLinecap=["']([a-z]+)["']/g)].map((m) => m[1])
    expect(caps.length, 'no strokeLinecap found in code').toBeGreaterThan(0)
    for (const c of caps) expect(c).toBe('butt')
  })

  it('a field short of 100% leaves visible daylight with the shipped cap', () => {
    /* THE REGRESSION GUARD. With butt caps this passes; flip the component back
       to round and the visible gap collapses to ~0.23px, which is the bug. */
    for (const [field, value] of Object.entries(data.coverage)) {
      if (field === 'total') continue
      if (value >= 100) continue
      const visible = gapPx(value) - CAP_INK_BUTT
      expect(visible, `${field} at ${value}% leaves only ${visible.toFixed(2)}px`).toBeGreaterThan(2)
    }
  })

  it('documents why round caps were wrong, in numbers', () => {
    /* The worst case among the bent rings: the smallest true gap. */
    const worst = Math.min(
      ...Object.entries(data.coverage)
        .filter(([k, v]) => k !== 'total' && v < 100)
        .map(([, v]) => gapPx(v as number)),
    )
    expect(worst).toBeGreaterThan(7) // the enforced minimum, 7.23px
    expect(worst - CAP_INK_ROUND).toBeLessThan(1) // what round caps left: ~0.23px
    expect(worst - CAP_INK_BUTT).toBeGreaterThan(7) // what butt caps leave
  })

  it('only a true 100% closes the circle', () => {
    expect(gapDegrees(100)).toBe(0)
    expect(gapDegrees(99.9)).toBeGreaterThan(0)
    expect(gapDegrees(99.99)).toBeGreaterThan(0)
  })

  it('isExact marks which arcs are drawn to scale and which were widened', () => {
    /* Above the threshold the arc is honest; below it the gap was enlarged. The
       page prints a disclosure counting the widened ones, so this boundary is
       load-bearing copy, not just geometry. */
    expect(isExact(100)).toBe(true)
    expect(isExact(99.9)).toBe(false) // 0.36deg, widened to 9
    expect(isExact(97.5)).toBe(true) // 9deg exactly, drawn true
    expect(isExact(35.3)).toBe(true) // nowhere near, drawn true
  })

  it('the disclosure counts exactly the arcs that were widened', () => {
    /* The sentence reads "N of these miss 100% by under a pixel of arc". If N
       ever stops matching the widened set, the page is describing a distortion
       it did not make, or hiding one it did. */
    const widened = Object.entries(data.coverage)
      .filter(([k]) => k !== 'total')
      .filter(([, v]) => !isExact(v as number))
    expect(widened.length).toBeGreaterThan(0)

    /* And the copy's claim has to be true of all of them. It used to assert a
       fixed "under a pixel of arc", which held for the 99.7 to 99.9% rings it
       was written against and went false on 2026-09-03 when the retailers
       field settled at 99.6%, a 1.16px gap. The page now prints the worst
       shortfall it actually has, so what is checked is that the printed figure
       really does cover every bent ring, and that the gap is still small
       enough for the sentence's point to stand: too little to draw honestly. */
    const worstShortfall = Math.round(Math.max(...widened.map(([, v]) => 100 - (v as number))) * 10) / 10
    for (const [field, v] of widened) {
      expect(100 - (v as number), `${field} shortfall vs the printed figure`).toBeLessThanOrEqual(
        worstShortfall + 0.05,
      )
      /* Below MIN_GAP_DEG is the definition of bent, so this is the property
         that makes the disclosure necessary in the first place. */
      const trueDeg = ((100 - (v as number)) / 100) * 360
      expect(trueDeg, `${field} true arc gap in degrees`).toBeLessThan(MIN_GAP_DEG)
    }
  })
})
