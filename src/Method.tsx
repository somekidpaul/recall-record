import { useEffect } from 'react'
import Nav from './Nav'
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
      <Nav current="/method" />

      <section className="pt-14 pb-4 sm:pt-20">
        <h1 className="m-0 max-w-[22ch] font-[family-name:var(--font-display)] text-[clamp(2rem,5.5vw,3.4rem)] font-normal leading-[1.18] tracking-[-0.02em] sm:leading-[1.12]">
          How this was counted, and where it falls short.
        </h1>
        <p className="mt-6 mb-0 max-w-[62ch] text-[19px] leading-[1.6] text-[var(--color-ink-soft)]">
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
          ground shifting under it.
          {/* A closing sentence here used to add that the page "used to start in
              2015, which was a choice rather than a limit". True, and it is the
              best thing about how this was made, but it is about the page's
              editing history rather than about the data, and the reader did not
              ask what this used to be. The note already justifies 2004 on field
              reliability, which is the actual reason; the confession was a
              second justification aimed at the author. It belongs in a write-up
              about building this, not in the answer to the question. */}
        </Note>

        <Note title="What the number actually means">
          CPSC does not publish a tidy list of stores. It writes one sentence per recall,
          like <em>“Online at Amazon.com from August 2024 through April 2026 for
          about $140.”</em> So every number here counts how often a company gets{' '}
          <strong className="font-semibold text-[var(--color-ink)]">named</strong> in that
          sentence. It is not how much they sold, and it is not market share. Those are
          different questions, and this data cannot answer them.
        </Note>

        {/* THE WEAKEST JOINT IN THE HEADLINE, STATED BEFORE ANYONE ELSE FINDS IT.

            "Only buy on Amazon" is a sentence. "No other store is named" is the
            measure. They are close but not identical, and the gap is countable,
            so it gets counted rather than argued. Every figure here is read from
            the build output, so the weekly rebuild cannot leave it stale. */}
        <Note title="Where “only Amazon” is looser than it sounds">
          The headline counts recalls whose notice names no other <em>major retailer</em>.
          That is a little looser than “only on Amazon”, because two things slip through,
          and both are counted here rather than argued away. Some name the maker's own
          website too (giantex.com, vivehealth.com), which is a brand selling direct, not
          a rival store. A few others name a small or regional shop in passing (a New York
          discount store, independent hobby shops). Of this year's {last.amazonOnlyCount}{' '}
          Amazon-only recalls, {last.amazonOnlyCount - last.soleClean} name another seller
          like that. The other{' '}
          <strong className="font-semibold text-[var(--color-ink)]">
            {last.soleClean}
          </strong>{' '}
          name Amazon and nowhere else at all, which is still{' '}
          <strong className="font-semibold text-[var(--color-ink)]">
            {last.soleCleanShare}%
          </strong>{' '}
          of every recall this year. Read at its strictest, the finding barely moves.
        </Note>

        <Note title="The list this whole figure depends on">
          Because the headline is defined by the <em>absence</em> of a competitor, it is
          only as good as the list of competitors being checked. That list started at 23
          names, which was too few, so the Amazon-only recalls were searched for retailer
          names the list had missed. It had missed REI, Nordstrom, Bass Pro, Dick's, Ace
          Hardware, Bed Bath, Meijer, Sears and others, now added. Fixing it lowered the
          figures, and it lowered the earlier ones proportionally far more, so the climb
          got <em>steeper</em> rather than flatter. Worth saying plainly, because the
          mistake had been flattering the early years, which is the opposite of what someone
          nudging the numbers in their own favor would do. The list is national chains, so a small or
          regional shop can still slip through, which is why the note above counts how
          often that happens instead of pretending it never does.
        </Note>

        {/* Titled "Why {year} is not a full year" until now, which asked a
            question nobody has. Everyone knows the year is not over. The thing a
            reader actually wants to know is whether a part-year number can sit
            on the same chart as twenty-one finished ones, and that is what the
            answer was always about. */}
        <Note title={`Why a partial ${p.year} still compares fairly`}>
          The data runs through {data.newestRecallDate},
          about {p.monthsElapsed} months in. That matters less than it sounds, because every
          number here is a percentage and not a total, so a shorter year is not a smaller
          one. The months were also checked one by one for a seasonal pattern that could tilt a partial
          year, and there is not one. The chart draws the last stretch dashed so you can see
          which part is still moving.
        </Note>

        <Note title="The obvious objection: everyone shops online now">
          The clean way to answer this is to stop comparing Amazon to every store in the
          country and compare it only to the rest of the internet. Among recalls that were
          sold online at all, the share that name Amazon climbs from{' '}
          <strong className="font-semibold text-[var(--color-ink)]">
            {ratio.amazonOfOnline}% in {ratio.year} to {last.amazonOfOnline}% in {last.year}
          </strong>
          . So this is not the tide lifting every boat. Amazon is gaining on the other online
          sellers, and the growth of online shopping cannot explain a share measured inside
          online shopping. The same holds if you compare growth rates instead, both anchored
          to {ratio.year} so the baselines are big enough to divide by. Since “sold online” is
          a fuzzy thing to define, it is measured three ways, strict to loose: online selling
          grew{' '}
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

        {/* PRE-EMPTS THE SHARPEST CONFOUNDER. In 2024 the CPSC ruled Amazon a
            "distributor" legally responsible for recalls of third-party
            marketplace goods, final order January 2025. A sharp reader asks
            whether that, not Amazon's growth, is putting Amazon's name on more
            notices. Verified against the feed: the rise begins in 2015, the
            ordered categories are a small and shrinking slice of the Amazon-only
            set, and the field counted is where the product was SOLD, which is
            unaffected by who is ordered to run the recall. All three checked by
            hand before this note was written. */}
        <Note title="The other objection: didn’t the rules change in 2024?">
          In 2024 the CPSC ruled that Amazon is legally responsible for recalls of products
          sold on its site by outside sellers, and finalized that order in early 2025. A fair
          question is whether that, rather than Amazon's growth, is what puts Amazon's name on
          more notices. Three things say no. The rise starts in{' '}
          <strong className="font-semibold text-[var(--color-ink)]">{ratio.year}</strong>,
          years before the ruling. The order covered a specific, narrow set of products
          (carbon monoxide detectors, hairdryers, children's sleepwear), and those are a small
          and shrinking share of the Amazon-only recalls, not the source of the recent jump.
          And the thing counted here is where a product was <em>sold</em>, which a shopper
          bought from Amazon no matter who the government later orders to run the recall.
        </Note>

        <Note title="The way this could have been fake">
          If CPSC had started writing longer sentences, more store names would match by
          accident and everyone's numbers would drift up together. It went the other way. The
          typical sentence got <em>shorter</em>, from {first.medianDescriptionChars} characters
          in {first.year} to {last.medianDescriptionChars} today. Even counting only the short
          sentences, which holds length roughly even, Amazon still climbs from{' '}
          <strong className="font-semibold text-[var(--color-ink)]">
            {shortFirst}% to {shortLast}%
          </strong>
          {/* COMPARED AGAINST THE RIGHT NUMBER.

              This read "steeper than the headline". The headline is the SOLE
              measure, and this test counts Amazon being NAMED, the same as
              the higher line. Setting the length-controlled figure against the
              SOLE measure would compare two
              different populations and flatters the result: the honest
              comparison is against the named share across all sentences, which
              is the number this figure is the length-controlled version of.

              It survives either way, which is the point of running the test.
              But a page whose argument is that it does not put a thumb on the
              scale cannot pick the more impressive of two baselines. */}
          , against {last.retailers.amazon}% across sentences of every length. Holding length
          even makes the climb steeper rather than flatter, because more recalls now have just
          one store to name.
        </Note>
        <Note title="A claim this piece does not make">
          Recalls name the manufacturer less and less: {mfrFirst}% did in {first.year}, against{' '}
          {mfrLast}% this year. The tempting story is that marketplace sellers are anonymous, so
          Amazon-only recalls hide who made the thing. Tested directly, it is not true. Lumped
          together it looks convincing, but that is a trick of the calendar, because Amazon-only
          recalls bunch up in the recent years, when the record keeping is bad for everyone. Year
          by year it is basically a coin flip. In the two most recent years, the ones with the most
          recalls to judge from, Amazon-only recalls name the maker about as often as everyone else,{' '}
          <strong className="font-semibold text-[var(--color-ink)]">
            {gap25 > 0 ? '+' : ''}{gap25} and {gap26 > 0 ? '+' : ''}{gap26} points
          </strong>{' '}
          apart. So the records are getting worse across the board, and the more interesting version
          of this story is one this record cannot support.
        </Note>
      </div>
      </section>

      <section className="border-t border-[var(--color-rule)] py-16">
        <h4 className="m-0 max-w-[26ch] font-[family-name:var(--font-display)] text-[clamp(1.4rem,2.8vw,2rem)] font-normal leading-[1.28] tracking-[-0.015em] sm:leading-[1.18]">
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
          {/* FULL WIDTH, on purpose, and it is a trade worth naming.

              The 72ch cap resolved to 771px inside a 1000px column, so every
              answer stopped 229px short of the question sitting directly above
              it. Two blocks in the same row, one reaching the edge and one not,
              reads as a layout fault rather than as a measure.

              The cost is line length, and it is larger than first estimated.
              Measured on the live page at a 1060px viewport: 980px of text at
              an average glyph width of 7.64px is about 128 characters a line,
              against a usual range of 45 to 75. Worth noting the old cap was
              not comfortable either. `ch` measures the "0" glyph, 10.28px here,
              while real prose averages 7.64px, so 72ch was already ~101
              characters rather than the 72 it looks like.

              Kept anyway, decided deliberately rather than by default. These
              are five-to-seven-line answers opened one at a time, not running
              text, and the alternative was a column that stopped 229px short of
              its own question and read as a layout fault. */}
          <p className="mt-0 mb-6 text-[17px] leading-[1.65] text-[var(--color-ink-soft)]">
            {children}
          </p>
        </div>
      </div>
    </div>
  )
}
