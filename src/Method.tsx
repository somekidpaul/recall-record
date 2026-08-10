import { useEffect } from 'react'
import Controls from './Controls'
import CoverageRings from './CoverageRings'
import data from './data/recalls.json'
import { useId, useState } from 'react'

const last = data.series.at(-1)!
const first = data.series[0]

/**
 * /method, the whole account of how the number was produced.
 *
 * This used to be a section in the middle of the essay. On a 375px phone it
 * measured 3,279px, four screens and 41% of the page, which meant scrolling
 * four screens of caveats to reach the recall list. Moving it here takes the
 * essay from 9.8 screens to under six.
 *
 * The essay keeps the three provenance cards, so a reader still sees where the
 * data comes from without leaving, and links here for the rest. The trade is
 * one click between the claim and the proof, which is worth taking: anyone who
 * cares enough to audit the method will click, and this is now a URL that can
 * be sent on its own rather than "scroll to the middle of that page".
 *
 * Nothing was reworded in the move.
 */
export default function Method() {
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

  useEffect(() => {
    document.title = 'How this was counted | The Recall Record'
  }, [])

  return (
    <main className="mx-auto max-w-[1080px] px-6 pb-32 sm:px-10">
      <header className="flex flex-wrap items-center justify-between gap-x-4 gap-y-3 border-b border-[var(--color-rule)] py-4 sm:gap-x-8 sm:py-5">
        <div className="flex items-center gap-3 sm:gap-5">
          <a
            href="/"
            className="m-0 font-[family-name:var(--font-display)] text-[19px] font-normal tracking-tight text-[var(--color-ink)] sm:text-[22px]"
          >
            The Recall Record
          </a>
          <Controls />
        </div>
        {/* Arrow alone on a phone. Measured at 375px: the title and theme pill
            are 262px of a 327px masthead, and "Read the record →" is another
            151px, so 413 wrapped it onto a second row. The label returns at
            sm. */}
        <a
          href="/"
          aria-label="Back to the record"
          className="m-0 flex items-center gap-2 font-[family-name:var(--font-mono)] text-[12px] uppercase tracking-[0.14em] text-[var(--color-ink-faint)] hover:text-[var(--color-ink)] sm:text-[13px]"
        >
          <svg width="15" height="15" viewBox="0 0 16 16" fill="none" aria-hidden className="shrink-0">
            <path d="M13 8H3M7 3.5L2.5 8l4.5 4.5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          <span className="hidden sm:inline">Read the record</span>
        </a>
      </header>

      <section className="pt-14 pb-4 sm:pt-20">
        <h1 className="m-0 max-w-[22ch] font-[family-name:var(--font-display)] text-[clamp(2rem,5.5vw,3.4rem)] font-normal leading-[1.08] tracking-[-0.02em]">
          How this was counted, and where it falls short.
        </h1>
        <p className="mt-6 mb-0 max-w-[56ch] text-[19px] leading-[1.6] text-[var(--color-ink-soft)]">
          Every figure on this site is computed from the federal record at build time. This page
          is the account of how, including the ways it could have been wrong and the one claim the
          evidence would not support.
        </p>
      </section>

      <section className="py-10">
        <div className="mt-4">
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
      </section>

      <section className="border-t border-[var(--color-rule)] py-16">
        <h4 className="m-0 max-w-[26ch] font-[family-name:var(--font-display)] text-[clamp(1.4rem,2.8vw,2rem)] font-normal leading-[1.15] tracking-[-0.015em]">
          What the records actually contain, gaps and all.
        </h4>
        {/* Two paragraphs became one, 116 words became 46. The cut was the
            passage explaining why this window is shorter than the chart's,
            which was the page narrating its own construction at the same
            volume as its findings. The reason survives as one clause. */}
        <p className="mt-5 mb-12 max-w-[62ch] text-[19px] leading-[1.6] text-[var(--color-ink-soft)]">
          How often CPSC fills each field in, across the {cov.total.toLocaleString()} recalls
          since {data.coverageFirstYear}. A shorter window than the chart, because some of these
          fields did not exist in {first.year}. The weak ones sit beside the strong ones, since a
          number you cannot see the holes in is not worth trusting.
        </p>
        <CoverageRings />
      </section>

      <footer className="border-t border-[var(--color-rule)] py-12">
        <p className="m-0 text-[17px] leading-[1.55] text-[var(--color-ink)]">
          <a
            className="font-semibold underline decoration-[var(--color-signal)] decoration-2 underline-offset-4"
            href="/"
          >
            Back to the record
          </a>
        </p>
        <div className="no-print mt-8 flex flex-wrap gap-3">
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
      </footer>
    </main>
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
