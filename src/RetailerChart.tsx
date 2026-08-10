import { useMemo, useRef, useState } from 'react'
import data from './data/recalls.json'
import { useMediaQuery } from './usePrefs'

type Row = (typeof data.series)[number]

const Y_MAX = 90
const years = data.series.map((d) => d.year)

/**
 * Two coordinate systems, because one cannot serve both.
 *
 * Everything in an SVG is expressed in viewBox units, and the browser scales
 * those units to whatever width the container has. On a 375px phone the
 * desktop viewBox scaled by 0.36, which turned 14px axis labels into 5.1px on
 * screen. Measured, not estimated. No amount of CSS fixes that, because the
 * problem is the ratio between the viewBox and the container.
 *
 * So the phone gets its own viewBox, sized so that one unit is roughly one
 * pixel at phone widths. Declared type sizes then land at close to their real
 * size. The right gutter also collapses, because the end-labels it existed for
 * are replaced below the chart by a legend that can use ordinary HTML type.
 */
const DESKTOP = { W: 900, H: 420, PAD: { top: 28, right: 132, bottom: 44, left: 52 }, gap: 19 }
const MOBILE = { W: 360, H: 340, PAD: { top: 18, right: 14, bottom: 36, left: 38 }, gap: 13 }

type Layout = typeof DESKTOP

function geom(L: Layout) {
  const PLOT_W = L.W - L.PAD.left - L.PAD.right
  const PLOT_H = L.H - L.PAD.top - L.PAD.bottom
  return {
    ...L,
    PLOT_W,
    PLOT_H,
    x: (year: number) => L.PAD.left + ((year - years[0]) / (years.at(-1)! - years[0])) * PLOT_W,
    y: (v: number) => L.PAD.top + PLOT_H - (v / Y_MAX) * PLOT_H,
  }
}

type Geom = ReturnType<typeof geom>

const COMPARATORS = [
  { key: 'walmart', label: 'Walmart', color: 'var(--color-alt-1)' },
  { key: 'target', label: 'Target', color: 'var(--color-alt-2)' },
  { key: 'homeDepot', label: 'Home Depot', color: 'var(--color-alt-3)' },
  { key: 'ebay', label: 'eBay', color: 'var(--color-alt-4)' },
] as const

const path = (pts: Array<[number, number]>) =>
  pts.map(([px, py], i) => `${i === 0 ? 'M' : 'L'}${px.toFixed(1)},${py.toFixed(1)}`).join(' ')

/** Rough polyline length, used to seed the scroll-driven draw animation. */
const length = (pts: Array<[number, number]>) =>
  pts.reduce((n, p, i) => (i === 0 ? 0 : n + Math.hypot(p[0] - pts[i - 1][0], p[1] - pts[i - 1][1])), 0)

function seriesPoints(G: Geom, pick: (d: Row) => number | null): Array<[number, number]> {
  return data.series
    .filter((d) => pick(d) != null)
    .map((d) => [G.x(d.year), G.y(pick(d) as number)] as [number, number])
}

const clamp = (v: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, v))

/**
 * Every series' value at one year, sorted high to low so the tooltip reads
 * like a standing. Amazon keeps its own color; comparators keep theirs.
 *
 * When the counterargument line is showing, its value belongs in the readout
 * too. Drawing a line the tooltip refuses to explain would be the exact
 * sleight of hand this piece is arguing against.
 */
function readout(d: Row, soleOnly: boolean, showControl = false) {
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
  const sorted = rows.filter((r) => r.value != null).sort((a, b) => b.value - a.value)

  // The baseline is not a retailer, so it sits apart rather than in the ranking.
  return showControl && d.online.mid != null
    ? [
        ...sorted,
        {
          key: 'control',
          label: 'Sold online, any',
          value: d.online.mid as number,
          color: 'var(--color-control)',
        },
      ]
    : sorted
}

/** Highest point across all series at this year, so the tooltip clears them all. */
function topOf(G: Geom, d: Row, soleOnly: boolean, showControl: boolean) {
  return Math.min(...readout(d, soleOnly, showControl).map((s) => G.y(s.value)))
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
  const svgRef = useRef<SVGSVGElement>(null)

  /**
   * Arrow keys walk the series, Home and End jump to the ends, Escape clears.
   * A chart you can only read with a mouse is a chart half the point of this
   * piece is arguing against.
   */
  const onKeyDown = (e: React.KeyboardEvent) => {
    const i = hover ? data.series.indexOf(hover) : -1
    const go = (n: number) => {
      e.preventDefault()
      setHover(data.series[clamp(n, 0, data.series.length - 1)])
    }
    if (e.key === 'ArrowRight') go(i < 0 ? 0 : i + 1)
    else if (e.key === 'ArrowLeft') go(i < 0 ? data.series.length - 1 : i - 1)
    else if (e.key === 'Home') go(0)
    else if (e.key === 'End') go(data.series.length - 1)
    else if (e.key === 'Escape') setHover(null)
  }


  /* The phone gets a different coordinate system, not a scaled-down one. */
  const isMobile = useMediaQuery('(max-width: 640px)')
  const G = useMemo(() => geom(isMobile ? MOBILE : DESKTOP), [isMobile])
  const { W, H, PAD, PLOT_W, PLOT_H, x, y } = G

  const amazon = useMemo(
    () => seriesPoints(G, (d) => (soleOnly ? d.amazonOnly : d.retailers.amazon)),
    [soleOnly, G],
  )
  const control = useMemo(() => seriesPoints(G, (d) => d.online.mid), [G])
  const comparators = useMemo(
    () => COMPARATORS.map((c) => ({ ...c, pts: seriesPoints(G, (d) => d.retailers[c.key]) })),
    [G],
  )

  const first = data.series[0]
  const last = data.series.at(-1)!
  const comparatorLabelY = useMemo(
    () => declutter(COMPARATORS.map((c) => G.y(last.retailers[c.key]!)), G.gap),
    [last, G],
  )
  const amzFirst = soleOnly ? first.amazonOnly! : first.retailers.amazon!
  const amzLast = soleOnly ? last.amazonOnly! : last.retailers.amazon!
  const ctlGrowth = last.online.mid! / first.online.mid!

  return (
    <figure className="m-0">
      <div className="mb-6 flex flex-wrap gap-2">
        <Toggle
          on={showControl}
          onClick={() => setShowControl((v) => !v)}
          tone="var(--color-control)"
          swatch="dashed"
        >
          Show the obvious objection
        </Toggle>
        <Toggle
          on={soleOnly}
          onClick={() => setSoleOnly((v) => !v)}
          tone="var(--color-signal)"
          swatch="solid"
        >
          Count only recalls where Amazon is the only store
        </Toggle>

      </div>

      <div className="relative">
        <svg
          ref={svgRef}
          viewBox={`0 0 ${W} ${H}`}
          className="w-full h-auto overflow-visible"
          role="application"
          tabIndex={0}
          onKeyDown={onKeyDown}
          onBlur={() => setHover(null)}
          aria-label={`Share of US product recalls naming each store, ${years[0]} to ${years.at(-1)}. Amazon rises from ${amzFirst} to ${amzLast} percent. Use arrow keys to read each year. Full figures are in the table below.`}
        >
          {[0, 25, 50, 75].map((v) => (
            <g key={v}>
              <line
                x1={PAD.left} x2={PAD.left + PLOT_W} y1={y(v)} y2={y(v)}
                stroke="var(--color-rule)" strokeWidth={1}
              />
              <text
                x={PAD.left - (isMobile ? 7 : 10)} y={y(v)} dy="0.32em" textAnchor="end"
                className={`fill-[var(--color-ink-faint)] tabular-nums ${isMobile ? 'text-[13px]' : 'text-[15px]'}`}
              >
                {v}%
              </text>
            </g>
          ))}

          {/* Every year is labelled on desktop. With only twelve points the
              gaps read as missing data rather than as breathing room, and the
              reader should be able to see the granularity they are actually
              looking at.

              On a phone there is not room for twelve, so it drops to every
              other year. The latest year always survives the thinning, because
              it is the one the whole piece is about. */}
          {data.series.map((d, i) => {
            const isLast = d.year === last.year
            if (isMobile && !isLast && (data.series.length - 1 - i) % 2 !== 0) return null
            return (
              <text
                key={d.year} x={x(d.year)} y={H - (isMobile ? 12 : 16)} textAnchor="middle"
                className={`tabular-nums ${isMobile ? 'text-[13px]' : 'text-[14px]'} ${
                  isLast
                    ? 'fill-[var(--color-ink-soft)] font-semibold'
                    : 'fill-[var(--color-ink-faint)]'
                }`}
              >
                ’{String(d.year).slice(2)}
              </text>
            )
          })}

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
              {!isMobile && (
                <>
                  <text
                    x={x(last.year) + 10} y={y(last.online.mid!)} dy="0.32em"
                    className="label-after fill-[var(--color-control)] text-[15px] font-semibold"
                  >
                    Sold online
                  </text>
                  <text
                    x={x(last.year) + 10} y={y(last.online.mid!) + 17} dy="0.32em"
                    className="label-after fill-[var(--color-ink-faint)] text-[13px] tabular-nums"
                  >
                    {ctlGrowth.toFixed(1)}× since ’{String(first.year).slice(2)}
                  </text>
                </>
              )}
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
            className="tail-after"
          />

          {/* The end-labels are the payoff, so they arrive after the line has
              finished drawing rather than sitting there from the start. */}
          {!isMobile && (
            <>
              <text
                x={x(last.year) + 10} y={y(amzLast)} dy="0.32em"
                className="label-after fill-[var(--color-signal)] text-[16px] font-semibold"
              >
                Amazon
              </text>
              <text
                x={x(last.year) + 10} y={y(amzLast) + 17} dy="0.32em"
                className="label-after fill-[var(--color-ink-faint)] text-[13px] tabular-nums"
              >
                {(amzLast / amzFirst).toFixed(1)}× since ’{String(first.year).slice(2)}
              </text>
            </>
          )}

          {!isMobile && comparators.map((c, i) => {
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
                  className="label-after text-[13px] font-medium" fill={c.color}
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
            readout(hover, soleOnly, showControl).map((s) => (
              <circle
                key={s.key} cx={x(hover.year)} cy={y(s.value)} r={s.key === 'amazon' ? 5 : 4}
                fill={s.color} stroke="var(--color-paper)" strokeWidth={1.5}
              />
            ))}

          {/* Resting state: a single dot marks the latest Amazon value. */}
          {!hover && (
            <circle
              cx={x(last.year)} cy={y(amzLast)} r={4} fill="var(--color-signal)"
              className="tail-after"
            />
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
              top: `${(topOf(G, hover, soleOnly, showControl) / H) * 100}%`,
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
              {readout(hover, soleOnly, showControl).map((s) => (
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

      {/* The phone's replacement for the end-labels.
          Same information, but as HTML type at a real size instead of SVG type
          scaled down past legibility. Values are the latest year, which is what
          the end-labels showed. */}
      {isMobile && (
        <ul className="m-0 mt-5 grid list-none grid-cols-2 gap-x-4 gap-y-2.5 p-0">
          {readout(last, soleOnly, showControl).map((s) => (
            <li key={s.key} className="flex items-baseline gap-2 text-[14px] leading-snug">
              <span
                aria-hidden
                className="mt-[1px] inline-block size-2.5 shrink-0 rounded-full"
                style={{ background: s.color }}
              />
              <span className="text-[var(--color-ink-soft)]">{s.label}</span>
              <span className="ml-auto font-semibold tabular-nums text-[var(--color-ink)]">
                {s.value}%
              </span>
            </li>
          ))}
        </ul>
      )}

      {/* Announced to screen readers as the keyboard selection moves. */}
      <p className="sr-only" role="status" aria-live="polite">
        {hover
          ? `${hover.year}: ${readout(hover, soleOnly, showControl)
              .map((s) => `${s.label} ${s.value} percent`)
              .join(', ')}`
          : ''}
      </p>

      {/* The same figures as a real table. A chart is a rendering of data, not
          a replacement for it, so the data itself stays reachable.

          The .sr-only sits on a WRAPPER, not on the table. On the table it did
          not work: a table under the default auto layout takes the larger of
          its specified width and its minimum content width, so width:1px left
          it 632px wide. clip-path hid it, but it still stretched the document
          to 655px against a 375px phone, and the page zoomed out to fit. That
          was the whole mobile bug. A block wrapper does honour width:1px, and
          overflow:hidden clips the table inside it, so the table keeps its
          native display and its semantics for a screen reader. */}
      <div className="sr-only">
      <table>
        <caption>
          Share of US product recalls naming each store, by year
        </caption>
        <thead>
          <tr>
            <th scope="col">Year</th>
            <th scope="col">Recalls</th>
            <th scope="col">Amazon</th>
            <th scope="col">Amazon only</th>
            {COMPARATORS.map((c) => (
              <th key={c.key} scope="col">{c.label}</th>
            ))}
            <th scope="col">Sold online, any</th>
          </tr>
        </thead>
        <tbody>
          {data.series.map((d) => (
            <tr key={d.year}>
              <th scope="row">{d.year}</th>
              <td>{d.recalls}</td>
              <td>{d.retailers.amazon}%</td>
              <td>{d.amazonOnly}%</td>
              {COMPARATORS.map((c) => (
                <td key={c.key}>{d.retailers[c.key]}%</td>
              ))}
              <td>{d.online.mid}%</td>
            </tr>
          ))}
        </tbody>
      </table>
      </div>

      <figcaption className="mt-8 max-w-[62ch] text-[17px] leading-[1.6] text-[var(--color-ink-soft)]">
        <p className="m-0">
          The share of US product recalls that mention each company. CPSC writes down where a
          product was sold as one sentence, so this counts <em>mentions</em>, not sales or
          market share.
        </p>
        <p className="mt-3 mb-0">
          {showControl ? (
            <strong className="font-semibold text-[var(--color-ink)]">
              Online selling overall grew {ctlGrowth.toFixed(1)}× since {first.year}. Amazon grew{' '}
              {(amzLast / amzFirst).toFixed(1)}×. Online shopping growing does not explain the
              gap, and Walmart, Target and Home Depot are flat or falling over the same stretch.
            </strong>
          ) : (
            <strong className="font-semibold text-[var(--color-ink)]">The obvious objection is that everyone shops online now. Turn it on and see whether it holds.</strong>
          )}
        </p>
      </figcaption>
    </figure>
  )
}

/**
 * A toggle wears the colour of the thing it controls.
 *
 * Both of these used to light up in the signal orange. That was wrong for the
 * objection toggle, which adds the muted "sold online" line: you pressed an
 * orange button and a tan dashed line appeared, so nothing on screen told you
 * which mark you had just summoned. The sole-retailer toggle keeps the orange,
 * because the line it changes genuinely is the orange one.
 *
 * The swatch carries the same dash pattern as the line it draws, so the link
 * survives for anyone who cannot separate the two hues.
 */
function Toggle({
  on,
  onClick,
  tone = 'var(--color-signal)',
  swatch,
  children,
}: {
  on: boolean
  onClick: () => void
  tone?: string
  swatch?: 'solid' | 'dashed'
  children: React.ReactNode
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={on}
      className={`flex items-center gap-2.5 rounded-full border px-5 py-2.5 text-[15px] transition-colors ${
        on
          ? ''
          : 'border-[var(--color-rule)] text-[var(--color-ink-soft)] hover:border-[var(--color-ink-faint)] hover:text-[var(--color-ink)]'
      }`}
      style={
        on ? { borderColor: tone, background: tone, color: 'var(--color-paper)' } : undefined
      }
    >
      {swatch && (
        <svg width="18" height="8" viewBox="0 0 18 8" aria-hidden className="shrink-0 overflow-visible">
          <line
            x1="0" y1="4" x2="18" y2="4"
            stroke={on ? 'var(--color-paper)' : tone}
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeDasharray={swatch === 'dashed' ? '5 4' : undefined}
          />
        </svg>
      )}
      {children}
    </button>
  )
}
