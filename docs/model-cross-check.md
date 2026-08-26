# Automated model cross-check, 2026-08-20

**This is not a clinical review, and nothing in it is signed.** It is a machine-driven
proofread of the transcribed numbers, the model structure, and the learner-facing clinical
content against the primary literature. It catches transposed digits, structural mistakes
and claims the code does not support. It does not and cannot replace a credentialed
clinician judging whether the patient behaves like a patient. That review is task 13 of the
alpha change and it has still not happened. See [`GOVERNANCE.md`](../GOVERNANCE.md).

Why record it at all: it found sixteen real defects, five of which a learner would have
seen on screen, and the provenance of a fix matters as much as the fix.

## Method and its limits

Four independent passes over the code and tests, grouped as follows:

| Pass | Scope |
| --- | --- |
| Propofol kinetics | Eleveld 2018, Schnider 1998, Marsh 1991, body-composition equations |
| Opioid and dynamics | Minto 1997, the response surface, MAC, the compartment solver, the envelope evaluator |
| Physiology | Benumof benchmark, the dissociation curve, gas exchange, haemodynamics, baroreflex, airway |
| Clinical content | Drug cards, explainers, the scenario, the four waveform generators, the alarm set |

**The central limitation: the original passes worked largely from recalled knowledge of the
papers, not from the papers themselves.** On 2026-08-23 the Eleveld publisher PDF, corrigendum,
and final S4 NONMEM stream were checked directly, resolving the stale paywall note and the
reference-person Q2 correction and correcting the asymmetric depth transition. The other items
below remain unverified. A primary-source proofread is not the
independent second-person, second-source check required before a model may be called Published.

## Fixed

Each has a regression test that fails against the previous behaviour.

| # | Defect | Effect on a learner |
| --- | --- | --- |
| 1 | ECG deflection amplitude scaled with the square of heart rate | The R wave went 1.1 mV at 60 bpm, 5.0 at 130, 9.8 at 180 — twice the usual limb-lead hypertrophy criterion, on a patient whose only problem was a fast heart |
| 2 | Oxygen was consumed twice in the gas exchange model | A healthy ventilated adult on room air read SpO₂ 93%. Now 98% |
| 3 | End-tidal CO₂ could exceed arterial CO₂ | Any hyperdynamic moment produced a physically impossible negative gradient |
| 4 | The arterial trace disagreed with the arterial numbers | Diastolic rendered ~10 mmHg high, pulse pressure a quarter narrow, so reading pulse-pressure variation off the trace gave the wrong answer |
| 5 | The hypotension alarm fired at MAP 55 | Taught that MAP 56 is unremarkable. Most outcome literature is organized around 65, and one to five minutes below 55 is associated with kidney and myocardial injury |
| 6 | The preoxygenation objective measured inspired, not end-tidal, oxygen for two minutes | A leaking mask scores full marks. Now end-tidal 0.9 for three minutes, and the state vector carries end-tidal oxygen |
| 7 | Both saturation alarms were high priority | Escalating from 90% to 85% carried no information |
| 8 | The deep-depth alarm fired at 30 while citing the 40–60 range as its source | The threshold did not match its own stated source |
| 9 | Nitrous oxide was not age-corrected | Under-read the nitrous contribution by ~28% at age 80, in the direction of underestimating depth in the patients where awareness matters |
| 10 | The additivity comparator summed effects (Bliss), not potencies (Loewe) | The "synergy exceeds additivity" property was asserted by one lucky test point, and the comparator could return a negative depth index |
| 11 | An unchecked transcription could display as "Published" | The rule was written in the type and never implemented. Such models now read "Pending independent check" |
| 12 | The Cormack-Lehane difficulty ramp was far too steep, and videolaryngoscopy under-credited | 24% grade 3/4 at low difficulty and 44% even with video would teach that difficult laryngoscopy is routine and that the rescue device barely helps |
| 13 | Fat-free mass stepped discontinuously at exactly 18 years | A female patient's value dropped 2.9% on her eighteenth birthday, and Eleveld's V3 and Q3 moved with it |
| 14 | Eleveld's asymmetric depth slopes were reversed and joined with a hard branch | The learner-visible depth index disagreed with the authors' final NONMEM stream, especially around Ce50. It now uses 1.89 below, 1.47 above, and the source's logistic blend |
| 15 | An unused helper called the Q-to-S two-standard-deviation Gaussian support a QRS duration | It reported 147 ms without a clinical onset/offset definition, which could falsely imply the normal trace's width had been validated. The proxy was removed; tests now assert the published event timing, rate-stable Gaussian widths, and the declared narrow/wide distinction without inventing a diagnostic interval. |
| 16 | Alarm priorities used `critical`/`warning`/`advisory` internally while the governing monitor specification requires `high`/`medium`/`low` | The worker protocol, alarm engine, audio patterns, visual state, and accessibility announcements now share the standard priority vocabulary. Event-log severity and the existing visual color-token names remain separate domains. |

Smaller corrections in the same pass: the remifentanil model offered itself as the
alternative when its own failure predicate fired; an envelope violation could be handed a
remedy belonging to a failure that had not fired; the response surface's provenance note
claimed remifentanil has no hypnotic effect of its own, which the Greco form contradicts;
the missing low-inspired-oxygen alarm the ASA monitoring standard requires was added; and
the preoxygenation explainer said Benumof "measured" times that were modelled.

## Newly disclosed rather than fixed

Added to the limitations register, because the honest move was to say so rather than to
build the mechanism badly in a weekend:

- The oxyhaemoglobin dissociation curve does not shift with pH, CO₂ or temperature.
- There is no shunt or ventilation-perfusion model; the A–a gradient is a per-patient constant.
- A bolus is injected instantaneously. Injection rate is not modelled, so the simulator will
  let a learner do exactly what the remifentanil card warns against and show no consequence.
- The response surface gives remifentanil a hypnotic effect of its own that it does not
  clinically have, which understates the awareness risk of an opioid-heavy technique.
- Positive end-expiratory pressure can be set and held but has no physiological effect.

## Still unverified, and needs a human with the paper

These are the items a clinician reviewer should start with. They are ordered by what would
be worst if wrong.

1. **Eleveld's arterial versus venous parameters.** The paper publishes both; only the
   arterial branch is implemented, which is now stated in the file.
2. **Minto's pharmacodynamic parameters** (Ce50 13.1 ng/mL, age slope −0.148, γ 2.44). A
   competing set attributed to the same paper circulates widely. Needs Part II, Table 2.
3. **The applicability envelope bounds** for Minto, and Eleveld's upper age bound of 105,
   which is beyond the derivation population and carries no failure predicate.
4. **The `ke0` provenance** for Marsh (0.26) and Schnider (0.456). Both are the conventional
   values; neither comes from the cited paper.

## Known and not yet addressed

Recorded here rather than silently carried:

- Apnoeic arterial CO₂ rises at a flat 3 mmHg/min with no first-minute step, because the
  carbon dioxide store is a single compartment.
- The baroreflex heart-rate limb has a 7.2 s time constant, which is the sympathetic
  timescale rather than the vagal one, and a 25% haemorrhage in an awake patient produces
  less tachycardia than the textbook class II picture.
- Ventricular tachycardia morphology degenerates toward a continuous undulation at high
  rates, which would undermine a VT-versus-VF discrimination lesson.
- The healthy-child respiratory profile is bounded to the exact bundled 6-year-old, 20 kg teaching
  patient, the bronchiolitis scenario's exact 1-year-old, 10 kg scaffold, the croup scenario's
  exact 3-year-old, 15 kg scaffold, and the pediatric status-asthmaticus scenario's exact
  10-year-old, 32 kg scaffold, and the pediatric septic-shock scenario's exact 4-year-old, 16 kg
  scaffold, the pediatric dehydration scenario's exact 2-year-old, 12 kg scaffold, and the
  pediatric DKA scenario's exact 9-year-old, 30 kg scaffold, and the pediatric hypoglycemic-seizure
  scenario's exact 5-year-old, 18 kg scaffold, and the pediatric febrile-seizure scenario's exact
  2-year-old, 12 kg scaffold; pediatric
  disease, upper- and lower-airway obstruction,
  developmental hemodynamics, and broader age-specific validation remain absent. Pediatric sepsis
  reuses the exact 6-year-old, 20 kg scaffold and overlays fixed infection, coagulation,
  classification, qualified-care, and serial-response reports; it does not validate sepsis
  physiology or treatment effect.
  Pediatric septic shock overlays fixed infection, perfusion, congestion-warning, Phoenix,
  qualified-care, and serial-response reports on its source-composed child scaffold; it does not
  validate shock physiology, fluid responsiveness, congestion causality, or treatment effect.
  Pediatric dehydration overlays fixed loss, intake, weight-history, hydration, qualified-care,
  and serial-response reports on its source-composed child scaffold; it does not validate a
  dehydration percentage, intravascular deficit, fluid physiology, oral tolerance, or treatment effect.
  Pediatric DKA overlays fixed illness, hydration, breathing, mentation, perfusion, biochemical,
  qualified-care, neurological-safety, and serial-response reports on its source-composed child
  scaffold; it does not validate DKA physiology, laboratory kinetics, fluid or insulin treatment,
  electrolyte management, cerebral-injury exclusion, or treatment effect.
  Pediatric hypoglycemic seizure overlays a fixed stopped convulsion, mentation, airway-safety,
  glucose, qualified-care, recurrence-risk, and serial-response report on its source-composed child
  scaffold; it does not validate seizure or glucose physiology, glucose kinetics, rescue effect,
  neurological recovery, cause, or recurrence.
  Pediatric febrile seizure overlays a fixed stopped event, fever, recovery, perfusion,
  qualified-care, serious-illness, caregiver-safety, and serial-response report on its
  source-composed child scaffold; it does not validate fever or seizure physiology, temperature or
  recovery kinetics, treatment effect, fever source, CNS-infection exclusion, recurrence, or
  outcome.
  Pediatric status epilepticus reuses the exact 6-year-old, 20 kg healthy-child scaffold and
  overlays a fixed ongoing-convulsion clock, 2-dose qualified-care record, supplied room-air oxygenation and
  glucose, immediate escalation boundary, and serial visible-response report; it does not validate
  seizure physiology, benzodiazepine or second-line drug effect, airway safety, electrographic
  control, neurological recovery, cause, recurrence, or outcome.
  Pediatric anaphylaxis reuses the exact 6-year-old, 20 kg healthy-child scaffold and overlays a
  fixed reported exposure, supplied first-line-care record, persistent airway-breathing-circulation
  compromise, qualified repeat-care escalation, and serial partial-response report; it does not
  validate anaphylaxis physiology, drug or support effect, diagnostic or trigger certainty,
  resolution, recurrence, observation, referral, disposition, or outcome.
  Pediatric supraventricular tachycardia reuses the exact 6-year-old, 20 kg healthy-child scaffold
  and overlays a fixed regular narrow-complex rhythm, supplied peripheral-perfusion compromise,
  qualified rhythm-care escalation, and serial improving response; it does not validate pediatric
  rhythm or perfusion physiology, ECG interpretation, a mechanism or cause, treatment modality or
  effect, durable rhythm control, recurrence, disposition, or outcome.
  Pediatric bradycardic arrest reuses the exact 6-year-old, 20 kg healthy-child scaffold and
  overlays fixed qualified effective breathing support, compromised sinus bradycardia with a pulse,
  qualified CPR ownership, and a strict-later PEA transition; it does not validate pediatric
  bradycardia, ventilation, perfusion, arrest or CPR physiology, treatment effect, cause, pulse-loss
  prediction, ROSC, termination, post-arrest care, prognosis, or outcome.
  Pediatric foreign-body airway obstruction reuses the exact 6-year-old, 20 kg healthy-child
  scaffold and overlays a fixed abrupt eating event, effective-cough branch, strict-later severe
  responsive obstruction, qualified pathway ownership, and strict-later unresponsive transition;
  it does not validate cough or airway physiology, object identity or location, oxygenation kinetics,
  obstruction progression, maneuver or CPR performance, treatment effect, removal, pulse status,
  recovery, ROSC, disposition, prognosis, or outcome.
  Pediatric injury safeguarding escalation reuses the exact 2-year-old, 12 kg healthy-child
  scaffold and overlays fixed development, history, objective injury distribution, physiological
  stability, qualified safeguarding and immediate-safety ownership, and a strict-later protected
  state; it does not validate injury, bruising, bleeding, occult-harm, safety, or recovery physiology,
  injury mechanism, bruise age, abuse, perpetrator identity, credibility, screening-rule performance,
  medical alternatives, reporting completion, legal action, custody, disposition, prognosis, or
  outcome.
  Minor nondisabling acute ischemic stroke overlays fixed symptom timing, sensory deficit,
  patient-specific function, NIHSS, CT, CTA, physiology, qualified strategy ownership, and strict-
  later neurological trajectory on the healthy adult scaffold; it does not validate cerebral
  ischemia, infarct evolution, neurological examination, NIHSS, disability, imaging, glucose,
  antiplatelet or thrombolytic pharmacology, reperfusion, treatment effect, etiology, recurrence,
  rehabilitation need, disposition, prognosis, or outcome.
  Late-window basilar artery occlusion escalation overlays fixed timing, posterior neurological
  findings, NIHSS, prestroke function, CT, CTA, pc-ASPECTS, physiology, qualified endovascular and
  airway-capable ownership, and strict-later surveillance on the healthy adult scaffold; it does
  not validate cerebral ischemia, examination, scoring, imaging, eligibility, airway safety,
  transfer, thrombectomy, reperfusion, treatment effect, etiology, disposition, prognosis, or
  outcome.
  Spontaneous cerebellar intracerebral hemorrhage overlays fixed timing, posterior-fossa findings,
  CT reports, physiology, qualified multidisciplinary ownership, and strict-later neurological,
  airway, hematoma, hydrocephalus, and brainstem-compression deterioration on the healthy adult
  scaffold; it does not validate hemorrhage or pressure physiology, examination, volume calculation,
  imaging, airway safety, procedure selection, surgery, treatment effect, etiology, disposition,
  prognosis, functional benefit, or outcome.

## Concentration-time checks, 2026-08-23

The acceptance text requires a published concentration-time point for every model. The Marsh
paper does not provide one reproducible from a linked patient, administration history, and
sample. Its separately computed golden point therefore does not close that requirement. These
checks prove solver transcription and integration; they are not a Varvel validation study and
do not make any model clinically verified.

Primary locators: Marsh DOI `10.1093/bja/67.1.41`; Schnider DOI
`10.1097/00000542-199805000-00006`, Figure 5; Eleveld DOI
`10.1016/j.bja.2018.01.018`, Supplement S1; Minto Part II DOI
`10.1097/00000542-199701000-00005`, Table 1.

| Model | Protocol and source point | Acceptance |
| --- | --- | --- |
| Marsh 1991 | 70 kg adult, 140 mg bolus, plasma at 1 min. `scipy.linalg.expm` independently evaluated the production convention: published volumes and forward rates determine Q2/Q3, retaining more precision than the separately rounded published k21/k31. The source contains no reproducible individual trajectory. | synthetic golden 6.699642910679039 µg/mL, software-regression precision; does not satisfy task 4.5 |
| Schnider 1998 | Figure 5 bottom: 50-year-old, 77 kg, 175 cm woman; infusion-only prediction at 200 µg/kg/min for 60 min, then 16 min off. | approximately 1.0 µg/mL, ±0.10 for the plotted line and 1 µg/mL axis ticks |
| Eleveld 2018 | Official Supplement S1, study 30, subject 838: AGE is 66 years and PMA is separately supplied as 66.769 years; the patient is a 65 kg, 158 cm woman with concomitant drugs. A 120 mg bolus plus a separate 1,333.333 mg infusion at 8.333 mg/min (about 160.006 min) begin at t=0; arterial plasma is sampled at 75 min. The final PK stream converts PMA with `PMW=PMA*52`. | observed 4.25 µg/mL, bounded by one typical log residual-error standard deviation, `exp(±0.191307)` |
| Minto 1997 | Part II Table 1, 20-year column: typical lean body mass 55 kg, 279 µg bolus, predicted effect site at 1.22 min. | 16.1 ng/mL, ±0.05 from the table's one-decimal precision |

The Eleveld fixture transcribes one row, not the supplement dataset. No patient record or
publisher attachment is bundled with the application.
