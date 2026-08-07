import { useEffect, useRef, useState } from 'react'

/**
 * Counts a number up when it first scrolls into view.
 *
 * Chosen over the typewriter effect that was considered for the surrounding
 * prose. The distinction matters: animating a NUMBER draws the eye to the
 * datum, animating a SENTENCE just delays reading it, and the sentences here
 * carry the argument.
 *
 * TWO THINGS KEEP IT FROM SHIFTING THE LAYOUT, and it needed both.
 *
 * 1. Decimal places are fixed by the FINAL value and never change mid-count.
 *    The first version formatted each frame independently and stripped a
 *    trailing ".0", so counting to 50 rendered "0", "12.5", "50" and the
 *    character count swung between one and four.
 * 2. An invisible copy of the final string reserves the width, with the live
 *    value stacked on top in the same grid cell. Measured, the span was
 *    swinging 14.2px during the count, and since the paragraph uses
 *    text-wrap: pretty the whole block re-balanced on every frame.
 *
 * Renders the true value immediately under reduced motion, and always carries
 * the final figure as its accessible name so a screen reader never announces a
 * partial number.
 */
export default function CountUp({
  to,
  suffix = '',
  duration = 900,
}: {
  to: number
  suffix?: string
  duration?: number
}) {
  const ref = useRef<HTMLSpanElement>(null)
  const [value, setValue] = useState(to)

  // Locked to the final value, so every frame renders the same character count.
  const decimals = Number.isInteger(to) ? 0 : 1
  const format = (n: number) => `${n.toFixed(decimals)}${suffix}`

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

  /*
   * inline-block, not inline-grid, and the difference is only visible in the
   * clipboard. Both reserve the width correctly and both render flush against
   * the following comma (measured at 0px). But a grid box makes the selection
   * algorithm treat the number as its own block, so copying the sentence
   * produced "6.9% , about one in fourteen" with a stray space. This is a page
   * people may quote, so the copied text has to be clean.
   */
  return (
    <span ref={ref} className="relative inline-block tabular-nums" aria-label={format(to)}>
      {/* Reserves the box. Never changes, so the line never re-wraps. */}
      <span aria-hidden className="invisible">
        {format(to)}
      </span>
      <span aria-hidden className="absolute inset-0 text-left">
        {format(value)}
      </span>
    </span>
  )
}
