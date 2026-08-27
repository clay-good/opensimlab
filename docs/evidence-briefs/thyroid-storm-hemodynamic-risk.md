# Thyroid storm: treatment and circulation

Content 0.1.0 is a dose-free, state-transition preview for a fictional 38-year-old with known
Graves disease, interrupted antithyroid treatment, fever, confusion, vomiting, and circulatory
instability. It rehearses parallel treatment, circulation-informed rate control, iodine sequencing,
reassessment, and continuing-care handoff. It is not independently clinically reviewed.

## Sources and disagreement

- [Joint ETA/BTA/Society for Endocrinology/Welsh consensus, August 2026](https://doi.org/10.1530/ETJ-26-0043): clinical recognition, multidisciplinary care, cardiac assessment, individualized beta blockade, parallel supportive and precipitant care, antithyroid-before-iodine timing, and repeated clinical assessment.
- [ATA 2016, recommendations 34–35 and Table 7](https://doi.org/10.1089/thy.2016.0229): multimodal care and iodine at least one hour after antithyroid therapy.
- [JTA/JES 2016](https://www.jstage.jst.go.jp/article/endocrj/63/12/63_EJ16-0336/_pdf): a different supported pathway permits concurrent iodide and antithyroid treatment in synthesis-driven hyperthyroidism. The [primary prospective registry](https://pmc.ncbi.nlm.nih.gov/articles/PMC11651683/) also documents that approach.

Sources checked August 27, 2026. The new consensus remains expert guidance supported largely by
observational evidence. A score or laboratory threshold is not a gate to urgent treatment here.
Beta blockade is not universally prohibited in heart failure, nor is a short-acting agent
universally safe. The learner asks the qualified team to assess cardiac function and individualize
treatment; no beta-blocker selection, dose, or automatic fluid load is simulated.

The selected sequence applies in both displayed practice regions; it is not a claim that all local
protocols agree. An early iodine attempt is a mismatch with this declared pathway, not a verdict
that every concurrent-treatment protocol is unsafe. Steroids, support, and precipitant care start
without waiting for the iodine interval.

## Authored defaults and consequences

| State | BP, mmHg | HR/min | Temperature | Interpretation |
| --- | --- | --- | --- | --- |
| Presentation | 96/58 | 148 | 39.8°C | Agitated, confused, and unwell |
| Missing urgent coverage at 5 minutes | 82/46 | 164 | 40.2°C | More confused; poor perfusion persists |
| 2 hours after the complete pathway | 104/62 | 132 | 39.3°C | More attentive, still febrile and unwell |

RR/SpO2 are respectively 28/94%, 32/92%, and 24/96%. All numbers are authored contrasts, not
estimates of an individual's physiology or treatment kinetics. Age 38, weight 62 kg, height
165 cm, and the Graves/vomiting context are fixed fictional defaults, not randomized risk factors.
The supplied focused circulation assessment reveals congestion and cool, poorly perfused
extremities. No echocardiogram, hormone concentration, diagnostic score, or laboratory correction
curve is invented. Observation is separate from patient progression and can become stale.

Only the minimum one-hour iodine interval is source-derived. The five-minute deterioration,
30-minute incomplete-urgent-care stop, two-hour early partial-support checkpoint after the
complete pathway, and four-hour unfinished-lesson stop are authored clocks. The complete pathway
includes support, antithyroid and supportive care, circulation assessment, qualified rate-control
review, and sequence-compliant iodine. Missing either urgent treatment triggers the early branch;
an appropriate iodine wait does not. A late correction can recover the authored course without
erasing earlier choices. Marked clinical improvement generally takes 24–72 hours; this rehearsal
neither waits for nor proves it. Reassessment remains available immediately, including when worse.

## Hazards and controls

- False recovery: persistent fever and tachycardia remain visible; handoff states ongoing critical
  care, not discharge. The debrief distinguishes an early observation from resolution.
- Pulse-only prescribing: blanket beta blockade is refused and retained in the learning record.
  A circulation-informed review remains available, without promising a safe agent or dose.
- Diagnostic delay: treatment accepts no laboratory, score, full history, or support prerequisite;
  the delay choice remains visible after correction.
- Sequence overgeneralization: briefing, limitation register, and debrief name the selected
  pathway and Japanese alternative. Urgent supportive care is independently available.
- False kinetic precision: authored clocks and discrete values are labeled in the briefing and
  controls. Instructor takeover predicts no injury, death, or clinical treatment deadline.
- Stale observations: a prior reassessment is timestamped and does not become fresh when the
  underlying state changes. Later response must be observed before handoff.
- Scope leakage: generic drugs, fluids, procedures, crisis injection, adjacent-scenario actions,
  extra payload fields, and malformed action names are refused without echoing arbitrary text.
- Privacy: the inherited optional report includes at most 32 whitelisted equipment scalars.
  Thyroid action flags, timestamps, and numeric observations have priority; feedback, alertness,
  and unobserved findings are excluded. Reporting has no role in patient progression.

## Evidence and remaining work

Seed 4903 and exact-version expert, common-error, recovery, and no-action fixtures exercise the
shared engine. Model tests cover boundaries, partial care, stale observations, duplicate actions,
recovery, and both stop conditions. Real-engine checks cover replay hashes, five debrief findings,
generic-action isolation, and bounded report context. Inline tutor text reads accepted actions and
observations only; it stays quiet during alarms and is hidden in Unassisted mode. Its source link
pauses the simulation before opening.

A worked example, full inclusive-runtime evidence, independent clinical review, exact-version
four-surface reporting coverage, and production submission verification remain pending. Catalog
registration, authored fixtures, and passing development checks do not establish full completion.

Engineering browser checks on August 27, 2026 used the development server. Desktop controls
accepted urgent treatment before assessment, then qualified circulation/rate review, the elapsed
iodine sequence, and an early reassessment. The live report was centered at (640, 360) in a
1,280 × 720 viewport, capped its note at 160 characters, and previewed the actual bounded thyroid
actions and scalars. No report was submitted. The complete later response and handoff are covered
by real-engine/UI tests, not claimed as completed in this browser run.

At 320 × 568, the document had equal 320 px client and scroll widths. The report was centered at
(160, 284), with equal 271 px client and scroll widths inside its vertical scrollbar. Long action
labels wrapped to 247 × 48.5 px controls; the final reassessment and handoff controls remained
above the fixed launcher strip after scrolling. Browser inspection prompted full heading wrapping,
8 px control gaps, and extra briefing scroll room for the fixed Report control. Focusable
unavailable controls stay mounted, are visually muted, and reject repeated actions. These checks
do not establish native keyboard completion, screen-reader usability, or production validation.

The final 320 × 568 briefing check placed Start at y=427.5–471.5 and Report at y=503–547;
both passed center-point hit tests without overlap. Temporary inspection pages were removed.

Final full CI passed 3,422 tests across 450 files, all 30 specs, lint, TypeScript, static-host,
asset-budget, and font checks. The indexable build verified 218 routes. The 212 preview-channel
blockers remain explicit. Long real-engine replay tests retain every tick and use a test-specific
two-minute timeout for full-suite contention; production performance budgets were not raised.
