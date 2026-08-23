# Automated model cross-check, 2026-08-20

**This is not a clinical review, and nothing in it is signed.** It is a machine-driven
proofread of the transcribed numbers, the model structure, and the learner-facing clinical
content against the primary literature. It catches transposed digits, structural mistakes
and claims the code does not support. It does not and cannot replace a credentialed
clinician judging whether the patient behaves like a patient. That review is task 13 of the
alpha change and it has still not happened. See [`GOVERNANCE.md`](../GOVERNANCE.md).

Why record it at all: it found thirteen real defects, four of which a learner would have
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
papers, not from the papers themselves.** On 2026-08-23 the Eleveld publisher PDF and
corrigendum were checked directly, resolving the stale paywall note and the reference-person
Q2 correction. The other items below remain unverified. A primary-source proofread is not the
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
- `qrsDurationSeconds` returns 147 ms by its Gaussian-edge convention at every rate, which
  is not a clinically usable QRS duration and should not be read as one.
- Ventricular tachycardia morphology degenerates toward a continuous undulation at high
  rates, which would undermine a VT-versus-VF discrimination lesson.
- There is no paediatric respiratory profile, and the benchmark harness hardcodes adult
  haemoglobin and blood volume, so one cannot be added without changing it.
- The alarm priority names in source are `critical`/`warning`/`advisory` rather than the
  standard's high/medium/low. The learner-facing display already uses the standard's words.
