import data from './data/recalls.json'

/**
 * Sized from the type, not picked by eye. The widest label is "35.3%", measured
 * at 57 x 21px, so its corners sit 30.4px from centre. R of 46 gives an inner
 * radius of 42.5 and about 12px of corner clearance.
 */
const R = 46
const STROKE = 7
const C = 2 * Math.PI * R
const BOX = (R + STROKE) * 2

const cov = data.coverage

type Field = { label: string; value: number; note: string; trend?: 'manufacturer' | 'importer' }

/**
 * WHY THIS IS SPLIT INTO TWO GROUPS.
 *
 * Six of these sit between 99.7% and 100%. On a ring that difference is 0.3% of
 * a circle, roughly one degree, which is under a pixel at any size that fits on
 * the page. Drawing six rings and implying the reader can compare them would be
 * a chart pretending to carry information it cannot carry.
 *
 * So the six are grouped and labelled as what they are, complete, at a size
 * that suits a glance. The two that are genuinely incomplete get the full ring
 * and a trend line, because there the arc IS legible and the movement matters.
 * The layout carries the finding instead of flattening it.
 */
const COMPLETE: Field[] = [
  { label: 'Product images', value: cov.images, note: 'Every recall ships photography.' },
  { label: 'Retailer', value: cov.retailers, note: 'The field this piece rests on.' },
  { label: 'Injuries', value: cov.injuries, note: 'Prose, not counts.' },
  { label: 'Hazard', value: cov.hazards, note: 'Free text, always present.' },
  { label: 'Remedy type', value: cov.remedyOptions, note: 'A clean enum. Rare here.' },
  { label: 'Country of origin', value: cov.manufacturerCountries, note: 'Reliable.' },
]

const INCOMPLETE: Field[] = [
  {
    label: 'Importer',
    value: cov.importers,
    note: 'Roughly two in three, and falling. Usable, but not something to build on.',
    trend: 'importer',
  },
  {
    label: 'Manufacturer',
    value: cov.manufacturers,
    note: 'Mostly empty, and emptier every year. Nothing on this page relies on it.',
    trend: 'manufacturer',
  },
]

const lowest = Math.min(...COMPLETE.map((f) => f.value))

export default function CoverageRings() {
  return (
    <div className="grid gap-x-16 gap-y-14 lg:grid-cols-[1fr_auto]">
      <section>
        <Heading>Complete, all six</Heading>
        <p className="mt-3 mb-8 max-w-[46ch] text-[16px] leading-[1.6] text-[var(--color-ink-faint)]">
          Every one of these is above {lowest}% in every year since {data.firstYear}. The gaps
          between them are fractions of a percent, so they are listed rather than drawn: a ring
          cannot show a third of a percent and it would be dishonest to imply otherwise.
        </p>
        <ul className="m-0 grid list-none gap-x-8 gap-y-5 p-0 sm:grid-cols-2">
          {COMPLETE.map((f) => (
            <li
              key={f.label}
              className="flex items-baseline justify-between gap-4 border-b border-[var(--color-rule)] pb-3"
            >
              <span className="text-[17px] text-[var(--color-ink)]">{f.label}</span>
              <span className="shrink-0 text-[17px] tabular-nums text-[var(--color-ink-soft)]">
                {f.value}%
              </span>
            </li>
          ))}
        </ul>
      </section>

      <section>
        <Heading>Incomplete</Heading>
        <p className="mt-3 mb-8 max-w-[38ch] text-[16px] leading-[1.6] text-[var(--color-ink-faint)]">
          These two are worth drawing, because the arc is legible and both are moving in the
          wrong direction.
        </p>
        <ul className="m-0 flex list-none flex-wrap gap-x-12 gap-y-10 p-0">
          {INCOMPLETE.map((f) => (
            <li key={f.label} className="flex flex-col items-center text-center">
              <Ring value={f.value} />
              <p className="m-0 mt-5 text-[17px] font-semibold text-[var(--color-ink)]">{f.label}</p>
              <p className="m-0 mt-1.5 max-w-[24ch] text-[14px] leading-snug text-[var(--color-ink-faint)]">
                {f.note}
              </p>
              {f.trend && <Sparkline points={data.trend[f.trend]} />}
            </li>
          ))}
        </ul>
      </section>
    </div>
  )
}

function Heading({ children }: { children: React.ReactNode }) {
  return (
    <h4 className="m-0 font-[family-name:var(--font-mono)] text-[13px] uppercase tracking-[0.16em] text-[var(--color-ink-faint)]">
      {children}
    </h4>
  )
}

function Ring({ value }: { value: number }) {
  // Under half is the story. Between half and complete is a caution.
  const color = value < 50 ? 'var(--color-signal)' : 'var(--color-alt-1)'
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
        className="absolute inset-0 flex items-center justify-center text-[18px] font-semibold tabular-nums"
        style={{ color }}
      >
        {value}%
      </span>
    </div>
  )
}

function Sparkline({ points }: { points: Array<{ year: number; pct: number | null }> }) {
  const vals = points.filter((p) => p.pct != null) as Array<{ year: number; pct: number }>
  if (vals.length < 2) return null

  const w = 132
  const h = 30
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
