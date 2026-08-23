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

## Slice 5: perioperative anaphylaxis initial response

- [x] Add a persistent antibiotic-triggered teaching syndrome coupling vasodilation, plasma-only
  capillary leak, and bronchospasm without inventing skin signs or laboratory confirmation.
- [x] Add bounded, logged, replayable 10, 20, and 50 microgram IV epinephrine actions.
- [x] Enforce a documented allergy after a real positive dose of the matching stocked drug.
- [x] Author and register a cefazolin-exposure case with no presumed neuromuscular-blocker culprit.
- [x] Evaluate initial epinephrine, crystalloid, oxygen, ventilation, and observable outcomes.
- [x] Map the scenario to NBCRNA, COA, and ACGME domains.
- [x] Add NAP6 and current RCUK sources; update limitations, face-validity scope, landing inventory,
  and discoverability assets.
- [ ] Add rash, swelling, tryptase, trigger removal, team behavior, arrest, epinephrine infusion,
  a full refractory pathway, or post-event investigation. None is implied by this slice.

## Slice 6: early malignant hyperthermia response

- [x] Add a latent volatile-triggered hypermetabolic teaching model in which carbon dioxide rises
  before tachycardia, observable rigidity, and later temperature.
- [x] Add bounded, logged, replayable fresh-gas flow, exact 2.5 mg/kg IV dantrolene, and
  temperature-bounded active-cooling actions.
- [x] Author and register an induction-to-volatile-maintenance case whose live event does not leak
  hidden susceptibility or diagnosis.
- [x] Evaluate accepted initial response, trigger removal, oxygen, fresh-gas flow, minute
  ventilation, dantrolene timing, and observable response.
- [x] Map the scenario to NBCRNA, COA, and ACGME domains.
- [x] Add current MHAUS and EMHG guidance, Hopkins and Larach evidence, limitations,
  face-validity scope, landing inventory, and discoverability assets.
- [ ] Add succinylcholine or masseter spasm, circuit replacement or charcoal filters, blood gases,
  acidosis, potassium, dysrhythmia treatment, rhabdomyolysis, urine/coagulation monitoring, team
  or hotline actions, intensive care, recurrence, or confirmatory referral. None is implied.

## Slice 7: bounded routine pediatric induction

- [x] Add the age-1-to-12 Paedfusor propofol pharmacokinetic model and select it by default only
  inside that applicability envelope.
- [x] Add a bounded healthy-child respiratory teaching profile derived from age and weight, with
  pediatric metabolic demand, functional residual capacity, dead space, and spontaneous breathing.
- [x] Author and register one healthy 6-year-old, 20 kg intravenous-induction case using only
  propofol from the modeled formulary.
- [x] Evaluate end-tidal preoxygenation, accepted weight-based propofol, 6–8 mL/kg delivered
  ventilation with sustained carbon-dioxide exchange, and the post-induction saturation margin.
- [x] Map the scenario to NBCRNA, COA, and ACGME domains.
- [x] Add Paedfusor and pediatric respiratory sources; update limitations, face-validity scope,
  landing inventory, and discoverability assets.
- [ ] Add validated pediatric depth pharmacodynamics, hemodynamic maturation, pediatric airway-
  device sizing, maintenance, emergence, or generalization beyond this single profile. None is
  implied by this slice.

## Slice 8: difficult-airway supraglottic rescue

- [x] Add a bounded difficult-airway event that configures reproducible failed tracheal attempts
  and a fixed marginal facemask-delivery teaching fraction.
- [x] Add logged, replayable airway-help and supraglottic-airway actions, including a fixed
  15-second insertion interval without assisted ventilation.
- [x] Author and register a can-oxygenate rescue case that does not leak the configured failure in
  the live timeline before the learner encounters it.
- [x] Evaluate end-tidal preoxygenation, accepted attempt limitation, early help escalation,
  supraglottic placement, explicit oxygen delivery, sustained capnography, and saturation.
- [x] Map the scenario to NBCRNA, COA, and ACGME domains.
- [x] Add ASA and DAS source scope; update limitations, face-validity scope, landing inventory,
  and discoverability assets.
- [ ] Add changing facemask technique or seal, oral airways, supraglottic sizing or failure,
  intubation through the device, wake-up or proceed decisions, aspiration, team performance,
  cannot-intubate-cannot-oxygenate progression, or emergency front-of-neck access. None is implied.

## Remaining required scenario families

- [x] Rapid-sequence induction with neuromuscular blockade.
- [x] Difficult-airway rescue beyond the existing obesity case, bounded to supraglottic oxygenation.
- [x] Anaphylaxis with antibiotic exposure and independently tested documented-allergy enforcement.
- [x] Malignant hyperthermia early recognition and initial response.
- [ ] Local-anesthetic systemic toxicity.
- [ ] Resuscitable cardiac arrest.
- [x] Pediatric anesthesia with pediatric pharmacokinetics and a bounded respiratory profile.
- [x] Obstetric presentation: the hemorrhage case is a ruptured ectopic pregnancy.
- [x] Geriatric presentation: hypotension after induction.
- [x] Obesity presentation: rapid desaturation.
- [x] Awareness under paralysis with line disconnection.
