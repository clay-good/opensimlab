# Expand the anesthesia scenario library

## Why

The engine specification requires at least 12 bundled scenarios across routine and emergency
anesthesia. The alpha proved the platform with 4 scenarios, but it left major code-addressable
coverage gaps once the external face-validity gate was treated as provisionally passed.

The first increment was unexpected intraoperative hemorrhage. The second was rapid-sequence
induction: the smallest case that turns the existing train-of-four state and declared airway
duration into a learner decision about preoxygenation, neuromuscular-block onset, and the time
spent without ventilation. The third is awareness risk under paralysis: a running propofol pump
whose disconnected line no longer delivers hypnotic, while quantitative block removes movement
as a warning.
The fourth adds laryngospasm after airway stimulation, limited to the first observable response:
held jaw thrust with continuous positive airway pressure, high inspired oxygen, and deepening.
The fifth adds an antibiotic-triggered perioperative anaphylaxis teaching model, centered on the
common NAP6 presentation of abrupt hypotension with possible bronchospasm and initial treatment.
The sixth adds a volatile-triggered malignant-hyperthermia teaching model, centered on carbon
dioxide as an early clue, later temperature, trigger removal, hyperventilation, and dantrolene.
The seventh adds one bounded routine pediatric intravenous induction with Paedfusor propofol
kinetics and weight-derived respiratory physiology for a healthy 6-year-old weighing 20 kg.
The eighth adds a failed-intubation course with early help escalation and supraglottic rescue,
bounded to restoration and confirmation of oxygenation rather than the complete airway algorithm.
The ninth adds one bounded local-anesthetic systemic-toxicity pattern and the initial ASRA 2020
response, stopping before dysrhythmia treatment or cardiac arrest.

## What changes

- Add a fifth scenario covering recognition of compensated hemorrhage and initial crystalloid
  temporization during emergency laparotomy.
- Add learner-delivered balanced crystalloid with a fixed 25% intravascular-retention teaching
  model, input validation, event logging, deterministic replay, and a working cockpit tray.
- Track circulating hemoglobin mass so whole-blood loss preserves concentration and retained
  crystalloid causes dilution.
- Evaluate the new scenario's objectives from the recorded actions and map them to the supported
  curriculum frameworks.
- Add a later bounded adult packed-red-cell foundation with fixed unit volume and hemoglobin mass,
  separate cumulative totals, and calculated oxygen-delivery evidence.
- State the remaining boundary plainly: compatibility, other blood products, coagulopathy, calcium,
  laboratory guidance, source-control action, team behavior, and a massive-transfusion protocol are absent.
- Add a sixth scenario covering rapid-sequence induction in a full-stomach adult with an otherwise
  straightforward airway.
- Add rocuronium as a bolus-only teaching model that drives quantitative train-of-four count and
  ratio, with no hypnotic, analgesic, or direct hemodynamic effect.
- Make laryngoscopy consume its declared simulated time and evaluate whether the learner waited
  for modeled block onset while preserving the oxygen margin.
- State the second boundary plainly: the induction case stops before reversal, emergence,
  extubation, regurgitation, aspiration, cricoid pressure, or difficult-airway rescue. A later
  bounded slice adds reversal without implying the other endpoints.
- Add a seventh scenario covering a silent propofol-line disconnection during TIVA under modeled
  neuromuscular blockade.
- Keep the commanded pump rate separate from delivered propofol, expose explicit line inspection
  and reconnection actions, and preserve both in deterministic replay.
- Evaluate hypnotic-before-block order, line inspection and reconnection timing, and the concurrent
  rise in predicted depth with suppressed train-of-four.
- State the third boundary plainly: the case predicts a pharmacologic awareness-risk pattern; it
  does not model consciousness, distress, memory, recall, or a processed EEG.
- Add an eighth scenario with persistent upper-airway closure, absent gas movement, and a bounded
  learner-held jaw-thrust/continuous-positive-pressure maneuver.
- Evaluate end-tidal oxygen at closure, the timing of the combined maneuver and delivered oxygen,
  propofol deepening timing, and the lowest saturation as observable behavioral proxies.
- State the fourth boundary plainly: this is not a complete laryngospasm algorithm. Suction,
  separate adjuncts, succinylcholine, team actions, and refractory management remain unavailable.
- Add a ninth scenario with cefazolin exposure, coupled vasodilation, plasma leak, and bronchospasm.
- Record 50 micrograms IV epinephrine, rapid crystalloid, and oxygen/ventilation as observable
  initial actions, without asserting a definitive diagnosis.
- State the fifth boundary plainly: rash, tryptase, trigger removal, team behavior, arrest, and
  the complete refractory algorithm remain unavailable.
- Add a tenth scenario with latent susceptibility activated only by genuine end-tidal volatile exposure.
- Model carbon dioxide rising before tachycardia, rigidity, and later temperature; record trigger
  removal, high-flow 100% oxygen, hyperventilation, and exact 2.5 mg/kg IV dantrolene.
- State the sixth boundary plainly: this is early recognition and initial response, without
  laboratory-guided complications, team actions, intensive care, or diagnostic confirmation.
- Add an eleventh scenario for a healthy 6-year-old weighing 20 kg, with Paedfusor selected as the
  pediatric propofol kinetic model and a bounded healthy-child respiratory profile.
- Evaluate end-tidal preoxygenation, accepted 2.5–3.5 mg/kg propofol, 6–8 mL/kg delivered breaths
  with sustained observed gas exchange, and the post-induction saturation margin.
- State the seventh boundary plainly: the depth response is a shared teaching calibration, not
  validated pediatric pharmacodynamics, and pediatric hemodynamic maturation, airway-device
  sizing, maintenance, emergence, and generalization beyond this profile remain unavailable.
- Add a twelfth scenario with reproducible failed tracheal attempts, marginal facemask delivery,
  a logged airway-help request, and a fixed 15-second supraglottic-airway insertion.
- Evaluate attempt limitation, help timing, rescue-device placement, explicit oxygen delivery,
  sustained capnography, and saturation from accepted events, actions, and observed state.
- State the eighth boundary plainly: successful screen placement is not physical skill or tracheal
  intubation, and the post-rescue plan, team performance, failed supraglottic ventilation,
  cannot-intubate-cannot-oxygenate rescue, and emergency front-of-neck access remain unavailable.
- Add a thirteenth scenario after a scripted bupivacaine exposure in a 60 kg adult.
- Model observable seizure status and bounded cardiovascular depression, with IV benzodiazepine
  suppression, reduced-dose epinephrine, and weight-banded 20% lipid emulsion.
- Trace initial lipid dosing, the 12 mL/kg cap, and named drug avoidance to the ASRA 2020 checklist.
- State the ninth boundary plainly: this is not regional-anesthesia, dose-to-toxicity, dysrhythmia,
  arrest, refractory resuscitation, team, transport, or observation simulation.
- Add a fourteenth scenario beginning at a third persistent-VF cycle after two prior shocks.
- Record fixed-rate compression intent, exact 1 mg IV/IO epinephrine, and energy-selected biphasic
  defibrillation; permit bounded modeled ROSC only after the declared 200 J shockable-rhythm path.
- Preserve the irreversible hypoxic-arrest guard and ensure asystole or PEA never converts after a shock.
- State the tenth boundary plainly: screen actions do not teach physical CPR, pad safety, teams,
  reversible causes, refractory arrest, individualized outcome, or post-cardiac-arrest care.
- Add the replayable manual crisis-injector foundation for the 9 entries already backed by engine
  physiology, with two-step confirmation and explicit patient/equipment preconditions.
- Complete the injector with distinct high-spinal and venous-air-embolism teaching trajectories;
  inert or cosmetic controls do not count as crisis coverage.
- Complete bounded quantitative neuromuscular reversal with the specified 2/4 mg/kg sugammadex
  depth branches and neostigmine with an antimuscarinic only during minimal block, without
  claiming emergence or extubation.
- Promote the bounded high-spinal trajectory into a fifteenth authored scenario with a scored,
  replayable initial response: call for help, high inspired oxygen with active ventilation,
  250–500 mL crystalloid, and exact 6/12 mg IV ephedrine boluses.
- Promote the bounded venous-air-embolism trajectory into a sixteenth authored scenario with
  accepted escalation, source-control intent, 100% oxygen, and gradual monitor-pattern recovery.
- Complete the legacy bronchospasm scenario with accepted help, region-aware 5 mg nebulized
  albuterol/salbutamol, and bounded obstruction relief without simulating circuit delivery.
- Add a seventeenth scenario that makes a documented difficult-airway history actionable before
  induction, contrasts one failed attempt with repeated laryngoscopy, and moves to bounded
  supraglottic rescue without adding new airway physiology.
- Add an eighteenth scenario that isolates a capnography sampling-line obstruction during stable
  spontaneous ventilation, requires an independent cross-check before confirmed reconnection, and
  never changes canonical respiratory physiology to create the display fault.
- Add a nineteenth scenario that begins from a declared prior-dilution state during ongoing bleeding,
  then requires an accepted coagulation panel, bounded lab-guided plasma, and repeat testing without
  claiming a compatibility or massive-transfusion workflow.
- Add a twentieth scenario that keeps patient pressure separate from a misleveled and over-damped
  invasive display, then requires waveform assessment, level-and-zero intent, a delayed independent
  cuff result, and bounded signal restoration before any patient-changing treatment.
- Add a twenty-first scenario with exhausted circle-system carbon-dioxide absorbent, a raised
  inspiratory capnogram baseline, a high-fresh-gas-flow bridge, ordered assessment and replacement
  intent, and confirmed washout without claiming workstation-specific technique or patient prediction.
- Add a twenty-second scenario for routine inhalational maintenance with an established airway and
  volatile state, a declared changing surgical stimulus, modeled opioid planning, and quiet-phase
  reassessment without presenting any setting or infusion rate as an individualized prescription.
- Add a twenty-third scenario that turns the existing confirmed blood-bank release into a dedicated
  ordered-action lesson with fixed-unit red-cell response and explicit compatibility-workflow exclusions.
- Add a twenty-fourth scenario that isolates a stable older-adult intravenous induction, connects
  end-tidal oxygen reserve to small spaced propofol increments and effect-site lag, and preserves
  pressure and ventilation without claiming individual dose prediction or a general frailty model.
- Add a twenty-fifth scenario during established volatile anesthesia that distinguishes onset from
  recovery, matches a bounded reversal branch to quantitative block depth, and confirms a ratio of
  at least 0.9 without claiming emergence, extubation readiness, or individual recovery prediction.
- Add a twenty-sixth scenario for one healthy 6-year-old that separates circuit preparation,
  vaporizer delivery, end-tidal wash-in, age-adjusted MAC, and bounded response trends without
  claiming mask technique, consciousness, airway behavior, respiratory depression, or individual timing.

## Impact

These 29 slices close the hemorrhage, obstetric-presentation, rapid-sequence-induction,
awareness-under-paralysis, anaphylaxis, and malignant-hyperthermia gaps and add an honest initial-response laryngospasm case. The seventh also closes the bounded
pediatric-family gap without claiming a general pediatric patient model. The eighth reaches the
minimum count of 12 scenarios and closes the bounded difficult-airway rescue gap. The ninth closes
the required bounded local-anesthetic systemic-toxicity family. The tenth closes the required
resuscitable cardiac-arrest library family through initial modeled ROSC. The eleventh supplies the
replayable injector foundation for 9 modeled crises. The twelfth adds distinct high-spinal and
venous-air-embolism physiology and completes the required 11-entry manual injector without
claiming diagnosis, treatment, block-height, or gas-volume simulation. The thirteenth completes
bounded quantitative neuromuscular reversal while leaving emergence and extubation explicit. The
seventeenth adds the fifteenth authored scenario and a bounded high-spinal initial response without
claiming neuraxial spread, obstetric physiology, or individualized outcome.
The eighteenth adds the sixteenth authored scenario and a bounded venous-air-embolism response
without claiming gas volume, diagnostic certainty, physical source-control skill, or outcome.
The nineteenth completes the older bronchospasm case with a first-line response while preserving
its waveform-recognition lesson and explicitly excluding examination, delivery mechanics,
advanced drugs, and individual outcome.
The twentieth adds the seventeenth authored scenario and distinguishes a known difficult airway
from the existing unanticipated marginal-mask course through prior information, full facemask
delivery, pre-attempt escalation evidence, and a debrief centered on the cost of repetition.
The twenty-first adds the eighteenth authored scenario and a distinct signal-versus-patient lesson:
sampled carbon dioxide disappears while canonical ventilation stays stable, with accepted cross-check
and reconnection evidence but no claim of physical examination or device troubleshooting skill.
The twenty-second adds the nineteenth authored scenario and turns the existing bounded coagulation
capability into a distinct assessment-treatment-reassessment lesson without replaying an invented
earlier resuscitation sequence or overstating the instantaneous blood-product controls.
The twenty-third adds the twentieth authored scenario and closes the arterial-transducer artifact
gap with separate patient and sensor state, a hydrostatic display offset, dynamic-response morphology,
a delayed independent cuff sample, and accepted diagnostic/corrective intent without claiming
psychomotor or device-specific competence.
The twenty-fourth adds the twenty-first authored scenario and closes the exhausted-absorbent
rebreathing gap with an elevated inspiratory baseline, actual modeled carbon-dioxide exposure,
a bounded fresh-gas-flow bridge, ordered correction, and washout without claiming a complete
workstation, acid-base, or individual patient model.
The twenty-fifth adds the twenty-second authored scenario and the catalog's first deliberately
non-crisis maintenance loop: plan before a declared stimulus, read end-tidal agent, predicted depth,
heart rate, and pressure together, then reduce an earlier input when the stimulus falls. The fixed
stimulus and expert infusion are teaching fixtures, not a patient-specific anesthetic plan.
The twenty-sixth adds the twenty-third authored scenario and makes the previously incidental
blood-bank request a focused recognition-release-response lesson. Accepted event order and the
fixed red-cell model are inspectable, while specimens, identifiers, compatibility, inventory,
delay, emergency release, bedside checks, administration, and team communication remain excluded.
The twenty-seventh adds the twenty-fourth authored scenario and the catalog's first stable
older-adult induction loop. The labeled range, accepted increments, end-tidal oxygen, effect-site
trajectory, pressure, and ventilation are inspectable, while injection rate, frailty, cognition,
delirium, organ dysfunction, polypharmacy, physical airway skill, and individual prediction remain excluded.
The twenty-eighth adds the twenty-fifth authored scenario and turns the shared quantitative
neuromuscular controls into a dedicated measurement-decision-reassessment lesson. The engine now
requires a descending recovery-phase signal before it accepts reversal, so the same count or ratio
on onset cannot earn credit. The idealized monitor and immediate bounded response do not claim
electrode technique, commercial-device behavior, pharmacokinetics, emergence, extubation readiness,
recurrent block, postoperative weakness, or individual recovery time.
The twenty-ninth adds the twenty-sixth authored scenario and the second bounded pediatric induction
path. It makes the vaporizer-to-end-tidal lag, age-adjusted MAC, predicted depth, pressure, and
saturation inspectable, while an intentional empty syringe tray directs attention to the machine.
It does not claim cooperation, mask delivery, behavioral endpoints, consciousness, airway reflexes,
volatile respiratory depression, IV access, physical airway skill, emergence, or individual need.
