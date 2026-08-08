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
          Half of every product recall in America is something you could only buy on Amazon.
        </h2>
        <p className="arrive mt-8 mb-0 max-w-[46ch] text-[21px] leading-[1.55] text-[var(--color-ink-soft)]">
          In {first.year} it was <CountUp to={first.amazonOnly!} suffix="%" />, about one in
          fourteen. This year it is{' '}
          <strong className="font-semibold text-[var(--color-ink)]">
            <CountUp to={last.amazonOnly!} suffix="%" />
          </strong>
          , or {last.amazonOnlyCount} of {last.recalls} recalls, where Amazon is the only retailer
          the government names.
        </p>
      </section>

      <section className="border-t border-[var(--color-rule)] py-20">
        <h3 className="m-0 max-w-[24ch] font-[family-name:var(--font-display)] text-[clamp(1.7rem,3.6vw,2.6rem)] font-normal leading-[1.12] tracking-[-0.015em]">
          One retailer is rising. The others are not.
        </h3>
        <p className="arrive mt-5 mb-12 max-w-[50ch] text-[19px] leading-[1.6] text-[var(--color-ink-soft)]">
          Every US consumer product recall since {first.year}, sorted by which retailer the
          recall notice names. Amazon quadruples. Walmart peaks and falls. Target and Home
          Depot barely move.
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
              AI-native product designer. I take something confusing and turn it into one clear,
              honest answer, then show the reasoning so you can decide whether to trust it. More
              at{' '}
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
          Public-domain federal data. No tracking, no cookies, no accounts. Every figure on this
          page is computed at build time from the source above, so it cannot drift from the data.
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
        How this was counted, and where it is weak.
      </h3>

      <div className="card-row mt-10 flex flex-col gap-4 sm:flex-row">
        <Card label="Source" value="CPSC">
          The federal recall database, US Government public domain.{' '}
          <a
            className="underline decoration-[var(--color-rule)] underline-offset-4 hover:decoration-[var(--color-ink)]"
            href={data.source}
          >
            Fetch it yourself
          </a>
          .
        </Card>
        <Card label="Corpus" value={data.corpusTotal.toLocaleString()}>
          Recalls back to 1973. This piece analyzes the {cov.total.toLocaleString()} since{' '}
          {first.year}, when Amazon's retail share first became meaningful.
        </Card>
        <Card label="Rebuilt" value="Weekly">
          Newest recall {data.newestRecallDate}. The build fails rather than publish if the
          corpus shrinks or the data goes more than three weeks stale.
        </Card>
      </div>

      <div className="mt-14 border-t border-[var(--color-rule)]">
        <Note title="What the number actually means">
          CPSC does not publish a list of retailers. It publishes one prose sentence per
          recall, like <em>“Online at Amazon.com from August 2024 through April 2026 for
          about $140.”</em> So every figure here is the share of recalls whose retailer
          sentence <strong className="font-semibold text-[var(--color-ink)]">names</strong> a
          company. It is not units sold, and it is not market share. Those would be different
          claims and this data cannot support them.
        </Note>

        <Note title={`Why ${p.year} is not a full year`}>
          Because it has not happened yet. The data runs through {data.newestRecallDate},
          about {p.monthsElapsed} months in. That matters less than it sounds, because every
          figure is a share rather than a count, so a shorter year is not a smaller one. I
          checked month by month for a seasonal pattern that could tilt a partial year and
          found none. The chart draws the final segment dashed so you can see which part is
          still moving.
        </Note>

        <Note title="The obvious objection, tested three ways">
          If e-commerce simply grew, every online retailer should have risen together. To make
          sure that answer did not depend on how I defined “sold online,” I ran three
          definitions, from strict to loose. Online selling grew{' '}
          <strong className="font-semibold text-[var(--color-ink)]">
            {(last.online.strict! / first.online.strict!).toFixed(1)}×,{' '}
            {(last.online.mid! / first.online.mid!).toFixed(1)}× and{' '}
            {(last.online.loose! / first.online.loose!).toFixed(1)}×
          </strong>{' '}
          respectively. Amazon grew{' '}
          <strong className="font-semibold text-[var(--color-ink)]">
            {(last.retailers.amazon! / first.retailers.amazon!).toFixed(1)}×
          </strong>
          . The conclusion does not depend on the definition.
        </Note>

        <Note title="The way this could have been fake">
          If CPSC had started writing longer retailer sentences, more names would match by
          accident and everyone's share would drift up. It went the other way. The median
          retailer sentence got <em>shorter</em>, from {first.medianDescriptionChars} characters
          in {first.year} to {last.medianDescriptionChars} in {last.year}. Holding length
          roughly constant by looking only at short sentences, Amazon still goes from{' '}
          <strong className="font-semibold text-[var(--color-ink)]">
            {shortFirst}% to {shortLast}%
          </strong>
          , a steeper climb than the headline, because more recalls now have exactly one
          retailer to name.
        </Note>
        <Note title="A claim this piece does not make">
          Manufacturer identification is collapsing: {mfrFirst}% of {first.year} recalls named
          one, against {mfrLast}% this year. The tempting conclusion is that marketplace sellers
          are anonymous, so Amazon-only recalls hide the maker. I tested it and it is not true.
          Aggregated it looks convincing, but the gap is a calendar artifact, because Amazon-only
          recalls cluster in the recent years when coverage is low for everyone. Year by year the
          gap flips sign, and in the two most recent years, with the largest samples, it is{' '}
          <strong className="font-semibold text-[var(--color-ink)]">
            {gap25 > 0 ? '+' : ''}{gap25} and {gap26 > 0 ? '+' : ''}{gap26} points
          </strong>
          . So the fields are degrading for everyone, and the interesting version of this story
          is one I cannot support.
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
        Field coverage, including the failures.
      </h3>
      <p className="mt-5 mb-14 max-w-[58ch] text-[19px] leading-[1.6] text-[var(--color-ink-soft)]">
        How much of each field CPSC actually fills in, across the{' '}
        {cov.total.toLocaleString()} recalls analyzed. The weak ones are published beside the
        strong ones, because a number you cannot see the gaps in is not worth trusting. Six of
        these sit above 99% in every year since {first.year}, so only the two that actually move
        carry a trend line.
      </p>
      <CoverageRings />
    </section>
  )
}

/**
 * One row of the methodology accordion.
 *
 * These were a two-column grid of five paragraphs, which is a wall of text in
 * the exact place a sceptical reader arrives with a question. As a disclosure
 * list the questions are scannable and the reader opens only the one they came
 * for. Uses <details>, so it works before hydration, survives find-in-page, and
 * gets keyboard and screen-reader behaviour from the browser instead of from me.
 */
function Note({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <details className="note group border-b border-[var(--color-rule)]">
      <summary className="flex cursor-pointer list-none items-center justify-between gap-6 py-5 marker:hidden [&::-webkit-details-marker]:hidden">
        <h4 className="m-0 font-[family-name:var(--font-display)] text-[clamp(1.1rem,2.2vw,1.4rem)] font-normal leading-snug tracking-tight text-[var(--color-ink)]">
          {title}
        </h4>
        <span
          aria-hidden
          className="grid size-8 shrink-0 place-items-center rounded-full border border-[var(--color-rule)] text-[var(--color-ink-faint)] transition-colors group-hover:border-[var(--color-ink-faint)] group-hover:text-[var(--color-ink)]"
        >
          <svg width="13" height="13" viewBox="0 0 14 14" fill="none" className="chev">
            <path d="M2.5 5L7 9.5L11.5 5" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </span>
      </summary>
      <div className="disclosure">
        <div>
          <p className="mt-0 mb-6 max-w-[68ch] text-[17px] leading-[1.65] text-[var(--color-ink-soft)]">
            {children}
          </p>
        </div>
      </div>
    </details>
  )
}
