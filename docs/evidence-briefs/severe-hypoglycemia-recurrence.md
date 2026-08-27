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

Content 0.1.1 adds eight tutor rules grounded in the visible result, alertness, completed observation
timer, and reviewed records. No rule reads hidden glucose or announces the authored recurrence
before a visible change. The 15-second orientation delay and 90-second same-objective cooldown
are presentation defaults, not clinical deadlines. First and repeat rescue use separate recheck
prompts. Guidance never dispatches care, advances time, or changes the patient; exact expert,
error, and recovery engine traces are hashed across all three modes. The ADA source register
entry links recommendations 6.15–6.18 and the hypoglycemia treatment discussion. The source currency
check is due February 26, 2027, or sooner if a relevant update is identified; no clinical sign-off
is implied. The completion audit now cites implemented evidence and retains the demonstration,
inclusive-runtime, and four-surface reporting gaps.

The 0.1.1 full CI run passed 438 test files and 3,263 tests. Live browser checks confirmed the
Guided orientation, rationale, collapse control, authoritative source link, and transition to
rescue guidance only after a glucose observation. These checks do not replace moderated
accessibility or clinical validation.

Content 0.1.2 adds a worked example driven by accepted observations and actions, not absolute
script times. It sends ten ordinary decisions across the two rescue cycles, waits for actual
post-rescue checkpoints, and stops if the first recheck is missed. Display-cadence tests verify
the same decision sequence and successful objective evidence at 1-, 37-, and 600-tick intervals,
then replay each recorded action trace exactly. React tests cover duplicate renders, pause,
readable findings with disabled decision controls, and takeover without a patient reset. The
session-level test includes the real clock, transcript recorder, and in-process worker protocol.
The 60× default is a presentation choice; learners may pause or change speed. No new clinical
parameter, treatment claim, or validation sign-off is introduced.

The session test also exposed a catch-up defect: the transport displayed “paused” while later
frames advanced the internal clock. A failing regression observed tick 50 become 60 during this
claimed pause. The session now pauses the internal clock too, and Resume clears the notice.

A 1,280 × 720 browser check also found the fixed report launcher intercepting the worked
example's takeover button. Both overlays now share the responsive demonstration-height
reservation. The report launcher remains available above the strip; a regression checks
the shared desktop and stacked-height definitions. These are engineering checks, not
moderated accessibility approval.

The repaired browser flow preserved simulated time 00:08:31 and the observed glucose of
36 mg/dL on takeover, removed the narration strip, enabled decision controls, and selected
1× speed. The live report dialog was centered at (640, 360) in a 1,280 × 720 viewport,
accepted 160 characters, and remained unavailable on localhost without sending a report.

The final 0.1.2 CI run passed 440 test files and 3,273 tests, including the clock-freeze,
report-overlay, real-session replay, and worked-example regressions.
