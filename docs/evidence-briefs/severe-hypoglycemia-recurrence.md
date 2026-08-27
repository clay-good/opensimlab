# Severe hypoglycemia: rescue is not the end

This state-transition lesson practices recognition, safe rescue selection, timed reassessment, and recurrence prevention. The fictional patient is a 72-year-old woman taking glimepiride, with kidney disease and poor intake. The medication record is initially hidden. Learner choices and elapsed time change the patient's state; no real-patient input or dose calculator exists.

## Evidence checked August 26, 2026

- ADA 2026 defines severe hypoglycemia by impaired function requiring another person's assistance, regardless of the glucose number. Oral glucose is for an alert person able to swallow; hypoglycemia requires prompt treatment, repeat assessment, and review of treatment and recurrence risks. See the hypoglycemia assessment, treatment, and prevention sections of [Standards of Care, section 6](https://doi.org/10.2337/dc26-s006).
- JBDS 2023 calls for urgent support and parenteral rescue for severe hypoglycemia when oral treatment is unsafe, with repeat glucose after 10–15 minutes and further treatment if still low. Sulfonylureas, impaired intake, and renal impairment matter when planning continued observation and medication review. See the severe pathway and follow-up sections of [Hospital Management of Hypoglycaemia in Adults with Diabetes Mellitus](https://www.diabetes.org.uk/sites/default/files/2023-03/JBDS%2001%20Hypo%20Guideline%20with%20qr%20code.pdf).

The 10-minute repeat checkpoint is within the guideline interval. The 36→112→42→108 mg/dL sequence, 30-minute recurrence after first rescue, and untreated deterioration are authored state transitions, not pharmacokinetic estimates or expected clinical responses. A 45-minute untreated safety stop represents instructor takeover, not death or a treatment deadline. The simulation can be run at 60× speed; accelerated time does not alter the transitions.

## Defaults and boundaries

The patient is 72 years old, 70 kg, and 165 cm; HR 112/min, BP 132/76 mm Hg, RR 18/min, SpO2 98% in room air, and temperature 36.6°C are fictional starting observations. No random traits or preselected treatment are used. The glucose and medication findings require separate learner observations. Rescue means a simulated qualified-team IV glucose pathway; there is no selectable formulation, concentration, dose, infusion, access technique, or guaranteed response. The scenario does not prescribe a universal observation duration or imply that all basal insulin should be stopped.

## Hazards and proof

Oral treatment while drowsy is refused with an explanation, not silently rewarded. Delayed rescue leaves hypoglycemia active; apparently successful rescue does not prevent the authored recurrence. Premature closure stops the learner's monitoring plan but not the patient's clock. A learner can correct course before instructor takeover. The debrief distinguishes safe expert performance, unsafe early choices, and recovery using transcript events, with an explicitly authored counterfactual. No diagnosis of overdose, intentional ingestion, durable neurologic recovery, safe discharge, or bedside competence is claimed.

Exact-version clinical review and moderated accessibility/learning review remain pending. Sources support clinical boundaries, not the invented numbers or timing of harm. No source figure, algorithm, or passage is reproduced.

The 45-minute catalog estimate is simulated time at 1×. The shared schema permits up to 60 minutes
for longitudinal reassessment; this does not change the initial anesthesia catalog's under-20-minute
requirement. Pausing and accelerated time keep observation periods manageable without relabeling them.

Verification on August 26, 2026: full CI passed 437 test files and 3,253 tests, including exact
timing, stale measurements, recovery, takeover, hostile actions, both practice regions, and UI
visibility. Browser checks observed timed improvement and recurrence, inline refusal feedback,
the centered 160-character report modal, disabled sending on the unconfigured local host, and
Escape dismissal with focus restored. No report was sent. This is not moderated screen-reader,
320 px, clinical, or learning-outcome validation.
