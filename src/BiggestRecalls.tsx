import data from './data/recalls.json'

const year = data.series.at(-1)!.year

/** US households, 2024 American Community Survey. Used only for scale, and cited. */
const US_HOUSEHOLDS = 132_216_000

/**
 * The six largest recalls of the year, by units, with the government's own
 * photography.
 *
 * Two honest constraints are visible on the face of it. The unit count is prose
 * in the source ("About 1,719,995"), so the parsed figure sits next to the
 * string it came from. And several recalls also cover Canada, which is excluded
 * here, because the rest of this piece counts US recalls.
 */
export default function BiggestRecalls() {
  const biggest = data.biggest
  if (!biggest?.length) return null

  return (
    <section className="border-t border-[var(--color-rule)] py-20">
      <h3 className="m-0 max-w-[26ch] font-[family-name:var(--font-display)] text-[clamp(1.7rem,3.6vw,2.6rem)] font-normal leading-[1.12] tracking-[-0.015em]">
        The biggest recalls of {year}.
      </h3>
      <p className="mt-5 mb-12 max-w-[54ch] text-[19px] leading-[1.6] text-[var(--color-ink-soft)]">
        Ranked by units. Every photograph below is the government's own, published with the
        recall notice and in the public domain, which is why this page has pictures at all.
      </p>

      <ol className="m-0 grid list-none gap-x-8 gap-y-12 p-0 [grid-template-columns:repeat(auto-fit,minmax(280px,1fr))]">
        {biggest.map((r, i) => {
          const perHouseholds = Math.round(US_HOUSEHOLDS / r.units)
          return (
            <li key={r.url || r.title} className="flex flex-col">
              <div className="mb-5 aspect-4/3 overflow-hidden rounded-xl border border-[var(--color-rule)] bg-[var(--color-paper-sunk)]">
                <img
                  src={r.image}
                  alt={r.imageCaption || r.product}
                  loading={i < 2 ? 'eager' : 'lazy'}
                  decoding="async"
                  className="size-full object-contain p-3"
                />
              </div>

              <p className="m-0 font-[family-name:var(--font-mono)] text-[12px] uppercase tracking-[0.14em] text-[var(--color-ink-faint)] tabular-nums">
                {r.date}
              </p>
              <p className="m-0 mt-2 font-[family-name:var(--font-display)] text-[26px] leading-none tracking-tight text-[var(--color-signal)] tabular-nums">
                {r.units.toLocaleString()}
              </p>
              <p className="m-0 mt-2.5 text-[18px] leading-snug text-[var(--color-ink)]">
                {r.product}
              </p>
              <p className="m-0 mt-2 text-[15px] leading-[1.55] text-[var(--color-ink-soft)]">
                Enough for one in every {perHouseholds.toLocaleString()} American households.
              </p>

              {r.hazard && (
                <p className="m-0 mt-3 text-[15px] leading-snug text-[var(--color-ink-faint)]">
                  {r.hazard}
                </p>
              )}

              {/* The parsed number beside the string it was read from, same rule
                  the rest of the piece follows. */}
              <p className="m-0 mt-3 border-t border-[var(--color-rule)] pt-3 font-[family-name:var(--font-mono)] text-[12px] leading-snug text-[var(--color-ink-faint)]">
                Source field: “{r.unitsRaw}”
              </p>

              {r.url && (
                <a
                  href={r.url}
                  className="mt-3 self-start text-[15px] text-[var(--color-ink-soft)] underline decoration-[var(--color-rule)] underline-offset-4 hover:text-[var(--color-ink)] hover:decoration-[var(--color-ink)]"
                >
                  Read the notice
                </a>
              )}
            </li>
          )
        })}
      </ol>

      <p className="m-0 mt-12 max-w-[64ch] text-[15px] leading-[1.6] text-[var(--color-ink-faint)]">
        Unit counts are US only. Several of these notices also cover Canada, and those figures
        are excluded so the number matches the rest of this page. Household scale uses{' '}
        {US_HOUSEHOLDS.toLocaleString()} US households from the 2024 American Community Survey.
      </p>
    </section>
  )
}
