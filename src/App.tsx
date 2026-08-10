import { useId, useState } from 'react'
import RetailerChart from './RetailerChart'
import Controls from './Controls'
import CoverageRings from './CoverageRings'
import CountUp from './CountUp'
import MotionNotice from './MotionNotice'
import BiggestRecalls from './BiggestRecalls'
import { FIND_ID } from './RecallSearch'
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
        <div className="flex items-center gap-6">
          {/* Scrolls to the search that is already on this page rather than
              navigating away to a second copy of it. The href stays a real URL
              so middle-click, right-click and no-JS all still work; the handler
              only intercepts the ordinary click.

              preventScroll on the focus call matters: focusing an element
              scrolls it into view instantly, which would cancel the smooth
              scroll a frame after it started. */}
          <a
            href="/check"
            onClick={(e) => {
              const shell = document.getElementById(FIND_ID)
              if (!shell || e.metaKey || e.ctrlKey || e.shiftKey || e.button !== 0) return
              e.preventDefault()
              /* Smooth for most people, instant for anyone who asked for less
                 motion. This is a page-length jump, which is exactly the kind
                 of travel Reduce Motion exists to stop, and it is also the
                 safety net: focus() is told not to scroll, so if the animated
                 scroll never runs the reader would be left typing into an input
                 five screens away. */
              const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches
              shell.scrollIntoView({ behavior: reduce ? 'auto' : 'smooth', block: 'center' })
              shell.querySelector('input')?.focus({ preventScroll: true })
            }}
            className="rounded-full border border-[var(--color-rule)] px-4 py-2 text-[14px] whitespace-nowrap text-[var(--color-ink-soft)] transition-colors hover:border-[var(--color-ink-faint)] hover:text-[var(--color-ink)]"
          >
            Check a product
          </a>
          <p className="m-0 hidden font-[family-name:var(--font-mono)] text-[13px] uppercase tracking-[0.14em] text-[var(--color-ink-faint)] sm:block">
            Issue 01 · Data through {asOf}
          </p>
        </div>
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
          {/* No count-up on the opening figure any more. It is zero, and
              animating a number up to nothing is a flourish with no payload.
              The sentence carries it instead. */}
          In {first.year}, not one of the {first.recalls} recalls that year named Amazon as the
          only place you could buy the product. Not one. This year it is{' '}
          {/* The number and the punctuation after it are one unbreakable unit.
              The count-up is an inline-block, so a following bare "." is its
              own wrap opportunity, and on a phone the period was landing alone
              at the start of the next line. */}
          <span className="whitespace-nowrap">
            <strong className="font-semibold text-[var(--color-ink)]">
              <CountUp to={last.amazonOnly!} suffix="%" />
            </strong>
            ,
          </span>{' '}
          or {last.amazonOnlyCount} of {last.recalls}.
        </p>
      </section>

      <section className="border-t border-[var(--color-rule)] py-20">
        <h3 className="m-0 max-w-[24ch] font-[family-name:var(--font-display)] text-[clamp(1.7rem,3.6vw,2.6rem)] font-normal leading-[1.12] tracking-[-0.015em]">
          Amazon is climbing. Everyone else is flat.
        </h3>
        <p className="arrive mt-5 mb-12 max-w-[50ch] text-[19px] leading-[1.6] text-[var(--color-ink-soft)]">
          Every US product recall since {first.year}, grouped by which store the notice
          mentions. Amazon goes from nothing to sixty percent. Walmart rises, then drops back.
          Target and Home Depot barely move in twenty-two years.
        </p>
        <MotionNotice />
        <RetailerChart />
      </section>

      {/* ORDER IS THE ARGUMENT. Claim, evidence, how it was counted and where it
          falls short, and only then the tool.

          The lookup used to sit here, between the chart and the methodology, so
          the page made its case, broke off to hand the reader a product
          browser, then restarted the case afterwards. That is what made a
          5.4-screen page feel long: not word count, an interrupted spine. It
          also buried the methodology behind a browsing interlude, and the
          methodology is the only reason a stranger should believe the number.

          The tool now closes the piece, which is where it belongs: it is the
          "so what do I do about it" after the argument has landed. */}
      <Methodology />
      <BiggestRecalls />

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
            {/* The line that used to sit here read "I take something confusing
                and turn it into one clear, honest answer". The page uses "I" six
                other times and they all work, because they are an analyst
                accounting for their own method: "I tested it", "I cannot back
                this up". That one was different in kind. It switched from
                reporting what was done to advertising what someone is, and it
                restated a claim the preceding 3,000 words had already made. */}
            <p className="m-0 mt-3 text-[16px] leading-[1.6] text-[var(--color-ink-soft)]">
              AI-native Product Designer, years in web, brand and marketing, now shipping
              products end to end. More at{' '}
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
  /* The year the growth-rate comparison is anchored to. Not the first year of
     the chart: Amazon is 0.0% there, so a multiplier off that baseline is
     undefined. */
  const ratio = data.series.find((s) => s.year === data.ratioFirstYear)!
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
        <Card label="Charted" value={data.series.reduce((n, s) => n + s.recalls, 0).toLocaleString()}>
          Recalls from {first.year} to {last.year}, out of{' '}
          {data.corpusTotal.toLocaleString()} in the full database going back to 1973. Why it
          starts where it does is the first question below.
        </Card>
        <Card label="Checked" value="Daily">
          Newest recall {data.newestRecallDate}. CPSC publishes in weekly batches, almost always
          on a Thursday, so a daily check is never more than a day behind. If the data ever
          shrinks or goes stale, the rebuild stops instead of publishing bad numbers.
        </Card>
      </div>

      {/* No top rule. The solid line above the first row read as a divider
          between list items, which made it look like a row was missing above
          "What the number actually means". The dotted separators between rows
          already carry the grouping. */}
      <div className="mt-14">
        <Note title={`Why this starts in ${first.year}, when the data goes back to ${w.corpusFirstYear}`}>
          Because {first.year} is where the record becomes usable, not where the story gets good.
          The retailer sentence is the one thing this whole page depends on, and it is mostly
          blank in the early years: of the {w.preReliableRecalls.toLocaleString()} recalls before{' '}
          {w.firstReliableYear}, only{' '}
          <strong className="font-semibold text-[var(--color-ink)]">
            {w.preReliableRetailerPct}%
          </strong>{' '}
          say where the product was sold at all. Counting how often Amazon gets named across years
          where most recalls name nobody would measure the empty field, not Amazon. From{' '}
          {first.year} onward it is filled in on 99% or more of recalls in every single year, in
          the same prose format it uses today, so the line can run the whole way without the
          ground shifting under it. This page used to start in {data.ratioFirstYear}, which was a
          choice rather than a limit, and starting a trend line at the point the trend begins is
          exactly the kind of quiet thumb on the scale the rest of this page is about.
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
          The clean way to answer this is to stop comparing Amazon to the whole world and
          compare it only to the rest of the internet. Among recalls that were sold online at
          all, the share naming Amazon goes from{' '}
          <strong className="font-semibold text-[var(--color-ink)]">
            {first.amazonOfOnline}% in {first.year} to {last.amazonOfOnline}% in {last.year}
          </strong>
          . So this is not online shopping lifting every boat. Amazon is taking the water out
          from under the other boats, and the growth of e-commerce cannot explain a share
          measured inside e-commerce. You can also do it the older way, by comparing growth
          rates, though that needs a baseline big enough to divide by, so it runs from{' '}
          {ratio.year} rather than {first.year}. Because “sold online” is a fuzzy thing to
          define I used three definitions, strict to loose: online selling grew{' '}
          <strong className="font-semibold text-[var(--color-ink)]">
            {(last.online.strict! / ratio.online.strict!).toFixed(1)}×,{' '}
            {(last.online.mid! / ratio.online.mid!).toFixed(1)}× and{' '}
            {(last.online.loose! / ratio.online.loose!).toFixed(1)}×
          </strong>{' '}
          while Amazon grew{' '}
          <strong className="font-semibold text-[var(--color-ink)]">
            {(last.retailers.amazon! / ratio.retailers.amazon!).toFixed(1)}×
          </strong>
          . Both ways round, the same answer.
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
          , which is steeper than the headline, because more recalls now have just one store to
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

      {/* COVERAGE LIVES INSIDE METHODOLOGY NOW, rather than as its own section.
          Both answer one question, how much this data can be trusted, and
          splitting them gave one idea two full-width headings and made the page
          restart a subject it had already begun. It is a subsection here, so
          the heading drops a level. */}
      <div className="mt-20 border-t border-[var(--color-rule)] pt-16">
        <h4 className="m-0 max-w-[26ch] font-[family-name:var(--font-display)] text-[clamp(1.4rem,2.8vw,2rem)] font-normal leading-[1.15] tracking-[-0.015em]">
          What the records actually contain, gaps and all.
        </h4>
        <p className="mt-5 mb-14 max-w-[62ch] text-[19px] leading-[1.6] text-[var(--color-ink-soft)]">
          How often CPSC actually fills in each piece of information, across the{' '}
        {cov.total.toLocaleString()} recalls since {data.coverageFirstYear}. The weak ones sit
        right next to the strong ones, because a number you cannot see the holes in is not worth
        trusting. Six of these have been above 99% every year in that span, so only the two that
        actually move get a trend line.
      </p>
      {/* The chart runs from 2004 and this section does not, so it says so.
          Blending the two would misreport rather than inform: Remedy type did
          not exist before 2009, and averaging across that boundary would read
          as "partly filled in" when the truth is "the field was invented
          mid-window". Each window is set by the field it describes. */}
        <p className="mt-[-2.5rem] mb-14 max-w-[62ch] text-[15px] leading-[1.6] text-[var(--color-ink-faint)]">
          A shorter window than the chart above, on purpose. The chart measures one field that has
        been reliable since {first.year}. This section describes what the records hold now, and
        some of these fields did not exist in {first.year} at all, so averaging across that
        boundary would describe a filing change rather than a gap.
      </p>
        <CoverageRings />
      </div>
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
