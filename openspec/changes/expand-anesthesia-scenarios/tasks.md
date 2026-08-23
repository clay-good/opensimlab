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

## Slice 3: awareness risk under paralysis

- [x] Separate the commanded propofol pump rate from delivered hypnotic during a line failure.
- [x] Add logged, replayable learner inspection and reconnection actions.
- [x] Author and register a 10-minute-or-shorter induction-to-maintenance TIVA scenario.
- [x] Evaluate hypnotic-before-block order, inspection and reconnection timing, and concurrent
  predicted-depth and train-of-four state.
- [x] Map the scenario to NBCRNA, COA, and ACGME domains.
- [x] Add the NAP5 evidence base and state that risk modeling is not consciousness or recall.
- [x] Update limitations, face-validity scope, landing-page inventory, and discoverability assets.
- [ ] Add consciousness, distress, memory, explicit recall, processed EEG, partial line failure,
  pump pressure behavior, or emergence. None is implied by this risk-recognition slice.

## Slice 4: laryngospasm initial response

- [x] Add persistent, bounded upper-airway closure distinct from lower-airway bronchospasm.
- [x] Add a logged, replayable 90-second jaw-thrust/continuous-positive-pressure teaching maneuver;
  the fixed duration is an interaction bound, not a clinical recommendation.
- [x] Require the maneuver, active ventilation, high inspired oxygen, and adequate modeled depth
  for the bounded initial-response trajectory.
- [x] Refuse scripted closure after a tracheal tube has secured the airway.
- [x] Author and register the airway-stimulation scenario without stocking a blocker rescue.
- [x] Evaluate oxygen reserve, initial-action timing, deepening timing, and oxygenation from
  recorded state and actions.
- [x] Map the scenario to NBCRNA, COA, and ACGME domains.
- [x] Add Difficult Airway Society and AIMS sources and update limitations, face-validity scope,
  landing inventory, and discoverability assets.
- [ ] Add suction, separate airway adjuncts, source removal, succinylcholine, a refractory pathway,
  team actions, aspiration, or negative-pressure pulmonary edema. None is implied by this slice.

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
- [x] Awareness under paralysis with line disconnection.
