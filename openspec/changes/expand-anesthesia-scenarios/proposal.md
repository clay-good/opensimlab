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

## Impact

These eight slices close the hemorrhage, obstetric-presentation, rapid-sequence-induction,
awareness-under-paralysis, anaphylaxis, and malignant-hyperthermia gaps and add an honest initial-response laryngospasm case. They do not complete the bundled-library,
neuromuscular-reversal, or crisis-injector requirements. The seventh also closes the bounded
pediatric-family gap without claiming a general pediatric patient model. The eighth reaches the
minimum count of 12 scenarios and closes the bounded difficult-airway rescue gap, while local-
anesthetic systemic toxicity and cardiac arrest remain required library work.
