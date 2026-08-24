# Clinical governance

Why a professor should trust Open Sim Lab with their students — and, right now, why they
should not yet.

## The honest state of this build

**No clinician has signed any content in this build.** The editorial board below is empty.
Every scenario, drug card, concept explainer and region profile carries an `UNSIGNED`
review record, the release gate refuses to publish, and no scenario is described anywhere
in the interface as reviewed.

Recruiting at least three credentialed clinician reviewers is task 13.1 of
[`mvp-anesthesia-alpha`](openspec/changes/mvp-anesthesia-alpha/tasks.md), started in
parallel with the build rather than at the review, and it has not completed. Until it does,
the honest-status notice on the front page says so and the governance page lists every
outstanding item by name.

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

The shared in-product report control and isolated report service are specified but **not yet
implemented**. The repository is also still private, so there is no public issue intake today.
Clinician reviewers with repository access can record claim-specific notes on `/content-review`,
export one local file, and send it through the private channel by which they were invited.

Once public intake ships, usable reports will be acknowledged within five working days. Corrections
are appended permanently to [`CORRECTIONS.md`](CORRECTIONS.md) and never deleted or rewritten.

An error that could teach an unsafe practice is triaged as urgent: the affected content is
disabled in the next build regardless of the release schedule, and the corrections log
records the timeline.

## Auditing this from outside

The repository is intended to become the public source of truth, but it remains private today. The
current records are internally auditable and the public-readiness result is recorded in
[`docs/public-readiness-audit.md`](docs/public-readiness-audit.md). Do not infer public availability
from the planned architecture.

| Record | Where |
| --- | --- |
| The board | `EDITORIAL_BOARD` in `src/platform/governance/records.ts` |
| Review records | On each content item, in its own source file |
| The gate | `src/platform/governance/review-gate.ts` |
| Coverage, by name | `/governance` in the running application |
| Corrections | [`CORRECTIONS.md`](CORRECTIONS.md) |
| Limitations | `src/platform/docs/limitations.ts` and `/limitations` |
| Validation | `src/platform/docs/validation-report.ts` and `/validation` |

The governance dashboard reports the percentage of clinical content under current review
**together with the full list of everything that is not**. It never reports the aggregate
without the list.
