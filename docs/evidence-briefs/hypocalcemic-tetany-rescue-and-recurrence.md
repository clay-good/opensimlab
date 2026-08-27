# Hypocalcemic tetany: rescue now, prevent recurrence

Content 0.1.0 rehearses monitored rescue, cause-directed continuing care, fresh reassessment,
and active-risk handoff. Relief is not resolution. This fictional postoperative case is a
dose-free state-transition preview, not independently clinically reviewed.

## Clinical boundaries and sources

- [SfE acute hypocalcemia guidance, 2016](https://doi.org/10.1530/EC-16-0056), presentation,
  investigations and severe-hypocalcemia sections: symptoms and rate of decline matter alongside
  the adjusted-calcium threshold of 1.9 mmol/L. Tetany, QT changes, laryngospasm and seizures
  require urgent attention. Monitored IV calcium and cause-directed care are distinct priorities.
- [SfE addendum, 2019](https://doi.org/10.1530/EC-16-0056a): calcium preparations differ in
  elemental content. Dose, concentration, rate, access and equivalence calculations are excluded.
- [ESE hypoparathyroidism guideline, 2025](https://doi.org/10.1093/ejendo/lvaf222), R.1.1,
  R.2.5, R.3.3, R.3.8 and section 5.3: low magnesium interferes with PTH secretion/action;
  ongoing calcium regulation may require activated vitamin D. Early postoperative dysfunction
  is not established chronic disease. Chronic thresholds and follow-up intervals are not acute
  reassessment rules. Evidence for many recommendations is limited and includes expert opinion.
- [DAS/BAETS/ENT-UK consensus, 2021](https://doi.org/10.1111/anae.15585): postoperative airway
  deterioration may signal neck hematoma. It must not automatically be attributed to hypocalcemia.

Sources checked August 27, 2026. Their administration guidance does not validate a symptom-relief,
QT-normalization, magnesium-response, or recurrence timer. The selected calcium action includes
qualified ECG monitoring and proceeds without waiting for the risk, cause, or support buttons.
Magnesium and continuing-care choices require review of supplied findings, not new laboratory
testing or magnesium normalization before calcium.

## Fictional defaults and clocks

The authored patient is a 46-year-old woman, 165 cm and 68 kg, on postoperative day 1 after total
thyroidectomy. She has painful carpopedal spasm and perioral tingling, a patent airway and no
supplied neck hematoma. Initial BP is 112/68 mmHg, MAP 83, HR 98/min, RR 20/min, SpO2 98%,
temperature 36.8°C, adjusted calcium 6.6 mg/dL (about 1.65 mmol/L), and supplied QTc 520 ms.
QTc is a fixed report, never a calculation from the monitor waveform.

Opening the cause panel reveals authored magnesium 0.45 mmol/L, PTH 4 pg/mL (supplied assay
reference 15 to 65), phosphate 5.4 mg/dL (reference 2.5 to 4.5), and creatinine 0.9 mg/dL with
preserved renal function. These are fictional findings and illustrative local assay ranges,
not universal diagnostic cutoffs. No magnesium, PTH, renal, or QT normalization is modeled.

The five-minute missing-rescue branch changes HR/RR to 110/24 while calcium stays 6.6. After
15 minutes of accepted calcium rescue, the initial-relief state is HR/RR 90/18 and calcium 7.0.
At 45 minutes after rescue, absent magnesium or continuing care selects an authored recurrence:
HR/RR 106/22 and calcium 6.7. Sixty minutes after all six care elements are active, the partial
checkpoint is HR/RR 86/18 and calcium 7.2. BP, MAP, SpO2 and temperature remain fixed throughout.
All calcium values use mg/dL; all response magnitudes and intervals are authored contrasts.

No rescue by 30 minutes ends in instructor takeover; any unfinished path stops at 180 minutes.
Neither predicts catastrophe or a safe treatment delay. Ordinary reassessment remains available;
stored observations stay historical until another is requested. Metadata estimates 60 simulated
minutes for prompt complete care, not the maximum session length or real-time reading duration.
Full observation credit requires separate early and later observations. Complete care with a
fresh later assessment permits handoff even if the early observation was missed; that missed
learning evidence does not create an artificial barrier to appropriate continuing care.

## Hazards, verification and remaining work

The model retains oral-only, laboratory-delay, magnesium-delay and stop-after-relief mistakes
after correction. A source-informed handoff still requires ongoing symptom, cardiac, calcium,
magnesium, phosphate, renal and vitamin D review. No airway procedure, seizure treatment,
calcium prescription, chronic diagnosis, discharge clearance or individual outcome is assessed.
Unused generic physiology settings, including baseline blood volume 4,400 mL, stroke volume
70 mL, hemoglobin 12.5 g/dL, arterial stiffness and baroreflex gain 1, ASA 3 and airway difficulty
0.1, support schema compatibility only. Inactive manual ventilation supplies FiO2 0.21,
tidal volume 450 mL, rate 20/min and fresh gas flow 10 L/min without delivering ventilation;
they do not generate this model's authored changes or establish delivered respiratory treatment.

Seed 4906 binds expert, common-error, recovery and no-action fixtures to this version. Recovery
observes recurrence before correcting magnesium and continuing care. Local tests cover real
engine replay, retained mistakes, both observation phases, five debrief objectives, action
isolation, and a nine-decision learner-paced example. A recurrence-first observation never claims
observed early relief; one late assessment cannot earn both phases. Reading time is not patient time.

Local browser inspection verified the centered desktop report dialog, 160-character limit,
disabled unconfigured-host submission, explicit first example decision, and paused takeover.
Takeover now focuses the stable Play control instead of the removed example button. A 320 × 568
iframe check verified the compact cockpit, action-panel entry, and centered scrolling report form
with a reachable 44 px Cancel button and no document-level horizontal overflow. This is a narrow
layout check, not a native phone, screen-reader, or full keyboard certification. Temporary browser
fixtures, tabs, and the preview server were removed; no production report was submitted.

The evidence matrix keeps independent clinical review, full inclusive-runtime verification and
production Turnstile/D1 submission pending. Separate version-bound quality records for training
value, authored defaults and hazards also remain missing; this brief does not satisfy those gates.
Local tests and browser checks are recorded separately in the implementation task log and do not
replace independent review. Reporting follows the shared
160-character note and opt-in bounded context pattern; hidden cause findings must not leak.
