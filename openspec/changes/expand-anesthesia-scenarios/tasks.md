# Scenario-library expansion tasks

## Slice 1: unexpected intraoperative hemorrhage

- [x] Add bounded, logged, replayable learner crystalloid actions.
- [x] Model hemoglobin mass through whole-blood loss and crystalloid dilution.
- [x] Add the working fluid tray and revise the unavailable-capability notice.
- [x] Author and register the hemorrhage recognition and temporization scenario.
- [x] Evaluate its objectives from recorded actions and expose them in instructor analysis.
- [x] Map the scenario to NBCRNA, COA, and ACGME domains.
- [x] Update limitations, face-validity scope, and landing-page inventory.
- [x] Add a bounded adult packed-red-cell foundation that restores volume, hemoglobin mass, and
  calculated oxygen delivery; log accepted units and physiological change; expose separate totals.
- [ ] Add compatibility workflow, other blood products, coagulation, laboratory guidance, calcium,
  and a traceable massive-transfusion protocol. None is implied by the packed-red-cell foundation.

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
- [x] Add bounded, quantitative neuromuscular reversal as a later slice.
- [ ] Add emergence, extubation, aspiration physiology, or cricoid pressure. None is implied by
  the induction-only or bounded-reversal slices.

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
- [x] Local-anesthetic systemic toxicity.
- [x] Resuscitable cardiac arrest, bounded to a persistent shockable-rhythm cycle and initial modeled ROSC.
- [x] Pediatric anesthesia with pediatric pharmacokinetics and a bounded respiratory profile.
- [x] Obstetric presentation: the hemorrhage case is a ruptured ectopic pregnancy.
- [x] Geriatric presentation: hypotension after induction.
- [x] Obesity presentation: rapid desaturation.
- [x] Awareness under paralysis with line disconnection.

## Slice 9: bounded local-anesthetic systemic-toxicity response

- [x] Add a deterministic bupivacaine-exposure event with observable seizure status and bounded
  cardiovascular depression that does not invent cardiac arrest.
- [x] Add logged, replayable IV benzodiazepine seizure suppression without claiming dose pharmacology.
- [x] Add the ASRA 2020 initial 20% lipid bolus and infusion with explicit weight bands and a
  12 mL/kg cumulative cap.
- [x] Enforce LAST epinephrine at no more than 1 microgram/kg while preserving anaphylaxis dosing.
- [x] Surface the checklist's named drug avoidance and keep those agents unavailable.
- [x] Author, register, evaluate, and curriculum-map the 60 kg adult scenario.
- [x] Update sources, limitations, face-validity scope, landing inventory, and discoverability.
- [ ] Add repeat lipid bolus, doubled infusion for instability, dysrhythmia treatment, full arrest
  care, cardiopulmonary bypass, team actions, transport, observation, or a regional-block model.
  None is implied by this initial-response slice.

## Slice 10: bounded persistent-VF cardiac-arrest response

- [x] Add a scripted third-cycle VF handoff after two prior unsuccessful shocks, without changing
  the irreversible hypoxic-arrest behavior in other scenarios.
- [x] Add fixed-rate chest-compression, exact 1 mg IV/IO epinephrine, and energy-selected biphasic
  defibrillation actions with accepted equipment state and deterministic replay.
- [x] Convert only shockable VF under the declared 200 J teaching-device conditions; never convert
  asystole or PEA after a shock.
- [x] Author, register, evaluate, curriculum-map, and make the complete initial response reachable
  with keyboard-operable controls and a non-visual state summary.
- [x] Trace the sequence, dose, compression rate, rhythm discrimination, and device-specific energy
  boundary to the official AHA 2025 adult cardiac-arrest algorithm.
- [x] Update sources, limitations, landing inventory, protocol fixtures, and discoverability.
- [ ] Add physical compression quality, pad placement or safety, recurrent or refractory arrest,
  antiarrhythmics, reversible-cause treatment, individualized outcome, teams, or post-arrest care.
  None is implied by this initial-ROSC slice.

## Slice 11: manual crisis-injector foundation

- [x] Add a two-step scenario-author injector reachable from the cockpit overflow.
- [x] Inject massive hemorrhage at 100 mL/min, anaphylaxis, laryngospasm, bronchospasm,
  malignant-hyperthermia susceptibility, local-anesthetic toxicity, shockable VF arrest,
  non-shockable asystolic arrest, and TIVA-line disconnection through existing engine physiology.
- [x] Record every accepted or refused injection in the event log and transcript, expose the most
  recent accepted injection in the equipment snapshot, and prove deterministic replay.
- [x] Reject unknown and repeated injection requests without mutating the patient.
- [x] State that volatile exposure is still required for the injected malignant-hyperthermia
  susceptibility and paralysis is still required for the specified TIVA-awareness pattern.
- [x] Add high-spinal and air-embolism injection only after their hemodynamic, respiratory, and
  observable monitor effects are implemented. Disabled or cosmetic controls do not satisfy this.

## Slice 12: complete manual crisis injector

- [x] Add a progressive high-spinal teaching drive with distinct bradycardia, hypotension,
  reduced cardiac output, and impaired unassisted breathing.
- [x] Add a rapid venous-air-embolism teaching drive with distinct end-tidal carbon-dioxide,
  oxygen-saturation, pressure, and cardiac-output effects without changing respiratory rate.
- [x] Expose both through the same confirmed, logged, replayable author action and equipment snapshot.
- [x] Make injected respiratory impairment affect gas exchange and expose every matching existing
  rescue control and nonvisual treatment summary from accepted live injection state.
- [x] Trace the clinical direction to current OAA guidance and peer-reviewed air-embolism evidence.
- [x] Publish the calibration, diagnosis, gas-volume, block-height, obstetric, treatment, cerebral,
  and paradoxical-embolism boundaries in the injector, limitations register, and review rubric.
- [ ] Add patient-specific block spread, gas volume or entry mechanics, diagnostic certainty,
  individualized outcomes, or treatment pathways. None is implied by this injector slice.

## Slice 13: bounded quantitative neuromuscular reversal

- [x] Derive a bounded post-tetanic-count proxy from the same rocuronium teaching course as TOF.
- [x] Accept 2 mg/kg sugammadex with at least one TOF twitch and 4 mg/kg with zero twitches plus
  post-tetanic count of at least one; reject depth-dose mismatches without mutation.
- [x] Accept neostigmine with an antimuscarinic only during minimal block and reject deeper requests.
- [x] Drive ratio recovery to at least 0.9, record accepted state, and prove deterministic replay.
- [x] Add a scored reversal objective, two-step keyboard controls, source scope, limitations, and
  face-validity review items.
- [ ] Add neostigmine dose pharmacology, emergence, extubation, recurrent block, hypersensitivity,
  individual recovery prediction, or postoperative outcomes. None is implied.

## Slice 14: bounded adult packed-red-cell foundation

- [x] Add fixed 300 mL and 60 g hemoglobin adult packed-red-cell units during active modeled
  hemorrhage, with a two-unit cumulative cap.
- [x] Add retained volume and hemoglobin mass inside physiology and calculate oxygen delivery from
  cardiac output, hemoglobin, saturation, and arterial oxygen tension.
- [x] Record accepted units, volume, isolated hemoglobin change, calculated oxygen-delivery change,
  cumulative totals, and deterministic replay.
- [x] Add a two-step keyboard-operable tray, nonvisual summary, sources, and explicit limitations.
- [ ] Add ordering, compatibility, crossmatch, delivery rate, warming, reactions, storage effects,
  platelets, cryoprecipitate, calcium, or a massive-transfusion protocol.

## Slice 15: bounded dilutional coagulation and plasma

- [x] Track normalized clotting-factor and fibrinogen mass through whole-blood loss, plasma leak,
  retained crystalloid, packed red cells, and fixed-unit plasma.
- [x] Add an immediate PT-ratio/fibrinogen teaching panel and fixed 275 mL adult plasma units only
  while modeled hemorrhage is active.
- [x] Record before/after factor and fibrinogen values, cumulative units, invalid requests, and
  deterministic state through the existing transcript path.
- [x] Add two-step keyboard controls, current NICE/NHSBT source scope, and explicit limitations.
- [ ] Add consumption, fibrinolysis, platelet count or products, cryoprecipitate, viscoelastic
  testing, lab delay, compatibility, warming, reactions, calcium, or a massive-transfusion protocol.

## Slice 16: bounded blood-bank handoff

- [x] Require a confirmed, logged, replayable blood-bank request before any modeled blood product
  can be selected during active hemorrhage.
- [x] Reveal the released products progressively in the fluid tray and expose accepted release state
  through the worker protocol.
- [x] State in the control, event log, briefing, source scope, and limitations register that release
  is instantaneous and assumes appropriate product selection.
- [ ] Add specimens, ABO/RhD typing, antibody screening, crossmatch, inventory, release delay,
  patient or unit identifiers, emergency-release authorization, bedside checks, or issue records.

## Slice 17: authored high-spinal recognition and initial response

- [x] Add a fifteenth authored scenario that triggers the existing progressive high-spinal drive
  after an epidural top-up and exposes the observable respiratory and cardiovascular compromise.
- [x] Add accepted, replayable high-spinal help and exact 6/12 mg IV ephedrine actions with a
  cumulative 30 mg teaching cap, plus the existing oxygen, ventilation, and 250–500 mL fluid controls.
- [x] Score escalation, breathing support, circulation support, and observed oxygenation only from
  accepted actions and state; add nonvisual status, curriculum mappings, and current OAA provenance.
- [x] Register the scenario so its detail page, structured data, social card, sitemap, and public
  scenario count are generated from the same source of truth.
- [ ] Add neuraxial dose or spread, sensory or motor level, pregnancy physiology, aortocaval
  compression, fetal status, delivery, full vasopressor pharmacology, or individualized outcome.

## Slice 18: authored venous-air-embolism recognition and initial response

- [x] Add a sixteenth authored scenario that triggers the existing abrupt pulmonary-flow teaching
  drive during central-line removal without directly imposing a respiratory-rate change.
- [x] Add accepted, replayable help escalation and two-step source-control intent; stop new modeled
  entry while clearing the residual pattern gradually rather than producing an instant cure.
- [x] Score escalation, source-control intent, 100% oxygen with active breath delivery, and observed
  carbon-dioxide recovery only from accepted actions, engine events, and state history.
- [x] Add a compact mobile rescue tray, nonvisual status, curriculum mappings, current consensus
  provenance, limitations, review items, structured data, social preview, and sitemap coverage.
- [ ] Add gas volume, embolus location, diagnostic certainty, neurologic injury, imaging, central
  aspiration, positioning, hyperbaric therapy, physical source-control skill, teams, or outcome prediction.
