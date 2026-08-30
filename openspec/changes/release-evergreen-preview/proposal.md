# Release the corpus publicly as one evergreen, honestly-unreviewed product

## Summary

Publish Open Sim Lab to the public now, on the preview channel, with every item truthfully
labeled as not clinically reviewed — and stop describing the product as an alpha waiting for a
launch that a signature will one day authorize.

Two things change. First, the preview publication contract is extended to the content kinds it
never covered, so explainers, drug cards, region profiles and debrief templates can earn
publication the same way scenarios do, on evidence rather than on a signature. Second, the
product drops staged version labels: there is one continuously-updated release, and the honesty
lives in per-item maturity labels and a public review-status surface instead of in the word
"alpha".

Nothing here relabels unsigned content as reviewed. The clinical-review gate stays exactly as
strict as it is; it simply stops being the thing that decides whether the public may open the
site at all.

## Why

The release gate currently reports 254 preview-channel blockers, and they are not one problem:

- **14 oncology scenarios** are missing their completion contract and quality records. This is
  real, unfinished authoring work. It is cleared by finishing the work, not by changing a rule.
- **Every non-scenario item** — 10 explainers, 3 drug cards, 2 region profiles — is blocked
  twice over: it is still `draft`, and `check-review-gate.ts` deliberately passes it an empty
  evidence set because "non-scenario completion/source/test contracts are not implemented yet."
  Fail-closed was the right default while the contract was undefined. Leaving it undefined means
  no explainer or drug card can ever publish, however good it is.

Meanwhile the thing that would actually find errors in 239 scenarios is people reading them. The
report control, the isolated Worker, D1, Turnstile, quotas, retention and the kill switch are
all built. They detect nothing while the repository is private and the site is unpublished. An
unreviewed corpus that nobody can see does not become more accurate by waiting; a public one
with a working correction path does.

The staged-version framing works against this too. "Alpha" invites the reader to wait for a 1.0
that this project does not intend to have. The product is a catalog that grows and is corrected
continuously. The accurate signal for a reader is not a global version word but the per-item
status and the review-status page, both of which already exist.

## What this change does not do

- It does not weaken, bypass, or auto-satisfy the `clinically_reviewed` or
  `institution_endorsed` gates. No signature is invented, and the editorial board stays empty
  until real clinicians join it.
- It does not remove the not-for-clinical-use statement, the acknowledgement gate, or the
  no-real-patient-data guards.
- It does not lower the scenario preview bar. The 14 incomplete oncology scenarios stay blocked
  until their completion contracts and tests exist.
- It does not treat a user report as review. A report is detection; status still changes only
  after reproduction and source verification.

## Outcomes

When this change is implemented:

1. Every content kind has a defined, testable preview-evidence contract. No kind is blocked
   merely because its contract was never written.
2. Complete, source-carrying explainers, drug cards, region profiles and debrief templates
   publish as `preview`, visibly labeled "not clinically reviewed".
3. The 14 incomplete oncology scenarios remain blocked, and the gate names them.
4. `npm run deploy` publishes the preview channel to the public site, and the reviewed channel
   remains available and unchanged for the day a board exists.
5. The product carries no `alpha`, `beta`, or `rc` label anywhere a reader can see. Releases are
   identified by date and commit; content items carry their own semantic content versions.
6. A permanent public review-status surface reports exact counts and the full item list for
   every maturity status, and the front page links to it instead of an "alpha" banner.
7. Public report intake is live, acknowledged within five working days, and every confirmed
   correction is appended permanently to `CORRECTIONS.md`.
