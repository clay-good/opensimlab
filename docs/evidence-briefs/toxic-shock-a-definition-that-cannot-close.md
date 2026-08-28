# Toxic shock: a definition that cannot close

Content version 0.1.0; infectious-disease preview. Sources checked August 28, 2026.
Independent clinical approval remains pending. Educational simulation, not patient care.

## What the learner must distinguish

A surveillance case definition is not a bedside decision rule. Neither definition that applies here
can close while the patient is in front of you, and they fail for **two different reasons**:

- The staphylococcal definition requires **desquamation one to two weeks after the rash**. That has
  not happened, cannot have happened, and may never happen if the illness aborts or the patient dies
  first, which the definition explicitly accommodates.
- The streptococcal definition requires **isolation of the organism**. The culture has not grown.

The sharp part is what that means for a single pending blood culture. One definition requires those
cultures to be **negative**; the other requires an organism to be **isolated**. So the same pending
result is two mutually exclusive unknowns, and the learner cannot tell which definition they are
failing. No action taken today closes either.

That makes this distinct from the necrotizing-infection lesson, which is a *rule-out* failure whose
resolving action is available now. This is *confirmation deferral*: the learner acts on a pattern,
records that the definition is open and why, names a re-check horizon, and hands over a diagnosis
that is still open.

The evidence supports those distinctions, not this fictional response curve:

- [CDC/CSTE Toxic Shock Syndrome (Other Than Streptococcal), 2011 case definition](https://ndc.services.cdc.gov/case-definitions/toxic-shock-syndrome-2011/):
  fever at or above 38.9 °C; diffuse macular erythroderma; desquamation 1 to 2 weeks after rash
  onset; systolic pressure at or below 90 mmHg; multisystem involvement in **at least 3 of 7** organ
  systems. Laboratory criteria include **negative blood and CSF cultures**, with blood permitted to
  be positive for *S. aureus*. Confirmed requires all five clinical findings including desquamation,
  unless the patient dies before it occurs.
- [CDC/CSTE Streptococcal Toxic Shock Syndrome, 2010 case definition](https://ndc.services.cdc.gov/case-definitions/streptococcal-toxic-shock-syndrome-2010/):
  hypotension plus **at least 2 of** renal impairment, coagulopathy, hepatic involvement, ARDS,
  generalized erythematous macular rash, or soft-tissue necrosis. **Confirmed** requires group A
  *Streptococcus* from a normally sterile site; **probable** from a non-sterile site.
- [WHO Disease Outbreak News, December 15, 2022](https://www.who.int/emergencies/disease-outbreak-news/item/2022-DON429):
  a documented multi-country rise in invasive group A streptococcal infection. It changed alerting
  and contact management; it did **not** change the case definitions, which remain at 2010 and 2011.

## Where the numbers come from

| Value | Presentation | After the authored deterioration | Role |
| --- | --- | --- | --- |
| Temperature | 39.4 | 39.8 | fever criterion met |
| Blood pressure | **88/44** | 82/40 despite fluid | hypotension criterion met |
| Heart rate | 128 | 138 | plausible |
| Erythroderma | present | present | rash criterion met |
| Mucosal hyperaemia | present | present | mucous-membrane criterion |
| Vomiting and diarrhoea | from onset | — | gastrointestinal criterion |
| Creatinine (mg/dL) | **1.9** | **2.4** | above 2× normal, so staphylococcal renal criterion met; **below** the streptococcal 2.0 cut at presentation and above it after |
| Platelets | **118** | **84** | above both cuts at presentation, below 100 after |
| ALT (U/L) | 78 | 140 | hepatic criterion met |
| Creatine kinase (U/L) | 640 | 1,450 | staphylococcal muscular criterion; not a streptococcal criterion |
| Lactate | 3.4 | 4.6 | plausible |
| **Desquamation** | **absent** | **absent** | structurally impossible at this time point |
| **Cultures** | no growth | no growth | uninformative, not negative |

The creatinine is deliberately split: 1.9 mg/dL is above twice the upper limit of normal, satisfying
the staphylococcal renal criterion, while sitting **below** the streptococcal threshold of 2.0. One
number, two different answers. After the deterioration it crosses the second threshold too, and the
platelets cross the shared one, so more criteria are satisfied on both definitions and neither
closes.

Thresholds drawn from the definitions are anchored. Heart rate, lactate, CRP, white cell count, and
the rate of change are clinically plausible.

## What is disputed, and stays disputed

Reported case fatality spans a wide range across published series, so **no single figure is
asserted** anywhere in this scenario. Whether the desquamation criterion has clinical rather than
purely epidemiological utility is genuinely debated. And the persistent misuse of surveillance
definitions as bedside decision rules is exactly the error this lesson targets.

The CDC clinical-guidance page for streptococcal toxic shock **could not be retrieved** at authoring
time, returning HTTP 403 from both the primary host and a mirror. Nothing in this scenario is
sourced from it. The case definitions themselves were read in full from the notifiable-disease
service.

Regional practice differs. The definitions cited are United States surveillance instruments; there
is no equivalent national definition for the staphylococcal form in some other systems, where
notification turns instead on laboratory-confirmed sterile-site isolation. At least one national
definition elsewhere additionally admits non-group-A beta-haemolytic streptococci. Units differ
between regions.

## What this scenario cannot teach

Antimicrobial selection, and in particular the anti-toxin agent and the immunoglobulin question,
whose evidence is contested. Fluid volumes and vasoactive choice. Any of these would be prescribing
decisions, so they are modelled as qualified-team actions in the fixed response rather than learner
selections.

Source control is deliberately **already completed off-stage** by the qualified team before the
rehearsal begins. Removing a retained focus is both a procedure and the lesson of a different
shipped scenario, so keeping it out lets this one carry only the definitional teaching.

It also cannot teach which organism is responsible, whether desquamation will ever occur, or whether
the culture will grow and from where. Those are the unknowns, and handing them over as unknowns,
with the reason recorded and a re-check named, is the point of the exercise.
