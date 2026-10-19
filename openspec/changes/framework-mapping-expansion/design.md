# Design: frameworks as versioned data

## 1. The framework registry

A framework is a data record, as the existing three are:

```text
{ id, name, body, version | year, appliesTo: learner roles and modules,
  fidelity: 'verbatim' | 'summarised', note, items: [{ id, label, parent? }] }
```

The set this change adds, with what each is for:

| Framework | Body, version | Applies to | Fidelity |
| --- | --- | --- | --- |
| Milestones 2.0: emergency medicine, pediatrics, internal medicine, obstetrics and gynecology, neurology | ACGME, per-specialty publication year | residents in those modules | summarised |
| Core Entrustable Professional Activities for Entering Residency | AAMC, 2014 (13 EPAs) | medical students, every module | verbatim EPA titles |
| 2021 Curriculum for a CCT in Anaesthetics, Stage 1 | RCoA, current version on the RCoA site | anaesthesia trainees in the UK region | summarised domains and key capabilities |
| Clinical Judgment Measurement Model, Layer 3 | NCSBN | nursing module, and any scenario declaring a nursing learner role | verbatim function names |
| NCLEX-RN Test Plan client-needs categories | NCSBN, 2026 (effective April 1, 2026) | nursing learners | verbatim category names |
| USMLE Step 2 CK content outline: systems and physician tasks | NBME/FSMB, current outline | medical students | verbatim category names |
| Primary FRCA syllabus | RCoA, current | anaesthesia trainees | summarised |

"Verbatim" is used only for short identifying names (an EPA title, a client-needs category); any
descriptor longer than a name is summarised and the record says so. This keeps the project inside
the originality rule the open-source-publication capability already imposes.

Each framework record carries a `review_by` date no more than 24 months out, like guideline
content, because frameworks are revised: the NCLEX test plan is reissued every three years and
the RCoA curriculum has already been amended since 2021.

## 2. Applicability

A mapping is only meaningful for a learner the framework describes. Each scenario already declares
supported learner roles; the build requires at least one mapping to a framework whose
`appliesTo` intersects those roles, and reports the scenario as unmapped otherwise. A scenario
with a nursing role and a medical-student role maps to both families.

## 3. The NCJMM mapping

NCSBN's Layer 3 functions are observable here in a way most frameworks are not:

| Function | Observable evidence the engine already records |
| --- | --- |
| Recognize cues | observations opened; alarm acknowledged; trend read before action |
| Analyze cues | cross-check of an independent parameter before treating an artifact; reassessment after a result |
| Prioritize hypotheses | order of observations and actions against the scenario's declared priority; objective-declared evidence |
| Generate solutions | the set of accepted actions considered — only when the scenario declares alternatives |
| Take action | accepted action within its window |
| Evaluate outcomes | reassessment after an action; response to a changed state |

Each nursing objective maps to at least one function and names the evidence. The debrief shows
the six functions as exercised, evidenced, or not exercised for this run, in the same vocabulary
the objectives already use, with no composite. NCSBN's own framing — the model measures the
decision-making of entry-level nurses and neither defines nor redefines clinical judgment — is
quoted on the mapping surface so the product does not claim more than the model does.

## 4. Exam-blueprint filter

The catalog gains a "preparing for" filter whose options are the exam frameworks. Selecting one
filters to scenarios mapped to any of its categories and groups results by category. The filter
state lives in the URL as public values only, like every other catalog filter. The surface
carries the non-endorsement statement and makes no outcome claim; the words "pass", "score", and
"prepare you" do not appear, and a lint asserts it.

## 5. Where the statements live

Two statements appear on every mapping surface: the existing "simulated practice is not clinical
time and satisfies no requirement," and a new one: "No accrediting, licensing, or examining body
has reviewed or endorsed this mapping or this content." Both are asserted by a route test.

## 6. Alternatives considered

- **Mapping only at module level.** Rejected: a program director filters by milestone to find
  scenarios, not modules.
- **A single universal competency vocabulary.** Rejected: the adoption capability already says
  mappings must trace to frameworks a program recognises, not one invented here.
- **Importing the full descriptor text of each framework.** Rejected on originality grounds; names
  identify, summaries describe.
