# The Recall Record

A weekly visual record of US consumer product recalls, built from CPSC public-domain data.

## The finding

Half of every US consumer product recall in 2026 so far names Amazon as the only
retailer. In 2015 it was 6.9%, about one in fourteen.

The obvious objection is that e-commerce simply grew. It does not hold. Online
selling overall roughly doubled over the same period while Amazon quadrupled,
and Walmart, Target and Home Depot are flat or falling.

## Methodology, and its limits

CPSC records where a product was sold as a single prose sentence per recall, e.g.
`"Online at Amazon.com from August 2024 through April 2026 for about $140."`

So every figure here is **share of recalls whose retailer description names X**.
It is not share of units sold, and it is not market share. The site says so on
its face, not in a footnote.

Verified before publishing:
- The retailer field is populated on 99.4% to 100% of records every year since 2015.
- The conclusion holds under three independent definitions of "sold online"
  (growth of 1.7x to 2.0x, against Amazon's 4.1x).
- It is not an artifact of longer retailer descriptions. Descriptions got
  *shorter* (median 127 to 85 characters), and holding length constant makes the
  trend steeper, not weaker.
- 2026 is a partial year, and the phrasing of the retailer field appears to have
  changed around 2025. Amazon's series runs smooth through that window, but it
  is disclosed rather than hidden.

## Stack

Vite, React 19, TypeScript, Tailwind 4. Zero runtime cost: data is fetched at
build time and shipped as static JSON. No API keys, no server, no LLM calls.

Palette is authored in OKLCH so one perceptual ramp serves both light and dark.

## Commands

```
npm run data     # fetch CPSC and rebuild src/data/recalls.json
npm run dev      # local dev on :5176
npm run build    # data + typecheck + production build
```

The data step asserts the corpus has not shrunk, every year's retailer field is
populated, and the newest recall is under 28 days old. It exits non-zero
otherwise, so a broken weekly rebuild fails loudly instead of silently shipping
stale numbers.

## Source

CPSC Recalls API, `https://www.saferproducts.gov/RestWebServices/Recall?format=json`
US Government public domain.
