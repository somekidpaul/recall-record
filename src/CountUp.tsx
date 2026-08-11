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
          /*
           * CLAMPED AT BOTH ENDS. It used to be Math.min(1, ...), which caps
           * the top but lets the bottom run negative, and the first frame's
           * timestamp can land before the `start` captured just above it. At
           * t = -0.004 this eased to -0.012 and painted "-0.1%".
           *
           * Two things broke at once, from that one minus sign. It showed a
           * negative percentage, which is not a number this data can produce.
           * And it made the string one character longer than the box the
           * invisible copy reserves for the FINAL value, so it overflowed to
           * the right and covered the comma after it: "6.9%, about" rendered
           * as "-0.1%about".
           */
          const t = Math.min(1, Math.max(0, (now - start) / duration))
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
      {/*
        RIGHT-ALIGNED, and this is about where the slack goes.

        The box is sized for the FINAL string ("49.6%") but holds the CURRENT
        one, and early in the count that is shorter ("5.1%"). Something has to
        absorb the difference. Left-aligned, it all fell on the right, which is
        precisely where the comma is: for the first second of the page the
        headline read "5.1% , or 185 of 373" with the punctuation floating a
        character-width away from its number. Caught on a screenshot mid-count.

        Right-aligned, the number's right edge is pinned, so the comma never
        detaches, and the slack lands on the left where it merges with the word
        space after "is" and reads as nothing at all.

        (The DOM was always clean here. `textContent` has no stray space, so
        copy-paste was fine either way. This was purely what the eye saw while
        the number was still moving.)
      */}
      <span aria-hidden className="absolute inset-0 text-right">
        {format(value)}
      </span>
    </span>
  )
}
