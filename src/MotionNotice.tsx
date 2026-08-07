import { useMotion } from './usePrefs'

/**
 * Shown only when motion is off, and only right above the thing that would
 * have moved.
 *
 * The alternative was to default everyone to animation regardless of their
 * system setting, which would have made the piece contradict its own argument:
 * a page about being careful with people should not override an accessibility
 * preference to show off a line drawing itself.
 *
 * So the default stands and the choice becomes visible instead of buried in a
 * nav icon nobody finds. Turning it on here persists.
 */
export default function MotionNotice() {
  const { motion, setMotion, systemPrefersReduced } = useMotion()

  if (motion === 'full') return null

  return (
    <p className="no-print m-0 mb-6 flex flex-wrap items-baseline gap-x-2 gap-y-1 text-[15px] text-[var(--color-ink-faint)]">
      <span>
        {systemPrefersReduced
          ? 'Animation is off to match your system setting.'
          : 'Animation is off.'}
      </span>
      <button
        type="button"
        onClick={() => setMotion('full')}
        className="underline decoration-[var(--color-signal)] decoration-2 underline-offset-4 hover:text-[var(--color-ink)]"
      >
        Turn it on for this page.
      </button>
    </p>
  )
}
