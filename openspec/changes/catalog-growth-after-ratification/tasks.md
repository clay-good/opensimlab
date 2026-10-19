# Implementation plan: catalog growth after ratification

## 1. The floor

- [ ] Add `ratified` to the catalog registry; compute the playable count with no upper bound.
- [ ] Make the gate read `CORRECTIONS.md` for withdrawals; fail on a sub-ratified count without
  an entry; tests for growth, silent shrink, and recorded withdrawal.
- [ ] Reconcile with the multidomain catalog delta: on archive of
  `build-multidomain-practice-catalog`, "exactly 256" becomes "the ratified count as a floor";
  record the reconciliation in that archive step.

## 2. The breadth test

- [ ] Define the module proposal document format and a validator (eight scenario proposals,
  training-value rule, formulary sources, review domains, negative-transfer analysis, status).
- [ ] Wire status to the module registry: planned only with breadth-test-passed and first
  evidence briefs; the landing page reads status from the registry.
- [ ] Register a planned module's review domains with governance coverage.

## 3. Candidates

- [ ] Write proposal documents for prehospital/EMS, office-based procedural sedation, acute care
  of older adults, and psychiatric emergencies with medical physiology, each at status proposed
  with its needs listed; add the "proposed, not planned" section to the About page.

## 4. Computed counts

- [ ] Add the README-table-versus-registry test; assert structured-data counts in CI; audit every
  count surface and replace typed numbers with rendered ones.
