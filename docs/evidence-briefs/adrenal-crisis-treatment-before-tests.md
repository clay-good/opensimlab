# Adrenal crisis: treatment before tests

Content 0.1.0 rehearses urgent combined rescue, reassessment, and continuity in a fictional
46-year-old with known primary adrenal insufficiency and persistent vomiting. It is a preview,
not clinically reviewed, and does not establish dosing or procedural competence.

## Clinical basis

- [Endocrine Society, 2016, recommendations 1.1–1.3 and 4.1–4.6](https://www.endocrine.org/clinical-practice-guidelines/primary-adrenal-insufficiency): urgent parenteral hydrocortisone before diagnostic results; fluid support; emergency identification, supplies, and education.
- [Society for Endocrinology, adrenal crisis](https://www.endocrinology.org/clinical-practice/clinical-guidance/adrenal-crisis/): diagnostic work must not delay treatment; vomiting and illness can interrupt adequate replacement.
- [NICE NG243, sections 1.6–1.7](https://www.nice.org.uk/guidance/ng243): whole-patient recognition, ongoing steroid coverage, individualized fluid care, and repeated hemodynamic, electrolyte, and glucose assessment.

Sources checked August 26, 2026. This is primary adrenal failure, not a model of chronic
prednisone withdrawal. Hyperkalemia is compatible with this phenotype but is not a prerequisite
for rescue. Infection and other shock causes remain open; improvement does not prove the cause.

## Authored assumptions

| State | BP, mmHg | HR, bpm | Meaning |
| --- | --- | --- | --- |
| Presentation | 78/44 | 124 | Shock, vomiting, weakness, and drowsiness |
| Incomplete rescue at 5 simulated minutes | 68/38 | 132 | No fluid pathway; steroid alone is insufficient |
| Fluid-only partial response | 82/48 | 120 | Persistent shock without steroid replacement |
| 10 minutes after both pathways start | 102/60 | 100 | More alert, still unwell; reassessment required |

These values and times are authored contrasts, not estimated treatment kinetics, guideline
thresholds, or safe waiting intervals. Initial sodium 126 mmol/L, potassium 5.7 mmol/L, and
glucose 96 mg/dL are revealed with the medication record and remain labeled initial results.
No laboratory correction curve or normalization is implied. At 30 simulated minutes with
incomplete combined rescue, instructor takeover ends the branch without predicting an injury.

## Verification and limits

Expert, common-error, and recovery fixtures use seed 4902 and bind to this exact content version.
Tests exercise urgent treatment before history or support acknowledgment, both treatment orders,
partial care, exact clock boundaries, stale observations, continued monitoring needs, refusal of
oral-only care and injected dosing, ended branches, and preservation of early errors after rescue.
Real-engine replay hashes physiology, adrenal state, and events across all guidance levels.

Five source-linked tutor rules read observed state. Quiet in-tray text remains available during
alarms; it neither opens a floating card nor makes a live announcement. Unassisted hides it.
Opening its source pauses the patient before navigation, matching the existing tutor behavior.
Late diagnostic-delay or oral-only actions are refused after parenteral treatment starts, so
replay cannot invent an earlier mistake. The shared report service retains exact-version evidence.
Opt-in report context prioritizes whitelisted adrenal state within the existing 32-equipment-field
limit; free-text feedback, alertness prose, and unreviewed medication contents are excluded.

Desktop browser checks on August 27, 2026 confirmed treatment before record review, timed
improvement, a required fresh reassessment, and ongoing-care handoff. The inline source link
paused the clock. The centered live report dialog capped text at 160 characters and previewed
the bounded opt-in context; sending stayed disabled on localhost and no report was submitted.
The debrief names emergency care rather than anesthesia, and the menu omits the unused floating
tutor introduction for this inline-guidance lesson.

Final verification: `npm run ci` passed 30 specs and 3,300 tests across 442 files, including
21 adrenal-specific tests; lint, type checks, static-host, asset, font, and bundle checks passed.
`npm run build:indexable` verified 217 crawlable routes. Development builds still report the
outstanding publication gates; these checks are not clinical approval or a reviewed release.

Clinical review, an in-product worked example, complete inclusive-runtime evidence, and
four-surface reporting verification remain pending. Catalog registration is not full completion.
