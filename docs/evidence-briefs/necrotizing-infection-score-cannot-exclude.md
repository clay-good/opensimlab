# Necrotizing infection: a ruled-out result changes nothing

Content version 0.1.0; infectious-disease preview. Sources checked August 28, 2026.
Independent clinical approval remains pending. Educational simulation, not patient care.

## What the learner must distinguish

A ruled-in result changes what you do. A ruled-out result here changes nothing, because the only
test that can exclude this diagnosis is surgical exploration. The decision is therefore whether to
escalate for exploration, not whether a score permits waiting.

This is deliberately a different failure mode from the obstructed-kidney scenario. There, the
diagnosis was already made and the failure was incomplete therapy: antibiotics without drainage.
Here the failure is upstream of therapy, because the diagnosis has not been made and the available
test is structurally incapable of excluding it.

The case is built so the reassuring number arrives **before** the escalation decision, so the
recorded intent is made against the grain of the score.

The evidence supports those distinctions, not this fictional response curve:

- [Fernando et al., *Ann Surg* 2019;269(1):58-65](https://pubmed.ncbi.nlm.nih.gov/29672405/),
  23 studies, 5,982 patients. LRINEC at or above 6: **sensitivity 68.2%**, specificity 84.8%. At or
  above 8: sensitivity 40.8%. Crepitus 25.2%, haemorrhagic bullae 25.2%, hypotension 21.0%, CT
  88.5%. Its stated conclusion is that the score has poor sensitivity and should not be used to
  rule out the diagnosis.
- [WSES and partners, *World J Emerg Surg* 2022;17:3](https://www.ncbi.nlm.nih.gov/pmc/articles/PMC8761341/):
  the score lacks the sensitivity to be a useful adjunct, and a low score does not rule out the
  diagnosis. Debridement at least within the first six hours after admission; re-exploration every
  12 to 24 hours.
- [Nawijn et al., *World J Emerg Surg* 2020;15:4](https://pubmed.ncbi.nlm.nih.gov/31921330/),
  109 studies, 6,051 patients, 21.1% mortality. Surgery within six hours versus later: **odds ratio
  0.43 (95% CI 0.26 to 0.70)**. Patient delay before presentation showed no significant mortality
  effect, while system delay did. No time variable reduced the amputation rate.

## Why the score looks better than it is

The derivation study compared confirmed cases against *selected* severe-cellulitis controls, so its
reported predictive values never faced a real emergency-department population. Predictive value is
also prevalence-dependent, and the score counts late physiology: C-reactive protein at or above 150
contributes a third of the available points, and early disease has not yet produced it. A score
that measures late derangement will be low in exactly the presentation this scenario stages.

One published review reaches the opposite conclusion and calls the score a useful clinical
determinant. It pooled *mean scores in confirmed cases* rather than sensitivity in suspected ones,
which is the same reasoning error the scenario asks the learner not to make.

## Where the numbers come from

Every presenting value sits inside a band that keeps the score low. That is the design.

| Value | Presentation | Score contribution | After progression |
| --- | --- | --- | --- |
| White cells | 14.8 | 0 points, below 15 | 22.1 |
| C-reactive protein | 132 | 0 points, below 150 | 214 |
| Sodium | 136 | 0 points, at or above 135 | 131 |
| Creatinine | 118 µmol/L | 0 points | 176 |
| Glucose | 11.4 mmol/L | 1 point, above 10 | 13.1 |
| Haemoglobin | 12.6 g/dL | 1 point | 11.9 |
| **Derived score** | **3** | below the cutoff of 6 | **11** |
| Lactate | 2.4 | not a score component | 4.6 |
| Temperature | 37.4 | | 38.6 |
| Erythema | at the marked border | | 4 cm beyond it, dusky |

Lactate is deliberately the only frankly abnormal number, and it is not one the score counts.
Crepitus and bullae are absent throughout, because at roughly a quarter and a fifth sensitivity
their absence must never read as reassurance. Temperature is unremarkable at presentation, since a
little over half of confirmed cases are afebrile.

The score reaching 11 after the progression is the point of the case, not a reward: it became
useful only after the interval in which acting on it mattered.

## What is disputed, and stays disputed

**No validated hour threshold exists.** The six-hour figure is a defensible operational target
drawn from observational data, not a validated boundary, and there is no randomised trial. The
pooled estimate is confounded by indication in both directions: obviously fulminant patients reach
theatre fastest and also die most, biasing toward the null, while patients too unstable to operate
on are delayed and die, biasing toward benefit. Immortal-time bias applies too, since a patient
must survive to be operated on. The honest claim is that delay is consistently associated with
death across every study that has looked, and no study shows the reverse.

**Whether the score has any role is contested**, though the consensus is against using it to
exclude rather than against its existence.

## What this scenario cannot teach

Anything intraoperative: the extent of debridement, amputation decisions, the finger test, or
second-look timing. Antimicrobial selection, including the anti-toxin question, which is unsettled
and outside the house style. Imaging interpretation, since ordering imaging is a plausible move that
is explicitly not sufficient and must never delay exploration. Paediatric, obstetric, and
immunocompromised presentations differ enough to need their own scenarios.

The progression is authored and occurs whatever the learner records, because only an operation
treats this and the operation happens after the rehearsal ends. The scenario cannot show whether
exploration would have helped this patient, and it ends with the diagnosis unconfirmed, because
that is the honest state at handoff.
