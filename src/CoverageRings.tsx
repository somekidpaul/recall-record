import data from './data/recalls.json'

/**
 * Sized from the type, not picked by eye.
 *
 * The widest label is "35.3%", measured at 57 x 21px. Its corners therefore sit
 * sqrt(28.5^2 + 10.5^2) = 30.4px from the centre. At the previous R of 40 the
 * inner radius was 36.5, leaving 6px of corner clearance, which read as the
 * number crowding the stroke. R of 46 gives an inner radius of 42.5 and about
 * 12px, which is the gap the label needs to sit inside the ring rather than
 * against it.
 */
const R = 46
const STROKE = 7
const C = 2 * Math.PI * R
const BOX = (R + STROKE) * 2

type Field = { label: string; value: number; note: string; trend?: 'manufacturer' | 'importer' }

const cov = data.coverage

const FIELDS: Field[] = [
  { label: 'Product images', value: cov.images, note: 'Every recall ships photography.' },
  { label: 'Retailer', value: cov.retailers, note: 'The field this whole piece rests on.' },
  { label: 'Injuries', value: cov.injuries, note: 'Prose, not counts. Parsed, never asserted.' },
  { label: 'Hazard', value: cov.hazards, note: 'Free text, but always present.' },
  { label: 'Country of origin', value: cov.manufacturerCountries, note: 'Reliable.' },
  { label: 'Remedy type', value: cov.remedyOptions, note: 'A clean enum. Rare in this dataset.' },
  { label: 'Importer', value: cov.importers, note: 'Two in three, and falling.', trend: 'importer' },
  {
    label: 'Manufacturer',
    value: cov.manufacturers,
    note: 'Mostly empty, and emptier every year. Nothing here relies on it.',
    trend: 'manufacturer',
  },
]

/**
 * Three tiers, not two.
 *
 * The first version split at 50%, which coloured exactly one ring and implied
 * the other seven were equivalent. They are not: six sit above 99% and are
 * genuinely solid, Importer at 63% is usable but degrading, and Manufacturer at
 * 35% is not usable at all. Two colours flattened a three-way distinction, and
 * this section exists precisely to make that distinction visible.
 */
function tier(v: number) {
  if (v >= 99) return { key: 'solid', color: 'var(--color-ink-faint)', label: 'complete' }
  if (v >= 50) return { key: 'partial', color: 'var(--color-alt-1)', label: 'partial' }
  return { key: 'thin', color: 'var(--color-signal)', label: 'mostly missing' }
}

export default function CoverageRings() {
  return (
    <ul className="m-0 grid list-none gap-x-8 gap-y-12 p-0 [grid-template-columns:repeat(auto-fit,minmax(200px,1fr))]">
      {FIELDS.map((f) => {
        const t = tier(f.value)
        return (
          <li key={f.label} className="flex flex-col items-center text-center">
            <Ring value={f.value} tone={t} />
            <p
              className={`m-0 mt-5 text-[17px] text-[var(--color-ink)] ${
                t.key === 'solid' ? '' : 'font-semibold'
              }`}
            >
              {f.label}
            </p>
            <p className="m-0 mt-1.5 max-w-[25ch] text-[14px] leading-snug text-[var(--color-ink-faint)]">
              {f.note}
            </p>
            {f.trend && <Sparkline points={data.trend[f.trend]} />}
          </li>
        )
      })}
    </ul>
  )
}

function Ring({ value, tone }: { value: number; tone: ReturnType<typeof tier> }) {
  const target = C * (1 - value / 100)
  return (
    <div className="relative" role="img" aria-label={`${value}% populated, ${tone.label}`}>
      <svg width={BOX} height={BOX} viewBox={`0 0 ${BOX} ${BOX}`} className="-rotate-90">
        <circle
          cx={BOX / 2} cy={BOX / 2} r={R} fill="none"
          stroke="var(--color-rule)" strokeWidth={STROKE}
        />
        <circle
          cx={BOX / 2} cy={BOX / 2} r={R} fill="none"
          stroke={tone.color} strokeWidth={STROKE} strokeLinecap="round"
          strokeDasharray={C}
          className="ring-arc"
          style={{ '--len': C, '--target': target } as React.CSSProperties}
        />
      </svg>
      <span
        aria-hidden
        className={`absolute inset-0 flex items-center justify-center text-[18px] tabular-nums ${
          tone.key === 'solid' ? 'text-[var(--color-ink-soft)]' : 'font-semibold'
        }`}
        style={tone.key === 'solid' ? undefined : { color: tone.color }}
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
function Sparkline({ points }: { points: Array<{ year: number; pct: number | null }> }) {
  const vals = points.filter((p) => p.pct != null) as Array<{ year: number; pct: number }>
  if (vals.length < 2) return null

  const w = 140
  const h = 32
  const max = Math.max(...vals.map((v) => v.pct))
  const min = Math.min(...vals.map((v) => v.pct))
  const span = Math.max(1, max - min)
  const at = (v: { pct: number }, i: number) =>
    [(i / (vals.length - 1)) * w, h - ((v.pct - min) / span) * h] as const
  const d = vals.map((v, i) => `${i === 0 ? 'M' : 'L'}${at(v, i)[0].toFixed(1)},${at(v, i)[1].toFixed(1)}`).join(' ')
  const firstV = vals[0]
  const lastV = vals.at(-1)!

  return (
    <div className="mt-4">
      <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`} className="overflow-visible" aria-hidden>
        <path d={d} fill="none" stroke="var(--color-signal)" strokeWidth={1.75} strokeLinejoin="round" />
        <circle cx={w} cy={at(lastV, vals.length - 1)[1]} r={2.75} fill="var(--color-signal)" />
      </svg>
      <p className="m-0 mt-2 font-[family-name:var(--font-mono)] text-[12px] uppercase tracking-[0.08em] text-[var(--color-ink-faint)] tabular-nums">
        {firstV.pct}% ’{String(firstV.year).slice(2)} → {lastV.pct}% ’{String(lastV.year).slice(2)}
      </p>
    </div>
  )
}
