import { useMotion } from './usePrefs'

/**
 * The only motion control on the page, and it sits directly above the only
 * thing it governs.
 *
 * There used to be a Motion/Still toggle in the header too. It went because it
 * was answering a question nobody was asking in a place nobody was asking it,
 * and because the split between decorative and functional motion made it
 * mostly redundant: panels, pills and hovers now animate for everyone, so the
 * only thing left to opt into is the chart drawing itself.
 *
 * That choice belongs next to the chart, not in the masthead. Turning it on
 * here persists.
 */
export default function MotionNotice() {
  const { motion, setMotion, systemPrefersReduced } = useMotion()

  if (motion === 'full') return null

  return (
    <p className="no-print m-0 mb-6 flex flex-wrap items-baseline gap-x-2 gap-y-1 text-[15px] text-[var(--color-ink-faint)]">
      <span>
        {systemPrefersReduced
          ? 'The chart draws itself on scroll. That is off to match your system motion setting.'
          : 'The chart draws itself on scroll. That is currently off.'}
      </span>
      <button
        type="button"
        onClick={() => setMotion('full')}
        className="underline decoration-[var(--color-signal)] decoration-2 underline-offset-4 hover:text-[var(--color-ink)]"
      >
        Turn it on.
      </button>
    </p>
  )
}
