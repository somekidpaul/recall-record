import { useEffect, useRef, useState } from 'react'

/**
 * Counts a number up when it first scrolls into view.
 *
 * Chosen over the typewriter effect that was considered for the surrounding
 * prose. The distinction matters: animating a NUMBER draws the eye to the
 * datum, animating a SENTENCE just delays reading it, and the sentences here
 * carry the argument.
 *
 * Renders the true value immediately for anyone with reduced motion, and the
 * element always carries the final value as its accessible name, so a screen
 * reader never announces a partial figure.
 */
export default function CountUp({
  to,
  suffix = '',
  decimals = 1,
  duration = 900,
}: {
  to: number
  suffix?: string
  decimals?: number
  duration?: number
}) {
  const ref = useRef<HTMLSpanElement>(null)
  const [value, setValue] = useState(to)

  useEffect(() => {
    const el = ref.current
    if (!el) return
    if (document.documentElement.getAttribute('data-motion') !== 'full') return
    if (typeof IntersectionObserver === 'undefined') return

    let raf = 0
    const io = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting) return
        io.disconnect()

        const start = performance.now()
        // Ease out, so it decelerates into the real figure rather than stopping dead.
        const ease = (t: number) => 1 - (1 - t) ** 3
        const tick = (now: number) => {
          const t = Math.min(1, (now - start) / duration)
          setValue(to * ease(t))
          if (t < 1) raf = requestAnimationFrame(tick)
          else setValue(to)
        }
        setValue(0)
        raf = requestAnimationFrame(tick)
      },
      { threshold: 0.6 },
    )

    io.observe(el)
    return () => {
      io.disconnect()
      cancelAnimationFrame(raf)
    }
  }, [to, duration])

  const shown = value.toFixed(decimals).replace(/\.0$/, '')

  return (
    <span ref={ref} className="tabular-nums" aria-label={`${to}${suffix}`}>
      <span aria-hidden>
        {shown}
        {suffix}
      </span>
    </span>
  )
}
