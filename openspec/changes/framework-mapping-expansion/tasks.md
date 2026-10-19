# Implementation plan: framework mapping expansion

## 1. Registry

- [ ] Generalise the framework registry out of the anesthesia module into the platform; add
  `appliesTo`, `review_by`, and the verbatim/summarised rule to the record type.
- [ ] Add framework records: ACGME Milestones 2.0 for EM, pediatrics, IM, OB/GYN, neurology;
  AAMC Core EPAs (2014); RCoA 2021 Stage 1 domains and key capabilities; NCSBN CJMM Layer 3;
  NCLEX-RN Test Plan 2026 client-needs categories; USMLE Step 2 CK content outline; Primary FRCA.
  Record issuing body, version, date checked, locator, fidelity.
- [ ] Build check: a verbatim item longer than a short name fails; `review_by` ≤ 24 months.

## 2. Scenario mappings

- [ ] Map every scenario in every module to at least one applicable framework; list unmapped by
  name in the curriculum view and fail the build on an unmapped scenario once authoring is done.
- [ ] Map every nursing scenario's objectives to NCJMM functions with named evidence; build check.
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
- [ ] Extend the CSV export to every framework with its version; test.
- [ ] Add `educationalAlignment` to `LearningResource` structured data with the framework as
  target; validate in CI; assert no endorsement wording.

## 4. Statements and governance

- [x] Add the non-endorsement statement beside the not-clinical-time statement on every mapping
  surface and export; route test. Already true of all four surfaces and the adoption pack's
  competency section, which carry `MAPPING_DISCLAIMER`; the same test now holds it.
- [ ] List overdue framework records on the governance dashboard with overdue guidelines.
- [ ] Document each framework's source and date checked in the sources register.
