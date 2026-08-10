# Recall Record, competitive research and the call

*Written 2026-08-09. Everything below was verified by search on that date, not assumed.
Where something is unverified it says so.*

**Read this before adding a single feature.**

---

## 1. The headline finding: nobody has published this

I searched hard for prior art on the Amazon share-of-recalls trend and could not find it.
What exists instead is two things, and neither is this:

**Event churn.** Newsweek, Fox Business and a long tail of trade sites publish a continuous
stream of "products sold on Amazon recalled" stories. All single-event. Zero aggregate, zero
trend, no denominator.

**Alert services.** `getrecalls.com` ("Recall Watch") is the closest thing to a competitor.
I fetched it. It aggregates **FDA, USDA, CPSC and CDC**, rechecks hourly, browses by retailer,
contamination type, food category and state, has email and push alerts, a free account tier and
a paid plan. For Amazon it lists 60 recalls across 24 months.

⭐ **It shows no trend analysis and no statistical comparison of any kind.** It is a notification
product. The measurement is the part everyone skipped.

**The news peg exists and is strong.** In July 2024 CPSC ruled unanimously that Amazon is a
"distributor" under federal safety law and therefore legally responsible for recalling
third-party sellers' hazardous products, covering 400,000+ units.
<https://www.cpsc.gov/Newsroom/News-Releases/2024/CPSC-Finds-Amazon-Responsible-Under-Federal-Safety-Law-for-Hazardous-Products-Sold-by-Third-Party-Sellers-on-Amazon-com>

That ruling is the legal half of this story. **This site is the measurement half, and it is
unclaimed.** A finding that is unclaimed today is not unclaimed forever.

---

## 2. The call: freeze the scope, land the finding

Verified state as of 2026-08-09: clean working tree, deployed, `.github/workflows/refresh.yml`
running the daily rebuild, sitemap pointing at `https://recall-record.vercel.app/`.
The thing is built. The work left is not building.

**In order:**

1. **Move off `recall-record.vercel.app` onto a real domain.** A vercel.app subdomain reads as a
   side project, and the next step is asking journalists to take a statistic seriously.
2. **Pitch the finding.** See §4.
3. **Then, and only then, expand.** See §3.

⛔ **Nothing outward-facing gets sent without Paul's explicit go.** Drafting is fine. Sending is not.

---

## 3. Expansion, held for piece two

CPSC is one of four US recall authorities. All three others are real, free and verified
2026-08-09:

| Agency | Covers | Endpoint | Verified |
|---|---|---|---|
| **NHTSA** | vehicles, car seats, tires | `api.nhtsa.gov` | Free, **no API key**, JSON. VIN decode is separate at `vpic.nhtsa.dot.gov` |
| **USDA FSIS** | meat, poultry, egg products | [Recall API](https://www.fsis.usda.gov/science-data/developer-resources/recall-api) | JSON, attribute-based querying, purpose-built for recalls and public health alerts |
| **openFDA** | food, drug, device, cosmetics | [open.fda.gov](https://open.fda.gov/apis/) | Public domain, enforcement-report endpoints exist. ⚠️ **Key requirement and rate limits NOT yet verified** |

Adding all four makes this *the* record of American recalls rather than *a* record, and it is
the part Recall Watch never did. **But it dilutes a finding that is currently sharp.** Ship the
Amazon story first.

---

## 4. Why the pitch matters more than a launch post

From `_For Claude/Job Hunt/Strategy/ALIGNMENT.md` §4: 65+ cold applications produced 0 interviews,
2 conversations with actual humans produced 2 advances. And the gap that doc names is having
almost no **witness** to work done alone.

A journalist engaging with this finding is a competent outsider taking the work seriously in
public. That is worth more than any number of LinkedIn impressions, and it is the exact thing
the last three products never got.

The methodology section is already stronger than most published data journalism, in particular
**"a claim this piece does not make."** Lead the pitch with that, not with the headline number.
An editor's first instinct is to look for the flaw; hand them the flaws first and the piece
reads as trustworthy instead of promotional.

---

## 5. Unexplored findings already inside the data

The field coverage chart already says which fields can carry a claim. Country of origin is marked
reliable. Remedy type is a clean enum, which the copy itself notes is rare in this dataset.
Untouched so far:

- Has time from first reported injury to recall changed?
- Is the refund / repair / replace mix shifting?
- Which product categories are getting more dangerous?
- Is the country-of-origin mix moving, and does it move with the Amazon-only series?

Same rules apply to every one of these: test it three ways, publish how it could have been fake,
and publish the version you could not support.

---

## 6. Cheap, high-value, not yet done

`public/recall-data.json` and `public/recall-data.csv` already ship. **Nobody publishes a cleaned,
parsed CPSC corpus.** Giving that a named page with a schema and a license costs one page and
earns citations from researchers and journalists, which is higher-quality distribution than
social ever is.

---

## 7. What NOT to do

- ⛔ Do not add agencies, a lookup feature, or alerts before the finding lands.
- ⛔ Do not contact any outlet without Paul's explicit go.
- ⛔ Do not soften the methodology section to make the headline punchier. The rigor **is** the
  product, and it is the only reason a newsroom would touch a stranger's statistic.

---

*Companion research from the same session lives in the chat, not here: hospital price transparency
(Turquoise Health, $20M Series A, ~1 trillion records, 8+ named competitors, do not enter),
Wayback timeline viewers (crowded, dead), earth/weather visualization (earth.nullschool since 2013,
Windy, Ventusky, Zoom Earth, saturated).*
