# Scenario-library expansion tasks

## Slice 1: unexpected intraoperative hemorrhage

- [x] Add bounded, logged, replayable learner crystalloid actions.
- [x] Model hemoglobin mass through whole-blood loss and crystalloid dilution.
- [x] Add the working fluid tray and revise the unavailable-capability notice.
- [x] Author and register the hemorrhage recognition and temporization scenario.
- [x] Evaluate its objectives from recorded actions and expose them in instructor analysis.
- [x] Map the scenario to NBCRNA, COA, and ACGME domains.
- [x] Update limitations, face-validity scope, and landing-page inventory.
- [ ] Add blood products, coagulation, laboratory guidance, and a traceable massive-transfusion
  protocol. This remains a separate slice and is not implied by the crystalloid implementation.

## Slice 2: rapid-sequence induction

- [x] Add a bounded, logged, replayable rocuronium bolus with a labeled onset and spontaneous-
  recovery teaching model.
- [x] Drive quantitative train-of-four count and ratio from the modeled neuromuscular effect.
- [x] Show train-of-four only when the scenario declares that monitoring and a blocker is active.
- [x] Make laryngoscopy consume simulated time, with ventilation absent during the attempt.
- [x] Author and register a full-stomach rapid-sequence-induction scenario.
- [x] Evaluate preoxygenation, block timing, oxygen margin, and subsequent gas exchange from the
  recorded state and actions.
- [x] Map the scenario to NBCRNA, COA, and ACGME domains.
- [x] Update limitations, face-validity scope, and landing-page inventory.
- [ ] Add reversal, emergence, extubation, aspiration physiology, or cricoid pressure. None is
  implied by the induction-only slice.

## Remaining required scenario families

- [x] Rapid-sequence induction with neuromuscular blockade.
- [ ] Difficult-airway crisis beyond the existing obesity case.
- [ ] Anaphylaxis with allergy enforcement.
- [ ] Malignant hyperthermia.
- [ ] Local-anesthetic systemic toxicity.
- [ ] Resuscitable cardiac arrest.
- [ ] Pediatric anesthesia with pediatric pharmacokinetics and physiology.
- [x] Obstetric presentation: the hemorrhage case is a ruptured ectopic pregnancy.
- [x] Geriatric presentation: hypotension after induction.
- [x] Obesity presentation: rapid desaturation.
- [ ] Awareness under paralysis with line disconnection.
