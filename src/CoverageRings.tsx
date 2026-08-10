import data from './data/recalls.json'

/**
 * Sized from the type. The widest label is "35.3%", measured at 57 x 21px, so
 * its corners sit 30.4px from centre. R of 46 gives an inner radius of 42.5 and
 * about 12px of corner clearance.
 */
const R = 46
const STROKE = 7
const C = 2 * Math.PI * R
const BOX = (R + STROKE) * 2

const cov = data.coverage

type Field = { label: string; value: number; note: string; trend?: 'manufacturer' | 'importer' }

const FIELDS: Field[] = [
  { label: 'Product images', value: cov.images, note: 'Every recall comes with photos.' },
  { label: 'Retailer', value: cov.retailers, note: 'The one this whole page rests on.' },
  { label: 'Injuries', value: cov.injuries, note: 'Written as sentences, not numbers. Read carefully, never guessed.' },
  { label: 'Hazard', value: cov.hazards, note: 'Free-form text, but always there.' },
  { label: 'Remedy type', value: cov.remedyOptions, note: 'An actual tidy list. Rare here.' },
  { label: 'Country of origin', value: cov.manufacturerCountries, note: 'Reliable.' },
  {
    label: 'Importer',
    value: cov.importers,
    note: 'Roughly two in three, and falling.',
    trend: 'importer',
  },
  {
    label: 'Manufacturer',
    value: cov.manufacturers,
    note: 'Mostly empty, and emptier every year. Nothing here relies on it.',
    trend: 'manufacturer',
  },
]

/**
 * MINIMUM VISIBLE GAP, and this is a deliberate departure from a literal scale.
 *
 * Six of these land between 99.7% and 100%. At true scale a 0.3% shortfall is
 * about one degree of arc, which is under a pixel, so all six rendered as
 * closed circles. That is the version that actually misleads: "99.7% populated"
 * drawn as a complete ring tells the reader the field is complete.
 *
 * So anything short of 100% keeps a gap of at least MIN_GAP_DEG. Above that
 * threshold the arc is exact. The trade is stated on the page rather than
 * hidden, because a scale bent without saying so is the thing this piece spends
 * a whole section warning about. Only 100.0 closes the circle.
 */
const MIN_GAP_DEG = 9

function gapDegrees(v: number) {
  const trueGap = ((100 - v) / 100) * 360
  return v >= 100 ? 0 : Math.max(MIN_GAP_DEG, trueGap)
}

/** True where the drawn arc is exact, false where the minimum gap took over. */
export const isExact = (v: number) => v >= 100 || ((100 - v) / 100) * 360 >= MIN_GAP_DEG

/**
 * Colour here is a severity scale, not decoration.
 *
 * grey   = 99% and up, the field is there and you can lean on it
 * blue   = 50 to 99, partly filled in, usable with care
 * orange = under 50, mostly missing
 *
 * The scale used to be undeclared, so the only way to learn it was to notice
 * that the two coloured rings were also the two low numbers. That is a puzzle,
 * not an encoding, so the thresholds are now printed under the rings.
 */
const BANDS = [
  { from: 99, label: 'Reliable', hint: '99% and up', color: 'var(--color-ink-faint)' },
  { from: 50, label: 'Partial', hint: '50 to 99%', color: 'var(--color-alt-1)' },
  { from: 0, label: 'Mostly missing', hint: 'under 50%', color: 'var(--color-signal)' },
]

function tone(v: number) {
  return BANDS.find((b) => v >= b.from)!.color
}

export default function CoverageRings() {
  const bent = FIELDS.filter((f) => !isExact(f.value))
  /* Only show a band in the key if something on screen actually uses it. */
  const usedBands = BANDS.filter((b) => FIELDS.some((f) => tone(f.value) === b.color))
  return (
    <>
    <ul className="m-0 grid list-none gap-x-8 gap-y-12 p-0 [grid-template-columns:repeat(auto-fit,minmax(196px,1fr))]">
      {FIELDS.map((f) => (
        <li key={f.label} className="flex flex-col items-center text-center">
          <Ring value={f.value} />
          <p
            className={`m-0 mt-5 text-[17px] text-[var(--color-ink)] ${
              f.value < 99 ? 'font-semibold' : ''
            }`}
          >
            {f.label}
          </p>
          <p className="m-0 mt-1.5 max-w-[25ch] text-[14px] leading-snug text-[var(--color-ink-faint)]">
            {f.note}
          </p>
          {/* The trend takes the ring's colour. It was hardcoded to the signal
              orange, so the blue Importer ring sat above an orange sparkline
              and implied the two marks were about different things. */}
          {f.trend && <Sparkline points={data.trend[f.trend]} color={tone(f.value)} />}
        </li>
      ))}
    </ul>

    {/* The key. Without it the colours are a puzzle rather than an encoding,
        and the reader has to infer the thresholds from which rings happen to
        be coloured. */}
    <ul className="m-0 mt-14 flex list-none flex-wrap items-center gap-x-8 gap-y-3 border-t border-[var(--color-rule)] p-0 pt-6">
      {usedBands.map((b) => (
        <li key={b.label} className="flex items-center gap-2.5 text-[15px]">
          <span
            aria-hidden
            className="inline-block size-3 shrink-0 rounded-full"
            style={{ background: b.color }}
          />
          <span className="text-[var(--color-ink)]">{b.label}</span>
          <span className="text-[var(--color-ink-faint)] tabular-nums">{b.hint}</span>
        </li>
      ))}
    </ul>

    {/* A footnote, and it sits AFTER the rings now. It used to run above them,
        so the page explained a drawing the reader had not seen yet. */}
    {bent.length > 0 && (
      <p className="m-0 mt-6 max-w-[68ch] text-[15px] leading-[1.6] text-[var(--color-ink-faint)]">
        One note on how these are drawn. {bent.length} of them miss 100% by less than{' '}
        {MIN_GAP_DEG / 3.6}%, and at true scale that gap would be thinner than a pixel, so they
        would all look like closed circles. Anything under 100% therefore gets a small visible
        gap on purpose. Every other arc is exact, and only a true 100% closes the ring. The
        numbers themselves are precise.
      </p>
    )}
    </>
  )
}

function Ring({ value }: { value: number }) {
  const color = tone(value)
  return (
    <div className="relative" role="img" aria-label={`${value} percent populated`}>
      <svg width={BOX} height={BOX} viewBox={`0 0 ${BOX} ${BOX}`} className="-rotate-90">
        <circle
          cx={BOX / 2} cy={BOX / 2} r={R} fill="none"
          stroke="var(--color-rule)" strokeWidth={STROKE}
        />
        <circle
          cx={BOX / 2} cy={BOX / 2} r={R} fill="none"
          stroke={color} strokeWidth={STROKE} strokeLinecap="round"
          strokeDasharray={C}
          className="ring-arc"
          style={{ '--len': C, '--target': (gapDegrees(value) / 360) * C } as React.CSSProperties}
        />
      </svg>
      <span
        aria-hidden
        className={`absolute inset-0 flex items-center justify-center text-[18px] tabular-nums ${
          value < 99 ? 'font-semibold' : ''
        }`}
        style={{ color: value < 99 ? color : 'var(--color-ink-soft)' }}
      >
        {value}%
      </span>
    </div>
  )
}

/**
 * Only the two fields that actually move get a trend. The other six sit between
 * 99.4% and 100% in every year since 2015, so a line for them would be a flat
 * rule pretending to be information.
 */
function Sparkline({
  points,
  color,
}: {
  points: Array<{ year: number; pct: number | null }>
  color: string
}) {
  const vals = points.filter((p) => p.pct != null) as Array<{ year: number; pct: number }>
  if (vals.length < 2) return null

  const w = 128
  const h = 28
  const max = Math.max(...vals.map((v) => v.pct))
  const min = Math.min(...vals.map((v) => v.pct))
  const span = Math.max(1, max - min)
  const at = (v: { pct: number }, i: number) =>
    [(i / (vals.length - 1)) * w, h - ((v.pct - min) / span) * h] as const
  const d = vals
    .map((v, i) => `${i === 0 ? 'M' : 'L'}${at(v, i)[0].toFixed(1)},${at(v, i)[1].toFixed(1)}`)
    .join(' ')

  return (
    <div className="mt-4">
      <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`} className="overflow-visible" aria-hidden>
        <path d={d} fill="none" stroke={color} strokeWidth={1.75} strokeLinejoin="round" />
        <circle cx={w} cy={at(vals.at(-1)!, vals.length - 1)[1]} r={2.75} fill={color} />
      </svg>
      <p className="m-0 mt-2 font-[family-name:var(--font-mono)] text-[12px] uppercase tracking-[0.08em] text-[var(--color-ink-faint)] tabular-nums">
        {vals[0].pct}% ’{String(vals[0].year).slice(2)} → {vals.at(-1)!.pct}% ’
        {String(vals.at(-1)!.year).slice(2)}
      </p>
    </div>
  )
}
