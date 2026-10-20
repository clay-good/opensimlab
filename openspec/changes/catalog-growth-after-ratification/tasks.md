# Implementation plan: catalog growth after ratification

## 1. The floor

- [x] Add `ratified` to the catalog registry; compute the playable count with no upper bound.
  `RATIFIED_SCENARIO_COUNT` in `src/platform/catalog/catalog-growth.ts`. The playable count is
  every scenario in an available module whose maturity is not `withdrawn`, counted by module and
  id together. Building this found that ids are unique per module, not across the catalog:
  `status-epilepticus` is two different lessons, in emergency medicine and critical care, so
  counting bare ids reported 255.
- [x] Make the gate read `CORRECTIONS.md` for withdrawals; fail on a sub-ratified count without
  an entry; tests for growth, silent shrink, and recorded withdrawal. The gate reads the typed
  corrections log, which `tests/unit/corrections.test.ts` already holds in step with
  `CORRECTIONS.md`; an entry withdraws a scenario through its `withdrawal` field. It also blocks
  a recorded withdrawal whose scenario is still playable. `tests/unit/catalog-growth.test.ts`.
- [ ] Reconcile with the multidomain catalog delta: on archive of
  `build-multidomain-practice-catalog`, "exactly 256" becomes "the ratified count as a floor";
  record the reconciliation in that archive step.

## 2. The breadth test

- [x] Define the module proposal document format and a validator (eight scenario proposals,
  training-value rule, formulary sources, review domains, negative-transfer analysis, status).
  `docs/module-proposals/README.md` states the format; `scripts/module-proposals.ts` judges each
  document and refuses any status it has not earned. A scenario proposal counts only with
  Actions, Choices, Consequences, and Debrief lines and when it does not read as a calculator,
  lookup, or checklist answer; a section that says "Not yet written" counts as missing.
- [x] Wire status to the module registry: planned only with breadth-test-passed and first
  evidence briefs; the landing page reads status from the registry. A registry module marked
  planned without a planned proposal fails `tests/unit/module-proposals.test.ts`; the landing
  and About pages already read status from the registry.
- [ ] Register a planned module's review domains with governance coverage. Not yet: no proposal
  is planned, so there is nothing to register, and the governance coverage list has no hook for
  a module that has no scenarios. Build this with the first proposal that earns planned.

## 3. Candidates

- [x] Write proposal documents for prehospital/EMS, office-based procedural sedation, acute care
  of older adults, and psychiatric emergencies with medical physiology, each at status proposed
  with its needs listed; add the "proposed, not planned" section to the About page. Each states
  only what the design states and marks every unwritten section as not yet written, so each
  honestly earns `proposed` and nothing more. About lists them from a typed mirror that the test
  holds in step with the documents.

## 4. Computed counts

- [x] Add the README-table-versus-registry test; assert structured-data counts in CI; audit every
  count surface and replace typed numbers with rendered ones. `tests/unit/readme-counts.test.ts`
  holds every README row against the registry and the real scenario arrays, and the headline
  totals against what the landing page renders. The structured data carries no count; the root
  description, the landing figures, and the module cards already render theirs from the
  registry. An audit of `src/`, the README, and the governance documents found typed scenario
  counts only in code comments that describe history.
