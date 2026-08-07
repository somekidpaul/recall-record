import { useMemo, useState } from 'react'
import data from './data/recalls.json'

type Row = (typeof data.series)[number]

const W = 900
const H = 420
const PAD = { top: 28, right: 132, bottom: 44, left: 52 }
const PLOT_W = W - PAD.left - PAD.right
const PLOT_H = H - PAD.top - PAD.bottom
const Y_MAX = 90

const COMPARATORS = [
  { key: 'walmart', label: 'Walmart', color: 'var(--color-alt-1)' },
  { key: 'target', label: 'Target', color: 'var(--color-alt-2)' },
  { key: 'homeDepot', label: 'Home Depot', color: 'var(--color-alt-3)' },
  { key: 'ebay', label: 'eBay', color: 'var(--color-alt-4)' },
] as const

const years = data.series.map((d) => d.year)
const x = (year: number) =>
  PAD.left + ((year - years[0]) / (years.at(-1)! - years[0])) * PLOT_W
const y = (v: number) => PAD.top + PLOT_H - (v / Y_MAX) * PLOT_H

const path = (pts: Array<[number, number]>) =>
  pts.map(([px, py], i) => `${i === 0 ? 'M' : 'L'}${px.toFixed(1)},${py.toFixed(1)}`).join(' ')

/** Rough polyline length, used to seed the scroll-driven draw animation. */
const length = (pts: Array<[number, number]>) =>
  pts.reduce((n, p, i) => (i === 0 ? 0 : n + Math.hypot(p[0] - pts[i - 1][0], p[1] - pts[i - 1][1])), 0)

function seriesPoints(pick: (d: Row) => number | null): Array<[number, number]> {
  return data.series
    .filter((d) => pick(d) != null)
    .map((d) => [x(d.year), y(pick(d) as number)] as [number, number])
}

const clamp = (v: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, v))

/**
 * Every series' value at one year, sorted high to low so the tooltip reads
 * like a standing. Amazon keeps its own color; comparators keep theirs.
 */
function readout(d: Row, soleOnly: boolean) {
  const rows = [
    {
      key: 'amazon',
      label: soleOnly ? 'Amazon only' : 'Amazon',
      value: (soleOnly ? d.amazonOnly : d.retailers.amazon) as number,
      color: 'var(--color-signal)',
    },
    ...COMPARATORS.map((c) => ({
      key: c.key as string,
      label: c.label,
      value: d.retailers[c.key] as number,
      color: c.color,
    })),
  ]
  return rows.filter((r) => r.value != null).sort((a, b) => b.value - a.value)
}

/** Highest point across all series at this year, so the tooltip clears them all. */
function topOf(d: Row, soleOnly: boolean) {
  return Math.min(...readout(d, soleOnly).map((s) => y(s.value)))
}

/**
 * Push overlapping end-labels apart while keeping their order.
 * Target, Home Depot and eBay all sit in the low single digits, so their
 * natural label positions collide. Nudging the label without moving the line
 * is the honest fix: the data stays where it is, only the type moves.
 */
function declutter(vals: number[], minGap = 19): number[] {
  const order = vals.map((v, i) => ({ v, i })).sort((a, b) => a.v - b.v)
  let prev = -Infinity
  for (const o of order) {
    o.v = Math.max(o.v, prev + minGap)
    prev = o.v
  }
  const out = new Array<number>(vals.length)
  for (const o of order) out[o.i] = o.v
  return out
}

export default function RetailerChart() {
  const [showControl, setShowControl] = useState(false)
  const [soleOnly, setSoleOnly] = useState(false)
  const [hover, setHover] = useState<Row | null>(null)

  const amazon = useMemo(
    () => seriesPoints((d) => (soleOnly ? d.amazonOnly : d.retailers.amazon)),
    [soleOnly],
  )
  const control = useMemo(() => seriesPoints((d) => d.online.mid), [])
  const comparators = useMemo(
    () => COMPARATORS.map((c) => ({ ...c, pts: seriesPoints((d) => d.retailers[c.key]) })),
    [],
  )

  const first = data.series[0]
  const last = data.series.at(-1)!
  const comparatorLabelY = useMemo(
    () => declutter(COMPARATORS.map((c) => y(last.retailers[c.key]!))),
    [last],
  )
  const amzFirst = soleOnly ? first.amazonOnly! : first.retailers.amazon!
  const amzLast = soleOnly ? last.amazonOnly! : last.retailers.amazon!
  const ctlGrowth = last.online.mid! / first.online.mid!

  return (
    <figure className="m-0">
      <div className="mb-6 flex flex-wrap gap-2">
        <Toggle on={showControl} onClick={() => setShowControl((v) => !v)}>
          Show the obvious objection
        </Toggle>
        <Toggle on={soleOnly} onClick={() => setSoleOnly((v) => !v)}>
          Count only where Amazon is the sole retailer
        </Toggle>
      </div>

      <div className="relative">
        <svg
          viewBox={`0 0 ${W} ${H}`}
          className="w-full h-auto overflow-visible"
          role="img"
          aria-label={`Share of US consumer product recalls naming each retailer, ${years[0]} to ${years.at(-1)}. Amazon rises from ${amzFirst} percent to ${amzLast} percent.`}
        >
          {[0, 25, 50, 75].map((v) => (
            <g key={v}>
              <line
                x1={PAD.left} x2={PAD.left + PLOT_W} y1={y(v)} y2={y(v)}
                stroke="var(--color-rule)" strokeWidth={1}
              />
              <text
                x={PAD.left - 10} y={y(v)} dy="0.32em" textAnchor="end"
                className="fill-[var(--color-ink-faint)] text-[15px] tabular-nums"
              >
                {v}%
              </text>
            </g>
          ))}

          {/* Every year is labelled. With only twelve points the gaps read as
              missing data rather than as breathing room, and the reader should
              be able to see the granularity they are actually looking at. */}
          {data.series.map((d) => (
            <text
              key={d.year} x={x(d.year)} y={H - 16} textAnchor="middle"
              className={`text-[14px] tabular-nums ${
                d.year === last.year
                  ? 'fill-[var(--color-ink-soft)] font-semibold'
                  : 'fill-[var(--color-ink-faint)]'
              }`}
            >
              ’{String(d.year).slice(2)}
            </text>
          ))}

          {/* Comparators first, so the subject sits on top of its context. */}
          {comparators.map((c) => (
            <path
              key={c.key} d={path(c.pts)} fill="none" stroke={c.color}
              strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round"
              className="draw-in" style={{ '--len': length(c.pts) } as React.CSSProperties}
            />
          ))}

          {/* The counterargument. Dashed, neutral, deliberately unglamorous. */}
          {showControl && (
            <>
              <path
                d={path(control)} fill="none" stroke="var(--color-control)"
                strokeWidth={2} strokeDasharray="7 5" strokeLinecap="round"
              />
              <text
                x={x(last.year) + 10} y={y(last.online.mid!)} dy="0.32em"
                className="fill-[var(--color-control)] text-[15px] font-semibold"
              >
                Sold online
              </text>
              <text
                x={x(last.year) + 10} y={y(last.online.mid!) + 17} dy="0.32em"
                className="fill-[var(--color-ink-faint)] text-[13px] tabular-nums"
              >
                {ctlGrowth.toFixed(1)}× since ’{String(first.year).slice(2)}
              </text>
            </>
          )}

          {/* The final year is still running, so its segment is drawn dashed.
              The reader can see which part of the line is provisional without
              reading a footnote, which is the honest version of a disclaimer. */}
          <path
            d={path(amazon.slice(0, -1))} fill="none" stroke="var(--color-signal)"
            strokeWidth={3.25} strokeLinecap="round" strokeLinejoin="round"
            className="draw-in" style={{ '--len': length(amazon.slice(0, -1)) } as React.CSSProperties}
          />
          <path
            d={path(amazon.slice(-2))} fill="none" stroke="var(--color-signal)"
            strokeWidth={3.25} strokeLinecap="round" strokeDasharray="6 5"
          />

          <text
            x={x(last.year) + 10} y={y(amzLast)} dy="0.32em"
            className="fill-[var(--color-signal)] text-[16px] font-semibold"
          >
            Amazon
          </text>
          <text
            x={x(last.year) + 10} y={y(amzLast) + 17} dy="0.32em"
            className="fill-[var(--color-ink-faint)] text-[13px] tabular-nums"
          >
            {(amzLast / amzFirst).toFixed(1)}× since ’{String(first.year).slice(2)}
          </text>

          {comparators.map((c, i) => {
            const ly = comparatorLabelY[i]
            const ty = y(last.retailers[c.key]!)
            return (
              <g key={c.key}>
                {/* Leader line, drawn only when the label had to move. */}
                {Math.abs(ly - ty) > 2 && (
                  <path
                    d={`M${x(last.year) + 3},${ty} L${x(last.year) + 7},${ly}`}
                    stroke={c.color} strokeWidth={1} fill="none" opacity={0.55}
                  />
                )}
                <text
                  x={x(last.year) + 10} y={ly} dy="0.32em"
                  className="text-[13px] font-medium" fill={c.color}
                >
                  {c.label}
                </text>
              </g>
            )
          })}

          {/* Crosshair. Appears at the hovered year, behind the dots. */}
          {hover && (
            <line
              x1={x(hover.year)} x2={x(hover.year)} y1={PAD.top} y2={PAD.top + PLOT_H}
              stroke="var(--color-ink-faint)" strokeWidth={1} strokeDasharray="3 3"
            />
          )}

          {/* Every series gets a dot at the hovered year, not just the subject.
              A dot on one line only implied the others were not measured. */}
          {hover &&
            readout(hover, soleOnly).map((s) => (
              <circle
                key={s.key} cx={x(hover.year)} cy={y(s.value)} r={s.key === 'amazon' ? 5 : 4}
                fill={s.color} stroke="var(--color-paper)" strokeWidth={1.5}
              />
            ))}

          {/* Resting state: a single dot marks the latest Amazon value. */}
          {!hover && (
            <circle cx={x(last.year)} cy={y(amzLast)} r={4} fill="var(--color-signal)" />
          )}

          {/* One wide hit target per year, so hovering is forgiving. */}
          {data.series.map((d) => (
            <rect
              key={d.year} x={x(d.year) - PLOT_W / (years.length * 2)} y={PAD.top}
              width={PLOT_W / years.length} height={PLOT_H} fill="transparent"
              onMouseEnter={() => setHover(d)} onMouseLeave={() => setHover(null)}
            />
          ))}
        </svg>

        {hover && (
          <div
            className="pointer-events-none absolute z-10 w-max min-w-[15rem] -translate-x-1/2 -translate-y-full rounded-xl border border-[var(--color-rule)] bg-[var(--color-paper)] px-5 py-4 shadow-2xl"
            style={{
              // Positioned from the viewBox in percentages, so it tracks the
              // point at every container width without a resize listener.
              left: `${clamp((x(hover.year) / W) * 100, 12, 88)}%`,
              top: `${(topOf(hover, soleOnly) / H) * 100}%`,
              marginTop: '-14px',
            }}
          >
            <div className="flex items-baseline justify-between gap-5 border-b border-[var(--color-rule)] pb-3">
              <span className="font-[family-name:var(--font-display)] text-[24px] leading-none tracking-tight text-[var(--color-ink)] tabular-nums">
                {hover.year}
              </span>
              <span className="font-[family-name:var(--font-mono)] text-[13px] uppercase tracking-wider text-[var(--color-ink-faint)] tabular-nums">
                {hover.recalls} recalls
                {hover.year === last.year ? ' so far' : ''}
              </span>
            </div>
            <dl className="mt-3.5 grid grid-cols-[1fr_auto] items-center gap-x-6 gap-y-2.5">
              {readout(hover, soleOnly).map((s) => (
                <div key={s.key} className="contents">
                  <dt
                    className={`flex items-center gap-2.5 ${
                      s.key === 'amazon'
                        ? 'text-[17px] font-semibold'
                        : 'text-[16px] text-[var(--color-ink-soft)]'
                    }`}
                    style={s.key === 'amazon' ? { color: s.color } : undefined}
                  >
                    <span
                      aria-hidden
                      className="inline-block shrink-0 rounded-full"
                      style={{
                        background: s.color,
                        width: s.key === 'amazon' ? 11 : 9,
                        height: s.key === 'amazon' ? 11 : 9,
                      }}
                    />
                    {s.label}
                  </dt>
                  <dd
                    className={`m-0 text-right tabular-nums ${
                      s.key === 'amazon'
                        ? 'text-[19px] font-semibold'
                        : 'text-[17px] text-[var(--color-ink-soft)]'
                    }`}
                    style={s.key === 'amazon' ? { color: s.color } : undefined}
                  >
                    {s.value}%
                  </dd>
                </div>
              ))}
            </dl>
            {soleOnly && (
              <p className="m-0 mt-3.5 border-t border-[var(--color-rule)] pt-3 text-[14px] leading-snug text-[var(--color-ink-faint)]">
                <span className="tabular-nums">{hover.amazonOnlyCount}</span> of{' '}
                <span className="tabular-nums">{hover.recalls}</span> name Amazon and no one else
              </p>
            )}
          </div>
        )}
      </div>

      <figcaption className="mt-8 max-w-[62ch] text-[17px] leading-[1.6] text-[var(--color-ink-soft)]">
        <p className="m-0">
          Share of US consumer product recalls whose retailer description names each
          company. CPSC records where a product was sold as one prose sentence, so this
          measures <em>mentions</em>, not units sold or market share.
        </p>
        <p className="mt-3 mb-0">
          {showControl ? (
            <>
              Online selling overall grew <strong className="text-[var(--color-ink)]">{ctlGrowth.toFixed(1)}×</strong>{' '}
              since {first.year}. Amazon grew{' '}
              <strong className="text-[var(--color-ink)]">{(amzLast / amzFirst).toFixed(1)}×</strong>. The
              growth of e-commerce does not account for the gap, and Walmart, Target and
              Home Depot are flat or falling over the same period.
            </>
          ) : (
            <>The obvious objection is that everyone shops online now. Turn it on and see whether it holds.</>
          )}
        </p>
      </figcaption>
    </figure>
  )
}

function Toggle({ on, onClick, children }: { on: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={on}
      className={`rounded-full border px-5 py-2.5 text-[15px] transition-colors ${
        on
          ? 'border-[var(--color-signal)] bg-[var(--color-signal)] text-[var(--color-paper)]'
          : 'border-[var(--color-rule)] text-[var(--color-ink-soft)] hover:border-[var(--color-ink-faint)] hover:text-[var(--color-ink)]'
      }`}
    >
      {children}
    </button>
  )
}
