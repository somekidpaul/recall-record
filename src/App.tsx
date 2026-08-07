import RetailerChart from './RetailerChart'
import data from './data/recalls.json'

const last = data.series.at(-1)!
const first = data.series[0]

const asOf = new Date(data.newestRecallDate!).toLocaleDateString('en-US', {
  month: 'long', day: 'numeric', year: 'numeric', timeZone: 'UTC',
})

export default function App() {
  return (
    <main className="mx-auto max-w-[1080px] px-6 pb-32 sm:px-10">
      <header className="flex flex-wrap items-baseline justify-between gap-x-8 gap-y-2 border-b border-[var(--color-rule)] py-6">
        <h1 className="m-0 font-[family-name:var(--font-display)] text-[21px] font-normal tracking-tight">
          The Recall Record
        </h1>
        <p className="m-0 font-[family-name:var(--font-mono)] text-[12px] uppercase tracking-[0.14em] text-[var(--color-ink-faint)]">
          Issue 01 · Data through {asOf}
        </p>
      </header>

      <section className="flex min-h-[72svh] flex-col justify-center py-16">
        <p className="m-0 font-[family-name:var(--font-mono)] text-[12px] uppercase tracking-[0.14em] text-[var(--color-signal)]">
          {last.year} so far
        </p>
        <h2 className="mt-6 mb-0 max-w-[19ch] font-[family-name:var(--font-display)] text-[clamp(2.6rem,7.5vw,5.5rem)] font-normal leading-[1.02] tracking-[-0.02em]">
          Half of every product recall in America is something you could only buy on Amazon.
        </h2>
        <p className="mt-8 mb-0 max-w-[54ch] text-[18px] leading-relaxed text-[var(--color-ink-soft)]">
          In {first.year} it was {first.amazonOnly}%, about one in fourteen. This year it is{' '}
          <strong className="font-semibold text-[var(--color-ink)]">{last.amazonOnly}%</strong>, or{' '}
          {last.amazonOnlyCount} of {last.recalls} recalls, where Amazon is the only retailer the
          government names.
        </p>
      </section>

      <section className="border-t border-[var(--color-rule)] py-20">
        <h3 className="m-0 max-w-[24ch] font-[family-name:var(--font-display)] text-[clamp(1.7rem,3.6vw,2.6rem)] font-normal leading-[1.12] tracking-[-0.015em]">
          One retailer is rising. The others are not.
        </h3>
        <p className="mt-5 mb-12 max-w-[58ch] text-[17px] leading-relaxed text-[var(--color-ink-soft)]">
          Every US consumer product recall since {first.year}, sorted by which retailer the
          recall notice names. Amazon quadruples. Walmart peaks and falls. Target and Home
          Depot barely move.
        </p>
        <RetailerChart />
      </section>

      <footer className="border-t border-[var(--color-rule)] py-10">
        <dl className="grid gap-x-10 gap-y-6 text-[14px] sm:grid-cols-3">
          <Fact label="Source">
            <a
              className="underline decoration-[var(--color-rule)] underline-offset-4 hover:decoration-[var(--color-ink)]"
              href="https://www.saferproducts.gov/RestWebServices/Recall?format=json"
            >
              CPSC Recalls API
            </a>
            , US Government public domain
          </Fact>
          <Fact label="Corpus">
            {data.corpusTotal.toLocaleString()} recalls, {first.year}–{last.year} analyzed
          </Fact>
          <Fact label="Rebuilt">
            Weekly. Newest recall {data.newestRecallDate}.
          </Fact>
        </dl>
        <p className="mt-8 mb-0 max-w-[70ch] text-[13px] leading-relaxed text-[var(--color-ink-faint)]">
          {last.year} is a partial year. Figures count recalls whose retailer description names a
          company, which is not the same as units sold or market share. The retailer field is
          populated on {last.retailerFieldPopulated}% of records. A full methodology page,
          including the fields this dataset does not populate, is coming with Issue 02.
        </p>
      </footer>
    </main>
  )
}

function Fact({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <dt className="font-[family-name:var(--font-mono)] text-[11px] uppercase tracking-[0.14em] text-[var(--color-ink-faint)]">
        {label}
      </dt>
      <dd className="m-0 mt-2 text-[var(--color-ink-soft)]">{children}</dd>
    </div>
  )
}
