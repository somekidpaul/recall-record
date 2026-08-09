# Copy v1, the formal version

Saved 2026-08-09, immediately before the plain-language pass.

**To restore the code as it was:** `git checkout copy-v1-formal` (branch) or the
`copy-v1` tag. This file is just so the wording is readable without git.

---

## Headline

> Half of every product recall in America is something you could only buy on Amazon.

> In 2015 it was 6.9%, about one in fourteen. This year it is 50%, or 178 of 356
> recalls, where Amazon is the only retailer the government names.

## Section: the chart

> One retailer is rising. The others are not.

> Every US consumer product recall since 2015, sorted by which retailer the recall
> notice names. Amazon quadruples. Walmart peaks and falls. Target and Home Depot
> barely move.

Chart caption:

> Share of US consumer product recalls whose retailer description names each
> company. CPSC records where a product was sold as one prose sentence, so this
> measures mentions, not units sold or market share.

> The obvious objection is that everyone shops online now. Turn it on and see
> whether it holds.

> Online selling overall grew 1.7× since 2015. Amazon grew 4.1×. The growth of
> e-commerce does not account for the gap, and Walmart, Target and Home Depot are
> flat or falling over the same period.

Toggles: "Show the obvious objection" / "Count only where Amazon is the sole retailer"

## Section: biggest recalls

> The biggest recalls of 2026.

> The 10 largest by units. Every photograph is the government's own, published with
> the notice and in the public domain, which is why this page has pictures at all.
> Open a row for the full hazard description.

> Unit counts are US only. Several of these notices also cover Canada, and those
> figures are excluded so the number matches the rest of this page. Household scale
> uses 132,216,000 US households from the 2024 American Community Survey.

## Section: methodology

> How this was counted, and where it is weak.

Cards:

- **Source / CPSC** — The federal recall database, US Government public domain. Fetch it yourself.
- **Corpus / 9,927** — Recalls back to 1973. This piece analyzes the 3,587 since 2015, when Amazon's retail share first became meaningful.
- **Rebuilt / Weekly** — Newest recall 2026-07-30. The build fails rather than publish if the corpus shrinks or the data goes more than three weeks stale.

### What the number actually means

> CPSC does not publish a list of retailers. It publishes one prose sentence per
> recall, like "Online at Amazon.com from August 2024 through April 2026 for about
> $140." So every figure here is the share of recalls whose retailer sentence names
> a company. It is not units sold, and it is not market share. Those would be
> different claims and this data cannot support them.

### Why 2026 is not a full year

> Because it has not happened yet. The data runs through 2026-07-30, about 7 months
> in. That matters less than it sounds, because every figure is a share rather than
> a count, so a shorter year is not a smaller one. I checked month by month for a
> seasonal pattern that could tilt a partial year and found none. The chart draws
> the final segment dashed so you can see which part is still moving.

### The obvious objection, tested three ways

> If e-commerce simply grew, every online retailer should have risen together. To
> make sure that answer did not depend on how I defined "sold online," I ran three
> definitions, from strict to loose. Online selling grew 2.0×, 1.7× and 1.7×
> respectively. Amazon grew 4.1×. The conclusion does not depend on the definition.

### The way this could have been fake

> If CPSC had started writing longer retailer sentences, more names would match by
> accident and everyone's share would drift up. It went the other way. The median
> retailer sentence got shorter, from 127 characters in 2015 to 85 in 2026. Holding
> length roughly constant by looking only at short sentences, Amazon still goes from
> 6.7% to 63.8%, a steeper climb than the headline, because more recalls now have
> exactly one retailer to name.

### A claim this piece does not make

> Manufacturer identification is collapsing: 31.1% of 2015 recalls named one,
> against 20.2% this year. The tempting conclusion is that marketplace sellers are
> anonymous, so Amazon-only recalls hide the maker. I tested it and it is not true.
> Aggregated it looks convincing, but the gap is a calendar artifact, because
> Amazon-only recalls cluster in the recent years when coverage is low for everyone.
> Year by year the gap flips sign, and in the two most recent years, with the
> largest samples, it is -0.6 and +1.1 points. So the fields are degrading for
> everyone, and the interesting version of this story is one I cannot support.

## Section: field coverage

> Field coverage, including the failures.

> How much of each field CPSC actually fills in, across the 3,587 recalls analyzed.
> The weak ones are published beside the strong ones, because a number you cannot
> see the gaps in is not worth trusting. Six of these sit above 99% in every year
> since 2015, so only the two that actually move carry a trend line.

> A note on the drawing. 5 of these fall short of 100% by less than 2.5%, which at
> true scale is a gap of under a pixel, so they would render as closed circles. Any
> value below 100% is therefore drawn with a minimum visible gap. The arc is exact
> everywhere else, and only 100.0% closes the ring. The numbers are the precise ones.

Field labels:

- Product images — Every recall ships photography.
- Retailer — The field this whole piece rests on.
- Injuries — Prose, not counts. Parsed, never asserted.
- Hazard — Free text, but always present.
- Remedy type — A clean enum. Rare in this dataset.
- Country of origin — Reliable.
- Importer — Roughly two in three, and falling.
- Manufacturer — Mostly empty, and emptier every year. Nothing here relies on it.

## Footer

> Designed and built by Paul Buczkowski.

> AI-native product designer. I take something confusing and turn it into one clear,
> honest answer, then show the reasoning so you can decide whether to trust it. More
> at somekidpaul.com.

> Public-domain federal data. No tracking, no cookies, no accounts. Every figure on
> this page is computed at build time from the source above, so it cannot drift from
> the data.
