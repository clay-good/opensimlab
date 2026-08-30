# Clinical governance

Why a professor should trust Open Sim Lab with their students — and exactly how far that
trust should currently extend.

## The honest state of this build

**No clinician has signed any content in this build.** The editorial board below is empty.
Every scenario, drug card, concept explainer and region profile carries an `UNSIGNED`
review record, and no item is described anywhere in the interface as reviewed, validated,
or endorsed.

The project publishes anyway, and is explicit about what that does and does not mean. There
are two release channels:

| Channel | What it requires | What it is |
| --- | --- | --- |
| `preview` | Six blocking technical and evidence gates: build integrity, sources, safety scope, limitations, validation report, documented face-validity procedure. The completion contract and the full quality-record set are computed and reported but do not block — no item has ever passed them, and a channel nothing can pass is not a channel. **No signature.** | The public site. Every item labeled "Educational use only — not clinically reviewed." |
| `reviewed` | All of the above, plus current exact-version signatures, board coverage for every domain, and completed face-validity review. | Institutional adoption packs. **Still refuses to publish.** |

Publishing on `preview` is a deliberate decision recorded in
[`openspec/changes/release-evergreen-preview/`](openspec/changes/release-evergreen-preview/).
The reasoning: an unreviewed corpus nobody can open does not become more accurate by waiting,
and the correction path only detects errors once real readers meet the content. The trade is
stated rather than hidden — the material is available, nothing in it is signed, the review
status of every item is public, and the report control is the mechanism for telling us we are
wrong. [The review-status page](https://opensimlab.com/review-status) is where that status
lives: every item, the label it is published under, and the board state, with no count reported
without the list behind it. The release gate refuses to publish without it.

A professor should read that as: usable for rehearsal and self-directed practice by students
who are told it is unreviewed; **not** usable as an authority, a reference, or assessed
course material until items they care about reach `clinically_reviewed`.

Recruiting at least three credentialed clinician reviewers is task 13.1 of
[`mvp-anesthesia-alpha`](openspec/changes/mvp-anesthesia-alpha/tasks.md), started in
parallel with the build rather than at the review, and it has not completed. **Publication
does not close it.** Until it does, the review-status surface says so and the governance page
lists every outstanding item and every uncovered domain by name.

## The editorial board

*(Empty.)*

| Name | Credential | Institution | Scope of review | Joined | Competing interests |
| --- | --- | --- | --- | --- | --- |
| — | — | — | — | — | — |

A board member is a named, credentialed clinician or educator. There are no anonymous or
pseudonymous reviewers of clinical content, ever. Each entry states the person, their
credential, their institution, the domains they are qualified to review, the date they
joined, and a declaration of competing interests.

Where a reviewer has a financial relationship with a drug or device manufacturer relevant
to what they review, that relationship is stated here and on every item they signed, and a
second reviewer without that relationship must co-sign the item.

The build fails if a content domain has no qualified reviewer. The domains this module
needs covered are `adult-general-anaesthesia`, `pharmacology`, and `practice-variation`.

## What review means

Every scenario, crisis protocol, drug card, concept explainer, debrief template, alarm
threshold and normal-range value carries a machine-readable `clinical_review` record with:

- the reviewer's name and credential,
- the review date,
- the content version reviewed,
- the sources consulted,
- a `review_by` date no more than 24 months later.

A content item without a current record is **excluded from the release build**, the build
log names it, and the surface that would have shown it degrades gracefully rather than
showing unreviewed text. That gate is implemented once, in
[`src/platform/governance/review-gate.ts`](src/platform/governance/review-gate.ts), and
`tests/unit/governance.test.ts` asserts its behaviour.

**Re-review is triggered by change, not by the calendar alone.** If the text or any numeric
value in an item changes, its review record is invalidated immediately, whatever its
`review_by` date says.

An item that passes its `review_by` date is flagged in the build, listed as overdue on the
governance dashboard, and marked in the interface as pending re-review after 30 further
days.

## Guideline currency

Every item deriving from a published guideline records the guideline, its issuing body and
its publication year, and the interface displays them to the learner so they can judge how
current the guidance is.

When an issuing body publishes a new version, the supersession goes into the currency
register and every item citing the old version is queued for re-review.

## Reporting a clinical inaccuracy

Every playable scenario inherits the shared in-product report control. The isolated Worker, D1
migration, bounded request contract, Turnstile verification, quotas, retention, and kill switch are
implemented, and deployment remains fail-closed until the production Cloudflare values are
configured and explicitly enabled. Enabling it is a prerequisite of the public release, not a
follow-up: a public unreviewed corpus with no working correction path is not the arrangement this
release is premised on. Where intake is unavailable — including on a static-only fork — the control
says so rather than silently sending anywhere.

Clinician reviewers can also record claim-specific notes on `/content-review` and export one local
file. A flag is not a signature; recording notes marks nothing as reviewed.

Usable reports are acknowledged within five working days. A report is detection, not review: no
item's status changes on report volume, only after reproduction and authoritative source
verification. Corrections are appended permanently to [`CORRECTIONS.md`](CORRECTIONS.md) and never
deleted or rewritten.

An error that could teach an unsafe practice is triaged as urgent: the affected content is
disabled in the next build regardless of the release schedule, and the corrections log
records the timeline.

## Auditing this from outside

The repository is the public source of truth. The readiness result that gates the visibility
change is recorded in [`docs/public-readiness-audit.md`](docs/public-readiness-audit.md), and its
history and advisory checks are re-run immediately before publication rather than trusted from an
earlier date.

| Record | Where |
| --- | --- |
| The board | `EDITORIAL_BOARD` in `src/platform/governance/records.ts` |
| Review records | On each content item, in its own source file |
| The gate | `src/platform/governance/review-gate.ts` |
| Coverage, by name | `/governance` in the running application |
| Review status, by item | the review-status surface in the running application |
| Corrections | [`CORRECTIONS.md`](CORRECTIONS.md) |
| Limitations | `src/platform/docs/limitations.ts` and `/limitations` |
| Validation | `src/platform/docs/validation-report.ts` and `/validation` |

The governance dashboard reports the percentage of clinical content under current review
**together with the full list of everything that is not**. It never reports the aggregate
without the list.
