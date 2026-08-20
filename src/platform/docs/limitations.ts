/**
 * The limitations register (platform/clinical-governance → The Limitations Register).
 *
 * Each entry names the specific simplification, the clinical situation where it
 * would mislead, and the correct clinical understanding. It is linked from the
 * interface, not buried in a repository file, and a scenario whose teaching points
 * sit near one of these names it in the briefing.
 */

export interface Limitation {
  readonly id: string;
  readonly simplification: string;
  readonly whereItMisleads: string;
  readonly correctUnderstanding: string;
  /** Scenarios that should name this in their briefing. */
  readonly briefIn: readonly string[];
}

export const LIMITATIONS: readonly Limitation[] = [
  {
    id: 'oxyhaemoglobin-curve-is-fixed',
    simplification: 'The oxyhaemoglobin dissociation curve does not shift. Saturation is a '
      + 'function of arterial oxygen tension alone, with no Bohr effect and no temperature term, '
      + 'and core temperature never changes during a case.',
    whereItMisleads: 'Anywhere a shift is the teaching point: the acidotic or hypercapnic patient '
      + 'unloading oxygen more readily at the tissue, the hypothermic patient holding on to it, '
      + 'and stored-blood transfusion.',
    correctUnderstanding: 'Acidosis, hypercapnia and pyrexia move the curve right, so the same '
      + 'saturation corresponds to a higher oxygen tension and oxygen is given up more readily at '
      + 'the tissues. Here the curve is frozen at its normal position.',
    briefIn: [],
  },
  {
    id: 'no-shunt-or-dead-space-dynamics',
    simplification: 'The alveolar-to-arterial oxygen gradient is a fixed constant per patient '
      + 'profile. There is no shunt fraction and no ventilation-perfusion model, so the gradient '
      + 'does not widen with apnoea, atelectasis, position or one-lung ventilation, and positive '
      + 'end-expiratory pressure cannot narrow it.',
    whereItMisleads: 'Recruitment, laparoscopy, the obese patient in Trendelenburg, and any '
      + 'desaturation whose mechanism is shunt rather than hypoventilation.',
    correctUnderstanding: 'Most intraoperative hypoxaemia is a shunt problem, and the difference '
      + 'between a shunt and hypoventilation is what decides whether more oxygen or more pressure '
      + 'is the answer. This simulator cannot teach that distinction.',
    briefIn: [],
  },
  {
    id: 'bolus-injection-is-instantaneous',
    simplification: 'A bolus enters the central compartment instantaneously. Injection rate is '
      + 'not modelled, so a dose given over two seconds and the same dose given over sixty behave '
      + 'identically.',
    whereItMisleads: 'Remifentanil in particular: the drug card correctly warns that a rapid '
      + 'bolus causes bradycardia and chest-wall rigidity, and this simulator will let a learner '
      + 'do exactly that with no consequence at all. The same applies to the peak-plasma spike '
      + 'that drives propofol induction hypotension.',
    correctUnderstanding: 'How fast you push it changes the peak plasma concentration and the '
      + 'haemodynamic response, sometimes more than how much you push.',
    briefIn: ['routine-induction'],
  },
  {
    id: 'opioid-alone-hypnosis',
    simplification: 'The Greco response surface necessarily gives remifentanil a hypnotic effect '
      + 'of its own. At 8 ng/mL with no propofol it predicts a depth index around 71.',
    whereItMisleads: 'Any attempt to explore what the opioid alone does to depth. Clinically, '
      + 'remifentanil alone is a poor hypnotic and barely moves a processed EEG index.',
    correctUnderstanding: 'Opioids blunt the response to stimulation far more than they produce '
      + 'unconsciousness. An opioid-heavy technique with too little hypnotic is a recognised route '
      + 'to awareness, and this surface understates that risk.',
    briefIn: [],
  },
  {
    id: 'peep-not-modelled',
    simplification: 'Positive end-expiratory pressure can be set and the machine holds it, but '
      + 'its physiological effect is not modelled. It changes neither functional residual '
      + 'capacity, nor shunt fraction, nor venous return.',
    whereItMisleads: 'Any case where recruitment is the point: obesity, laparoscopy, one-lung '
      + 'ventilation, or a desaturation that real positive end-expiratory pressure would fix.',
    correctUnderstanding: 'Positive end-expiratory pressure recruits collapsed alveoli and '
      + 'reduces shunt, and at the same time raises intrathoracic pressure and can drop cardiac '
      + 'output. Here it does neither, so it will not rescue a saturation and will not cost you '
      + 'a blood pressure.',
    briefIn: [],
  },
  {
    id: 'no-regional-anaesthesia',
    simplification: 'Regional anaesthesia and block spread are not modelled at all.',
    whereItMisleads: 'Any case where a block would change the opioid requirement, the haemodynamics, '
      + 'or the recovery. Local anaesthetic systemic toxicity cannot be simulated either.',
    correctUnderstanding: 'A working block changes the whole anaesthetic plan. Nothing you learn '
      + 'here about opioid dosing transfers to a patient with a block in place.',
    briefIn: [],
  },
  {
    id: 'no-coagulopathy',
    simplification: 'Coagulation is not modelled. Blood loss removes volume and haemoglobin and '
      + 'nothing else.',
    whereItMisleads: 'Massive transfusion, where dilutional and consumptive coagulopathy drives '
      + 'management as much as volume does.',
    correctUnderstanding: 'In real major haemorrhage the clotting is often the problem, and '
      + 'replacing volume without addressing it makes the bleeding worse.',
    briefIn: [],
  },
  {
    id: 'acid-base-approximate',
    simplification: 'Acid-base compensation is approximated by the carbon dioxide model alone. '
      + 'There is no metabolic component, no base excess, and no renal compensation.',
    whereItMisleads: 'Prolonged cases, sepsis, diabetic emergencies, and any situation where a '
      + 'metabolic acidosis would be driving the respiratory pattern.',
    correctUnderstanding: 'Arterial carbon dioxide is one axis of acid-base status. A normal '
      + 'end-tidal value does not mean a normal pH.',
    briefIn: [],
  },
  {
    id: 'no-fresh-gas-flow',
    simplification: 'Fresh gas flow is not modelled, so volatile wash-in does not change with flow '
      + 'and there is no circuit rebreathing.',
    whereItMisleads: 'Learning low-flow anaesthesia, or understanding why a vaporizer setting takes '
      + 'so much longer to reach the alveolus at 0.5 L/min than at 8 L/min.',
    correctUnderstanding: 'At low fresh gas flow the circuit concentration lags the dial setting '
      + 'substantially, which is the whole difficulty of low-flow technique.',
    briefIn: ['routine-induction'],
  },
  {
    id: 'no-neuromuscular-blockade',
    simplification: 'Neuromuscular blockade is not modelled in this alpha. The train-of-four '
      + 'readout is inert and no blocking agent is in the formulary.',
    whereItMisleads: 'Anything about intubating conditions, residual blockade, or reversal. The '
      + 'airway model here assumes conditions that a blocker would normally provide.',
    correctUnderstanding: 'Extubating below a train-of-four ratio of 0.9 is residual blockade, and '
      + 'a qualitative twitch assessment cannot exclude it. None of that is exercised here.',
    briefIn: ['routine-induction'],
  },
  {
    id: 'interaction-coefficient-calibrated',
    simplification: 'The propofol–remifentanil interaction uses a published response-surface FORM '
      + 'with a coefficient calibrated by Open Sim Lab rather than transcribed from a paper.',
    whereItMisleads: 'Any quantitative conclusion about exactly how much propofol a given '
      + 'remifentanil concentration spares.',
    correctUnderstanding: 'The direction and the rough magnitude of the synergy are right. The '
      + 'exact numbers are ours, not the literature\'s, and are marked as a teaching model.',
    briefIn: ['routine-induction'],
  },
  {
    id: 'no-team-or-communication',
    simplification: 'There is no surgeon, no scrub team, no assistant, and no communication of any '
      + 'kind.',
    whereItMisleads: 'Crisis management, where most of what determines the outcome is who you '
      + 'called, when, and what you said.',
    correctUnderstanding: 'Crisis resource management is a team skill. This simulator cannot teach '
      + 'it and mannequin-based simulation remains necessary for it.',
    briefIn: [],
  },
  {
    id: 'parameters-unverified',
    simplification: 'Every pharmacology parameter in this build is transcribed from its primary '
      + 'publication but has NOT had the independent second-source check the project requires.',
    whereItMisleads: 'Any use of a specific number from this simulator as a fact. A mistyped digit '
      + 'would not yet have been caught by the process designed to catch it.',
    correctUnderstanding: 'Treat the concentrations here as illustrative of the shape of the '
      + 'curves, not as validated values. The validation report says which models are affected: all of them.',
    briefIn: ['routine-induction'],
  },
];

export function limitationsFor(scenarioId: string): Limitation[] {
  return LIMITATIONS.filter((limitation) => limitation.briefIn.includes(scenarioId));
}
