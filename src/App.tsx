import { useId, useState } from 'react'
import RetailerChart from './RetailerChart'
import Controls from './Controls'
import CoverageRings from './CoverageRings'
import CountUp from './CountUp'
import MotionNotice from './MotionNotice'
import BiggestRecalls from './BiggestRecalls'
import data from './data/recalls.json'

const last = data.series.at(-1)!
const first = data.series[0]

const asOf = new Date(data.newestRecallDate!).toLocaleDateString('en-US', {
  month: 'long', day: 'numeric', year: 'numeric', timeZone: 'UTC',
})

/**
 * The headline word, derived rather than typed.
 *
 * It read "Half of every product recall" against a hardcoded 50.0%. A week of
 * new data moved the figure to 49.6% and the headline did not move with it, so
 * the largest type on the page was the only claim here that was not computed.
 * It will keep crossing 50% in both directions, and nobody would catch it.
 *
 * Below the line it says "Nearly half", which understates rather than
 * overstates, and that is the correct direction for a page whose whole argument
 * is that it does not overstate.
 */
const headlineQuantity = last.amazonOnly! >= 50 ? 'Half' : 'Nearly half'

export default function App() {
  return (
    <main className="mx-auto max-w-[1080px] px-6 pb-32 sm:px-10">
      <header className="flex flex-wrap items-center justify-between gap-x-8 gap-y-4 border-b border-[var(--color-rule)] py-5">
        <div className="flex items-center gap-5">
          <h1 className="m-0 font-[family-name:var(--font-display)] text-[22px] font-normal tracking-tight">
            The Recall Record
          </h1>
          <Controls />
        </div>
        <p className="m-0 font-[family-name:var(--font-mono)] text-[13px] uppercase tracking-[0.14em] text-[var(--color-ink-faint)]">
          Issue 01 · Data through {asOf}
        </p>
      </header>

      <section className="pt-16 pb-20 sm:pt-24 sm:pb-28">
        <p className="m-0 font-[family-name:var(--font-mono)] text-[13px] uppercase tracking-[0.14em] text-[var(--color-signal)]">
          {last.year} so far
        </p>
        <h2 className="mt-6 mb-0 max-w-[19ch] font-[family-name:var(--font-display)] text-[clamp(2.6rem,7.5vw,5.5rem)] font-normal leading-[1.02] tracking-[-0.02em]">
          {headlineQuantity} of every product recall in America is something you could only buy
          on Amazon.
        </h2>
        <p className="arrive mt-8 mb-0 max-w-[46ch] text-[21px] leading-[1.55] text-[var(--color-ink-soft)]">
          In {first.year} it was <CountUp to={first.amazonOnly!} suffix="%" />, about one in
          fourteen. This year it is{' '}
          <strong className="font-semibold text-[var(--color-ink)]">
            <CountUp to={last.amazonOnly!} suffix="%" />
          </strong>
          . That is {last.amazonOnlyCount} of {last.recalls} recalls where Amazon is the only
          store named on the notice.
        </p>
      </section>

      <section className="border-t border-[var(--color-rule)] py-20">
        <h3 className="m-0 max-w-[24ch] font-[family-name:var(--font-display)] text-[clamp(1.7rem,3.6vw,2.6rem)] font-normal leading-[1.12] tracking-[-0.015em]">
          Amazon is climbing. Everyone else is flat.
        </h3>
        <p className="arrive mt-5 mb-12 max-w-[50ch] text-[19px] leading-[1.6] text-[var(--color-ink-soft)]">
          Every US product recall since {first.year}, grouped by which store the notice
          mentions. Amazon quadruples. Walmart rises, then drops. Target and Home Depot
          barely move.
        </p>
        <MotionNotice />
        <RetailerChart />
      </section>

      <BiggestRecalls />
      <Methodology />
      <FieldCoverage />

      <footer className="border-t border-[var(--color-rule)] py-12">
        <div className="flex flex-wrap items-end justify-between gap-x-10 gap-y-8">
          <div className="max-w-[46ch]">
            <p className="m-0 text-[19px] leading-[1.55] text-[var(--color-ink)]">
              Designed and built by{' '}
              <a
                className="font-semibold underline decoration-[var(--color-signal)] decoration-2 underline-offset-4"
                href="https://somekidpaul.com"
              >
                Paul Buczkowski
              </a>
              .
            </p>
            <p className="m-0 mt-3 text-[16px] leading-[1.6] text-[var(--color-ink-soft)]">
              AI-native Product Designer with years in web, brand and marketing, now shipping
              products end to end. I take something confusing and turn it into one clear, honest
              answer, then show the reasoning so you can decide whether to trust it. More at{' '}
              <a
                className="underline decoration-[var(--color-rule)] underline-offset-4 hover:decoration-[var(--color-ink)]"
                href="https://somekidpaul.com"
              >
                somekidpaul.com
              </a>
              .
            </p>
          </div>

          <div className="no-print flex flex-wrap gap-3">
            <a
              href="/recall-data.csv"
              download
              className="rounded-full border border-[var(--color-rule)] px-5 py-2.5 text-[15px] text-[var(--color-ink-soft)] transition-colors hover:border-[var(--color-ink-faint)] hover:text-[var(--color-ink)]"
            >
              Download CSV
            </a>
            <a
              href="/recall-data.json"
              download
              className="rounded-full border border-[var(--color-rule)] px-5 py-2.5 text-[15px] text-[var(--color-ink-soft)] transition-colors hover:border-[var(--color-ink-faint)] hover:text-[var(--color-ink)]"
            >
              JSON
            </a>
            <a
              href={data.source}
              className="rounded-full border border-[var(--color-rule)] px-5 py-2.5 text-[15px] text-[var(--color-ink-soft)] transition-colors hover:border-[var(--color-ink-faint)] hover:text-[var(--color-ink)]"
            >
              Go to the raw CPSC data
            </a>
          </div>
        </div>

        <p className="m-0 mt-10 text-[15px] text-[var(--color-ink-faint)]">
          Free government data. No tracking, no cookies, no accounts. Every number here is
          calculated straight from the source above when the page is built, so it cannot drift
          out of sync.
        </p>
      </footer>
    </main>
  )
}

function Card({ label, value, children }: { label: string; value: string; children: React.ReactNode }) {
  return (
    <div className="rounded-xl border border-[var(--color-rule)] bg-[var(--color-paper-sunk)] p-7">
      <p className="m-0 font-[family-name:var(--font-mono)] text-[13px] uppercase tracking-[0.16em] text-[var(--color-ink-faint)]">
        {label}
      </p>
      <p className="m-0 mt-4 font-[family-name:var(--font-display)] text-[38px] leading-none tracking-tight text-[var(--color-ink)] tabular-nums">
        {value}
      </p>
      <p className="m-0 mt-4 text-[17px] leading-[1.55] text-[var(--color-ink-soft)]">{children}</p>
    </div>
  )
}

function Methodology() {
  const cov = data.coverage
  const w = data.windowContext
  const p = data.partialYear!
  const shortFirst = first.amazonAmongShort!
  const shortLast = last.amazonAmongShort!
  const mfrFirst = data.trend.manufacturer[0].pct
  const mfrLast = data.trend.manufacturer.at(-1)!.pct
  const t25 = data.manufacturerTest.at(-2)!
  const t26 = data.manufacturerTest.at(-1)!
  const round1 = (n: number) => Math.round(n * 10) / 10
  const gap25 = round1(t25.everythingElse.manufacturerKnown! - t25.amazonOnly.manufacturerKnown!)
  const gap26 = round1(t26.everythingElse.manufacturerKnown! - t26.amazonOnly.manufacturerKnown!)

  return (
    <section className="border-t border-[var(--color-rule)] py-20">
      <h3 className="m-0 max-w-[24ch] font-[family-name:var(--font-display)] text-[clamp(1.7rem,3.6vw,2.6rem)] font-normal leading-[1.12] tracking-[-0.015em]">
        How I counted this, and where it falls short.
      </h3>

      <div className="card-row mt-10 flex flex-col gap-4 sm:flex-row">
        <Card label="Source" value="CPSC">
          The government's own recall database, free for anyone to use.{' '}
          <a
            className="underline decoration-[var(--color-rule)] underline-offset-4 hover:decoration-[var(--color-ink)]"
            href={data.source}
          >
            Go check it yourself
          </a>
          .
        </Card>
        <Card label="Recalls analyzed" value={cov.total.toLocaleString()}>
          Out of {data.corpusTotal.toLocaleString()} in the full database, which reaches back to
          1973. This page covers {first.year} onward. Why that year, and not an earlier one, is
          the first question below.
        </Card>
        <Card label="Rebuilt" value="Weekly">
          Newest recall {data.newestRecallDate}. If the data ever shrinks or goes more than
          three weeks stale, the rebuild stops instead of publishing bad numbers.
        </Card>
      </div>

      {/* No top rule. The solid line above the first row read as a divider
          between list items, which made it look like a row was missing above
          "What the number actually means". The dotted separators between rows
          already carry the grouping. */}
      <div className="mt-14">
        <Note title={`Why this starts in ${first.year}, when the data goes back to ${w.corpusFirstYear}`}>
          Two different reasons, and only one of them is a real limit. The first is: the retailer
          sentence, the one thing this whole page depends on, is mostly blank in the early years.
          Of the {w.preReliableRecalls.toLocaleString()} recalls before {w.firstReliableYear}, only{' '}
          <strong className="font-semibold text-[var(--color-ink)]">
            {w.preReliableRetailerPct}%
          </strong>{' '}
          say where the product was sold at all. Counting how often Amazon gets named across years
          where most recalls name nobody would measure the empty field, not Amazon. The second
          reason is not a limit at all. From {w.firstReliableYear} the field is filled in on 99% or
          more of recalls every single year, written the same way it is written today, so I could
          have started there. I did not, and you should know that {first.year} is a choice. It is
          the conservative one: Amazon was{' '}
          <strong className="font-semibold text-[var(--color-ink)]">
            {w.amazonAtReliableStart}%
          </strong>{' '}
          of recalls in {w.firstReliableYear}, so a longer run would make this climb look steeper,
          not gentler.
        </Note>

        <Note title="What the number actually means">
          CPSC does not publish a tidy list of stores. It writes one sentence per recall,
          like <em>“Online at Amazon.com from August 2024 through April 2026 for
          about $140.”</em> So every number here counts how often a company gets{' '}
          <strong className="font-semibold text-[var(--color-ink)]">named</strong> in that
          sentence. It is not how much they sold, and it is not market share. Those are
          different questions, and this data cannot answer them.
        </Note>

        <Note title={`Why ${p.year} is not a full year`}>
          Because the year is not over yet. The data runs through {data.newestRecallDate},
          about {p.monthsElapsed} months in. That matters less than it sounds, because every
          number here is a percentage and not a total, so a shorter year is not a smaller
          one. I also checked month by month for a seasonal pattern that could tilt a partial
          year, and there is not one. The chart draws the last stretch dashed so you can see
          which part is still moving.
        </Note>

        <Note title="The obvious objection: everyone shops online now">
          If online shopping simply grew, every online store should have gone up together.
          And because “sold online” is a fuzzy thing to define, I tried three definitions,
          strict to loose, so the answer would not hinge on my judgment call. Online selling
          grew{' '}
          <strong className="font-semibold text-[var(--color-ink)]">
            {(last.online.strict! / first.online.strict!).toFixed(1)}×,{' '}
            {(last.online.mid! / first.online.mid!).toFixed(1)}× and{' '}
            {(last.online.loose! / first.online.loose!).toFixed(1)}×
          </strong>{' '}
          respectively. Amazon grew{' '}
          <strong className="font-semibold text-[var(--color-ink)]">
            {(last.retailers.amazon! / first.retailers.amazon!).toFixed(1)}×
          </strong>
          . Whichever definition you pick, the answer comes out the same.
        </Note>

        <Note title="The way this could have been fake">
          If CPSC had started writing longer sentences, more store names would match by
          accident and everyone's numbers would drift up together. It went the other way. The
          typical sentence got <em>shorter</em>, from {first.medianDescriptionChars} characters
          in {first.year} to {last.medianDescriptionChars} today. So I looked only at the short
          sentences, holding length roughly even, and Amazon still climbs from{' '}
          <strong className="font-semibold text-[var(--color-ink)]">
            {shortFirst}% to {shortLast}%
          </strong>
          . That is steeper than the headline, because more recalls now have just one store to
          name.
        </Note>
        <Note title="A claim this piece does not make">
          Recalls name the manufacturer less and less: {mfrFirst}% did in {first.year}, against{' '}
          {mfrLast}% this year. The tempting story is that marketplace sellers are anonymous, so
          Amazon-only recalls hide who made the thing. I tested it. It is not true. Lumped
          together it looks convincing, but that is a trick of the calendar, because Amazon-only
          recalls bunch up in the recent years, when the record keeping is bad for everyone. Year
          by year the gap flips back and forth, and in the two most recent years, which have the
          biggest samples, it is{' '}
          <strong className="font-semibold text-[var(--color-ink)]">
            {gap25 > 0 ? '+' : ''}{gap25} and {gap26 > 0 ? '+' : ''}{gap26} points
          </strong>
          . So the records are getting worse across the board, and the more interesting version
          of this story is one I cannot back up.
        </Note>
      </div>

    </section>
  )
}

function FieldCoverage() {
  const cov = data.coverage
  return (
    <section className="border-t border-[var(--color-rule)] py-20">
      <h3 className="m-0 max-w-[26ch] font-[family-name:var(--font-display)] text-[clamp(1.7rem,3.6vw,2.6rem)] font-normal leading-[1.12] tracking-[-0.015em]">
        What the records actually contain, gaps and all.
      </h3>
      <p className="mt-5 mb-14 max-w-[58ch] text-[19px] leading-[1.6] text-[var(--color-ink-soft)]">
        How often CPSC actually fills in each piece of information, across the{' '}
        {cov.total.toLocaleString()} recalls here. The weak ones sit right next to the strong
        ones, because a number you cannot see the holes in is not worth trusting. Six of these
        have been above 99% every year since {first.year}, so only the two that actually move get
        a trend line.
      </p>
      <CoverageRings />
    </section>
  )
}

/**
 * One row of the methodology accordion.
 *
 * Deliberately NOT built on <details>, which is where this started. The native
 * element flips content-visibility to hidden the instant it closes, so the
 * closing transition never runs, and on reopen the content emerges from a
 * skipped subtree where transitions do not fire on the first frame. The result
 * was an accordion that animated once and then snapped for the rest of the
 * session. Verified on the live site before rewriting it.
 *
 * So the state is React's and the semantics are hand-built: a real button, an
 * aria-expanded that tracks it, and aria-controls pointing at the region. That
 * is the same mechanism the recall panels use, and it animates in both
 * directions every time.
 */
function Note({ title, children }: { title: string; children: React.ReactNode }) {
  const [open, setOpen] = useState(false)
  const id = useId()

  /* The row separator is DOTTED, not solid. A 1px solid rule here is the same
     mark the page uses to end a section, so a separator between rows read as
     "the list stopped and an item is missing below it". Dotted says "another
     row follows". The group's own top border stays solid, because that one is
     genuinely a boundary. */
  return (
    <div className="border-b border-dotted border-[var(--color-rule)] last:border-b-0">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        aria-controls={id}
        className="note-row group flex w-full cursor-pointer items-center justify-between gap-6 py-5 text-left"
      >
        <h4 className="m-0 font-[family-name:var(--font-display)] text-[clamp(1.1rem,2.2vw,1.4rem)] font-normal leading-snug tracking-tight text-[var(--color-ink)]">
          {title}
        </h4>
        <span
          aria-hidden
          className="grid size-8 shrink-0 place-items-center rounded-full border border-[var(--color-rule)] text-[var(--color-ink-faint)] transition-colors group-hover:border-[var(--color-ink-faint)] group-hover:text-[var(--color-ink)]"
        >
          <svg
            width="13" height="13" viewBox="0 0 14 14" fill="none"
            className="chev" data-open={open}
          >
            <path d="M2.5 5L7 9.5L11.5 5" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </span>
      </button>

      <div className="disclosure" data-open={open} id={id} role="region" aria-hidden={!open}>
        <div>
          <p className="mt-0 mb-6 max-w-[68ch] text-[17px] leading-[1.65] text-[var(--color-ink-soft)]">
            {children}
          </p>
        </div>
      </div>
    </div>
  )
}
