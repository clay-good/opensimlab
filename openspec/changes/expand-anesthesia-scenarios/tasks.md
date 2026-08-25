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

## Slice 19: complete the legacy bronchospasm initial response

- [x] Add accepted, replayable bronchospasm help and exact 5 mg nebulized salbutamol actions with
  a cumulative 10 mg teaching cap and regional albuterol/salbutamol terminology.
- [x] Reduce only modeled lower-airway obstruction through a bounded effect while preserving the
  existing capnogram-morphology lesson and deterministic trajectory.
- [x] Score escalation, 100% inspired oxygen, anesthetic deepening, and first-line bronchodilator
  timing from recorded actions and accepted events.
- [x] Add compact two-step controls, nonvisual status, current Association QRH provenance,
  curriculum mappings, limitations, review scope, and discoverability copy.
- [ ] Add auscultation, tube/circuit checks, suction, HME or nebulizer delivery mechanics,
  dynamic hyperinflation, repeat-dose timing, advanced drugs, team performance, or outcome prediction.

## Slice 20: known difficult airway and repeated laryngoscopy harm

- [x] Check in an evidence brief using current ASA 2022 and DAS 2025 guidance and explicitly avoid
  a universal maximum-attempt rule where the regional pathways differ.
- [x] Add a seventeenth authored scenario with a visible prior difficult-airway record, full
  facemask delivery, configured failed tracheal attempts, and existing supraglottic rescue.
- [x] Make active laryngoscopy and supraglottic insertion suppress residual spontaneous as well as
  commanded ventilation so every airway-procedure interval spends modeled oxygen reserve.
- [x] Score pre-attempt escalation, attempt limitation, rescue placement, and sustained gas exchange
  only from accepted actions, engine events, and visible state.
- [x] Add curriculum mappings, exact limitations, the airway preparation-path update, generated
  catalog/governance records, social preview, sitemap route, discoverability copy, and regressions.
- [ ] Add edema, bleeding, aspiration, physical airway skills, changing facemask technique, awake
  intubation, flexible endoscopy, front-of-neck access, teams, or a post-rescue airway plan.

## Slice 21: capnography sampling-line obstruction during stable ventilation

- [x] Check in an evidence brief using the Association of Anaesthetists 2021 monitoring guideline
  and WFSA 2021 minimum capnometer specification.
- [x] Add an eighteenth authored scenario whose fixed sampling-line obstruction changes only the
  displayed capnogram and end-tidal number while canonical respiratory state stays stable.
- [x] Add accepted, replayable ventilation cross-check and confirmed reconnection actions, with
  duplicate and hostile actions refused without mutation.
- [x] Score discrimination, preservation of stable ventilation, and restoration only from accepted
  events, actions, and recorded state.
- [x] Add keyboard-operable controls, nonvisual state and waveform descriptions, curriculum
  mappings, limitations, preparation-path coverage, catalog assets, and responsive inspection.
- [ ] Add water traps, kinks, leaks, secretions, sample pumps, transport delay, dilution, calibration,
  analyzer failures, device-specific alarms, physical examination, or technical troubleshooting.

## Slice 22: authored dilutional-coagulopathy reassessment

- [x] Check in an evidence brief using current NICE NG24 and NHSBT plasma-dose context without
  turning either source into an individualized or major-hemorrhage dosing rule.
- [x] Add a nineteenth authored scenario with optional scenario-declared starting factor and
  fibrinogen values while every existing scenario retains its prior defaults.
- [x] Reuse the confirmed teaching release, immediate coagulation panel, fixed-unit plasma response,
  and repeat panel as an ordered assessment-treatment-reassessment loop.
- [x] Score the first abnormal panel, accepted lab-guided plasma, and post-treatment repeat panel
  only from accepted engine events.
- [x] Show the current result and repeat action in the keyboard-operable Fluids tray; add nonvisual
  status, curriculum mappings, limitations, preparation-path coverage, catalog assets, and SEO.
- [ ] Add the earlier resuscitation sequence, laboratory or product delay, compatibility, consumption,
  platelets, cryoprecipitate, viscoelastic testing, reactions, source control, teams, a
  massive-transfusion protocol, or individual outcome.

## Slice 23: arterial-pressure transducer artifact

- [x] Check in an evidence brief with the hydrostatic relation, dynamic-response basis, current
  monitoring context, explicit learning boundary, and device/psychomotor exclusions.
- [x] Add a twentieth authored stable-neuraxial scenario with separate canonical patient pressure
  and learner-visible arterial sensor state.
- [x] Model a 20 cm mislevel as a 15 mmHg display-only offset, over-damped waveform morphology, and
  a 20-second delayed cuff sample of canonical MAP.
- [x] Add accepted waveform-assessment, level-and-zero, cuff-cycle, and pressure-tubing replacement
  actions with independent correction paths, hostile-action refusal, replayable event evidence, and
  ordered debrief scoring.
- [x] Add a compact keyboard-operable Monitor tray, screen-reader morphology and summary output,
  curriculum mappings, limitations, preparation-path coverage, catalog assets, and route SEO.
- [ ] Add cannulation, physical leveling/zeroing/flushing, cuff technique or failure, patient-position
  reference selection, commercial-monitor behavior, sterility, arterial-site differences, or
  individualized device accuracy and treatment thresholds.

## Slice 24: circle-system rebreathing from exhausted absorbent

- [x] Check in an evidence brief covering inspired-carbon-dioxide recognition, fresh-gas-flow
  bridging, workstation-specific exchange safety, and explicit physiology/equipment exclusions.
- [x] Add a twenty-first authored established-maintenance scenario with a starting tracheal tube,
  delivered volatile agent, mechanical ventilation, and a fixed exhausted-absorbent event.
- [x] Raise the capnogram inspiratory baseline and patient end-tidal carbon dioxide on declared
  deterministic teaching curves while preserving delivered breaths and signal validity.
- [x] Add ordered capnogram-assessment and absorber-replacement intent plus a focused Circuit tray,
  fresh-gas bridge, nonvisual output, announcements, replay, and evidence-based debrief scoring.
- [x] Add curriculum mappings, limitations, preparation-path coverage, catalog assets, route SEO,
  hostile/out-of-order action regressions, and responsive browser inspection.
- [ ] Add canister chemistry, channeling, desiccation, color indicators, valve failure, circuit
  pressure or compliance, commercial alarm behavior, physical exchange, full carbon-dioxide and
  acid-base physiology, teams, or individual outcome prediction.

## Slice 25: routine inhalational maintenance

- [x] Check in an evidence brief covering FDA sevoflurane labeling, age-adjusted MAC context,
  remifentanil labeling, monitoring guidance, exact teaching fixtures, and unsafe inferences.
- [x] Add a twenty-second authored scenario with an established tracheal tube, mechanical
  ventilation, end-tidal volatile state, and a declared changing surgical-stimulus window.
- [x] Reuse accepted remifentanil infusion actions and existing volatile, depth, stimulus, and
  hemodynamic capabilities without adding a scenario-only physiological path.
- [x] Score bounded depth, anticipatory infusion evidence and hemodynamic response, timely
  quiet-phase reduction, and final recovery from accepted actions and recorded state.
- [x] Add catalog assets, responsive browser inspection, curriculum and preparation-path coverage,
  route SEO, expert/no-action/replay regressions, and final full-CI evidence.
- [ ] Add pain, memory, consciousness, commercial processed-EEG behavior, individualized MAC,
  real surgical nociception, injection-rate effects, neuromuscular blockade, emergence, or
  patient-specific dosing.

## Slice 26: bounded blood-bank handoff scenario

- [x] Check in an evidence brief covering the current AABB circular, current JPAC component
  specification, exact teaching fixtures, and every omitted compatibility-workflow safeguard.
- [x] Add a twenty-third authored scenario with established general anesthesia, fixed active blood
  loss, a confirmed bounded release, fixed-unit red-cell support, and a final reassessment window.
- [x] Reuse the existing hemorrhage, blood-bank request, blood-product, event-log, and replay paths
  without adding a second compatibility or transfusion physiology implementation.
- [x] Score timely accepted release, ordered red-cell selection, modeled response, and final pressure
  from accepted/refused engine events and recorded state.
- [x] Add catalog assets, curriculum and preparation-path coverage, route SEO, expert/no-action/
  out-of-order/replay regressions, responsive browser inspection, and final full-CI evidence.
- [ ] Add specimens, identifiers, ABO/RhD type, antibody screening, compatibility testing,
  crossmatch, inventory, delay, emergency-release authorization, consent, prescription, issue
  records, bedside checks, administration workflow, reactions, local policy, or team communication.

## Slice 27: bounded routine geriatric intravenous induction

- [x] Check in an evidence brief covering the current propofol label, Eleveld population model,
  monitoring context, exact expert fixture, and unsafe inference boundaries.
- [x] Add a twenty-fourth authored scenario for one stable older adult with end-tidal preoxygenation,
  small spaced propofol increments, effect-site lag, pressure observation, and early ventilation.
- [x] Reuse the existing propofol, oxygen, respiratory, hemodynamic, ventilator, event-log, and replay
  paths without adding a geriatric-only physiological implementation.
- [x] Score oxygen reserve, accepted total and increment timing, pressure nadir, delivered tidal
  volume per kilogram, and saturation from accepted actions and recorded state.
- [x] Add catalog assets, curriculum and preparation-path coverage, route SEO, expert/no-action/
  large-bolus/replay regressions, responsive browser inspection, and final full-CI evidence.
- [ ] Add injection-rate effects, individual dose prediction, frailty, cognition, delirium, organ
  dysfunction, polypharmacy, physical airway skill, neuromuscular blockade, intubation, or emergence.

## Slice 28: quantitative neuromuscular reversal during established anesthesia

- [x] Check in an evidence brief covering current quantitative-monitoring and antagonism guidance,
  teaching-course calibration, exact expert fixture, and unsafe inference boundaries.
- [x] Add a twenty-fifth authored scenario with established anesthesia and ventilation, a recorded
  baseline, one declared rocuronium exposure, recovery-depth selection, and quantitative reassessment.
- [x] Harden the shared engine so reversal requires a descending recovery-phase signal and an
  onset-phase count or ratio cannot be misread as recovery.
- [x] Score the pre-dose baseline, exact bolus, accepted depth match, post-reversal ratio, maintained
  anesthesia, ventilation, and oxygenation from accepted/refused events and recorded state.
- [x] Add catalog assets, curriculum and preparation-path coverage, route SEO, expert/no-action/
  onset-phase/wrong-depth/replay regressions, responsive browser inspection, and full-CI evidence.
- [ ] Add commercial-monitor behavior, stimulation technique, electrode placement, signal artifact,
  muscle-site equivalence, reversal pharmacokinetics, individual recovery, emergence, extubation,
  recurrent block, postoperative weakness, or patient-specific dosing.

## Slice 29: bounded routine pediatric inhalational induction

- [x] Check in an evidence brief covering the current sevoflurane label, pediatric comparative
  context, age-adjusted MAC, exact expert fixture, and unsafe inference boundaries.
- [x] Add a twenty-sixth authored scenario for one healthy 6-year-old with ordered circuit
  preparation, vaporizer-to-end-tidal wash-in, delivery reduction, and bounded reassessment.
- [x] Permit intentional device-only formularies and give an empty syringe tray a clear, useful
  route to the Airway & Vent controls.
- [x] Score ordered preparation, valid entered induction delivery, measured wash-in, reduction,
  and a sustained bounded response from accepted actions and recorded state.
- [x] Add curriculum and preparation-path coverage, catalog assets, route SEO, expert/no-action/
  unprepared/no-reduction/hostile/replay regressions, responsive browser inspection, and full CI.
- [ ] Add cooperation, distress, parental presence, premedication, mask technique, seal or leak,
  excitement, airway reflexes, volatile respiratory depression, consciousness, IV access, airway
  placement, movement, emergence, recovery, or individual anesthetic need.

## Slice 30: bounded obstetric general anesthesia

- [x] Check in an evidence brief covering the OAA/DAS preparation endpoint, pregnancy apnea
  calibration context, current induction evidence, expert fixture, and unsafe inference boundaries.
- [x] Add a twenty-seventh authored scenario with a bounded term-pregnancy respiratory profile,
  end-tidal preoxygenation, induction ordering, modeled tube placement, and ventilation confirmation.
- [x] Require successful modeled placement before post-attempt capnography can satisfy airway
  confirmation, so facemask gas exchange after a failed attempt cannot earn false credit.
- [x] Add curriculum and obstetric preparation-path coverage plus expert/no-action/unprepared/
  paralysis-first/failed-airway/replay regressions.
- [x] Complete catalog assets, route SEO, responsive browser inspection, and full CI.
- [ ] Add fetal monitoring or physiology, delivery, aspiration, cricoid pressure, awareness,
  neonatal effects, hemorrhage, emergence, extubation, physical airway technique, or team performance.

## Slice 31: bounded preeclampsia response before urgent delivery

- [x] Check in an evidence brief covering current ACOG, AIM, and SMFM severe-hypertension
  guidance, exact deterministic fixtures, and unsafe inference boundaries.
- [x] Add a twenty-eighth authored scenario that confirms the declared persistent severe-range
  pressure, accepts one first-line 20 mg IV labetalol branch, and records a distinct 4 g IV
  magnesium-sulfate seizure-prophylaxis branch.
- [x] Add a scenario-declared maternal-response tray and engine-owned accepted state; keep
  magnesium pressure-neutral and require an observed post-treatment repeat for reassessment credit.
- [x] Add curriculum and obstetric preparation-path coverage, public catalog assets, route SEO,
  accepted/hostile/out-of-order/duplicate/replay regressions, responsive browser inspection, and
  full CI.
- [ ] Add diagnosis, laboratory criteria, fetal monitoring, alternative or escalating
  antihypertensives, full drug pharmacokinetics, magnesium infusion and toxicity, eclampsia,
  pulmonary edema, delivery planning, anesthetic technique, surgery, postpartum care, or teams.

## Slice 32: bounded pneumothorax under positive-pressure ventilation

- [x] Check in an evidence brief covering current anesthesia-crisis and resuscitation guidance,
  exact deterministic fixtures, and unsafe inference boundaries.
- [x] Add a twenty-ninth authored scenario with a declared airway-pressure alarm and a bounded
  combined oxygenation, carbon-dioxide, and obstructive-shock teaching trajectory.
- [x] Add scenario-declared bilateral-assessment, help, oxygen, and confirmed decompression-intent
  controls backed by engine-owned accepted state and deterministic replay.
- [x] Score the response only from accepted events, accepted ventilator settings, and observed
  post-response state; reject pre-event, unsupported, and duplicate actions.
- [x] Add curriculum and preparation-path coverage, public catalog assets, route SEO, and focused
  engine, debrief, hostile-input, replay, and responsive UI regressions.
- [ ] Add a numerical airway-pressure or compliance model, pleural gas volume or pressure,
  barotrauma, differential diagnosis, ultrasound or radiography, arrest, later chest drainage,
  procedural site or equipment selection, psychomotor technique, complications, or teams.

## Slice 33: bounded aspiration-risk recognition

- [x] Check in an evidence brief covering the 2024 multi-society GLP-1 guidance, the ASA issuing-body
  summary, elective fasting scope, and unsafe inference boundaries.
- [x] Add a thirtieth authored scenario with declared medication escalation, active gastrointestinal
  symptoms, ordinary fasting, elective urgency, and no simulated aspiration physiology.
- [x] Add ordered cue-review, elevated-or-routine classification, and confirmed defer-or-proceed
  choices backed by engine-owned accepted state and deterministic replay.
- [x] Score only accepted decisions, preserve normal physiology, and reject unsupported,
  out-of-order, and duplicate requests.
- [x] Complete catalog assets, route SEO, responsive browser inspection, and full CI.
- [ ] Add gastric-emptying or content estimates, ultrasound, regurgitation, aspiration, pneumonitis,
  medication cessation, liquid-diet preparation, glycemic effects, emergency surgery, anesthetic or
  airway technique, local policy, cancellation logistics, team communication, or individual outcome.

## Slice 34: bounded emergence with residual blockade

- [x] Check in an evidence brief covering current ASA and ESAIC quantitative-monitoring guidance,
  the static 0.72 fixture, and unsafe inference boundaries.
- [x] Add a thirty-first authored scenario where four twitches and no detectable fade conflict with
  a quantitative ratio below 0.9 while the tracheal tube and delivered ventilation remain in place.
- [x] Add ordered monitor-review, residual-or-recovered classification, and confirmed
  defer-or-proceed choices backed by engine-owned accepted state and deterministic replay.
- [x] Score only accepted decisions and reject unsupported, out-of-order, and duplicate requests.
- [x] Complete catalog assets, route SEO, responsive browser inspection, and full CI.
- [ ] Add commercial-monitor behavior, stimulation technique, clinical-sign measurement, drug or
  reversal pharmacology, spontaneous recovery, consciousness, airway reflexes, airway removal,
  postoperative weakness, complete extubation readiness, or individual outcome.

## Slice 35: bounded delayed-emergence differential

- [x] Check in an evidence brief covering systematic pharmacologic, metabolic, and neurologic
  cause review and the unsafe inference boundaries.
- [x] Add a thirty-second authored scenario with an established airway, stable support, fixed
  exposure and metabolic findings, and a new lateralizing focused examination pattern.
- [x] Add ordered support, exposure, metabolic, neurologic-examination, and confirmed escalation
  actions backed by engine-owned accepted state and deterministic replay.
- [x] Score only accepted events and reject unsupported, out-of-order, duplicate, and unknown requests.
- [x] Complete curriculum mapping, preparation path, limitations, catalog, SEO, responsive browser
  inspection, and full CI.
- [ ] Add consciousness measurement, drug concentrations, reversal dosing, test acquisition,
  imaging, diagnostic certainty, treatment, team workflow, transfer, complications, or outcome.

## Slice 36: bounded extubation readiness

- [x] Check in an evidence brief covering quantitative recovery, awake response, spontaneous
  ventilation, airway risk stratification, rescue planning, and unsafe inference boundaries.
- [x] Add a thirty-third authored low-risk adult scenario with a static ratio above 0.90 and fixed
  awake-airway, gas-exchange, airway-risk, and resource findings.
- [x] Require ordered review of all four domains before a confirmed awake-extubation readiness decision.
- [x] Keep the tube and delivered ventilation in place, score accepted events only, and reject
  unsupported, out-of-order, duplicate, and unknown requests.
- [x] Complete curriculum mapping, preparation path, limitations, catalog, SEO, responsive browser
  inspection, and full CI.
- [ ] Add measured examination, tube removal, extubation technique, deep or at-risk strategies,
  rescue devices, reintubation, communication, post-extubation monitoring, complications, or outcome.

## Slice 37: bounded post-extubation obstruction

- [x] Check the existing Difficult Airway Society extubation source for reduced pharyngeal tone,
  airway patency, simple maneuvers, oxygen, continuous positive pressure, and escalation boundaries.
- [x] Add a thirty-fourth authored scenario that starts after tube removal and keeps soft-tissue
  obstruction distinct from laryngospasm and bronchospasm.
- [x] Require accepted help escalation, active high-concentration oxygen and positive pressure, a
  held jaw thrust, and observable gas-flow recovery on a deterministic teaching trajectory.
- [x] Score the engine trace and preserve safe handling of invalid or inapplicable event severity.
- [x] Complete curriculum mapping, preparation path, limitations, catalog, SEO, responsive browser
  inspection, and full CI.
- [ ] Add airway adjuncts, position controls, laryngospasm, edema, aspiration, reintubation,
  post-obstructive pulmonary edema, recurrence, prolonged monitoring, or team performance.

## Slice 38: bounded opioid-induced ventilatory impairment

- [x] Check in an evidence brief covering the OIVI triad, advancing sedation, imperfect oxygen and
  respiratory-rate surrogates, ventilatory support, naloxone reversal, and recurrence boundaries.
- [x] Add a thirty-fifth authored postoperative scenario with a patent airway and a dedicated
  slow-rate/relatively preserved-breath central-drive trajectory.
- [x] Add help, active ventilation and oxygen, ordered opioid hold, dose-free naloxone intent, and
  supported-to-spontaneous reassessment with deterministic replay and debrief evidence.
- [x] Reject unsupported, duplicate, out-of-order, hostile, and inactive response requests.
- [x] Complete curriculum mapping, preparation path, limitations, catalog, SEO, responsive browser
  inspection, and full CI.
- [ ] Add opioid or naloxone pharmacokinetics, dose or route, pain, sedation-scale technique,
  co-sedatives, withdrawal, recurrent depression, repeated reversal, or monitoring disposition.

## Slice 39: bounded hypothermia and rewarming

- [x] Check in an evidence brief covering the below-36°C definition, temperature trending,
  active surface warming, bulk-fluid warming, redistribution, and unsafe inference boundaries.
- [x] Add a thirty-sixth authored adult scenario with isolated deterministic cooling and rewarming
  targets while ventilation and circulation remain stable.
- [x] Require core-temperature confirmation before active surface-warming and bulk-fluid warming
  intents, then score observed recovery through 36.5°C.
- [x] Add a low-temperature monitor signal and reject unsupported, duplicate, out-of-order,
  hostile, and inactive response requests.
- [x] Complete curriculum mapping, preparation path, limitations, catalog, SEO, responsive browser
  inspection, and full CI.
- [ ] Add device settings, probe-site technique, redistribution compartments, heat-transfer
  calculation, shivering, comfort, complications, medication effects, emergence, or disposition.

## Slice 40: bounded perioperative hyperglycemia

- [x] Check in an evidence brief covering the 100–180 mg/dL perioperative target, point-of-care
  confirmation, protocolized response, hypoglycemia risk, and unsafe inference boundaries.
- [x] Add a thirty-seventh authored adult scenario with one fixed elevated glucose cue while
  ventilation and circulation remain stable.
- [x] Require point-of-care confirmation before dose-free institutional insulin-protocol intent,
  then gate a fixed in-target repeat result behind 30 simulated minutes.
- [x] Show both mg/dL and mmol/L and reject unsupported, duplicate, out-of-order, early, hostile,
  and inactive response requests.
- [x] Complete curriculum mapping, preparation path, limitations, catalog, SEO, responsive browser
  inspection, and full CI.
- [ ] Add continuous-monitor performance, sampling technique, insulin dose, route, preparation,
  delivery, pharmacokinetics, hypoglycemia, rescue, electrolytes, ketones, acid-base state,
  nutrition, medication reconciliation, complications, or outcome.

## Slice 41: bounded pacemaker and cautery planning

- [x] Check in an evidence brief covering device identification, pacing dependence, procedure
  location, electrosurgery interference, magnet uncertainty, backup, and restoration boundaries.
- [x] Add a thirty-eighth authored adult preoperative scenario with a fixed transvenous pacemaker
  record and fixed above-umbilicus monopolar-electrosurgery plan.
- [x] Require both record reviews before one device plan, then require backup, monitoring, and
  restoration documentation after the plan.
- [x] Reject unsupported, duplicate, out-of-order, hostile, and inactive assessment requests.
- [x] Complete curriculum mapping, preparation path, limitations, catalog, SEO, responsive browser
  inspection, and full CI.
- [ ] Add interrogation, programming, magnet application or response, pacing or sensing,
  electrosurgery technique, current-path calculation, malfunction, emergency response, or team
  performance.
