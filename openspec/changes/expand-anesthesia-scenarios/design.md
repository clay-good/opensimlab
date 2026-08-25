# Design

## Scope

Slice 1 teaches recognition and temporization, not definitive hemorrhage resuscitation.
Balanced crystalloid is its only new treatment. A bolus acts on the next 100 ms engine tick;
25% expands circulating volume and the added plasma dilutes hemoglobin. This fixed fraction is
identified as an Open Sim Lab teaching model wherever the action is offered or explained.

## Safety boundaries

- A single fluid action is limited to 1–5,000 mL and unknown products are rejected.
- Whole-blood loss removes red-cell mass and plasma in proportion, so it does not immediately
  change hemoglobin concentration. Crystalloid adds no red-cell mass and therefore dilutes it.
- Slice 14 later adds bounded adult packed-red-cell physiology. Compatibility, other products,
  coagulation, laboratories, and every massive-transfusion concern remain unavailable. The case
  must never claim that crystalloid is definitive replacement.
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

The induction slice stops at a secured, ventilated airway. Slice 13 later adds bounded reversal;
emergence, extubation, regurgitation, aspiration, cricoid pressure, and team behavior remain absent. Peripheral train-of-four is not
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

High spinal and air embolism remain explicitly absent from the control in this foundation slice;
Slice 12 adds them only with distinct physiology and observable monitor consequences.

## Slice 12: complete manual crisis injector

The author tool adds the 2 remaining required entries through the same confirmed, logged, and
replayable action. High spinal ramps over 20 simulated seconds and produces a bounded teaching
pattern of bradycardia, loss of vascular tone, reduced cardiac output and pressure, and impaired
unassisted breathing. Active ventilator delivery remains effective. The drive does not estimate
neuraxial dose, spread, block height, pregnancy physiology, or patient-specific onset.

Venous air embolism ramps over 2 simulated seconds and produces a distinct abrupt pulmonary-flow
pattern: end-tidal carbon dioxide, cardiac output, pressure, and oxygen saturation fall while
respiratory rate is not directly changed. The drive does not estimate gas volume, entry site,
embolus location, diagnostic certainty, cerebral or paradoxical embolism, treatment, or outcome.

The clinical directions come from current OAA high-central-neuraxial-block guidance and McCarthy
et al.'s air-embolism review. Exact slopes and magnitudes are declared teaching calibrations. Tests
compare each injected course with an identical untreated engine, prove the 2 syndromes remain
physiologically distinct, and include both actions in deterministic replay. High-spinal breathing
impairment enters the gas-exchange solver rather than changing display values after the fact.
Accepted manual injections also activate the matching rescue tray and nonvisual support summary;
the static scenario timeline is not the only source of control availability.

## Slice 13: bounded quantitative neuromuscular reversal

The existing rocuronium course gains a bounded post-tetanic-count proxy and a distinct reversal
opposition state. Sugammadex accepts only the master specification's observed-depth branches:
2 mg/kg with at least one train-of-four twitch, or 4 mg/kg with zero twitches and a post-tetanic
count of at least one. An accepted action reduces the effective rocuronium drive and the same
quantitative monitor must show a ratio of at least 0.9. Later rocuronium is refused because this
bounded model cannot separate previously opposed drug from a new dose without reactivating both.

Neostigmine with an antimuscarinic is an agent-class teaching action because this slice has no
sourced dose-kinetic model. It is accepted only at minimal blockade: four twitches and a ratio from
0.4 to below 0.9. Deeper requests are rejected, preserving the reason current guidance restricts
it to minimal blockade. Every request is logged and replayable; depth-dose mismatches, bad routes,
unsupported agents, and nonfinite doses mutate nothing.

The cockpit exposes the measured train-of-four count and ratio plus an auto-derived post-tetanic-
count teaching proxy beside two-step
controls. This is not emergence or an extubation decision. Individual recovery time, recurrent
block, hypersensitivity, neostigmine or antimuscarinic dose pharmacology, airway removal, and
postoperative outcomes remain unavailable.

## Slice 14: bounded adult packed-red-cell foundation

The adult fluids tray adds packed red cells as units rather than arbitrary milliliters. One unit is
a fixed 300 mL component carrying 60 g hemoglobin, bounded to one or two integer units per action
and two units cumulatively. The values sit within current AABB hemoglobin-content and JPAC volume
specifications but are labeled as a teaching convention rather than an individual product prediction.

Whole-blood loss first removes plasma and red-cell mass proportionally. Plasma leak and crystalloid
then change circulating volume, after which packed red cells add their retained volume and hemoglobin
mass. The engine isolates the packed-red-cell hemoglobin change for the event log and calculates
arterial oxygen content and systemic oxygen delivery from the final state. Oxygen delivery is debrief
evidence, not a monitor tile.

This foundation does not model ordering, compatibility, crossmatch, infusion time, warming, storage,
transfusion reactions, calcium, electrolytes, coagulation, laboratory guidance, other components, or
a massive-transfusion protocol. Its two-unit cap is an interaction boundary, not a clinical endpoint.

## Slice 19: complete the legacy bronchospasm response

The existing case keeps its progressive shark-fin capnogram and obstruction timeline. A distinct
bronchodilator state opposes only modeled lower-airway obstruction: each accepted exact 5 mg
nebulized salbutamol action adds a bounded teaching effect, capped after 10 mg and decaying over
10 modeled minutes. The United States profile presents the same agent as albuterol.

The crisis tray adds help and two-step bronchodilator controls beside the existing oxygen,
ventilation, and anesthetic-depth controls. Accepted events, not requested buttons, drive the
debrief. Auscultation, diagnostic certainty, tube and circuit checks, suction, nebulizer/HME
delivery mechanics, repeat timing, advanced drugs, dynamic hyperinflation, teams, and individual
response remain outside the model.

## Slice 20: known difficult airway and repeated laryngoscopy harm

The seventeenth authored scenario reuses the deterministic difficult-airway course with a full
facemask delivery fraction. Unlike the unanticipated rescue case, the prebrief exposes a prior
record of failed direct laryngoscopy and successful supraglottic oxygenation. The learner can call
for help before the first attempt, protect oxygen reserve, stop after one configured failure, and
move to the existing 15-second abstract supraglottic rescue.

Each airway procedure now suppresses both commanded and residual spontaneous ventilation for its
declared duration. Repeated accepted attempts therefore spend simulated oxygen reserve and retain
the existing grade-dependent accumulated-trauma teaching state. The debrief scores only accepted
help timing, attempts, device events, ventilation settings, and sustained visible gas exchange.

The evidence brief binds the shared United States and United Kingdom boundary to the ASA 2022 and
DAS 2025 guidelines without inventing a universal attempt ceiling. The case does not assess airway
examination, positioning, manual ventilation, laryngoscopy, device insertion, communication quality,
or team performance, and it does not model edema, bleeding, aspiration, front-of-neck access, awake
intubation, flexible endoscopy, or the post-rescue plan.

## Slice 21: capnography sampling-line obstruction during stable ventilation

The eighteenth authored scenario begins with an awake patient under regional anesthesia who is
spontaneously ventilating through a nasal carbon-dioxide sampling cannula. At a fixed tick, a new
sampling-line artifact flattens only the displayed capnogram and invalidates only the displayed
end-tidal number. Canonical carbon dioxide, respiratory rate, tidal volume, oxygen saturation, and
the plethysmogram keep following the unchanged respiratory model.

The Airway & Vent tray exposes an independent ventilation cross-check and a two-step reconnection.
Accepted engine events, not optimistic interface state, drive the debrief. The scenario scores timely
cross-checking, preservation of the stable respiratory trajectory, and restoration after the
cross-check. The nonvisual waveform description names an obstructed sample path rather than falsely
describing absent gas movement.

The evidence brief uses the Association of Anaesthetists 2021 monitoring guideline and WFSA 2021
minimum capnometer specification. It does not model water traps, kinks, leaks, secretions, sample
pumps, transport delay, dilution, calibration, analyzer faults, alarm timing, physical examination,
technical troubleshooting, communication, or sedation technique.

## Slice 22: dilutional-coagulopathy reassessment

The nineteenth authored scenario starts during a neuraxial anesthetic after prior blood loss and
crystalloid-heavy replacement. Two optional patient-baseline fields declare the current normalized
factor concentration and fibrinogen concentration. Existing scenarios omit them and preserve the
1.0 and 3.0 g/L defaults. The earlier resuscitation is stated as history rather than reconstructed
with an implausibly rapid multi-liter scripted infusion.

Modest blood loss remains active so the existing adult teaching controls are available. The learner
uses a new diffuse-oozing cue to obtain the immediate PT-ratio/fibrinogen panel, confirms the bounded
instantaneous product release, selects plasma only after the panel, and repeats the panel. The tray
keeps the current result visible and changes its action label to “Repeat panel,” making reassessment
the natural next step. The debrief reads only accepted engine events and compares the pre-plasma and
post-plasma values.

The evidence brief uses NICE NG24 for abnormal-result and reassessment context and the NHSBT poster
for unit-volume context, while explicitly refusing to convert either into individualized dosing or
a major-hemorrhage rule. Laboratory and product delay, compatibility, consumption, platelets,
cryoprecipitate, reactions, source control, team performance, massive-transfusion protocols, and
outcome remain outside the model.

## Slice 23: arterial-pressure transducer artifact

The twentieth authored scenario begins with a comfortable, awake adult under established neuraxial
anesthesia. At 60 seconds, a separate sensor state places the transducer 20 cm above its reference
level and over-damps the fluid-filled pressure system. Canonical circulation does not change. The
monitor subtracts a fixed 15 mmHg hydrostatic offset from displayed MAP and hatches the corrupted
tile; the waveform engine independently blunts the upstroke and removes the dicrotic notch while
leaving the trace unhached so those diagnostic features remain readable.

A scenario-scoped Monitor tray keeps the diagnostic loop compact. Waveform assessment records the
morphology interpretation, level-and-zero intent removes only the hydrostatic offset, and pressure-
tubing replacement intent is unavailable until the waveform has been assessed and removes only the
damping artifact. An independent cuff cycle takes 20 simulated seconds and samples canonical MAP
when it completes. The nonvisual summary reads the same displayed MAP and exposes the independent
cuff result only after that deliberate action; the corrupted MAP tile does not open the canonical
physiology “Why” panel.

The evidence brief uses Saugel et al. for leveling, zeroing, waveform-quality assessment, and the
7.5 mmHg-per-10 cm relation; Gardner for the fluid-filled system’s dynamic-response basis; and the
current ASA monitoring standard for circulation-monitoring context. Cannulation, cuff technique,
positioning, cerebral reference levels, fast-flush execution, sterility, commercial-monitor behavior,
device accuracy, and individualized treatment thresholds remain outside the model.

## Slice 24: circle-system rebreathing from exhausted absorbent

The twenty-first authored scenario begins after a tracheal tube, volume-controlled ventilation,
and 1.6% delivered sevoflurane are established at 1 L/min fresh-gas flow. At 180 seconds, exhausted
absorbent raises inspired carbon dioxide toward 8 mmHg on a fixed 45-second teaching time constant.
The phase-I capnogram baseline and patient end-tidal value rise while delivered breaths, sampling,
saturation, temperature, and airway patency remain available.

Higher fresh-gas flow lowers the inspired-carbon-dioxide target on a declared linear bridge curve
but does not repair the absorber. A scenario-scoped Circuit tray records capnogram assessment,
links directly to the existing fresh-gas control, and permits absorber-replacement intent only after
assessment. Replacement clears the fault and washes inspired carbon dioxide toward zero with a
fixed 10-second time constant. The same state drives the waveform, visual tray, nonvisual summary,
announcements, transcript, replay, and debrief.

The evidence brief uses Verbeke et al. 2023 for inspired-carbon-dioxide detection, the 3-4 mmHg
routine replacement threshold, and the fresh-gas-flow relationship; the 2024 APSF article for
workstation-specific exchange and backup-ventilation boundaries; and Association monitoring
guidance for waveform-capnography context. Exact concentrations and time constants are teaching
calibrations. Canister chemistry, channeling, desiccation, color change, valves, leaks, pressure,
commercial alarms, physical exchange, acid-base effects, sympathetic response, teams, and
individual outcome remain outside the model.

## Slice 25: routine inhalational maintenance

The twenty-second authored scenario begins after tracheal-tube confirmation with volume-controlled
ventilation, 2 L/min fresh-gas flow, and 1.2% delivered and end-tidal sevoflurane established. These
settings are a fictional starting condition, not a recommendation. A moderate scripted surgical
stimulus begins at 240 seconds and ends at 360 seconds.

The learner can start the existing modeled remifentanil infusion before that declared stimulus,
observe heart rate, pressure, predicted depth, end-tidal agent, and infusion effect together, then
reduce or stop the infusion when the stimulus falls. The debrief uses accepted infusion events and
recorded state to score time in the displayed depth range, relative hemodynamic response, timely
quiet-phase reassessment, and recovery by scenario end. Replay points bracket stimulus onset and
offset.

The evidence brief uses the FDA sevoflurane label for indication, labeled range, and age-specific MAC
context; Mapleson for the age relation already in the engine; the current US remifentanil label for
formulary range; and Association monitoring guidance for continuous assessment and processed-EEG
limits. Pain, memory, consciousness, commercial depth monitoring, individualized MAC, real surgical
nociception, injection-rate effects, neuromuscular blockade, emergence, and patient-specific dosing
remain outside the model.

## Slice 26: bounded blood-bank handoff scenario

The twenty-third authored scenario starts during established volatile anesthesia. A fixed
200 mL/min operative blood-loss event runs from 60 to 240 seconds. The existing blood-bank control
accepts a confirmed request only while that event is active, then immediately reveals the bounded
adult products. The expert teaching fixture requests release at 60.1 seconds and selects 2 fixed
red-cell units at 90 seconds; those values calibrate deterministic comparison and are not clinical
timing or dose recommendations.

The debrief reads only accepted and refused engine events. It scores timely release, rejects credit
for selecting a product before release, and reports the fixed event's hemoglobin and calculated
oxygen-delivery change alongside final pressure. Replay brackets hemorrhage onset and the accepted
release. The evidence brief and every learner-facing boundary state that specimens, identifiers,
typing, antibody screening, crossmatch, inventory, delay, authorization, consent, issue records,
bedside checks, administration, reactions, local policy, and communication are not modeled.

## Slice 27: bounded routine geriatric intravenous induction

The twenty-fourth authored scenario isolates a calm elective induction for one stable 76-year-old,
72 kg profile. It reuses the Eleveld population-mean propofol PK/PD, oxygen-wash-in, respiratory
depression, pressure, and delivered-ventilation paths. No geriatric-only physiology is added.

The expert fixture establishes 0.933 end-tidal oxygen before the first dose, then gives five accepted
20 mg propofol increments 20 seconds apart: 100 mg total, or 1.39 mg/kg. Delivered ventilation begins
at 450 mL and 12 breaths/min. In seed 616, predicted depth reaches 49.69, mean arterial pressure
reaches 73.19 mmHg, and saturation stays above 99.99%. These are deterministic teaching outputs,
not dose or outcome recommendations.

The debrief reads accepted bolus events, accepted ventilation actions, and recorded state. It scores
oxygen reserve before dose, total dose and increment timing, post-dose pressure nadir, 6–8 mL/kg
delivered ventilation, and saturation. The evidence brief and learner-facing limitations exclude
injection rate, individual dose selection, frailty, cognition, delirium, organ dysfunction,
polypharmacy, physical airway skill, neuromuscular blockade, intubation, and emergence.

## Slice 28: quantitative neuromuscular reversal during established anesthesia

The twenty-fifth authored scenario starts after airway confirmation with volatile anesthesia and
delivered ventilation already established. The learner records a quantitative baseline, gives the
declared 0.6 mg/kg rocuronium bolus, observes onset and recovery, chooses an available reversal
branch from measured depth, and confirms a train-of-four ratio of at least 0.9 afterward. It ends
before emergence or extubation.

The shared engine now records the historic peak rocuronium effect site and accepts reversal only on
the descending recovery phase. This prevents an onset ratio or count from being misread as recovery.
After the declared bolus, the deterministic teaching course reaches post-tetanic count 1 at about
274.7 seconds, count 1 at about 1,155.8 seconds, and four twitches with ratio 0.40 at about 2,503.9
seconds. The expert fixture uses the deep-recovery branch at 330 seconds; these checkpoints are
calibration evidence, not individual predictions.

The debrief reads the accepted rocuronium and reversal events plus recorded state. It scores the
pre-dose baseline, exact declared bolus, accepted recovery-phase depth match, post-reversal ratio,
continued delivered ventilation, saturation, and time in the displayed maintenance-depth range.
The evidence brief and learner-facing limitations exclude commercial-monitor behavior, stimulation
technique, electrode placement, artifact, muscle-site differences, reversal pharmacokinetics,
individual recovery, emergence, extubation readiness, recurrent block, and postoperative weakness.

## Slice 29: bounded routine pediatric inhalational induction

The twenty-sixth authored scenario reuses the same healthy 6-year-old, 20 kg respiratory profile as
the intravenous pediatric foundation but creates a distinct device-and-signal lesson. It begins
with room-air oxygen, 2 L/min fresh-gas flow, and the vaporizer off. The learner prepares at least
95% oxygen and 6 L/min flow, starts induction-range sevoflurane, watches end-tidal concentration and
age-adjusted MAC rather than equating them with the dial, then reduces delivery and reassesses.

The expert fixture prepares the circuit at 10 seconds, starts 8% delivery at 20 seconds, and reduces
to 2.5% at 28 seconds. In seed 929, the first 1-second sample above 0.8 age-adjusted MAC occurs at
27 seconds with end-tidal sevoflurane 1.954%, predicted depth 50.44, MAP 67.87 mmHg, and saturation
above 99.98%. The 7-minute trace settles near depth 40.75 and MAP 56.27 mmHg. These values calibrate
one deterministic teaching model and are not clinical timing or target recommendations.

The scenario intentionally has no syringes. The shared schema now permits device-only lessons, and
the syringe tray explains where to work instead of rendering blank. The debrief scores ordered
machine preparation, a valid entered induction setting, observed end-tidal wash-in, a subsequent
0.5–3% reduction, and 60 seconds of bounded depth, pressure, and saturation. Cooperation, distress,
parental presence, mask seal, breathing technique, excitement, airway reflexes, volatile respiratory
depression, consciousness, IV access, airway placement, emergence, and individual need remain absent.

## Slice 30: bounded obstetric general anesthesia

The twenty-seventh authored scenario begins with one term patient requiring emergency cesarean
delivery under general anesthesia. A new `term-pregnancy` respiratory profile uses lower functional
residual capacity and higher oxygen consumption than the healthy-adult profile, calibrated only to
the published direction and approximate pregnancy apnea course. The learner accepts at least 95%
inspired oxygen and 10 L/min fresh-gas flow, reaches end-tidal oxygen of at least 0.90, gives the
declared propofol action before rocuronium, waits for displayed count zero, performs one modeled
airway attempt, and confirms subsequent delivered ventilation and capnography.

In seed 1, the expert fixture prepares at 10 seconds, gives propofol at 90 seconds and rocuronium at
91 seconds, begins video laryngoscopy at 99.2 seconds, records modeled placement at 121.2 seconds,
and resumes 470 mL by 12 breaths/min ventilation. The 4-minute regression trace has a saturation
nadir of 96.73% and ends near EtCO2 39.73 mmHg, MAP 65.56 mmHg, and predicted depth 46.04. These are
teaching outputs, not individual timing, dose, or outcome recommendations.

The debrief reconstructs pre-induction machine settings, reads the end-tidal value at induction,
rejects paralysis-before-hypnosis, requires the displayed block signal before instrumentation, and
does not accept capnography after a failed attempt as proof of tracheal placement. Fetal physiology,
delivery, aspiration, cricoid pressure, awareness, neonatal effects, hemorrhage, emergence,
extubation, physical technique, and team performance remain outside the model.

## Slice 31: bounded preeclampsia response before urgent delivery

The twenty-eighth authored scenario begins after the diagnosis and urgent-delivery decision. A
prior pressure of 168/112 mmHg and persistent headache are declared. The learner repeats the
canonical simulated pressure, then uses one scenario-declared maternal-response tray for a 20 mg IV
labetalol branch and a separate 4 g IV magnesium-sulfate seizure-prophylaxis branch. Treatment is
engine-owned accepted state, not optimistic component state, and a raw request cannot earn credit.

Labetalol applies a fixed 18% pressure endpoint and 8% heart-rate endpoint on a 45-second teaching
time constant. In seed 31, the first engine sample is 164.63/120.19 mmHg with MAP 135.00 mmHg; 60
seconds after the accepted labetalol action it is 142.81/104.26 mmHg with MAP 117.11 mmHg. Magnesium
does not alter pressure or any other patient state. The comparative regression requires an otherwise
identical run with and without magnesium to produce identical patient state.

The debrief requires an accepted severe-range repeat before treatment, records the accepted
labetalol and magnesium purposes separately, and credits reassessment only from a later accepted
pressure below 160/110 mmHg with MAP at least 65 mmHg. Diagnosis, laboratory criteria, serial cuff
error, alternative or escalating antihypertensives, pharmacokinetics, infusion duration, magnesium
maintenance or toxicity, eclampsia, pulmonary edema, fetal status, delivery planning, anesthetic
technique, surgery, postpartum care, and teams remain outside the model.

## Slice 32: bounded pneumothorax under positive-pressure ventilation

The twenty-ninth authored scenario begins during stable volume-controlled ventilation after a
declared left subclavian central-line placement. At 60 simulated seconds, a left pleural teaching
drive produces a declared airway-pressure alarm with falling saturation, end-tidal carbon dioxide,
cardiac output, and arterial pressure. The engine does not claim a numerical pressure or compliance
model and the observable pattern remains a differential until assessed in context.

The focused crisis tray puts “check bilateral ventilation” beside “call for help,” links the learner
to 100% oxygen in the existing ventilator tray, and requires confirmation before recording immediate
left-chest decompression intent. The assessment returns markedly reduced left air entry, preserved
right air entry, and unchanged documented tube depth. The decompression control deliberately does
not expose site, needle, thoracostomy, drain, or equipment choices.

The crisis drive rises on a fixed 4-second teaching time constant and clears on a fixed 12-second
time constant after accepted decompression intent. Debrief credit comes from accepted engine events,
accepted ventilator actions, and observed recovery to saturation at least 94% with mean arterial
pressure at least 65 mmHg. The trajectory is deterministic and cannot predict a patient outcome.

## Slice 33: bounded aspiration-risk recognition

The thirtieth authored scenario is a day-of-procedure reasoning vignette rather than an aspiration
physiology model. One elective patient reports nausea and bloating during week 3 of semaglutide
dose escalation despite following ordinary fasting instructions. The learner reviews medication
phase, symptoms, fasting, and urgency together, then records one risk classification and one
disposition.

The expert path classifies elevated delayed-gastric-emptying risk and defers the elective case for
symptom resolution and shared replanning. The action order and accepted choices live in engine
state so raw requests, unsupported values, skipped review, and duplicates cannot earn debrief
credit. The controls explicitly contrast this patient-specific path with routine progression.

The scenario changes no physiology and estimates no probability. It does not simulate gastric
contents, regurgitation, aspiration, ultrasound, liquid-diet preparation, medication cessation,
glycemic consequences, emergency care, airway technique, local policy, or the quality of shared
decision-making. Its source brief records that the multi-society document is guidance built on
limited evidence and may change as the evidence base evolves.

## Slice 34: bounded emergence with residual blockade

The thirty-first authored scenario is a short emergence decision snapshot. A secured tracheal tube
and delivered ventilation remain in place while four visible twitches, no detectable qualitative
fade, and a quantitative train-of-four ratio of 0.72 create the disagreement the learner must
resolve. The ratio is a declared static fixture mapped through the existing neuromuscular teaching
signal, not a hidden dose or individual recovery prediction.

The engine accepts an ordered quantitative review, residual-or-recovered classification, and
confirmed defer-or-proceed plan only in the declared lesson. The expert path classifies residual
blockade below 0.9 and records continued airway and ventilatory support. Raw requests, skipped
review, unsupported values, and duplicate decisions cannot earn debrief credit.

This is not the separate quantitative reversal-selection lab or the future full extubation-readiness
scenario. It does not simulate drug dosing, spontaneous recovery, consciousness, airway reflexes,
airway removal, postoperative weakness, or outcome. Reaching 0.9 would satisfy the neuromuscular
checkpoint only; it would not prove complete extubation readiness.

## Slice 35: bounded delayed-emergence differential

The thirty-second authored scenario begins 20 minutes after anesthetic delivery ended with the
tracheal tube and delivered ventilation still established. It reveals an ordered sequence of
immediate support, recorded anesthetic and quantitative-block evidence, four fixed metabolic
findings, and a focused neurologic examination. The expert path recognizes the new lateralizing
pattern and records urgent neurologic evaluation while airway support continues.

Accepted progression is engine-owned and deterministic. Skipped steps, duplicates, unknown actions,
and use outside the declared lesson are refused; debrief credit comes only from accepted events.
The values and examination are authored fixtures. The slice does not measure consciousness,
simulate laboratory acquisition or drug concentrations, establish a diagnosis, choose imaging or
treatment, reproduce team workflow, or model outcome.
