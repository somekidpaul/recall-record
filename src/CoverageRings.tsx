import data from './data/recalls.json'

const R = 30
const STROKE = 7
const C = 2 * Math.PI * R
const BOX = (R + STROKE) * 2

type Field = { label: string; value: number; note: string; trend?: 'manufacturer' | 'importer' }

const cov = data.coverage

const FIELDS: Field[] = [
  { label: 'Product images', value: cov.images, note: 'Every recall ships photography.' },
  { label: 'Retailer', value: cov.retailers, note: 'The field this whole piece rests on.' },
  { label: 'Injuries', value: cov.injuries, note: 'Prose, not counts. Parsed, never asserted.' },
  { label: 'Hazard', value: cov.hazards, note: 'Free text.' },
  { label: 'Country of origin', value: cov.manufacturerCountries, note: 'Reliable.' },
  { label: 'Remedy type', value: cov.remedyOptions, note: 'A clean enum. Rare in this dataset.' },
  { label: 'Importer', value: cov.importers, note: 'Falling. See below.', trend: 'importer' },
  {
    label: 'Manufacturer',
    value: cov.manufacturers,
    note: 'Mostly empty, and getting emptier. Nothing here relies on it.',
    trend: 'manufacturer',
  },
]

/** Under 50% is the story, so it gets the signal colour and the heavier weight. */
const weak = (v: number) => v < 50

export default function CoverageRings() {
  return (
    <ul className="m-0 grid list-none gap-x-8 gap-y-10 p-0 [grid-template-columns:repeat(auto-fit,minmax(190px,1fr))]">
      {FIELDS.map((f) => (
        <li key={f.label} className="flex flex-col items-center text-center">
          <Ring value={f.value} />
          <p
            className={`m-0 mt-4 text-[17px] ${
              weak(f.value) ? 'font-semibold text-[var(--color-ink)]' : 'text-[var(--color-ink)]'
            }`}
          >
            {f.label}
          </p>
          <p className="m-0 mt-1.5 max-w-[24ch] text-[14px] leading-snug text-[var(--color-ink-faint)]">
            {f.note}
          </p>
          {f.trend && <Sparkline points={data.trend[f.trend]} />}
        </li>
      ))}
    </ul>
  )
}

function Ring({ value }: { value: number }) {
  const color = weak(value) ? 'var(--color-signal)' : 'var(--color-ink-faint)'
  return (
    <div className="relative" role="img" aria-label={`${value}% populated`}>
      <svg width={BOX} height={BOX} viewBox={`0 0 ${BOX} ${BOX}`} className="-rotate-90">
        <circle
          cx={BOX / 2} cy={BOX / 2} r={R} fill="none"
          stroke="var(--color-rule)" strokeWidth={STROKE}
        />
        <circle
          cx={BOX / 2} cy={BOX / 2} r={R} fill="none"
          stroke={color} strokeWidth={STROKE} strokeLinecap="round"
          strokeDasharray={C}
          strokeDashoffset={C * (1 - value / 100)}
          className="draw-in"
          style={{ '--len': C } as React.CSSProperties}
        />
      </svg>
      <span
        aria-hidden
        className={`absolute inset-0 flex items-center justify-center text-[17px] tabular-nums ${
          weak(value) ? 'font-semibold text-[var(--color-signal)]' : 'text-[var(--color-ink-soft)]'
        }`}
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

  const w = 132
  const h = 30
  const max = Math.max(...vals.map((v) => v.pct))
  const min = Math.min(...vals.map((v) => v.pct))
  const span = Math.max(1, max - min)
  const d = vals
    .map((v, i) => {
      const px = (i / (vals.length - 1)) * w
      const py = h - ((v.pct - min) / span) * h
      return `${i === 0 ? 'M' : 'L'}${px.toFixed(1)},${py.toFixed(1)}`
    })
    .join(' ')

  const firstV = vals[0]
  const lastV = vals.at(-1)!

  return (
    <div className="mt-3">
      <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`} className="overflow-visible" aria-hidden>
        <path d={d} fill="none" stroke="var(--color-signal)" strokeWidth={1.75} strokeLinejoin="round" />
        <circle cx={w} cy={h - ((lastV.pct - min) / span) * h} r={2.5} fill="var(--color-signal)" />
      </svg>
      <p className="m-0 mt-1.5 font-[family-name:var(--font-mono)] text-[11px] uppercase tracking-[0.1em] text-[var(--color-ink-faint)] tabular-nums">
        {firstV.pct}% ’{String(firstV.year).slice(2)} → {lastV.pct}% ’{String(lastV.year).slice(2)}
      </p>
    </div>
  )
}
