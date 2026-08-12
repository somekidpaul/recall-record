import data from './data/recalls.json'

/**
 * The second finding, and the one the retailer chart cannot make on its own.
 *
 * CPSC records a country of manufacture on 98.6% to 100% of recalls in every
 * year since 2015. The site read that field once, to draw a coverage ring, and
 * never asked it a question. Split the way the chart splits, it answers one:
 * the recalls that name Amazon alone are overwhelmingly Chinese-made, and the
 * rest of the record is not, and that has been true every single year measured.
 *
 * WHY IT SITS AFTER THE CHART AND NOT BESIDE IT. This is a different claim with
 * a different evidence base, and stacking it next to the retailer line would
 * invite a reader to treat one number as proof of the other. It runs as its own
 * short section, after the objection has been answered, so the first finding is
 * already settled before a second one is introduced.
 *
 * WHAT IT DELIBERATELY DOES NOT SAY. Nothing here claims Amazon causes unsafe
 * manufacturing. The likeliest explanation is structural and boring: a
 * marketplace of third-party sellers carries far more direct-from-manufacturer
 * importers than a retail shelf does, so the two channels are not drawing from
 * the same pool of suppliers. That sentence is on the page, at the same weight
 * as the number, for the same reason every other caveat here is.
 */

/**
 * 20, not 10, and the difference is whether a percentage means anything.
 *
 * At 10 this let in 2010 through 2014, where the Amazon-alone side holds 10 to
 * 12 records. A single recall moves that number ten points, and the section was
 * printing "90%" off nine recalls, then counting that year toward a claim about
 * consistency. Technically true, and exactly the kind of thin figure the rest of
 * this page refuses to lean on.
 *
 * At 20 the smallest group is 21 records, one recall moves it under five points,
 * and thirteen years survive: 2013, then 2015 onward unbroken. The gap is still
 * positive in every one of them. Dropping four years cost nothing except a
 * bigger number in a sentence.
 */
const MIN_PER_SIDE = 20

type YearOrigin = {
  year: number
  soleChina: number
  restChina: number
  gap: number
}

const rows: YearOrigin[] = data.series
  .filter(
    (s) =>
      s.origin &&
      s.origin.soleChina != null &&
      s.origin.restChina != null &&
      s.origin.soleN >= MIN_PER_SIDE &&
      s.origin.restN >= MIN_PER_SIDE,
  )
  .map((s) => ({
    year: s.year,
    soleChina: s.origin.soleChina as number,
    restChina: s.origin.restChina as number,
    gap: Math.round(((s.origin.soleChina as number) - (s.origin.restChina as number)) * 10) / 10,
  }))

export default function OriginSplit() {
  if (rows.length < 3) return null

  const latest = rows.at(-1)!
  const first = rows[0]
  const everyYearHigher = rows.every((r) => r.gap > 0)
  const smallest = rows.reduce((a, b) => (a.gap < b.gap ? a : b))
  const latestOrigin = data.series.find((s) => s.year === latest.year)!.origin

  return (
    <section className="border-t border-[var(--color-rule)] py-20">
      <h3 className="m-0 max-w-[26ch] font-[family-name:var(--font-display)] text-[clamp(1.7rem,3.6vw,2.6rem)] font-normal leading-[1.22] tracking-[-0.015em] sm:leading-[1.14]">
        The ones only Amazon sold are made somewhere else.
      </h3>
      <p className="mt-5 mb-10 max-w-[62ch] text-[19px] leading-[1.6] text-[var(--color-ink-soft)]">
        CPSC also records where a recalled product was manufactured, on{' '}
        {latestOrigin.coverage}% of {latest.year} recalls. Split the same way the chart splits, the
        two groups do not look alike.
      </p>

      {/* The comparison, as two figures rather than a chart. There are exactly
          two numbers and one relationship between them, and a chart of two bars
          is a decoration around a sentence. */}
      <div className="grid gap-4 sm:grid-cols-2">
        <Figure
          value={latest.soleChina}
          label="of recalls naming Amazon alone"
          n={latestOrigin.soleN}
          year={latest.year}
          emphasis
        />
        <Figure
          value={latest.restChina}
          label="of every other recall"
          n={latestOrigin.restN}
          year={latest.year}
        />
      </div>

      <p className="mt-8 mb-0 max-w-[68ch] text-[17px] leading-[1.65] text-[var(--color-ink-soft)]">
        {everyYearHigher ? (
          <>
            That gap is not a {latest.year} quirk. It runs the same direction in{' '}
            <strong className="font-semibold text-[var(--color-ink)]">
              every one of the {rows.length} years
            </strong>{' '}
            {/* NOT "from 2013 onward". The set starts at 2013 but skips 2014,
                where the Amazon-alone side holds 12 records and falls under the
                threshold, so "onward" would promise a continuity the strip below
                visibly does not have. The years shown are the years that
                qualify, and the sentence now says exactly that. */}
            back to {first.year} that have at least {MIN_PER_SIDE} recalls on both sides. Its
            narrowest was {smallest.year}, still{' '}
            <strong className="font-semibold text-[var(--color-ink)]">
              {smallest.gap.toFixed(1)} points
            </strong>{' '}
            apart.
          </>
        ) : (
          <>
            The gap runs in both directions across the {rows.length} years measured, so it is not a
            stable pattern and nothing here should be read as a trend.
          </>
        )}
      </p>

      {/* Every year, so the reader can check the claim above instead of taking
          it. A bar per year, split at the gap. */}
      <ul className="m-0 mt-10 grid list-none grid-cols-2 gap-x-6 gap-y-4 p-0 sm:grid-cols-3 lg:grid-cols-4">
        {rows.map((r) => (
          <li key={r.year} className="flex items-baseline gap-3">
            <span className="font-[family-name:var(--font-mono)] text-[12px] tabular-nums text-[var(--color-ink-faint)]">
              ’{String(r.year).slice(2)}
            </span>
            <span className="relative h-1.5 flex-1 rounded-full bg-[var(--color-rule)]">
              <span
                className="absolute inset-y-0 left-0 rounded-full bg-[var(--color-ink-faint)]"
                style={{ width: `${r.restChina}%` }}
              />
              <span
                className="absolute inset-y-0 left-0 rounded-full bg-[var(--color-signal)] opacity-90"
                style={{ width: `${r.soleChina}%`, mixBlendMode: 'normal' }}
              />
            </span>
            <span className="font-[family-name:var(--font-mono)] text-[12px] tabular-nums text-[var(--color-ink-faint)]">
              {r.gap > 0 ? '+' : ''}
              {r.gap.toFixed(0)}
            </span>
          </li>
        ))}
      </ul>

      <p className="m-0 mt-10 max-w-[72ch] border-t border-[var(--color-rule)] pt-6 text-[15px] leading-[1.6] text-[var(--color-ink-faint)]">
        This is a correlation and it is worth saying what it probably is not. Nothing here shows
        that Amazon causes unsafe manufacturing. The likeliest reason is duller: a marketplace of
        third-party sellers carries far more direct-from-manufacturer importers than a retail shelf
        does, so the two groups are not drawing from the same set of suppliers to begin with. This
        counts where recalled products were made. It does not count where products in general are
        made, which would need a source this record does not contain.
      </p>
    </section>
  )
}

function Figure({
  value,
  label,
  n,
  year,
  emphasis = false,
}: {
  value: number
  label: string
  n: number
  year: number
  emphasis?: boolean
}) {
  return (
    <div
      className={`rounded-2xl border p-6 ${
        emphasis
          ? 'border-[var(--color-signal)] bg-[var(--color-paper-sunk)]'
          : 'border-[var(--color-rule)]'
      }`}
    >
      <p
        className="m-0 font-[family-name:var(--font-display)] text-[clamp(2.4rem,6vw,3.6rem)] leading-[1.05] tabular-nums"
        style={{ color: emphasis ? 'var(--color-signal)' : 'var(--color-ink)' }}
      >
        {value}%
      </p>
      <p className="m-0 mt-3 text-[17px] leading-[1.5] text-[var(--color-ink)]">
        made in China, {label}
      </p>
      <p className="m-0 mt-2 font-[family-name:var(--font-mono)] text-[12px] uppercase tracking-[0.08em] text-[var(--color-ink-faint)] tabular-nums">
        {year} · {n.toLocaleString()} recalls
      </p>
    </div>
  )
}
