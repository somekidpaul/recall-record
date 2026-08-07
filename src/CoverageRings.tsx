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
  { label: 'Product images', value: cov.images, note: 'Every recall ships photography.' },
  { label: 'Retailer', value: cov.retailers, note: 'The field this whole piece rests on.' },
  { label: 'Injuries', value: cov.injuries, note: 'Prose, not counts. Parsed, never asserted.' },
  { label: 'Hazard', value: cov.hazards, note: 'Free text, but always present.' },
  { label: 'Remedy type', value: cov.remedyOptions, note: 'A clean enum. Rare in this dataset.' },
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
 * Every arc is drawn to its own value, full stop.
 *
 * Six of these land between 99.7% and 100%, so those six rings look nearly
 * identical. That is not a flaw to tune out: they ARE nearly identical, and a
 * ring that exaggerated a third of a percent to make it visible would be doing
 * exactly what this page spends a section warning about. The arcs are honest
 * and the numbers underneath carry the precision.
 */
function tone(v: number) {
  if (v >= 99) return 'var(--color-ink-faint)'
  if (v >= 50) return 'var(--color-alt-1)'
  return 'var(--color-signal)'
}

export default function CoverageRings() {
  return (
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
          {f.trend && <Sparkline points={data.trend[f.trend]} />}
        </li>
      ))}
    </ul>
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
          style={{ '--len': C, '--target': C * (1 - value / 100) } as React.CSSProperties}
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
function Sparkline({ points }: { points: Array<{ year: number; pct: number | null }> }) {
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
        <path d={d} fill="none" stroke="var(--color-signal)" strokeWidth={1.75} strokeLinejoin="round" />
        <circle cx={w} cy={at(vals.at(-1)!, vals.length - 1)[1]} r={2.75} fill="var(--color-signal)" />
      </svg>
      <p className="m-0 mt-2 font-[family-name:var(--font-mono)] text-[12px] uppercase tracking-[0.08em] text-[var(--color-ink-faint)] tabular-nums">
        {vals[0].pct}% ’{String(vals[0].year).slice(2)} → {vals.at(-1)!.pct}% ’
        {String(vals.at(-1)!.year).slice(2)}
      </p>
    </div>
  )
}
