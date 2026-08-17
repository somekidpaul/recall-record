import data from './data/recalls.json'
import CountUp from './CountUp'

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
  const latestSeries = data.series.find((s) => s.year === latest.year)!
  const latestOrigin = latestSeries.origin

  return (
    <section className="border-t border-[var(--color-rule)] py-20">
      {/* A mono eyebrow, so a fast scroller reads this as a SEPARATE, second
          finding (who made the thing) rather than blurring it into the first
          one (who sold it) as a single "Amazon is bad" impression. That blur is
          the exact causal leap the caveat at the foot of this section fights. */}
      <p className="m-0 mb-4 font-[family-name:var(--font-mono)] text-[12px] uppercase tracking-[0.1em] text-[var(--color-ink-faint)]">
        A second, separate pattern
      </p>
      <h3 className="m-0 max-w-[26ch] font-[family-name:var(--font-display)] text-[clamp(1.7rem,3.6vw,2.6rem)] font-normal leading-[1.22] tracking-[-0.015em] sm:leading-[1.14]">
        {/* "Made somewhere else" never said else than WHAT, so the heading
            asked the reader to hold a comparison it had not made yet. It names
            the finding now. 95.6% is "almost all" without rounding up. */}
        The ones only Amazon sold are almost all made in China.
      </h3>
      <p className="mt-5 mb-10 measure text-[19px] leading-[1.6] text-[var(--color-ink-soft)]">
        {/* A BRIDGE, because this is a second finding and it used to land with
            no handoff from the first. A reader arriving here has just finished
            absorbing who SOLD these products; without a sentence connecting the
            two, a new claim about manufacturing reads as a subject change
            rather than the same record answering a second question. */}
        The chart above is about who sold them. The record also says who made them, and it does
        for {latestOrigin.soleN + latestOrigin.restN} of this year&rsquo;s {latestSeries.recalls} recalls.
      </p>

      {/* THE ARITHMETIC, SPELLED OUT.

          This section showed two percentages and nothing else, and the first
          question a reader asks is why they do not add to 100. They do not
          because they are shares of two DIFFERENT groups, and the page never
          said so. The headline paragraph gets this right further up: it says
          "49.6%, or 185 of 373", and the fraction is what makes the percentage
          legible. This block was asking for the same trust without showing the
          same working. */}
      <p className="mt-4 mb-10 measure text-[19px] leading-[1.6] text-[var(--color-ink-soft)]">
        Split those{' '}
        <strong className="font-semibold text-[var(--color-ink)]">
          {latestOrigin.soleN + latestOrigin.restN}
        </strong>{' '}
        into two piles, the Amazon-only recalls against everything else, then ask each pile the
        same question: how many were made in China?
      </p>

      {/* The comparison, as two figures rather than a chart. There are exactly
          two numbers and one relationship between them, and a chart of two bars
          is a decoration around a sentence. */}
      <div className="grid gap-4 sm:grid-cols-2">
        <Figure
          value={latest.soleChina}
          pile="Recalls naming Amazon and no other store"
          n={latestOrigin.soleN}
          emphasis
        />
        <Figure
          value={latest.restChina}
          pile="Every other recall that year"
          n={latestOrigin.restN}
        />
      </div>

      {/* THE CAVEAT MOVED UP, AND OUT OF THE FAINT GRAY. A first-time reader hit
          the 95.7% and walked away with "Amazon makes junk", the exact causal
          read this does not support, because the correction sat small, gray, and
          below the scary number where nobody reached it. It now sits directly
          under the two cards at full body weight, so the "why" arrives with the
          number instead of long after it. */}
      <p className="mt-8 mb-0 measure text-[19px] leading-[1.6] text-[var(--color-ink)]">
        This is not Amazon making bad products. The likelier reason is duller: a marketplace is
        full of small sellers importing straight from overseas factories, far more than a store
        shelf is, so the two piles were never buying from the same suppliers. It is a pattern in
        who sells there, not proof of anything Amazon does.
      </p>

      <p className="mt-6 mb-0 measure text-[17px] leading-[1.65] text-[var(--color-ink-soft)]">
        {everyYearHigher ? (
          <>
            That is a {latest.gap.toFixed(0)}-point difference, and it is not a {latest.year}{' '}
            quirk. The Amazon-only pile has come out more Chinese-made{' '}
            <strong className="font-semibold text-[var(--color-ink)]">every year</strong> there
            are enough recalls to compare, back to {first.year}. The closest it ever got was{' '}
            <strong className="font-semibold text-[var(--color-ink)]">
              {smallest.gap.toFixed(0)} points
            </strong>
            , in {smallest.year}.
          </>
        ) : (
          <>
            The gap runs in both directions across the {rows.length} years measured, so it is not a
            stable pattern and nothing here should be read as a trend.
          </>
        )}
      </p>

      {/*
        THE BARS ARE GONE, and removing them is the fix rather than a retreat.

        This was a bar per year: the Amazon-alone China share drawn in signal
        over the everything-else share in grey, with the gap printed beside it.
        Nothing on screen said that. No key, no axis, no unit. A reader saw a
        year, a mostly-orange bar, and "+17".

        It was also drawing the comparison wrong. Both values started at zero, so
        the larger simply covered the smaller and the pair read as one bar with a
        tail rather than as two numbers being set against each other. Paul asked
        what the graphs meant, which is the answer: they did not mean anything
        legible, and an unreadable way to check a claim is worse than not
        offering one, because it looks like evidence.

        What the reader actually needs from this block is one thing: the gap
        never flips. That is a list of thirteen numbers, all positive, and a list
        of thirteen numbers is a perfectly good way to show thirteen numbers.
        Labelled, with its unit stated, and the smallest one marked so the
        sentence above can be checked at a glance.
      */}
      <div className="mt-10">
        <p className="m-0 font-[family-name:var(--font-mono)] text-[12px] uppercase tracking-[0.1em] text-[var(--color-ink-faint)]">
          The gap each year, in percentage points
        </p>
        <ul className="m-0 mt-4 flex list-none flex-wrap gap-x-7 gap-y-3 p-0">
          {rows.map((r) => {
            const isSmallest = r.year === smallest.year
            return (
              <li key={r.year} className="flex items-baseline gap-2 tabular-nums">
                <span className="font-[family-name:var(--font-mono)] text-[12px] text-[var(--color-ink-faint)]">
                  ’{String(r.year).slice(2)}
                </span>
                <span
                  className={`text-[17px] ${isSmallest ? 'font-semibold' : ''}`}
                  style={{ color: isSmallest ? 'var(--color-signal)' : 'var(--color-ink)' }}
                >
                  +{r.gap.toFixed(0)}
                </span>
              </li>
            )
          })}
        </ul>
        <p className="m-0 mt-4 measure text-[15px] leading-[1.6] text-[var(--color-ink-faint)]">
          Every number is positive, so in each year shown the Amazon-only group was more
          Chinese-made than the rest. Only years with at least {MIN_PER_SIDE} recalls in each pile
          are shown, so no figure rides on a handful of records. The lowest, {smallest.year}, is
          marked.
        </p>
      </div>

      <p className="m-0 mt-10 measure text-[15px] leading-[1.6] text-[var(--color-ink-faint)]">
        One more limit, so the number is not read for more than it is. This counts where recalled
        products were made. It does not count where products in general are made, which would need
        a source this record does not contain. So it is a fact about the recalled pile, not a
        claim about everything Amazon sells.
      </p>
    </section>
  )
}

/**
 * One pile, stated as a fraction before it is stated as a percentage.
 *
 * It used to print "95.1%" over "made in China, of recalls naming Amazon alone"
 * with the group size in a footnote below. Two percentages that do not sum to
 * 100 sitting side by side is the exact shape that makes a reader assume they
 * should, and nothing on the card contradicted that assumption.
 *
 * Leading with "176 of 185" removes the question before it is asked. The
 * denominators are visibly different, so the percentages obviously cannot be
 * parts of one whole. Same move the headline paragraph already makes with
 * "49.6%, or 185 of 373".
 */
function Figure({
  value,
  pile,
  n,
  emphasis = false,
}: {
  value: number
  pile: string
  n: number
  emphasis?: boolean
}) {
  /* Recovered from the share rather than carried separately, so it can never
     disagree with the percentage printed beside it. */
  const made = Math.round((value / 100) * n)
  return (
    <div
      className={`rounded-2xl border p-6 ${
        emphasis
          ? 'border-[var(--color-signal)] bg-[var(--color-paper-sunk)]'
          : 'border-[var(--color-rule)]'
      }`}
    >
      <p className="m-0 font-[family-name:var(--font-mono)] text-[12px] uppercase tracking-[0.08em] leading-[1.5] text-[var(--color-ink-faint)]">
        {pile}
      </p>
      <p className="m-0 mt-4 text-[19px] leading-[1.5] text-[var(--color-ink)] tabular-nums">
        <strong className="font-semibold">{made.toLocaleString()}</strong> of{' '}
        <strong className="font-semibold">{n.toLocaleString()}</strong> were made in China
      </p>
      <p
        className="m-0 mt-2 font-[family-name:var(--font-display)] text-[clamp(2.2rem,5.5vw,3.2rem)] leading-[1.05] tabular-nums"
        style={{ color: emphasis ? 'var(--color-signal)' : 'var(--color-ink)' }}
      >
        <CountUp to={value} suffix="%" />
      </p>
    </div>
  )
}
