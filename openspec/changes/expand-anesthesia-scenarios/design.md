# Design

## Scope

The slice teaches recognition and temporization, not definitive hemorrhage resuscitation.
Balanced crystalloid is the only new treatment. A bolus acts on the next 100 ms engine tick;
25% expands circulating volume and the added plasma dilutes hemoglobin. This fixed fraction is
identified as an Open Sim Lab teaching model wherever the action is offered or explained.

## Safety boundaries

- A single fluid action is limited to 1–5,000 mL and unknown products are rejected.
- Whole-blood loss removes red-cell mass and plasma in proportion, so it does not immediately
  change hemoglobin concentration. Crystalloid adds no red-cell mass and therefore dilutes it.
- Blood products and every massive-transfusion concern remain unavailable and are named in the
  briefing limitations. The case must never claim that crystalloid is definitive replacement.
- Objective evaluation uses recorded action timing and volume as a behavioral proxy. The debrief
  explicitly says that this cannot prove what the learner noticed or why.

## Verification

Focused tests compare treated and untreated trajectories, prove one-shot fluid delivery,
hemoglobin dilution, hostile-input rejection, deterministic replay, objective timing outcomes,
schema/registry validity, curriculum integrity, and the working tray. The full CI sequence then
builds and prerenders every scenario route before running all tests and budgets.

## Slice 2: rapid-sequence induction

The case isolates preparation and timing in a full-stomach adult with an otherwise straightforward
airway. Rocuronium is bolus-only and drives a quantitative train-of-four teaching model. It changes
neither depth, analgesia, nor hemodynamics. Laryngoscopy becomes a pending action whose declared
duration advances with the simulation; ventilation is absent until the attempt completes.

Objective evaluation reads the state at the recorded action tick. It checks end-tidal oxygen at
the first hypnotic dose, train-of-four at airway instrumentation, the lowest saturation, and
subsequent delivered ventilation with carbon dioxide. These are behavioral observations, not a
claim about the learner's reasoning or physical airway skill.

The slice stops at a secured, ventilated airway. It does not model reversal, emergence, extubation,
regurgitation, aspiration, cricoid pressure, or team behavior. Peripheral train-of-four is not
presented as proof of conditions at the larynx, and the rocuronium trajectory is labeled as a
teaching model rather than an individual prediction.

## Slice 3: awareness risk under paralysis

The case moves from induction into early TIVA maintenance within 10 simulated minutes. A scripted
line disconnection stops propofol delivery while the commanded pump rate remains unchanged;
remifentanil delivery continues. The learner must inspect and reconnect the hypnotic line rather
than infer delivery from the pump setting. Quantitative train-of-four remains available because
the teaching point depends on seeing that paralysis continues while hypnosis wanes.

Objective evaluation reads only recorded actions and state. It checks propofol-before-rocuronium
order, a running propofol infusion before failure, inspection and reconnection timing, and whether
predicted depth rose above 60 while train-of-four remained suppressed. The NAP5 incidence figures
frame why blockade is a risk multiplier; they are not applied as a probability for this patient.

The slice models neither consciousness nor explicit recall, distress, movement, a processed EEG,
partial line failure, pump pressure alarms, or emergence. A threshold crossing is described as a
modeled risk pattern, never proof that awareness occurred.

## Slice 4: laryngospasm initial response

The case scripts severe upper-airway closure after stimulation while the airway remains unsecured.
Closure removes gas movement and the capnogram without generating a lower-airway shark fin. A
learner action holds a combined jaw-thrust and continuous-positive-pressure teaching maneuver for
90 simulated seconds. The duration bounds the interface and is not a recommended clinical hold.
Relief also requires active delivered ventilation and at least 95% oxygen;
adequate modeled anesthetic depth enables the bounded response.

Objective evaluation reconstructs inspired oxygen and breath delivery from separate cockpit
actions, because the real controls dispatch them independently. It checks end-tidal oxygen at
closure, timing of the held maneuver, timing of a propofol deepening action, and the lowest
saturation. These are behavioral proxies and state outcomes, not evidence that a learner can
perform a physical jaw thrust, obtain a mask seal, choose pressure, or complete the algorithm.

The event is refused after successful tracheal intubation, because glottic closure cannot obstruct
a tracheal tube. The slice does not offer suction, a separate airway adjunct, source removal,
succinylcholine, help or team actions, refractory escalation, aspiration, or negative-pressure
pulmonary edema.

## Slice 5: perioperative anaphylaxis initial response

At 3 simulated minutes, a fixed cefazolin exposure starts persistent coupled vasodilation,
plasma-only capillary leak, and bronchospasm. This reflects NAP6's antibiotic predominance and
common hypotensive presentation without implying that every case has the same trajectory.

Objective evaluation checks the timing, route, and dose of epinephrine; cumulative balanced
crystalloid in the first 120 seconds; oxygen and ventilation settings in effect by 60 seconds,
including settings established before exposure; and
the lowest saturation. These are observable action and state proxies, not a definitive diagnosis.
The slice excludes cutaneous signs, tryptase, trigger removal, team behavior, arrest, infusion or
refractory treatment, and post-event investigation.

## Slice 6: early malignant hyperthermia response

The case begins with ordinary induction and volatile maintenance. A latent event arms at 4
simulated minutes but produces no syndrome without genuine end-tidal volatile exposure. Once
triggered, modeled excess carbon-dioxide production appears first, followed by tachycardia and
observable rigidity, with temperature rising later. The live event does not announce the hidden
susceptibility or diagnosis.

Objective evaluation uses the first modeled rigidity as an observable scoring anchor. It checks
an accepted initial-response action, reconstructs vaporizer, oxygen, fresh-gas flow, delivered
minute ventilation, accepts only exact 2.5 mg/kg IV dantrolene actions, and reports the subsequent
carbon-dioxide, heart-rate, rigidity, and temperature trajectory. This is an early pattern and
bounded initial response, not a diagnostic test or complete protocol.

The slice omits succinylcholine and masseter spasm, physical examination, circuit replacement and
charcoal filters, blood gases, acidosis, potassium, dysrhythmia treatment, rhabdomyolysis, urine
output, coagulation, team and hotline actions, intensive care, recurrence, and confirmation.

## Slice 7: bounded routine pediatric induction

The case is deliberately one healthy 6-year-old weighing 20 kg. Propofol uses the Paedfusor
population pharmacokinetic model, selected by default only from age 1 through 12. Paedfusor does
not supply a pediatric depth pharmacodynamic surface, so the displayed depth response remains the
shared calibrated teaching response and is labeled accordingly.

The healthy-child respiratory profile derives functional residual capacity, oxygen and carbon-
dioxide metabolism, dead space, and spontaneous breathing from published pediatric observations.
Objective evaluation checks end-tidal oxygen before the first accepted propofol dose, requires an
accepted 2.5–3.5 mg/kg entry for the labeled healthy-child range, reconstructs separately dispatched
ventilator settings including settings prepared before induction, and requires both 6–8 mL/kg
delivered breaths and sustained end-tidal carbon dioxide between 30 and 50 mmHg. It also reports the
lowest post-induction saturation. These are bounded gas-exchange outcomes, not device prescriptions.

The slice does not model validated pediatric depth pharmacodynamics, hemodynamic maturation,
pediatric airway-device sizing, maintenance, emergence, or children outside this one profile.

## Slice 8: difficult-airway supraglottic rescue

The case begins as an ordinary elective induction with reassuring bedside assessment. A hidden
scenario event configures every tracheal attempt to fail while retaining the sampled view,
duration, and accumulated trauma. Assisted facemask ventilation delivers a fixed 35% of the set
tidal volume after the first attempt begins and until a supraglottic airway is placed; preoxygenation
before the unanticipated difficulty remains unaffected. This is a reproducible teaching course, not an
individual prediction or a model of changing mask technique.

The learner can request airway help once and insert a configured supraglottic airway. Insertion
takes 15 simulated seconds without assisted ventilation, then provides a full modeled route for
breaths but does not itself prove gas exchange. Objective evaluation uses accepted engine events
to ignore refused and overlapping actions. It limits repeated completed laryngoscopy, records
help timing, and requires an explicit post-placement start of assisted ventilation plus at least
30 seconds of high inspired oxygen, end-tidal carbon dioxide from 25 to 55 mmHg, and saturation
of at least 92%.

The endpoint is rescue oxygenation, not tracheal intubation. The fixed successful device action
does not model physical placement, size, seal, aspiration protection, or operator skill. Team
arrival, repeated device attempts, the choice to wake or proceed, intubation through the device,
failed supraglottic ventilation, cannot-intubate-cannot-oxygenate progression, and emergency
front-of-neck access remain unavailable.

## Slice 9: bounded local-anesthetic systemic-toxicity response

The case starts with an awake 60 kg adult during a planned peripheral-block injection. A scripted
bupivacaine exposure produces one deterministic severe-toxicity pattern: observable seizure status,
bradycardia, and myocardial depression. It does not calculate exposure from injection technique,
dose, site, uptake, plasma concentration, or block spread, and the live event reports findings
rather than naming a diagnosis.

The crisis tray follows the initial ASRA 2020 checklist steps that this engine can represent.
Airway support uses the existing oxygen and breath-delivery controls. An agent-class IV
benzodiazepine action suppresses the modeled seizure without inventing a dose or pharmacokinetic
course. Epinephrine is limited to no more than 1 microgram/kg while toxicity is active. The tray
names vasopressin, beta blockers, calcium-channel blockers, and further local anesthetic as absent.

For patients below 70 kg, initial 20% lipid uses a 1.5 mL/kg bolus and 0.25 mL/kg/min infusion. At
70 kg or more, the implementation convention uses the checklist's fixed approximately 100 mL
bolus and 250 mL over 20 minutes. The bounded initial course stops after 20 minutes; 12 mL/kg is
enforced only as a safety ceiling, not used as a target. Lipid opposes the bounded toxicity drive
as an Open Sim Lab teaching effect; improvement is not an antidote claim or a guarantee.

Objective evaluation reads accepted engine events, not requested actions. It checks initial-
response timing, concurrent high oxygen and active breath delivery, accepted seizure suppression,
the exact 60 kg lipid calculation, and any accepted epinephrine dose. Repeat or doubled lipid,
dysrhythmia treatment, arrest care, bypass, teams, transport, observation, and regional anesthesia
remain outside this slice.

## Slice 10: bounded persistent-VF cardiac-arrest response

The case begins at a third-cycle handoff after two prior unsuccessful biphasic shocks. A scripted
rhythm event creates ventricular fibrillation with no spontaneous mechanical output while leaving
the existing irreversible hypoxic-arrest path untouched. The learner resumes a fixed 110/min
compression proxy, gives exactly 1 mg IV/IO epinephrine, and selects energy on a declared biphasic
device. Under those accepted conditions a 200 J shock deterministically converts this teaching case
to an organized rhythm and initial modeled ROSC. The same shock never converts asystole or PEA.

During arrest the observable state reports no spontaneous output and only bounded low-flow support
while compressions are active. The equipment snapshot records accepted compression time, perfusion
proxy, arrest-dose epinephrine, shocks, energy, and ROSC. Objective evaluation uses those accepted
engine events rather than raw action requests, including explicit non-shockable-rhythm errors.

The sequence follows the official AHA 2025 adult cardiac-arrest algorithm. The 200 J value belongs
only to the declared teaching device; real biphasic energy follows manufacturer guidance. Buttons
cannot evaluate compression depth, recoil, pauses, pad contact, electrical safety, physical access,
or teamwork. Reversible causes, refractory drugs, recurrent arrest, post-arrest care, and individual
outcome remain outside this slice.

## Slice 11: manual crisis-injector foundation

The cockpit overflow opens a two-step scenario-author injector. Each accepted selection is an
ordinary learner action with its simulated tick, so the event log, transcript, replay engine, and
instructor review all see the same intervention. The engine refuses unknown and repeated ids rather
than letting a control imply an effect it does not implement.

This foundation routes 9 entries into physiology that already exists: ongoing whole-blood loss at
100 mL/min; the bounded anaphylaxis, upper-airway closure, bronchospasm, local-anesthetic toxicity,
and volatile-dependent malignant-hyperthermia drives; shockable VF and non-shockable asystolic
arrest; and actual propofol-line disconnection without changing its pump command. Patient state and
current equipment still govern the outcome: laryngospasm cannot close a tracheal tube, malignant-
hyperthermia susceptibility does nothing without genuine volatile exposure, and line disconnection
does not create the specified awareness-under-paralysis pattern unless paralysis is already present.

High spinal and air embolism remain explicitly absent from the control until their distinct
physiology and monitor consequences exist. This interim slice advances the injector infrastructure
without turning the remaining names into inert buttons.
