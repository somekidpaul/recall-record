/**
 * One recall, as a row that opens.
 *
 * Shared by the biggest-recalls list and by search results, because they are
 * the same object and were drifting into two different designs. The search
 * results had a plainer row with no photograph and no expansion, which made
 * finding your own product feel like a lesser thing than reading the top ten.
 *
 * The two sources carry different amounts, and the row renders what it is
 * given rather than pretending otherwise: the biggest-recalls list knows unit
 * counts and the retailer sentence, the search index does not, because putting
 * either in it costs more than the whole feature is worth. Absent fields are
 * simply absent, never zero and never "unknown".
 */

/** US households, 2024 American Community Survey. Used only for scale, and cited. */
const US_HOUSEHOLDS = 132_216_000

export type RowView = {
  key: string
  date: string
  product: string
  hazard: string
  url?: string
  /** Resolved absolute URL, or undefined when CPSC published no photograph. */
  image?: string
  /** Position in a ranked list. Search results are not ranked, so they omit it. */
  rank?: number
  /** Biggest-recalls list only. */
  units?: number
  unitsRaw?: string
  retailerText?: string
  /** Full CPSC instruction. Shipped for the essay and /check lists only. */
  remedy?: string
  /** One word: Refund, Repair, Replace. Ships in the search index too. */
  remedyOption?: string
}

export function RecallRow({
  row,
  open,
  onToggle,
  panelId,
  imagesReady = true,
  highlight,
}: {
  row: RowView
  open: boolean
  onToggle: () => void
  panelId: string
  /**
   * Whether the photograph list has arrived yet.
   *
   * Without this the row could not tell "CPSC never published a photograph"
   * apart from "the file has not downloaded", and it asserted the first, which
   * is a claim about the federal record rather than about a pending fetch.
   * The biggest-recalls list passes true because its images ship with the page.
   */
  imagesReady?: boolean
  /** Wraps matched query terms, so a search result shows why it matched. */
  highlight?: (text: string) => React.ReactNode
}) {
  const mark = highlight ?? ((t: string) => t)
  return (
    <li className="border-b border-[var(--color-rule)]">
      <div
        className={`grid items-center gap-x-4 py-5 sm:gap-x-6 ${
          row.rank
            ? 'grid-cols-[2.5rem_1fr] sm:grid-cols-[3rem_1fr_auto]'
            : 'grid-cols-1 sm:grid-cols-[1fr_auto]'
        }`}
      >
        {row.rank != null && (
          <span className="self-start font-[family-name:var(--font-display)] text-[26px] leading-none text-[var(--color-ink-faint)] tabular-nums sm:text-[30px]">
            {String(row.rank).padStart(2, '0')}
          </span>
        )}

        <div className="min-w-0">
          <p className="m-0 font-[family-name:var(--font-mono)] text-[12px] uppercase tracking-[0.12em] text-[var(--color-ink-faint)] tabular-nums">
            {row.date}
            {row.units != null && (
              <>
                <span className="mx-2 opacity-50">/</span>
                <span className="text-[var(--color-signal)]">
                  {row.units.toLocaleString()} units
                </span>
              </>
            )}
          </p>
          <p className="m-0 mt-1.5 truncate text-[18px] leading-snug text-[var(--color-ink)]">
            {mark(row.product)}
          </p>
          {/* Clamped to one line at rest. This is the whole reason the section
              is a list: every row is the same height no matter how much hazard
              text the source happens to carry. */}
          <p className="m-0 mt-1 line-clamp-1 text-[15px] leading-snug text-[var(--color-ink-faint)]">
            {mark(row.hazard)}
          </p>
        </div>

        <div
          className={`mt-3 flex flex-wrap gap-2 sm:mt-0 sm:justify-self-end ${
            row.rank ? 'col-start-2 sm:col-auto' : ''
          }`}
        >
          <button
            type="button"
            onClick={onToggle}
            aria-expanded={open}
            aria-controls={panelId}
            className="rounded-full border border-[var(--color-rule)] px-4 py-2 text-[14px] whitespace-nowrap text-[var(--color-ink-soft)] transition-colors hover:border-[var(--color-ink-faint)] hover:text-[var(--color-ink)]"
          >
            {open ? 'Hide product' : 'View product'}
          </button>
          {row.url && (
            /* Opens in a new tab, and says so. Forcing a tab normally takes the
               back button away, and the exception is exactly this: leaving
               mid-task, to a third party, from a page you are partway through.
               rel="noreferrer" so the opened page cannot reach back through
               window.opener. */
            <a
              href={row.url}
              target="_blank"
              rel="noreferrer"
              aria-label={`Read the CPSC notice for ${row.product}, opens in a new tab`}
              className="flex items-center gap-2 rounded-full border border-[var(--color-rule)] px-4 py-2 text-[14px] whitespace-nowrap text-[var(--color-ink-soft)] transition-colors hover:border-[var(--color-ink-faint)] hover:text-[var(--color-ink)]"
            >
              Read the notice
              <svg width="12" height="12" viewBox="0 0 14 14" fill="none" aria-hidden className="shrink-0 opacity-70">
                <path d="M5.5 2.5H2.5v9h9v-3M8.5 2.5h3v3M11.5 2.5L6 8" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </a>
          )}
        </div>
      </div>

      {/* Always rendered, height driven by CSS. Rendering it conditionally made
          opening animate and closing snap, because an unmounted element cannot
          transition. */}
      <div className="disclosure" data-open={open} id={panelId} aria-hidden={!open}>
        <div>
          <div
            className={`grid gap-x-10 gap-y-6 pb-8 sm:grid-cols-[minmax(0,18rem)_1fr] ${
              row.rank ? 'sm:pl-[4.5rem]' : ''
            }`}
          >
            {/* Capped at 260px. Measured across the ten largest: heights run 150
                to 892px and ratios 0.63 to 2.52, so uncapped the tall skinny
                bottle towered over everything else. */}
            {row.image ? (
              <img
                src={row.image}
                alt={row.product}
                loading="lazy"
                className="max-h-[260px] w-full rounded-xl border border-[var(--color-rule)] bg-[var(--color-paper-sunk)] object-contain p-4"
              />
            ) : (
              <p className="m-0 grid min-h-[120px] place-items-center rounded-xl border border-dashed border-[var(--color-rule)] p-4 text-center text-[14px] leading-snug text-[var(--color-ink-faint)]">
                {imagesReady
                  ? 'CPSC published no photograph with this notice.'
                  : 'Loading the photograph…'}
              </p>
            )}

            <div>
              <p className="m-0 text-[17px] leading-[1.65] text-[var(--color-ink-soft)]">
                {row.hazard}
              </p>

              {row.units != null && (
                <p className="m-0 mt-4 text-[16px] leading-[1.6] text-[var(--color-ink-soft)]">
                  Enough for one in every{' '}
                  <strong className="font-semibold text-[var(--color-ink)] tabular-nums">
                    {Math.round(US_HOUSEHOLDS / row.units).toLocaleString()}
                  </strong>{' '}
                  American households.
                </p>
              )}

              {row.retailerText && (
                <p className="m-0 mt-4 text-[15px] leading-[1.6] text-[var(--color-ink-faint)]">
                  {row.retailerText}
                </p>
              )}

              {/*
                WHAT TO DO, and its absence was the biggest hole in this page.

                Someone opening a row has usually just found a product they own.
                Until now they were told the hazard, the unit count and the
                retailer, and nothing about what to do next: not to stop using
                it, not that a refund exists. CPSC publishes exactly that
                instruction on 100% of recalls since 2020 and the field was
                never read.

                Two shapes, because the two lists carry different amounts. The
                essay and /check lists ship the full instruction, which is the
                real answer. A search result carries only the one-word tag,
                since the prose across 9,944 records is 3MB, so there it names
                the remedy and sends the reader to the notice for the detail.
              */}
              {(row.remedy || row.remedyOption) && (
                <div className="mt-5 rounded-xl border border-[var(--color-rule)] bg-[var(--color-paper-sunk)] p-4">
                  <p className="m-0 flex flex-wrap items-center gap-x-2.5 gap-y-1">
                    <span className="font-[family-name:var(--font-mono)] text-[12px] uppercase tracking-[0.1em] text-[var(--color-ink-faint)]">
                      What to do
                    </span>
                    {row.remedyOption && (
                      <span className="rounded-full bg-[var(--color-signal)] px-2.5 py-0.5 text-[12px] font-semibold text-[var(--color-paper)]">
                        {row.remedyOption}
                      </span>
                    )}
                  </p>
                  <p className="m-0 mt-2.5 text-[16px] leading-[1.6] text-[var(--color-ink)]">
                    {row.remedy || (
                      <>
                        The notice lists a remedy of{' '}
                        <strong className="font-semibold">
                          {(row.remedyOption ?? '').toLowerCase()}
                        </strong>
                        . Open it for the full instructions and who to contact.
                      </>
                    )}
                  </p>
                </div>
              )}

              {row.unitsRaw && (
                <p className="m-0 mt-4 border-t border-[var(--color-rule)] pt-3 font-[family-name:var(--font-mono)] text-[12px] leading-snug text-[var(--color-ink-faint)]">
                  Count read from: “{row.unitsRaw}”
                </p>
              )}
            </div>
          </div>
        </div>
      </div>
    </li>
  )
}
