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
