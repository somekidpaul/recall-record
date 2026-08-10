# /check, design spec

A recall lookup built on the same data as The Recall Record.

Status: design, not built. Every figure below was measured against the live
CPSC corpus (9,944 records, 1973 to 2026-08-06) before it was written down.

---

## 1. What a person actually wants

> "I'm about to buy this. Has it been recalled?"

That is the real question, it is a good question, and **the federal record
cannot answer it.** Everything in this document follows from taking that
sentence seriously instead of pretending otherwise.

## 2. What the data can and cannot do

Measured, not assumed.

| | |
|---|---|
| Records available | 9,944, back to 1973 |
| Product name | present, brand-first, median 35 characters |
| Hazard text | 99.9% |
| Photograph | ~100% |
| **UPC / barcode** | **3.5% of 2026 recalls, 6.3% since 2015** |
| `Products[].Model` | **0%** |
| `Products[].Description` | **0%** |
| `Products[].CategoryID` | **0%** |

Three consequences, and they define the product:

1. **Barcode scanning is impossible.** Not hard, impossible. 96.5% of recent
   recalls carry no UPC at all. Any "scan the box" concept dies here.
2. **Names are the only real handle**, and they are prose written by a
   government press officer: "Laziza Dressers", "Apeks Second Stage Scuba
   Regulators", "EEMB Lithium-ion Coin Battery Chargers".
3. **There are no categories.** Any grouping has to be derived from text.

## 3. The central design problem

**"No results" is the most common answer and the most dangerous one.**

A person searches a crib, sees nothing, and reads it as *this is safe*. What it
actually means is *no record matched the words you typed*. Those are wildly
different claims, and the gap between them is where somebody gets hurt.

This is not hypothetical. Measured against the corpus:

| query | matches on product name | matches on full text |
|---|---|---|
| `button battery` | **0** | **3** |
| `graco` | 28 | 43 |
| `stroller` | 111 | 152 |
| `weighted` | 2 | 14 |

Searching only product names would have told someone asking about **button
batteries**, a hazard that kills children, that there was nothing on file.
There are three records. A naive build of this feature is actively unsafe.

## 4. The reframe

Stop answering **"is this recalled?"** Start answering:

> **"Here is exactly what the federal record does and does not say about this."**

That is a question the data can answer honestly, it is more useful than a
red/green light, and it is the same move the essay already makes: show the
number, then show the reasoning, then let the reader decide.

**Design principle: the empty state is the product.** It gets designed first
and gets the most care. Every other state is easier.

## 5. Architecture

```
/            The Recall Record   the argument
/check       The lookup          the tool
/check?q=graco+stroller          shareable, linkable, back-button-safe
```

Separate pages, deliberately. The essay is a piece of writing with a beginning
and an end; a utility bolted into the middle would damage both. They earn each
other instead: the essay is the evidence that this tool knows what its data is
worth, and the tool is where the essay's method pays off. Each links to the
other in one line.

The query lives in the URL so results are shareable. This is a page people will
send to each other.

## 6. Match strength, shown not hidden

Every result carries how it was found. This is the whole design.

| strength | how | shown as |
|---|---|---|
| **Exact** | UPC match | "This exact product" |
| **Strong** | brand + product type in the name | "Named in this recall" |
| **Possible** | appears in the notice body, not the name | "Mentioned in the notice" |
| **Context** | same hazard or product type, different product | "Similar products" |

Never one flat list. A "possible" match presented like an "exact" one is the
same sin as a bent scale.

## 7. The states

### 7a. Nothing found (design this first)

Not an error. Not a shrug. A result.

> ### No federal recall matches "weighted infant sleeper".
>
> **That is not the same as "this product is safe."**
>
> I searched 9,944 recall notices back to 1973, matching on product name,
> notice title, description and hazard.
>
> **What this cannot see**
> - Products recalled under a different name than the one you typed
> - Anything the maker fixed quietly without a federal recall
> - Only 3.5% of recent notices carry a barcode, so there is no way to match
>   the exact item in your hand
>
> **Worth doing next**
> - Try the brand alone, or the product type alone
> - Check the manufacturer's own recall page
> - Report a problem at SaferProducts.gov
>
> *Related hazards in this category →*

The "what this cannot see" block is the most important copy on the site.

### 7b. Direct hit
Product photo, date, units, hazard in plain language, the remedy, the retailer
sentence verbatim, link to the notice. Reuses the row component from the essay.

### 7c. Possible matches only
Leads with the caveat: "Nothing matches that name directly. These notices
mention your search in the body." Never silently promotes a weak match.

### 7d. Too broad
"crib" returns 186. Do not paginate into oblivion. Show the most recent, offer
narrowing by decade and by hazard, and say the real number.

### 7e. Before typing
The field, one line on what it searches, and the three most recent recalls so
the page is never empty and always shows something true.

## 8. Interaction

- **Results as you type**, debounced. Search is local, so it is instant.
- **No autocomplete of product names.** Suggesting "Graco Inc. Strollers"
  teaches the wrong lesson: that the record is a tidy catalogue. It is not.
- **The count updates live**, including to zero, so the empty state is
  something you arrive at rather than something that ambushes you.
- Reduced motion respected. Same two-tier policy as the essay.
- Full keyboard support, results in a live region, same as the chart.

## 9. Visual direction

Inherits the entire system: same palette, type, easing, motion policy, dark
mode. Notable choices:

- **No green.** Nothing here earns a safe signal, so the palette must not
  imply one. The absence of a result is neutral grey, never reassuring.
- Signal orange marks confirmed recalls only.
- Match strength gets the same **saturation ramp** the coverage rings use, so
  weaker matches literally look fainter. Consistent with the ordinal scale
  reasoning already applied elsewhere.
- The empty state is typographically the *largest* thing on the page.

## 10. Technical plan

Same architecture as the essay: build-time data, static hosting, no backend, no
API key, nothing to run.

Measured index sizes:

| index | records | brotli |
|---|---|---|
| names only, 2005+ | 7,044 | **115 KB** |
| full text, 2015+ | 3,604 | 459 KB |
| full text, 2005+ | 7,044 | **636 KB** |
| full text, all | 9,944 | 838 KB |

Full text is required (section 3), and 636 KB is too much to load eagerly on a
phone. So: **lazy-load on intent.** Nothing ships with the page. The index is
fetched on first focus of the search field and is ready before anyone finishes
typing a word. Cached after.

Further compression is available if wanted (token sets rather than raw strings,
dropping stopwords), but is not needed to ship.

## 11. Scope boundaries

Not doing, and why:

- **No accounts, no saved products, no alerts.** Alerting implies coverage this
  data cannot promise.
- **No safety score.** Reducing this to a number would be the exact bent scale
  the essay argues against.
- **No "safe" verdict, ever.** The strongest statement available is "no match
  found," and it must always be stated as that.

## 12. Open questions

1. **Does this dilute the essay?** The Recall Record is a finished argument. A
   tool changes the site from a piece into a product. Probably good, but it is
   a real change in what the thing is.
2. **CPSC has its own recall search.** The differentiator here is honest match
   strength and a designed empty state, not the existence of search. I have not
   audited their UX and should before claiming a gap.
3. **How far back?** 2005+ balances index size against coverage. Older recalls
   are still real recalls.
4. **Is `/check` the right name?** Alternatives: `/lookup`, `/search`. `/check`
   reads as an action, which suits it.
