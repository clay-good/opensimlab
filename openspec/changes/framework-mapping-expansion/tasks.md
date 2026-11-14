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
  **Blocked, and not on the lookups.** Attempted for the AAMC Core EPAs on 2026-11-14 and backed
  out, because the build will not accept a framework this catalogue does not wholly speak to.
  `tests/unit/curriculum.test.ts` holds that *every scenario appears against every framework* -
  "a programme looking at their own framework should see the whole catalogue under it, not a
  subset". That is true and worth keeping for the three readings that exist, because all three
  are anaesthesia frameworks and the anaesthesia catalogue does speak to all of them.
  It stops being true for the frameworks this task asks for next. The AAMC Core EPAs are for
  medical students entering residency, and several of the thirteen - document a clinical
  encounter, give an oral presentation, obtain informed consent, retrieve evidence - are simply
  not exercised anywhere in this simulator. Under the invariant, adding the record forces a
  mapping for all 39 anaesthesia lessons against all 13 activities, which means claiming coverage
  that does not exist. The same will be true of the USMLE Step 2 CK outline, and of ACGME
  Milestones for a specialty whose module is not the one being mapped.
  So the two tasks in this change are one task, and the order is wrong: a record cannot be added
  before its mappings, and its mappings cannot be honest for a framework that applies to only
  part of the catalogue. **The fix is a maintainer's design call, not an authoring one:** make
  applicability structured so the coverage invariant can be scoped by it. `appliesTo` already
  exists on the record and was added by this change's own first task, but it is free text
  ("Student registered nurse anesthetists preparing for certification"), so nothing can read it.
  Give it a machine-readable companion - the modules or the learner stage a framework applies to
  - and the invariant becomes "every scenario appears against every framework that applies to
  it", which is the guarantee the sentence above was always trying to make.
  Two findings from the AAMC lookup are worth keeping whoever does this next, because both came
  from reading the documents rather than assuming, and neither would be caught by reviewing a
  finished record:
  - The locator the AAMC's own 2017 toolkits document prints for itself
    (`aamc.org/initiatives/coreepas/publicationsandpresentations`) returns 404; the body has
    restructured its site. Check every locator resolves before recording it.
  - The AAMC's Competency-Based Medical Education page says the Core EPAs were developed in 2014,
    piloted by ten schools from 2014 to 2021, and that their use "is currently being evaluated in
    light of the release of the Foundational Competencies in 2024". The most obvious framework to
    map a medical catalogue against is one the issuing body has under review, and the 2024
    Foundational Competencies are the better record to add in its place.
  The thirteen activity titles are on the contents page of *Core Entrustable Professional
  Activities for Entering Residency: Toolkits for the 13 Core EPAs* (AAMC, 2017), whose copyright
  page permits reproduction with attribution for educational use. Nothing was committed, so the
  record has to be rebuilt from that document rather than recovered from here.

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
- [x] Show NCJMM coverage (exercised / evidenced / not exercised) in the nursing debrief; no
  composite; quote the NCSBN scope statement with citation. The nursing debrief summary lists all
  six steps with this run's status from its own objective outcomes, with no total, ratio, or rank,
  and Evaluate outcomes always shows its structural reason. It cites the 2026 NCLEX-RN Test Plan
  by link rather than quoting it, because the document's reproduction terms are restrictive, and
  states that the mapping is this project's reading and predicts nothing about an examination.

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
- [ ] Document each framework's source and date checked in the sources register. Done for the
  three frameworks that exist: the COA standards, the ACGME anaesthesiology milestones and the
  NBCRNA outline each carry an entry with what the citation was checked against and when. Each
  further reading brings its own entry with it, and the entry is written when the reading ships,
  not before: a register entry whose `usedFor` describes a framework nothing uses is itself a
  false claim.
