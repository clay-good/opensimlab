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
