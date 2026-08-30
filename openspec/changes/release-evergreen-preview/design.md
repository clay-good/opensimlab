# Design: evidence-gated publication for every content kind

## 1. What "release" means after this change

The project keeps two publication channels and changes which one the public site uses.

| Channel | Gate | Who it is for | Status |
| --- | --- | --- | --- |
| `preview` | Technical and evidence gates only. No signature required. | The public site. | Becomes the default deploy target. |
| `reviewed` | Everything in preview, plus current exact-version signatures, domain coverage on the board, and completed face-validity review. | Institutional adoption packs. | Unchanged. Still refuses today. |

`preview` was already specified as signature-independent in
`build-multidomain-practice-catalog`. This change finishes it, because a channel that no
non-scenario item can pass is not a channel.

## 2. The gap being closed

`previewPublication(record, evidence)` checks eight named gates. `scenarioPreviewEvidence`
derives those gates from a scenario's completion and quality audits. Nothing derives them for
any other kind, so `check-review-gate.ts` passes `{ passed: [] }` and every explainer, drug
card, region profile and debrief template is blocked on all eight.

Two of the eight gates are inherently scenario-shaped — `completion-contract` and `tests` mean
different things for a drug card than for a scenario. The other six are kind-independent. So the
contract is defined as a common core plus a per-kind evidence rule:

| Gate | Scenario | Explainer | Drug card | Region profile | Debrief template |
| --- | --- | --- | --- | --- | --- |
| `build-integrity` | exact-version maturity record resolves | same | same | same | same |
| `sources` | source-provenance requirement satisfied | every clinical assertion carries a source locator | every parameter carries citation and applicability envelope | every entry names its regulatory or practice source | every claim traces to a scenario objective |
| `safety-scope` | bounded fictional patient + scenario limitations | no dosing instruction addressed to a real patient | envelope stated; no dose recommendation | technique availability stated as practice, not advice | no claim beyond the transcript |
| `completion-contract` | completion audit complete | every declared section present and non-empty | every declared field present | every governed axis present | every declared block present |
| `tests` | quality records all present | assertion-to-source test present | published reference value asserted in a unit test | region-variant test present | template renders against a reference transcript |
| `limitations` | scenario-specific limitations satisfied | names where the explanation simplifies | names where the model does not apply | names what the profile does not cover | names what the debrief cannot conclude |
| `validation-report` | validation report present | same | same | same | same |
| `face-validity-procedure` | procedure documented | same | same | same | same |

The per-kind rules are deliberately the same shape as the scenario rules — presence of declared
evidence, checked by a test — so a single `previewEvidenceFor(kind, item)` replaces the current
scenario-only derivation and the empty-set fallback disappears. A kind with no rule defined
remains fail-closed; the fallback is removed, not widened.

## 3. Draft is a state, not a backlog

Every non-scenario item is `draft` today, which blocks before evidence is even considered. That
is correct: `draft` means "not finished". The promotion criterion is exactly the evidence
contract above — an item becomes `preview` when its evidence passes, and the status change is
recorded rather than asserted. This change specifies the criterion; it does not bulk-flip
statuses. An item that cannot pass its evidence rule stays `draft` and stays unpublished.

## 4. Evergreen versioning

Staged labels are removed from everything a reader can see:

- Release identity is `YYYY-MM-DD` plus the commit, generated at build time.
- Content items keep their existing semantic content versions. This change does not touch them,
  because transcript reproduction and review invalidation both depend on them.
- `package.json` version drops the `-alpha.N` suffix.
- The interface carries no global maturity word. The honest signal is the per-item maturity
  label plus the review-status surface.

The reason is not cosmetic. A global "alpha" and a per-item "preview — not clinically reviewed"
are two different claims about the same content, and when they disagree the reader believes the
weaker one. One signal, at the item, is more truthful than two.

## 5. Why publishing unreviewed content is defensible here

It is defensible only because of what stays in place, so all of it stays in place:

- The not-for-clinical-use statement, its first-load acknowledgement, its persistent chrome
  marker, and its presence in every export.
- No real-patient data path, enforced by architecture tests rather than by policy.
- Per-item "not clinically reviewed" labeling at every surface — card, briefing, tutor, debrief,
  source drawer — with no reviewed or endorsed styling anywhere.
- The empty editorial board, published as empty.
- The limitations register, linked from the interface.
- A working, bounded, anonymous report path and a permanent corrections log.

Remove any one of those and this becomes a different, worse proposal. The claim being made to a
reader is not "this is correct". It is "this is our best transcription, none of it is signed,
here is exactly what is unsigned, and here is the button to tell us we are wrong."

## 6. What this does not solve

Public reporting is a detection mechanism with a known bias: readers find what they can check
quickly — a wrong unit, a mistyped constant, a stale threshold — and do not find a scenario that
teaches a subtly wrong priority. That failure mode needs a clinician reading with intent, which
is what the `reviewed` channel is for and why recruiting the board stays an open task rather
than a resolved one.
