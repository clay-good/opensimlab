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
  **One of the seven is done: the AAMC Core EPAs**, in `src/platform/curriculum/aamc-core-epas.ts`,
  with all 39 anaesthesia lessons mapped to it. It is the first reading that lives in the platform
  rather than a specialty module, because unlike the three anaesthesia readings it belongs to no
  specialty - the AAMC's claim is that every entering resident performs these "regardless of
  specialty choice".
  This was recorded as blocked earlier in the same session, and that was a misreading worth
  recording so nobody repeats it. `tests/unit/curriculum.test.ts` requires every scenario to
  appear against every framework, and I read that as every scenario against every DOMAIN, which
  would have forced claiming coverage that does not exist. It requires each scenario to map to at
  least ONE domain, which is a different and entirely satisfiable thing.
  Five of the thirteen activities are mapped by nothing, and that is the honest result rather than
  a gap: this simulator takes no history, writes no note, gives no oral presentation, retrieves no
  evidence and takes no consent. The mapping CSV already names an uncovered domain by name, and
  `tests/unit/aamc-core-epas.test.ts` pins those five, so a later mapping cannot quietly claim one.
  It also pins the thirteen titles verbatim, because the value of a mapping is that a programme
  director recognises the domains as the ones in their own document.
  The titles are transcribed from the contents page of the AAMC's 2017 toolkits document, read
  directly rather than from a summary, and the sources register carries the document with what it
  was checked against. Two findings from that lookup, both from reading rather than assuming:
  - The locator the document prints for itself
    (`aamc.org/initiatives/coreepas/publicationsandpresentations`) returns 404; the body has
    restructured its site. Check every locator resolves before recording it.
  - The AAMC's own Competency-Based Medical Education page says the Core EPAs were developed in
    2014, piloted by ten schools from 2014 to 2021, and that their use "is currently being
    evaluated in light of the release of the Foundational Competencies in 2024". So the framework
    is one its issuing body has under review; the record's note says so, and the 2024 Foundational
    Competencies are the better next record to add.
  The record is marked `summarised` although its labels are exact, because six of the thirteen
  titles are longer than the shared verbatim-label limit and the descriptions are this project's
  words. Under-claiming fidelity is the safe direction, and the note carries the truth.
  A new body's URL also has to join `documentationHosts` in `tests/arch/boundaries.test.ts`, which
  is the gate that caught this one.
  **Two of the seven are now done.** The ACGME's Emergency Medicine Milestones joined next, in
  `src/platform/curriculum/acgme-emergency-medicine.ts`, with all 25 emergency medicine lessons
  mapped to it. Reading the document rather than recalling it decided the shape of the record: its
  second page says the Milestones "are designed only for use in evaluation of residents in the
  context of their participation in ACGME-accredited residency programs" and are not "designed to
  be relevant in any other context". A simulator is another context. So the reading carries that
  sentence wherever it is shown, claims subject-matter overlap and nothing else, and omits the five
  level descriptors entirely - a lesson cannot place a learner on a developmental scale, and
  recording the levels would have invited exactly that reading. A test holds both the statement and
  the absence of levels.
  Eight of the twenty-two subcompetencies are mapped by nothing, each with its reason recorded next
  to it: no lesson runs a quality-improvement project, works a health system's constraints,
  appraises published evidence, reflects on the learner's own growth, tests professional behaviour,
  accountability or well-being, or holds a conversation with a patient or a family. The set is
  pinned in both directions.
  **Three of the seven.** The ACGME's Pediatrics Milestones followed, with all 16 paediatric
  lessons mapped. Reading that document found the thing worth knowing before mapping a third
  specialty: the scope statement and the educational-use permission are word for word the emergency
  medicine ones, but the DIVISIONS are not. Paediatrics separates history from physical
  examination, coordination of care from transitions in care, and professional behaviour from
  ethical principles, where emergency medicine separates none of the three. So a reading cannot be
  copied from its neighbour and relabelled: the paediatric lessons' authored shape - reconcile,
  recognise, hand to a qualified team, hold threads open, look again, hand over - lands in six
  different subcompetencies here, and the convention is written against that shape.
  Eight of its twenty-two are mapped by nothing, and it is a different eight: professional
  behaviour and accountability are uncovered here as in emergency medicine, but ethical principles
  IS covered, by the two safeguarding objectives that turn on what may be concluded and what may be
  shared. Nine objectives name the caregiver as part of the work and carry the family-communication
  subcompetency; they are listed by name rather than inferred from the module's subject.
  **Four of the seven.** The ACGME's Neurology Milestones followed, with all 15 neurology lessons
  mapped. This is the finest division of the three: twenty-seven subcompetencies, with
  neuroimaging, EEG, nerve conduction and the lumbar puncture given one each, and management split
  between outpatient, inpatient and emergencies. Two rules fall straight out of that and are held
  as tests rather than left to care: a procedure subcompetency is claimed only where an objective
  names the procedure - so nerve conduction stays uncovered, because the Guillain-Barre and
  myasthenia lessons stop at supplied supportive evidence - and no lesson claims outpatient
  management, because all fifteen are declared ward lessons. Nine of the twenty-seven are
  uncovered, including determination of death by neurologic criteria, which no lesson reaches and
  none would be a defensible place to practise.
  **Five of the seven.** The ACGME's Obstetrics and Gynecology Milestones followed, with all 15
  obstetrics lessons mapped. This reading is the one where the honest result is a gap: thirty-two
  subcompetencies, sixteen covered and sixteen not, and the uncovered half is almost entirely
  gynaecology - endoscopy, laparoscopy, open surgery, family planning, ambulatory care,
  first-trimester bleeding. The module is obstetric emergencies. Rather than leave a reader to
  discover that in the coverage table, the record's own note says it, and a test holds the count.
  The document separates the antepartum, intrapartum and postpartum periods into three
  subcompetencies, so each lesson is assigned its period by its own words rather than inferred,
  and a test holds that every lesson carries exactly one: carrying the wrong one would be a claim
  about when the emergency happened.
  **Six of the seven, and the one that covers the most ground.** The ACGME's Internal Medicine
  Milestones are now recorded, with cardiology mapped to them. This reading is shared rather than
  per-module on purpose: eight modules - cardiology, respiratory medicine, renal and electrolyte,
  endocrine and metabolic, infectious disease, oncology, critical care and toxicology - are
  internal medicine by subject, and a programme assesses against that document rather than against
  eight subspecialty readings this project invented. Each of those modules joins the same reading
  as its mapping is authored; cardiology is the first.
  Two findings from reading it. Its well-being subcompetency carries an asterisk whose footnote
  says the subcompetency "is not intended to evaluate a resident's well-being", so the label omits
  the marker and the description carries the point - dropping the marker silently would have
  changed what the title claims. And it separates inpatient from outpatient management, which
  makes each lesson's DECLARED ENVIRONMENT the deciding fact rather than the module's subject:
  sixteen cardiology lessons are declared `clinic` and one `icu`, and a test holds the mapping to
  that. The same question will decide the other seven modules differently.
  A guard worth recording: the generator that writes these mappings refuses an objective whose
  prefix the convention does not place. Running it over respiratory medicine and critical care
  stopped on `coordinate-` and `calculate-`, which is the evidence that a module's convention is
  authored rather than copied.
  Respiratory medicine joined the internal medicine reading next, and answered the setting question
  the other way: all fifteen of its lessons are declared `icu`, so a lesson that directs care
  directs it inpatient and none claims outpatient, where sixteen of cardiology's seventeen claimed
  outpatient from the same reading. Its convention needed four additions, which is what the
  generator's refusal was pointing at: `coordinate-` an onward plan is navigation and a
  conversation with the patient rather than outpatient care; `corroborate-` a signal while
  supporting the patient is examination acted on at once; `select-` a support mode is therapeutic
  knowledge; and `escalate-` behaves as `activate-` does.
  One finding worth keeping: eight of the fifteen lessons direct no care at all. They reconcile,
  review, coordinate and hand over, which is what a module of reassessment lessons does, so none
  of the eight carries a management subcompetency - giving one to a lesson that changes nothing
  would claim the learner changed it. The eight are named in the test, so a later management
  objective cannot join them silently.
  Critical care joined next: 24 lessons, all `icu`, the largest module in the catalogue and the one
  with the most varied objectives - twenty-five distinct leading verbs against cardiology's
  thirteen. Each addition to the convention exists because an objective would otherwise have gone
  unplaced, and the generator refusing them one at a time is what made that visible.
  The finding here is an absence: no lesson in intensive care communicates with a patient or a
  family, because every patient in the module is sedated, intubated or unresponsive. That is a
  fact about the setting rather than an oversight, so the uncovered reason says it and a test
  holds it - otherwise it reads as the one gap a reader would assume somebody forgot.
  Infectious disease (10), oncology (11) and toxicology (15) followed together, because their
  objectives already fit the convention cardiology established and the only new question was the
  setting. Two of the three are declared `emergency-department`, which the reading has no
  subcompetency for: it divides management into inpatient and outpatient only. That is resolved to
  inpatient rather than left blank, because an emergency encounter is not clinic care and the
  inpatient descriptors speak of acuity and of patients requiring critical care - and the
  resolution is recorded as the uncovered reason for outpatient, so it cannot read as an accident.
  Oncology is the mirror: eleven clinic lessons, outpatient throughout, and two absences that
  would read as oversights without their reasons. No objective there examines the patient and none
  carries a safety bound, because these are reasoning lessons about what a number, a scan or a
  label does and does not settle, and the harm they teach is a conclusion drawn too early.
  Renal and electrolyte (12) and endocrine and metabolic (12) finished the internal medicine set,
  and they are the two that needed per-objective authoring rather than a prefix rule. Renal names
  every objective after its ROLE in the lesson - `renal-hyperkalemia-protection`,
  `renal-estimate-precision` - so the convention is written against those roles, and endocrine
  names half its lessons one way and half the other, so both shapes are placed and an id matching
  neither fails the build.
  Renal turned out to be the only module in the catalogue that reaches evidence-based and informed
  practice, and it reaches it from exactly two objectives: the phosphate lesson's randomised
  comparison and the contrast lesson's separation of what a controlled comparison shows from what
  a before-and-after rise shows. Every other module records that subcompetency as uncovered. A
  test pins those two objectives by name, because a third one appearing would be a claim that
  somebody should have to make deliberately.
- [x] Build check: a verbatim item longer than a short name fails; `review_by` ≤ 24 months. `tests/unit/framework-records.test.ts`.

## 2. Scenario mappings

- [x] Map every scenario in every module to at least one applicable framework; list unmapped by
  name in the curriculum view and fail the build on an unmapped scenario once authoring is done.
  **Done: all sixteen modules, all 256 lessons.** Neonatology took the ACGME's Neonatal-Perinatal
  Medicine Milestones rather than the paediatrics set, because a programme assessing neonatal
  fellows uses that document and the paediatrics milestones contain no emergency stabilization of
  a newborn; surgery and trauma took the Surgery Milestones. Two findings from those last two
  readings, both recorded as uncovered reasons rather than quietly resolved: the neonatal reading
  separates family-centred communication from complex communication around serious news, and these
  lessons keep parents present and informed without ever asking a learner to deliver serious news;
  and three of the surgery reading's eighteen subcompetencies are about operating, two of which a
  screen-based lesson cannot touch at all.
  The gate this line asks for now exists and is catalogue-wide:
  `tests/unit/catalogue-mapping-gate.test.ts` fails the build on any unmapped lesson in any
  module, holds that every available module carries a mapping, and holds that every mapped domain
  resolves against a reading this build ships. Nursing reaches the same gate by its own mechanism:
  its mapping is derived from each objective's leading verb, and the convention throws on an
  objective it cannot place.
  Sixteen of sixteen modules are mapped: anaesthesia to all four of its readings, nursing to the
  NCJMM through its verb convention, emergency medicine, paediatrics, neurology and obstetrics
  each to their own ACGME milestone set, and cardiology and respiratory medicine to the internal
  medicine one, and critical care, infectious disease, oncology, toxicology, renal and
  electrolyte, and endocrine and metabolic to it as well, neonatology to the neonatal-perinatal
  set, and surgery and trauma to the surgery set - 256 of 256 lessons. Counting those needed a fix
  worth recording: the README count keyed on scenario id alone, and emergency medicine and
  critical care each ship a lesson called `status-epilepticus`, so the catalogue reported one
  mapped lesson fewer than it had. It keys on module and id now.
  Each module after the first touched only the five wiring points the generalisation
  established, which is the evidence that it worked. What remains incomplete is the other
  direction, and it is not authoring: most of what each framework contains is touched by no lesson
  here, and every uncovered domain carries the reason it is uncovered rather than a promise.
  What changed with emergency medicine is that the machinery is no longer anaesthesia's. The four
  functions that compute coverage, unmapped lessons, dangling mappings and the CSV now take their
  data as arguments and live in `src/platform/curriculum/mapping.ts`; the anaesthesia module keeps
  its public API by delegating to them. The curriculum view gained a module chooser before its
  framework chooser, because a reading belongs to a module and offering EM subcompetencies over an
  anaesthesia lesson list would read as a claim that one maps to the other. The facilitator guide
  and the briefing's structured data ask one shared lookup instead of naming anaesthesia, so the
  25 EM guides fill their framework section and the 25 EM briefings carry their alignment without
  either file learning about a second module.
  Every mapped module also has its own test holding that no lesson is unmapped and that every
  objective is placed at least once, so a failure names the module as well as the lesson.
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

- [x] Add the "preparing for" blueprint filter; URL carries public values only; group by category.
  `/preparing-for` offers the examination readings that exist - the NBCRNA content outline and the
  NCSBN clinical judgment model - and nothing else. That exclusion is the design, not a gap waiting
  on task 1: the COA standards, the ACGME milestones and the AAMC EPAs describe a programme or a
  trainee rather than a paper anybody sits, and offering them under "preparing for" would
  misdescribe both. A test names all three and fails if one appears. The USMLE, FRCA and NCLEX
  client-needs readings the capability also asks for join by being added to `BLUEPRINTS`; no surface
  changes when they do.
  The URL carries two identifiers and nothing else, both drawn from the records, and reading one
  back accepts only an identifier a record defines - a category belonging to a different blueprint
  falls back to "every category" rather than reaching the page. Defaults never appear, so a shared
  link stays short.
  Two things found in the building, both worth keeping:
  - The wording lint could not be pointed at this surface as written. Its bare `score` rule fires on
    the nursing lesson *A low score: what the threshold does not exclude*, which is a deterioration
    score nobody acted on, and its `examination readiness` rule fires on the NCSBN record's own note
    saying the mapping "says nothing about examination readiness". A gate that forbids the
    disclaimer the requirement demands is backwards. Each pattern now carries its own learner
    context, and a match preceded by a negation in the same sentence is not a claim. The NCJMM
    surface's denial is pinned as a test, so the negation rule cannot rot untested.
  - The selected view is linted per blueprint, not once: the framework's own note and every mapped
    lesson title only reach the page after a learner chooses, which is exactly where the two rules
    above would have fired.
  A category with no lesson stays on the page with its reason - Evaluate outcomes carries the
  nursing module's structural one, that every lesson ends at the decision - for the same reason the
  curriculum table keeps its uncovered domains.
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
- [x] Document each framework's source and date checked in the sources register. All five readings
  now carry an entry: the COA standards, the ACGME anaesthesiology milestones, the NBCRNA outline,
  the AAMC Core EPAs, and - new here - the 2026 NCLEX-RN Test Plan behind the NCSBN clinical
  judgment reading. That last one is why this line is no longer "done for the frameworks that
  exist": the nursing mapping shipped, the blueprint filter started citing it, and nothing noticed
  the register had no entry for it. The rule that an entry ships with its reading only works if
  something checks, so `tests/unit/framework-records.test.ts` now pairs every reading with its
  register id, exhaustively in both directions, and fails if a reading is uncited or an entry
  outlives its reading.
  The document was read rather than recalled, and reading it found three things:
  - Its permission statement allows a nonprofit educational reproduction and requires material
    incorporating one to carry "Portions copyrighted by the National Council of State Boards of
    Nursing, Inc. All rights reserved." This project reproduces the six step names verbatim, so
    the record now carries that credit and a test holds it there.
  - The document never writes "Clinical Judgment Measurement Model" or "layer". That designation
    comes from NCSBN's own model publications, which this reading does not cite, so the register
    says the step names are sourced and the layer-3 label is not.
  - It presents clinical judgment as one of six integrated processes rather than as a scoring
    scheme, which is the framing the mapping surfaces already keep.
