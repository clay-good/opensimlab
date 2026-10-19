# Map every module to the frameworks its learners are assessed against

## Summary

The curriculum map currently declares mappings to the ACGME Anesthesiology Milestones, the
NBCRNA content domains, and the COA standards — the three frameworks the anesthesia module was
built against. Fifteen other modules now ship 217 labs for nursing students, medical students,
and residents in emergency medicine, pediatrics, obstetrics, and critical care, and none of their
scenarios maps to the frameworks those learners are actually assessed against.

This change extends the adoption capability's curriculum mapping to a defined, versioned set of
frameworks covering every module's audience, adds a mapping from nursing scenarios to the NCSBN
Clinical Judgment Measurement Model whose six cognitive functions the simulator already observes
directly, and adds a learner-facing exam-blueprint filter so a student preparing for a specific
examination can find the labs that rehearse its content. Mappings remain data, remain versioned,
remain exportable, and carry a statement that no issuing body has endorsed them.

## Why

- **A program director in pediatrics cannot filter by their milestones.** The curriculum route
  offers three anesthesia frameworks. A nurse educator, an emergency medicine program, or a UK
  anaesthetic trainee under the 2021 RCoA curriculum gets nothing that speaks their language, and
  the coverage CSV an institution needs for its own documentation is empty for their module.
- **The nursing module observes exactly what the NCJMM measures.** NCSBN's Clinical Judgment
  Measurement Model names six cognitive functions — recognize cues, analyze cues, prioritize
  hypotheses, generate solutions, take action, evaluate outcomes — and the Next Generation NCLEX
  tests them in unfolding cases. Every one of those functions is an observable behaviour in a
  running scenario: which observations were opened, which were acted on, in what order, and
  whether the learner reassessed. No other framework in the map fits the engine's evidence this
  closely, and the nursing module ships without it.
- **Students search by exam, not by framework.** A final-year student asks "which of these helps
  me with Step 2" or "with the NCLEX test plan" or "with the Primary FRCA." The test plan and
  content outlines are public documents with named categories. Mapping scenarios to those
  categories is a findability feature the catalog can offer honestly, provided it never implies
  the exam body's endorsement and never promises an outcome.

## What changes

- Extend the framework set to, at minimum: ACGME Milestones 2.0 for emergency medicine,
  pediatrics, internal medicine, obstetrics and gynecology, and neurology; the AAMC Core
  Entrustable Professional Activities for Entering Residency (2014); the RCoA 2021 curriculum
  Stage 1 domains and key capabilities; the NCSBN Clinical Judgment Measurement Model; and the
  NCLEX-RN Test Plan (2026) client-needs categories. Each carries its issuing body, version or
  year, and the existing transcribed-or-summarised fidelity label.
- Require every playable scenario in every module to declare at least one mapping to a framework
  that applies to its declared learner roles, and list the unmapped ones by name.
- Map every nursing scenario's objectives to the six NCJMM functions with the observable evidence
  that satisfies each, and show that mapping in the debrief as coverage, never as a score.
- Add an exam-blueprint filter to the catalog for the NCLEX-RN Test Plan, the USMLE Step 2 CK
  content outline, and the Primary FRCA syllabus, each as public category names with version.
- State on every mapping surface that no accrediting, licensing, or examining body has reviewed
  or endorsed the mapping or the content.

## Explicit non-goals

- No claim that simulator time satisfies any requirement of any body. The existing "Simulator Time
  Is Not Clinical Time" requirement is unchanged and is restated on every mapping surface.
- No reproduction of copyrighted framework text beyond category and capability names needed to
  identify them; detailed descriptors are summarised and labelled as such, as the existing
  fidelity label already provides.
- No scoring against a framework. An NCJMM mapping says which functions a scenario exercised and
  which the learner's run evidenced, never a composite.
- No predicted exam performance, anywhere.

## Success measures

- Every scenario in every module declares at least one applicable framework mapping, and the
  coverage view lists every unmapped scenario by name, verified at build.
- Every nursing scenario maps each objective to at least one NCJMM function with named observable
  evidence, verified at build.
- The curriculum CSV export includes every framework with its version, verified by a test.
- Every mapping surface carries the non-endorsement statement and the not-clinical-time statement,
  verified by a test over the routes.
