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
  Aneurysmal subarachnoid hemorrhage delayed deterioration overlays a fixed day-7 aneurysm-care
  record, new focal findings, CT, CTA, CTP, physiology, qualified multidisciplinary ownership, and
  strict-later neurological and captured-interval EEG reports on the healthy adult scaffold; it
  does not validate DCI, vasospasm, rebleeding, hydrocephalus, infarction or seizure physiology,
  examination, scoring, imaging or EEG interpretation, hemodynamic or airway management,
  angiography, endovascular care, treatment effect, etiology, disposition, prognosis, or outcome.
  Focal motor status epilepticus escalation overlays a fixed evolving visible motor pattern, absent
  meaningful recovery, physiology, glucose, qualified prior care, multidisciplinary ownership, and a
  strict-later persistent-clonus report on the healthy adult scaffold; it does not validate seizure
  generation, semiology assessment, a universal focal-status clock, airway safety, EEG state,
  medication or procedure effects, injury, cause, recovery, disposition, prognosis, or outcome.
  Nonconvulsive status epilepticus recognition overlays fixed fluctuating language and awareness,
  subtle recurrent signs, physiology, glucose, sodium, CT, CTA, qualified multidisciplinary
  ownership, and a strict-later specialist electrographic-status report on the healthy adult
  scaffold; it does not validate seizure generation, examination, clinical-only diagnosis, EEG
  acquisition or interpretation, airway safety, medication or procedure effects, cause, seizure
  control, recovery, disposition, prognosis, or outcome.
  Myasthenic crisis escalation overlays fixed rapid fatigable weakness, bulbar and respiratory
  findings, serial mechanics, gases, infection context, qualified multidisciplinary ownership, and
  a strict-later supplied invasive-ventilation requirement on the healthy adult scaffold; it does
  not validate myasthenic weakness, respiratory mechanics, gas exchange, infection, airway or
  ventilation management, medicine effects, treatment response, weaning, recovery, prognosis, or
  outcome.
  Guillain-Barré respiratory decline overlays fixed postinfectious ascending weakness, reflex,
  bulbar, cough, respiratory-mechanics, gas, autonomic, supportive CSF and electrodiagnostic, and
  strict-later deterioration reports on the healthy adult scaffold; it does not validate GBS
  physiology or diagnosis, examination, scoring, test acquisition or interpretation, respiratory
  or autonomic monitoring, airway or ventilation management, immune or other treatment effects,
  recovery, disposition, prognosis, or outcome.
  Acute bacterial meningitis first hour overlays fixed acute meningeal and infection findings,
  alert nonfocal neurological and LP-safety state, blood evidence, qualified diagnostics and care,
  bacterial-pattern CSF, and strict-later clinical state on the healthy adult scaffold; it does not
  validate meningitis physiology or diagnosis, examination, blood or CSF testing, imaging or LP
  safety, antimicrobial or adjunct effects, neurological complications, recovery, prognosis, or
  outcome.
  Suspected herpes simplex encephalitis overlays a fixed fever and encephalopathy clock, focal-
  seizure report, CSF inflammation, qualified early care, temporal MRI, specialist EEG, early
  negative HSV PCR, and strict-later clinical state on the healthy adult scaffold; it does not
  validate encephalitis physiology or diagnosis, examination, CSF or PCR testing, imaging or EEG
  interpretation, antiviral or antiseizure effects, repeat-test timing, recovery, prognosis, or
  outcome.
  Raised intracranial pressure with visual threat overlays fixed headache and visual symptoms,
  specialist eye findings, fields, MRI, venography, LP, qualified care, and strict-later field
  deterioration on the healthy adult scaffold; it does not validate pressure physiology, eye or
  neurological examination, testing, diagnosis, medicine or procedure effects, visual rescue,
  recovery, prognosis, or outcome.
  Acute transtentorial herniation pattern overlays fixed consciousness, pupil, motor, respiratory,
  pressure, CT, qualified rescue, and strict-later reports on the healthy adult scaffold; it does
  not validate intracranial-pressure or herniation physiology, examination, monitoring, imaging,
  airway or medical rescue, decompression, treatment effect, recovery, prognosis, or outcome.
  Metastatic spinal cord compression overlays fixed cancer, pain, motor, sensory, gait, bladder,
  qualified care, whole-spine MRI, and strict-later reports on the healthy adult scaffold; it does
  not validate cord-compression physiology, examination, imaging, movement, medication or
  definitive-treatment effects, recovery, prognosis, or outcome.
  Acute delirium with reversible causes overlays fixed baseline, fluctuating cognition, qualified
  4AT and diagnosis, contributor, care, and strict-later reports on the healthy adult scaffold; it
  does not validate delirium physiology, examination, scoring, capacity, cause attribution,
  medication or supportive-care effects, recovery, prognosis, or outcome.
  Autonomic dysreflexia with an authored trigger uses discrete canonical pressure and pulse states
  for presentation, upright support, release of one supplied visible external drainage-tubing kink,
  and elapsed reassessment on the healthy adult scaffold. These values are bounded teaching
  calibrations, not a validated neurogenic-autonomic response model, and do not validate lesion
  classification, diagnosis, catheter or bowel care, medication effects, individualized response,
  durable resolution, recurrence, complications, prognosis, or outcome.
  Methemoglobinemia with a saturation gap uses fixed canonical presentation and elapsed-response
  states: pulse-coherent SpO2 85%, PaO2 238 mmHg, calculated saturation 99%, co-oximetry
  methemoglobin 32%, then clearer mentation, heart rate 98/min, and methemoglobin 8%. These are
  teaching calibrations grounded in toxicology guidance, not a dyshemoglobin chemistry, tissue-
  oxygen-delivery, methylene-blue kinetic, contraindication, or individualized response model.
  Carbon monoxide with a reassuring monitor uses fixed canonical presentation and elapsed-response
  states: conventional pulse-coherent SpO2 99% with supplied COHb 28%, then clearer orientation,
  heart rate 92/min, respiratory rate 18/min, conventional SpO2 100%, and COHb 7%. These are teaching
  calibrations grounded in current CDC and ACEP guidance, not a CO uptake, elimination, tissue-
  oxygen-delivery, neurologic-injury, hyperbaric-benefit, or individualized response model.
  Acetaminophen where the clock changes the meaning uses fixed canonical presentation and elapsed-
  review states: an authored 6-hour level of 132 µg/mL with a supplied qualified above-treatment-line
  and below-high-risk-line position, baseline AST 24 U/L, ALT 21 U/L and INR 1.1, then a fixed
  22-hour report with acetaminophen below 10 µg/mL, AST 27 U/L, ALT 24 U/L and INR 1.2. These are
  teaching calibrations grounded in current consensus and ACMT guidance, not an absorption,
  metabolism, nomogram-calculation, liver-injury, acetylcysteine-pharmacology, automatic-stopping, or
  individualized-response model.
  Methanol visual-acidosis toxicity uses fixed canonical presentation and elapsed-response states:
  HR 118/min, BP 110/68 mmHg, RR 30/min, SpO2 98%, blurred snowfield-like vision, confusion,
  pH 7.19, bicarbonate 7 mmol/L, authored anion gap 31 mmol/L, measured osmolality 322 mOsm/kg and
  authored osmolar gap 31 mOsm/kg, then qualified source, antidote, cofactor, acid-base and
  extracorporeal intent with pH 7.27, HR 106/min, BP 112/70 mmHg, RR 26/min, persistent blurred
  vision and arousable confusion. These are teaching calibrations grounded in EXTRIP methanol
  recommendations and the current DailyMed fomepizole label, not an exposure, gap-calculation,
  acid-base, osmolar, concentration, visual, neurologic, antidote-response, dialysis, airway, renal,
  or individualized-response model.
  Delayed local-anesthetic CNS-cardiac toxicity uses fixed canonical presentation and elapsed-
  response states: a 38-hour continuous ropivacaine-catheter source, 12-minute metallic-taste,
  tinnitus, perioral-tingling, dysarthria and agitation prodrome, generalized seizure, HR 48/min,
  BP 82/46 mmHg, RR 10/min, SpO2 92%, QRS 124 ms and ventricular ectopy, then qualified source,
  airway, seizure, lipid, acid-base, modified-resuscitation and ECLS intent with sinus rhythm
  76/min, BP 104/64 mmHg, RR 16/min, SpO2 98%, QRS 104 ms and arousable drowsiness. These are teaching
  calibrations grounded in the ASRA practice advisory and current AHA guidance, not a source-
  delivery, pharmacokinetic, diagnostic, seizure, ECG, perfusion, lipid-response, airway,
  resuscitation, ECLS, or individualized-response model.
  Opioid poisoning with persistent sedation uses fixed canonical presentation and elapsed-response
  states: reported community naloxone and rescue breathing after an unknown powder exposure, HR
  50/min, BP 86/48 mmHg, RR 6/min, SpO2 84%, end-tidal CO2 62 mmHg, T 35.5°C and deep sedation, then
  qualified continued respiratory and supportive care with HR 54/min, BP 90/52 mmHg, RR 14/min,
  SpO2 97%, end-tidal CO2 43 mmHg and persistent drowsiness. These are teaching calibrations grounded
  in current CDC and FDA xylazine guidance, not an exposure-identification, respiratory, blood-gas,
  toxicology-screen, opioid-antagonist, xylazine, wound, withdrawal, addiction, or individualized-
  response model.
  Postpartum hemorrhage from uterine atony uses fixed canonical presentation and elapsed-response
  states: 8 minutes after vaginal birth with qualified measured loss 650 mL and rising, active
  bleeding, a boggy enlarged uterus, HR 118/min, BP 94/58 mmHg, RR 24/min, SpO2 98% and dizziness,
  then qualified bundled care with HR 104/min, BP 102/64 mmHg, RR 20/min, SpO2 99%, a firmer uterus
  and visibly slower bleeding. These are teaching calibrations grounded in 2025 WHO/FIGO/ICM and
  reaffirmed ACOG guidance, not a blood-loss, uterine-contractility, coagulation, medication,
  transfusion, procedural, fertility, maternal-outcome, newborn-outcome, or individualized-response
  model.
  Salicylate where the falling number can be worse uses fixed canonical presentation and elapsed-
  deterioration states: supplied salicylate 52 mg/dL, pH 7.45, PCO2 23 mmHg, bicarbonate 16 mmol/L,
  anion gap 20 mmol/L and potassium 3.2 mmol/L, then salicylate 46 mg/dL, pH 7.32, PCO2 25 mmHg,
  bicarbonate 13 mmol/L, potassium 3.0 mmol/L and new confusion. These are teaching calibrations
  grounded in ACMT and EXTRIP guidance, not a salicylate kinetic, tissue-distribution, acid-base,
  alkalinization-response, airway, extracorporeal-treatment, or individualized-response model.
  Tricyclic sodium-channel cardiotoxicity uses fixed canonical presentation and elapsed-response
  states: HR 132/min, BP 82/48 mmHg, supplied QRS 132 ms with terminal rightward aVR pattern,
  pH 7.34, sodium 139 mmol/L and potassium 3.7 mmol/L, then HR 112/min, BP 106/66 mmHg, QRS 104 ms,
  pH 7.43, sodium 144 mmol/L and potassium 3.4 mmol/L. These are teaching calibrations grounded in
  AHA guidance and product labeling, not an ECG, electrophysiology, toxicokinetic, bicarbonate-
  response, airway, dysrhythmia, refractory-rescue, or individualized-response model.
  Beta-blocker cardiogenic shock uses fixed canonical presentation and elapsed-response states:
  HR 42/min, BP 72/40 mmHg, glucose 62 mg/dL, supplied PR 220 ms, globally reduced LV contraction,
  pH 7.31, lactate 3.8 mmol/L and potassium 4.2 mmol/L, then HR 58/min, BP 98/60 mmHg, glucose
  104 mg/dL, lactate 2.8 mmol/L and potassium 3.5 mmol/L. These are teaching calibrations grounded
  in current AHA guidance and product labeling, not a toxicokinetic, receptor, contractility,
  metabolic, vasopressor, glucagon, insulin/euglycemia, pacing, dialysis, refractory-rescue, or
  individualized-response model.
  Calcium-channel-blocker mixed shock uses fixed canonical presentation and elapsed-response states:
  HR 34/min, BP 68/36 mmHg, complete AV block with atrial rate 78/min and ventricular escape 34/min,
  glucose 238 mg/dL, globally reduced LV contraction, low vascular tone, pH 7.29, lactate 4.6 mmol/L
  and potassium 4.1 mmol/L, then sinus rhythm 64/min, BP 96/58 mmHg, glucose 176 mg/dL, lactate
  3.0 mmol/L and potassium 3.4 mmol/L. These are teaching calibrations grounded in current AHA
  guidance and product labeling, not a toxicokinetic, ion-channel, conduction, contractility,
  vascular, metabolic, vasopressor, calcium, insulin/euglycemia, pacing, decontamination,
  refractory-rescue, or individualized-response model.
  Digoxin rhythm-potassium toxicity uses fixed canonical presentation and elapsed-response states:
  HR 36/min, BP 76/42 mmHg, complete AV block with atrial rate 84/min and ventricular escape 36/min,
  pre-antidote digoxin 8.6 ng/mL drawn 7 hours after the last dose, potassium 6.1 mmol/L,
  pH 7.32, lactate 3.4 mmol/L and creatinine 1.1 mg/dL, then sinus rhythm 62/min,
  BP 100/62 mmHg, potassium 4.7 mmol/L and lactate 2.1 mmol/L without a post-Fab total digoxin
  level. These are teaching calibrations grounded in current AHA guidance and product labeling, not
  a toxicokinetic, ion-pump, rhythm, potassium, Fab-response, assay, pacing, dialysis, rescue, or
  individualized-response model.
  Cholinergic pesticide respiratory failure uses fixed canonical presentation and elapsed-response
  states: HR 48/min, BP 86/50 mmHg, RR 30/min, SpO2 86%, bronchorrhea, bronchospasm, shallow tiring
  ventilation, fasciculations, proximal weakness, pH 7.27, PCO2 52 mmHg and lactate 3.6 mmol/L,
  then qualified decontamination plus reported airway support and assisted ventilation without a
  supplied device or setting, with markedly reduced secretions and
  wheeze, SpO2 96%, HR 82/min, BP 104/64 mmHg and clearer mentation while weakness persists. These
  are teaching calibrations grounded in current AHA and EPA guidance, not an exposure,
  cholinesterase, secretion, respiratory, neuromuscular, antidote-response, decontamination, airway,
  ventilation, seizure, or individualized-response model.
  Anticholinergic hyperthermia and delirium uses fixed canonical presentation and elapsed-response
  states: HR 138/min, BP 132/78 mmHg, RR 24/min, SpO2 98%, core T 40.3°C, severe agitated delirium,
  dry flushed skin and mucosa, mydriasis, reduced bowel sounds, urinary retention, QRS 86 ms,
  lactate 3.2 mmol/L, creatinine 1.1 mg/dL and CK 820 U/L, then qualified active cooling, supportive
  care and sedation with T 38.6°C, HR 106/min, BP 124/72 mmHg and calmer but persistent confusion and
  urinary retention. These are teaching calibrations grounded in current AHA hyperthermia guidance
  and the NLM anticholinergic-toxicity review, not an exposure, receptor, thermoregulation, delirium,
  ECG, renal, CK, urinary, cooling, sedation, antidote-response, airway, or individualized-response
  model.
  Serotonin toxicity with hyperthermia and clonus uses fixed canonical presentation and elapsed-
  response states: HR 128/min, BP 146/84 mmHg, RR 26/min, SpO2 97%, core T 40.1°C, agitation,
  confusion, diaphoresis, tremor, ocular and inducible ankle clonus, lower-limb hyperreflexia and
  increased tone, hyperactive bowel sounds, diarrhea, QRS 88 ms, lactate 3.8 mmol/L, creatinine
  1.0 mg/dL and CK 640 U/L, then qualified source cessation, cooling, support and sedation with
  T 38.7°C, HR 104/min, BP 132/76 mmHg and calmer mentation while clonus and hyperreflexia persist.
  These are teaching calibrations grounded in the primary Hunter-criteria study, the current
  linezolid label and current AHA drug-related hyperthermia guidance, not an exposure, diagnostic-
  rule, thermoregulation, neuromuscular, gastrointestinal, ECG, renal, CK, cooling, sedation,
  antagonist-response, airway, or individualized-response model.
  Sympathomimetic hyperadrenergic hyperthermia uses fixed canonical presentation and elapsed-response
  states: HR 150/min, BP 196/112 mmHg, RR 30/min, SpO2 98%, core T 40.4°C, fearful hypervigilance,
  severe motor agitation, paranoia, diaphoresis, mydriasis, active bowel sounds, QRS 90 ms, lactate
  5.2 mmol/L, creatinine 1.2 mg/dL and CK 980 U/L, then qualified de-escalation, GABAergic sedation,
  cooling and support with T 38.8°C, HR 112/min, BP 152/88 mmHg, RR 22/min and calmer cooperation.
  These are teaching calibrations grounded in the 2024 ASAM/AAAP stimulant guideline and current AHA
  sympathomimetic-hyperthermia guidance, not an exposure, toxicology-screen, thermoregulation,
  autonomic, cardiovascular, psychiatric, renal, CK, cooling, sedation, adjunct-response, airway, or
  individualized-response model.

Maternal sepsis with postpartum deterioration uses two fixed canonical states: the opening report
has HR 132/min, BP 88/52 mmHg, RR 28/min, SpO2 96%, T 39.1°C, slowed responses, reduced urine,
creatinine 1.4 mg/dL from 0.7 and lactate 4.2 mmol/L; the strict 30-minute report has HR 122/min,
BP 94/58 mmHg, RR 24/min, SpO2 98%, T 39.0°C, clearer responses, pending urine and repeat lactate,
and unresolved source control. These are authored teaching checkpoints grounded in SMFM Consult
Series #67 and the WHO maternal-sepsis statement, not an infection, antimicrobial, fluid,
vasopressor, source-control, organ-recovery, maternal-outcome or newborn-outcome model.

Concealed placental-abruption hemorrhage uses two fixed canonical states: the opening report has
only 80 mL externally collected blood beside abrupt pain, a supplied tense tender uterus, HR
126/min, BP 92/56 mmHg, RR 26/min, SpO2 98%, T 36.8°C, fetal baseline 170/min with minimal
variability and recurrent late decelerations, platelets 112 × 10^9/L, fibrinogen 1.5 g/L, INR 1.4
and lactate 4.0 mmol/L; the strict 10-minute report has HR 118/min, BP 98/60 mmHg, RR 22/min, SpO2
99% on supplied support, persistent fetal compromise, 120 mL visible cumulative blood and
operating-room readiness while total loss, coagulation, anesthesia and delivery remain unresolved.
These authored checkpoints are grounded in the 2024 BJA Education review and RCOG Green-top
Guideline No. 63, not a concealed-loss, fetal-monitoring, coagulation, treatment-response,
anesthesia, delivery, maternal-outcome or newborn-outcome model.

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
