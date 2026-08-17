import RetailerChart from './RetailerChart'
import Nav from './Nav'
import CountUp from './CountUp'
import BiggestRecalls from './BiggestRecalls'
import OriginSplit from './OriginSplit'
import data from './data/recalls.json'

const last = data.series.at(-1)!
const first = data.series[0]


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
      <Nav current="/" />

      <section className="pt-16 pb-20 sm:pt-24 sm:pb-28">
        <p className="m-0 font-[family-name:var(--font-mono)] text-[13px] uppercase tracking-[0.14em] text-[var(--color-signal)]">
          {last.year} so far
        </p>
        {/* 1.08, not the 1.04 this shipped with. Iowan Old Style's ink height
            measures 1.0144x its font-size, so at the 5.5rem end of the clamp the
            glyphs occupy 89.3 of the 91.5px line box: 2.2px between one line's
            descenders and the next line's ascenders. "Nearly" and "every" sit
            directly above "product", and at that size the y and p were within a
            couple of pixels of touching. 1.08 puts ~6px back. */}
        <h1 className="mt-6 mb-0 max-w-[19ch] font-[family-name:var(--font-display)] text-[clamp(2.6rem,7.5vw,5.5rem)] font-normal leading-[1.13] tracking-[-0.02em] sm:leading-[1.08]">
          {headlineQuantity} of every consumer product recall in America is something you could
          only buy on Amazon.
        </h1>
        <p className="arrive mt-8 mb-0 measure text-[21px] leading-[1.55] text-[var(--color-ink-soft)]">
          {/* No count-up on the opening figure any more. It is zero, and
              animating a number up to nothing is a flourish with no payload.
              The sentence carries it instead. */}
          In {first.year}, not one of the {first.recalls} recalls that year named Amazon as the
          only store. Not one. This year it is{' '}
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
        <h3 className="m-0 max-w-[24ch] font-[family-name:var(--font-display)] text-[clamp(1.7rem,3.6vw,2.6rem)] font-normal leading-[1.22] tracking-[-0.015em] sm:leading-[1.14]">
          Amazon is climbing. Everyone else is flat.
        </h3>
        <p className="arrive mt-5 mb-12 measure text-[19px] leading-[1.6] text-[var(--color-ink-soft)]">
          {/* DERIVED, because this sentence has already been wrong once. It read
              "to sixty percent", which described the measure the chart used to
              open on. Flipping the default to match the headline left the prose
              describing a line the reader was no longer looking at. Computed
              from the same figure the chart draws, so the two cannot drift
              apart again. */}
          Every US consumer product recall since {first.year}, grouped by which store each recall
          says it was sold at. Amazon goes from nothing to {last.amazonOnly}%. Walmart rises, then drops
          back. Target and Home Depot barely move in the {last.year - first.year} years since.
        </p>
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
      {/* AFTER the chart and its objection, BEFORE the methodology. A second
          finding introduced before the first one is settled reads as piling on;
          introduced after, it reads as the record having more in it. */}
      <OriginSplit />
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

        <p className="m-0 mt-10 measure text-[15px] text-[var(--color-ink-faint)]">
          Free government data. No tracking, no cookies, no accounts. Every number here is
          calculated straight from the source above when the page is built, so it cannot drift
          out of sync.
        </p>
      </footer>
    </main>
  )
}

/**
 * One provenance fact.
 *
 * Three of these stacked to 843px on a phone, because each one gave its label,
 * its value and its explanation a line apiece with a 38px display figure in the
 * middle. That is a poster layout, and on a narrow column it is mostly air.
 *
 * The phone puts the label and the value on one line and drops the figure to
 * reading size; the desktop keeps the stacked poster. Same content either way.
 */
function Card({ label, value, children }: { label: string; value: string; children: React.ReactNode }) {
  return (
    <div className="rounded-xl border border-[var(--color-rule)] bg-[var(--color-paper-sunk)] p-5 sm:p-7">
      <div className="flex items-baseline justify-between gap-4 sm:block">
        <p className="m-0 font-[family-name:var(--font-mono)] text-[12px] uppercase tracking-[0.16em] text-[var(--color-ink-faint)] sm:text-[13px]">
          {label}
        </p>
        <p className="m-0 font-[family-name:var(--font-display)] text-[26px] leading-none tracking-tight text-[var(--color-ink)] tabular-nums sm:mt-4 sm:text-[38px]">
          {value}
        </p>
      </div>
      <p className="m-0 mt-3 text-[16px] leading-[1.55] text-[var(--color-ink-soft)] sm:mt-4 sm:text-[17px]">
        {children}
      </p>
    </div>
  )
}

function Methodology() {
  return (
    <section className="border-t border-[var(--color-rule)] py-20">
      <h3 className="m-0 max-w-[24ch] font-[family-name:var(--font-display)] text-[clamp(1.7rem,3.6vw,2.6rem)] font-normal leading-[1.22] tracking-[-0.015em] sm:leading-[1.14]">
        Where these numbers come from.
      </h3>

      <div className="card-row mt-10 flex flex-col gap-4 sm:flex-row">
        <Card label="Source" value="CPSC">
          The government's own database of consumer product recalls: toys, appliances and tools,
          not cars, food or medicine, which other agencies handle. Free for anyone to use.{' '}
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
          starts there is the first thing the method page explains.
        </Card>
        <Card label="Checked" value="Weekly">
          Newest recall {data.newestRecallDate}. CPSC publishes in weekly batches, almost always
          on a Thursday, and the rebuild runs the morning after. If the data ever shrinks or goes
          stale, the rebuild stops instead of publishing bad numbers.
        </Card>
      </div>

      {/* The six questions and the coverage rings now live at /method.
          Measured on a phone they were 3,279px, four screens and 41% of the
          page, so a reader scrolled four screens of caveats to reach the recall
          list. The cards stay because they are the provenance at a glance and
          cost 622px; the rest is one click away and, more usefully, is now a
          URL that can be sent on its own. */}
      <a
        href="/method"
        className="mt-10 inline-flex items-center gap-2.5 rounded-full border border-[var(--color-rule)] px-5 py-3 text-[16px] text-[var(--color-ink-soft)] transition-colors hover:border-[var(--color-ink-faint)] hover:text-[var(--color-ink)]"
      >
        How this was counted, and where it falls short
        <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden className="shrink-0">
          <path d="M3 7h8M7.5 3.5L11 7l-3.5 3.5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </a>
      {/* A 27-word paragraph used to sit here listing what was behind the link.
          The button already says "How this was counted, and where it falls
          short", which is the same promise in nine words, and a caption under a
          button is the page selling its own footnotes. */}
    </section>
  )
}
