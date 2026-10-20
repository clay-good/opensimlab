# Implementation plan: framework mapping expansion

## 1. Registry

- [x] Generalise the framework registry out of the anesthesia module into the platform; add
  `appliesTo`, `review_by`, and the verbatim/summarised rule to the record type. The record type
  and its rules live in `src/platform/curriculum/framework-records.ts`; the three anesthesia
  readings import it and stay where their mappings are. Each now carries `recordedOn`, the date
  the reading entered the repository (2026-08-20, from git), and `reviewBy` 24 months later. That
  is when the reading was recorded, not a claim it was re-verified then.
- [ ] Add framework records: ACGME Milestones 2.0 for EM, pediatrics, IM, OB/GYN, neurology;
  AAMC Core EPAs (2014); RCoA 2021 Stage 1 domains and key capabilities; NCSBN CJMM Layer 3;
  NCLEX-RN Test Plan 2026 client-needs categories; USMLE Step 2 CK content outline; Primary FRCA.
  Record issuing body, version, date checked, locator, fidelity.
- [x] Build check: a verbatim item longer than a short name fails; `review_by` ≤ 24 months. `tests/unit/framework-records.test.ts`.

## 2. Scenario mappings

- [ ] Map every scenario in every module to at least one applicable framework; list unmapped by
  name in the curriculum view and fail the build on an unmapped scenario once authoring is done.
- [x] Map every nursing scenario's objectives to NCJMM functions with named evidence; build check.
  `src/modules/medical-surgical-nursing/curriculum.ts` records NCSBN's six step names verbatim
  from the 2026 NCLEX-RN Test Plan (PDF page 8), with this project's own descriptions because the
  document is copyrighted. All 54 objectives map through their leading verb, a stated convention,
  each with its own measure as evidence; an objective the convention cannot place fails the build.
  Evaluate outcomes is honestly not exercised, with the reason: every lesson ends at the decision.
  The mapping shows in each nursing facilitator guide and in each briefing's structured data.
- [ ] Show NCJMM coverage (exercised / evidenced / not exercised) in the nursing debrief; no
  composite; quote the NCSBN scope statement with citation.

## 3. Catalog and exports

- [ ] Add the "preparing for" blueprint filter; URL carries public values only; group by category.
- [x] Lint mapping surfaces for "pass", "score", "readiness" wording; fail the build on a hit.
  `tests/unit/mapping-surfaces.test.ts` checks the curriculum page, the educator page, the
  facilitator guide, and the mapping CSV. It forbids claims about the learner (a score, passing an
  exam, exam or learner readiness) rather than the bare words, because "extubation readiness" and
  "handoff readiness" are states of the fictional patient and appear correctly in the mappings. A
  new surface (the NCJMM debrief, the blueprint filter) joins that list when it exists.
- [x] Extend the CSV export to every framework with its version; test. The export already loops
  over every framework record with a version column; `tests/unit/framework-records.test.ts` now
  holds every record's id and version to it, so a new framework cannot be left out.
- [x] Add `educationalAlignment` to `LearningResource` structured data with the framework as
  target; validate in CI; assert no endorsement wording. Each mapped scenario's briefing carries
  one `AlignmentObject` per mapped domain, typed `teaches` (subject matter, never `assesses` or
  `requires`), with the framework named as the target. `tests/unit/educational-alignment.test.ts`
  forbids endorsement and accreditation claims, while letting a framework keep a name such as
  "Standards for Accreditation of Nurse Anesthesia Programs".

## 4. Statements and governance

- [x] Add the non-endorsement statement beside the not-clinical-time statement on every mapping
  surface and export; route test. Already true of all four surfaces and the adoption pack's
  competency section, which carry `MAPPING_DISCLAIMER`; the same test now holds it.
- [x] List overdue framework records on the governance dashboard with overdue guidelines. A
  "Framework readings" section on `/governance` lists every reading with its re-check date and
  counts the overdue ones, dated by the build so the prerendered page and the client agree.
- [ ] Document each framework's source and date checked in the sources register.
