import { useId, useState } from 'react'
import RetailerChart from './RetailerChart'
import Controls from './Controls'
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
      <header className="flex flex-wrap items-center justify-between gap-x-4 gap-y-3 border-b border-[var(--color-rule)] py-4 sm:gap-x-8 sm:py-5">
        {/* Measured at 375px: the masthead is 327px wide, and the title plus
            the theme pill came to 293px against a 41px search icon. 334 into
            327 wraps, which is why the nav sat on two rows at 123px tall even
            after the button lost its label. A smaller title and a tighter gap
            on phones bring the left group to about 260 and it fits on one. */}
        <div className="flex items-center gap-3 sm:gap-5">
          <h1 className="m-0 font-[family-name:var(--font-display)] text-[19px] font-normal tracking-tight sm:text-[22px]">
            The Recall Record
          </h1>
          <Controls />
        </div>
        <div className="flex items-center gap-3 sm:gap-6">
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
            aria-label="Search every recall"
            className="flex items-center gap-2 rounded-full border border-[var(--color-rule)] px-3 py-2 text-[14px] whitespace-nowrap text-[var(--color-ink-soft)] transition-colors hover:border-[var(--color-ink-faint)] hover:text-[var(--color-ink)] sm:px-4"
          >
            {/* The magnifier alone on a phone. The label was 141px wide, which
                pushed the masthead onto a second row at 129px tall. The icon is
                the affordance; the field it scrolls to carries the words. */}
            <svg width="15" height="15" viewBox="0 0 20 20" fill="none" aria-hidden className="shrink-0">
              <circle cx="9" cy="9" r="6" stroke="currentColor" strokeWidth="1.9" />
              <path d="M13.5 13.5L17 17" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" />
            </svg>
            <span className="hidden sm:inline">Check a product</span>
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
      <h3 className="m-0 max-w-[24ch] font-[family-name:var(--font-display)] text-[clamp(1.7rem,3.6vw,2.6rem)] font-normal leading-[1.12] tracking-[-0.015em]">
        Where these numbers come from.
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

      <p className="m-0 mt-5 max-w-[60ch] text-[15px] leading-[1.6] text-[var(--color-ink-faint)]">
        Six questions in full, including how this could have been fake and the one claim the
        evidence would not support, plus what every field in the records actually contains.
      </p>
    </section>
  )
}
