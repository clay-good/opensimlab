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

## What changes

- Add a fifth scenario covering recognition of compensated hemorrhage and initial crystalloid
  temporization during emergency laparotomy.
- Add learner-delivered balanced crystalloid with a fixed 25% intravascular-retention teaching
  model, input validation, event logging, deterministic replay, and a working cockpit tray.
- Track circulating hemoglobin mass so whole-blood loss preserves concentration and retained
  crystalloid causes dilution.
- Evaluate the new scenario's objectives from the recorded actions and map them to the supported
  curriculum frameworks.
- State the boundary plainly: no blood products, coagulopathy, calcium, laboratory guidance,
  source-control action, team behavior, or massive-transfusion protocol is simulated.
- Add a sixth scenario covering rapid-sequence induction in a full-stomach adult with an otherwise
  straightforward airway.
- Add rocuronium as a bolus-only teaching model that drives quantitative train-of-four count and
  ratio, with no hypnotic, analgesic, or direct hemodynamic effect.
- Make laryngoscopy consume its declared simulated time and evaluate whether the learner waited
  for modeled block onset while preserving the oxygen margin.
- State the second boundary plainly: reversal, emergence, extubation, regurgitation, aspiration,
  cricoid pressure, and difficult-airway rescue remain unavailable.
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

## Impact

These five slices close the hemorrhage, obstetric-presentation, rapid-sequence-induction,
awareness-under-paralysis, and anaphylaxis gaps and add an honest initial-response laryngospasm case. They do not complete the bundled-library,
neuromuscular-reversal, or crisis-injector requirements.
