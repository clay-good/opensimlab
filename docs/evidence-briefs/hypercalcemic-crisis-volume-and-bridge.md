# Hypercalcemic crisis: restore volume, bridge the delay

Content 0.1.0 rehearses severe hypercalcemia of malignancy (HCM) in a fictional woman with
metastatic breast cancer, dehydration, HFpEF, and CKD stage 3b. The priorities are tailored
hydration, a short calcitonin bridge, renal-informed antiresorptive care, fresh reassessment,
and continuing-care handoff. This preview has no independent clinical signoff.

## Source boundaries

Sources were checked August 27, 2026. The [Society for Endocrinology 2016 emergency guidance](https://pmc.ncbi.nlm.nih.gov/articles/PMC5314807/)
was read in full through the official NCBI EFetch endpoint. It supports urgent assessment,
rehydration with overload surveillance, renal-aware bisphosphonate use, and specialist
escalation. It does not support routine calcium-lowering diuresis. Its bisphosphonate calcium
nadir is described over two to four days, not minutes.

The [Endocrine Society guideline, published in the March 2023 issue](https://www.endocrine.org/clinical-practice-guidelines/hypercalcemia)
supplies the newer malignancy-specific pathway. Recommendation 3 conditionally suggests
calcitonin plus an IV bisphosphonate or denosumab for severe HCM above 14 mg/dL, with very
low-certainty evidence. Calcitonin is limited to 48–72 hours because its effect wanes.
Denosumab is not universally mandatory; other hypercalcemia causes require different care.

The full publisher [treatment table](https://academic.oup.com/view-large/400290212) lists
calcitonin onset at four to six hours, IV bisphosphonates at 48–72 hours, and denosumab at
three to ten days. These are clinical reference ranges, not this patient's predicted response.
The [good-practice table](https://academic.oup.com/view-large/400290223) supports cardiac-tailored
hydration, renal assessment before IV bisphosphonates, and ongoing mineral, vitamin D,
oral-health, and oncology review. The main publisher article endpoint was unavailable;
issuing-body recommendations and both complete publisher tables were verified directly.

## Authored patient and clocks

The profile is age 61, female, 165 cm, 68 kg, ASA 4, with poor intake, thirst, nausea, and
confusion. Expected duration is 240 simulated minutes, about four minutes of observation at
60× plus learner-paced reading and decisions; the six-hour teaching stop bounds unfinished runs.
Adjusted calcium is supplied as 16.4 mg/dL; creatinine is 2.2 mg/dL versus baseline
1.4. No albumin correction, eGFR calculation, PTH, magnesium, phosphate, or vitamin D result
is generated. The unspecified oncology regimen requires qualified medication review.

Initial BP is 96/60 mmHg, MAP 72, HR 108/min, RR 20/min, SpO2 96%, and temperature 36.8°C.
Fifteen authored minutes after tailored hydration, BP is 106/64, MAP 78, HR 96, and RR 18.
The supplied observation has no new overload signs but monitoring continues. Calcium remains
16.4 in this teaching contrast, although hydration can lower calcium clinically.

Four authored hours after calcitonin, calcium becomes 14.8 mg/dL independently of hydration
or antiresorptive acceptance. SpO2 and temperature stay fixed; confusion and severe disease
persist. Antiresorptive effect, durable recovery, renal recovery, and cancer response are not
modeled. No drug dose, fluid volume, rate, or procedure is taught.

Missing hydration or calcitonin at 15 minutes leaves a retained omission flag, not fabricated
worse vital signs. Missing either at 30 minutes ends in instructor takeover. Any unfinished
path stops at six hours. Every clock and patient-state magnitude is authored, even where a
clock falls within a published onset range. None is permission to wait without reassessment.

Schema-only defaults are stroke volume 55 mL, hemoglobin 11.5 g/dL, blood volume 4,200 mL,
arterial stiffness and baroreflex gain 1, and fixed stroke volume. The healthy respiratory
profile, airway difficulty 0.1, and unused manual ventilator defaults (FiO2 0.21, tidal volume
450 mL, rate 20/min, fresh gas 10 L/min, delivery off) are scaffolding, not measured findings
or evidence of delivered treatment.

## Decision and verification record

Tailored hydration includes immediate volume assessment and is independent of the review
button. Antiresorptive selection requires supplied cardiorenal review, not new laboratory
results or completed rehydration. Unrestricted fluids and routine diuresis are refused;
cause-delay evidence survives correction. A fresh observation is required for each response,
although one late assessment can observe both. Old observations never update automatically.

Handoff requires all five care pathways and observed fluid and bridge responses. It transfers
serial calcium, volume, kidney, magnesium, phosphate, vitamin D, and treatment-safety review;
the short bridge limit; delayed antiresorptive response; and oncology ownership. Oliguria or
congestion warrants qualified renal and critical-care reassessment, not automatic dialysis.

| Evidence | Status for content 0.1.0 |
| --- | --- |
| Primary sources | Verified as described above; no independent signoff |
| Reference paths | Expert, commonError, recovery, noAction; fixed seed 4905 |
| Model and engine | 24 model and nine real-engine tests pass, including whole-tick four-hour replay hashes and the six-hour boundary |
| Tutor and example | Exact-version observed-state guidance; eight learner-paced decisions |
| Inclusive runtime | Full keyboard, screen-reader, zoom, color, offline, and performance gates pending |
| Problem reports | Shared 160-character pattern; inclusive surface and production Turnstile/D1 gates pending |

Local checks include the real-session eight-decision worked example, nine report-surface tests,
keyboard and spoken-state checks, and production-browser inspection at desktop and 320 px.
Full CI passes 3,599 tests across 464 files; type, lint, static-host, and bundle-budget checks pass.
The desktop report dialog centers, limits a 170-character paste to 160, preserves the reading
pause, and restores focus. Narrow action and report surfaces wrap and scroll. These checks do
not establish assistive-technology conformance or successful production report delivery.

Completion binds the exact scenario document, fixture content, and capability version.
Development checks do not approve the missing clinical, inclusive-runtime, or production-report gates.
