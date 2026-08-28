# Severe pneumonia: the score answered a different question

Content version 0.1.0; infectious-disease preview. Sources checked August 28, 2026.
Independent clinical approval remains pending. Educational simulation, not patient care.

## What the learner must distinguish

Nothing is hidden here and every number is correct. The failure is interpretive rather than
perceptual: a mortality score is being asked a level-of-care question it was never validated to
answer, while a second instrument built for exactly that question says something different.

That is a distinct failure from the four earlier lessons. Meningococcal sepsis was about the speed
of a decision. The obstructed kidney was about a second treatment axis. Febrile neutropenia was
about a blind examination. Necrotizing infection was closest, but there the score fails at its
*own* question and has no validated substitute. Here the mortality score does not fail: it is right
about thirty-day mortality, and simply is not the instrument for where this patient should be.

The evidence supports those distinctions, not this fictional response curve:

- [ATS/IDSA 2019 CAP guideline](https://pmc.ncbi.nlm.nih.gov/articles/PMC6812437/),
  *Am J Respir Crit Care Med* 2019;200(7):e45-e67. Severe CAP is defined by either major criterion
  (septic shock requiring vasopressors, or respiratory failure requiring mechanical ventilation) or
  **three or more minor criteria**, which include respiratory rate at or above 30, PaO2/FiO2 at or
  below 250, multilobar infiltrates, confusion, uraemia, leukopenia, thrombocytopenia, hypothermia,
  and hypotension requiring aggressive fluid resuscitation. The 2025 ATS update did not revise this
  definition, and IDSA did not endorse that update, so the two bodies are now publicly split.
- [NICE NG250](https://www.ncbi.nlm.nih.gov/books/NBK618729/), published September 2, 2025,
  replacing NG138 and NG139 and partially replacing CG191. CURB65 supports place-of-care decisions
  **alongside clinical judgement rather than in isolation**: 0 to 1 discharge home, 2 intermediate
  options, 3 or more inpatient care with referral to critical care services if appropriate.
- [Marti et al., *Crit Care* 2012;16:R141](https://link.springer.com/article/10.1186/cc11447):
  pooled discrimination of about **0.69** for CURB-65 and PSI in predicting critical-care admission.
  The severity criteria and purpose-built tools discriminate better. This is the number that makes
  the lesson quantitative rather than rhetorical.

## Where the numbers come from

| Value | Presentation | After the authored deterioration |
| --- | --- | --- |
| Respiratory rate | **30** | 34 |
| Oxygen saturation | 92% | 90% |
| Inspired fraction | **0.35** | **0.60** |
| **Oxygenation ratio** | **171** | **92** |
| Blood pressure | 106/64 | 84/46 after a litre |
| Confusion | absent | **present** |
| Urea | **8.4** | 10.6 |
| Platelets | 148 | 118 |
| C-reactive protein | 284 | 284 |
| Sodium | 129 | 128 |
| Lactate | 2.6 | 4.1 |
| **Mortality score** | **2** | **4** |
| **Severity criteria met** | **3** | 5 |

The presenting line is the whole scenario: mortality score 2 places him in a ward band, while three
minor criteria are met (respiratory rate at or above 30, ratio at or below 250, multilobar), which
defines severe pneumonia. Both are correctly calculated from the same patient.

The saturation is deliberately reassuring and the ratio is not. Between the two states the
saturation falls only two points while the inspired fraction nearly doubles, so the ratio collapses
from 171 to 92. A learner reading the saturation alone sees almost nothing happen.

The C-reactive protein of 284 and the sodium of 129 are deliberate bait: both look alarming, both
are prognostically associated with outcome in the literature, and **neither appears in either
instrument**. The scenario says so and refuses an attempt to grade severity by the marker.

Values feeding the two instruments are guideline-anchored. Heart rate, temperature, CRP, sodium,
lactate, and the rate of change are clinically plausible.

## What is disputed, and stays disputed

**No severity tool has ever been shown in a randomised trial to improve outcomes when used for
critical-care triage.** The evidence that delayed escalation harms is observational and confounded
by indication. The minor criteria themselves have never been formally re-derived since 2007, and
their items carry unequal weight. PSI versus CURB-65 preference is contested, and the two guidelines
this scenario cites differ on it.

As of 2025 the two bodies that jointly published the 2019 guideline are split, so "the guideline
says" is no longer a single voice on this condition. Regional pathways diverge accordingly: one runs
a mortality score then the severity criteria, the other runs a disposition ladder that may never
compute the criteria at all. The scenario makes the two-instrument comparison itself the content
rather than localising to one country's route.

NICE NG250 recommendation numbers are **unverified**: the guideline page was not directly
retrievable at authoring time and its text was read through a mirror.

## What this scenario cannot teach

Ventilation strategy, oxygen device selection, vasopressor choice, fluid volumes, steroid decisions,
and antimicrobial selection or de-escalation, all of which are prescribing decisions.

It also cannot teach whether a critical-care bed exists. Capacity is the real-world constraint that
most often determines what actually happens, and the simulator deliberately does not model
rationing. The deterioration occurs whatever the learner records; what changes is whether the
review was requested while the patient was still on a ward trajectory. The run ends with the
level-of-care decision pending, because that decision belongs to the receiving team.
