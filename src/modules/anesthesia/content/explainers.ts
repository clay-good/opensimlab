/**
 * Concept explainers (learning/knowledge-layer → Concept Explainers).
 *
 * Each is under 250 words, in plain language, with one diagram and a link to the
 * scenario that demonstrates it. Every one is clinical content and carries a
 * clinical review and exact maturity records.
 */

import type { ContentMaturity } from '@platform/catalog/maturity';

export interface Diagram {
  /** Inline SVG drawn from design tokens. No image file is fetched. */
  readonly kind: 'hysteresis' | 'apnea-curve' | 'synergy-surface' | 'capnogram-phases';
  readonly caption: string;
}

export interface ClinicalReview {
  readonly reviewer: string;
  readonly credential: string;
  readonly reviewedOn: string;
  readonly reviewBy: string;
  readonly contentVersion: string;
  readonly sources: readonly string[];
}

export interface Explainer {
  readonly id: string;
  readonly maturity: ContentMaturity;
  readonly title: string;
  /** Under 250 words. The word count is asserted in the tests. */
  readonly body: string;
  readonly diagram: Diagram;
  /** The scenario or sandbox state that demonstrates it live. */
  readonly showMe: { readonly scenarioId: string; readonly atTick?: number };
  /** The guideline or source this reflects, with its year. */
  readonly reflects: string;
  readonly review: ClinicalReview;
}

const UNSIGNED: ClinicalReview = {
  reviewer: 'UNSIGNED',
  credential: 'UNSIGNED',
  reviewedOn: '1970-01-01',
  reviewBy: '1970-01-01',
  contentVersion: '0.1.0',
  sources: [],
};

export const EXPLAINERS: readonly Explainer[] = [
  {
    id: 'hysteresis-and-effect-site-lag',
    maturity: 'draft',
    title: 'Hysteresis and effect-site lag',
    body:
      'When you push a bolus, the concentration in the blood spikes within seconds. The '
      + 'concentration where the drug actually works — the brain — does not. It rises more slowly, '
      + 'peaks later, and peaks lower, because the drug has to cross out of the blood to get there.\n\n'
      + 'That delay is why the patient is not asleep the moment the syringe empties, and why the '
      + 'pressure keeps falling after you have stopped giving anything.\n\n'
      + 'The practical consequence is about waiting. If you give a second dose because the first '
      + 'one "has not worked yet", you are dosing against a number that was always going to arrive. '
      + 'The second dose lands on top of the first at its peak, and the patient gets far more drug '
      + 'than either dose alone. This is stacking, and it is the commonest way a learner produces '
      + 'profound hypotension in this simulator.\n\n'
      + 'The concentration panel draws both curves. The gap between the plasma peak and the '
      + 'effect-site peak is the time to peak effect for the active model. Watch it once and you '
      + 'will not need to be told again.',
    diagram: { kind: 'hysteresis', caption: 'Plasma concentration spikes and falls; effect-site concentration rises later to a lower peak.' },
    showMe: { scenarioId: 'routine-induction' },
    reflects: 'Standard pharmacokinetic principle; the curves are drawn from the active published model.',
    review: UNSIGNED,
  },
  {
    id: 'preoxygenation-and-safe-apnea-time',
    maturity: 'draft',
    title: 'Preoxygenation and safe apnoea time',
    body:
      'Breathing high-concentration oxygen before you take the airway away replaces the nitrogen '
      + 'in the lungs with oxygen. The lungs become a reservoir. How long that reservoir lasts is '
      + 'the time you have to secure the airway before the saturation falls.\n\n'
      + 'Benumof and colleagues MODELLED it; nobody was desaturated to find these numbers out. '
      + 'Assuming preoxygenation worked, a healthy 70 kg adult has roughly eight minutes to a '
      + 'saturation of 90%, a moderately ill adult about five, and an obese adult under three, '
      + 'because their functional residual capacity is small and their consumption is high.\n\n'
      + 'Without preoxygenation, the same healthy adult has one to two minutes.\n\n'
      + 'The endpoint is END-TIDAL oxygen near 0.9, not the flowmeter. A leaking mask delivers '
      + '1.0 to the circuit and 0.4 to the patient, and the reservoir never fills.\n\n'
      + 'Two things follow. First, preoxygenation is not a ritual; it is the difference between a '
      + 'calm second attempt and an emergency. Second, the number that matters is not the '
      + 'saturation now, it is how long it will stay there — and that depends on the patient in '
      + 'front of you, not on the average patient.\n\n'
      + 'Watch the saturation during an apnoea. It sits almost still, then falls off a cliff. That '
      + 'is the shape of the oxyhaemoglobin dissociation curve, and it is why 90% is the number '
      + 'people react to.',
    diagram: { kind: 'apnea-curve', caption: 'Saturation holds on a plateau, then falls steeply once it passes 90%.' },
    showMe: { scenarioId: 'routine-induction' },
    reflects: 'Benumof JL, Dagg R, Benumof R. Anesthesiology 1997;87:979-82 (PMID 9357902).',
    review: UNSIGNED,
  },
  {
    id: 'hypnotic-opioid-synergy',
    maturity: 'draft',
    title: 'Hypnotic–opioid synergy',
    body:
      'Propofol and remifentanil are not additive. Given together they produce more effect than '
      + 'the sum of what each produces alone, and the difference is large enough to change how you '
      + 'dose both.\n\n'
      + 'Practically: with an opioid on board you need markedly less hypnotic for the same depth, '
      + 'and the patient tolerates incision without a haemodynamic response. Without one, you can '
      + 'push the hypnotic deep enough to flatten the blood pressure and the patient will still '
      + 'react to the knife, because hypnotic depth is not analgesia.\n\n'
      + 'That is the balance the simulator is asking you to feel. Too much hypnotic and too little '
      + 'opioid gives you a hypotensive patient who responds to stimulus. The right combination '
      + 'gives you a stable patient at a lower total dose of each.\n\n'
      + 'The depth index here is a PREDICTED value from a published pharmacodynamic model, on the '
      + '0–100 scale those models were fitted to. It is not the output of any monitor, and it is '
      + 'computed from effect-site concentration rather than measured from an electroencephalogram.',
    diagram: { kind: 'synergy-surface', caption: 'The combination reaches a given depth at lower concentrations of both drugs than either alone would need.' },
    showMe: { scenarioId: 'routine-induction', atTick: 3600 },
    reflects: 'Published hypnotic–opioid response-surface models; the interaction coefficient here is an Open Sim Lab calibration, recorded in the limitations register.',
    review: UNSIGNED,
  },
  {
    id: 'vasodilation-versus-hypovolemia',
    maturity: 'draft',
    title: 'Vasodilation is not hypovolaemia',
    body:
      'Two patients have a mean arterial pressure of 52. One is vasodilated from an induction '
      + 'dose. The other has lost a litre of blood. The number is the same. The treatment is not.\n\n'
      + 'Pressure is not a thing the body sets. It is what you get from cardiac output multiplied '
      + 'by vascular resistance. Anaesthetic agents drop the resistance. Bleeding drops the output. '
      + 'A vasoconstrictor fixes the first and only borrows time on the second.\n\n'
      + 'Give a vasopressor to a vasodilated patient and the pressure comes up and stays up, and '
      + 'the heart rate falls because the baroreflex is satisfied. Give the same drug to a '
      + 'hypovolaemic patient and the pressure rises briefly and slides back, while cardiac output '
      + 'stays low the whole time — because you have squeezed an empty tank.\n\n'
      + 'The tell is what else is happening. Falling end-tidal carbon dioxide, a narrow pulse '
      + 'pressure that swings with the ventilator, and a pressure that will not stay up all point '
      + 'at volume. The Why panel will rank the contributors for you, but the point is to learn to '
      + 'read them yourself.',
    diagram: { kind: 'hysteresis', caption: 'The same mean pressure reached two ways responds differently to the same drug.' },
    showMe: { scenarioId: 'routine-induction' },
    reflects: 'Standard cardiovascular physiology.',
    review: UNSIGNED,
  },
  {
    id: 'capnogram-morphology',
    maturity: 'draft',
    title: 'Reading the capnogram shape',
    body:
      'The end-tidal number tells you one thing. The shape tells you several, and it usually tells '
      + 'you first.\n\n'
      + 'A normal capnogram has four phases: a flat inspiratory baseline at zero, a steep '
      + 'expiratory upstroke, a nearly flat alveolar plateau, and a steep inspiratory downstroke. '
      + 'The angle between the upstroke and the plateau is the alpha angle, normally around 100 to '
      + '110 degrees.\n\n'
      + 'In obstruction the upstroke slopes and the plateau climbs, opening that angle out into '
      + 'the shark fin. Crucially, the shape changes while the end-tidal value is still inside its '
      + 'alarm limits, so a learner who watches only the number finds out late.\n\n'
      + 'Other shapes worth knowing: a notch in the plateau as neuromuscular blockade wears off, '
      + 'a baseline that fails to return to zero in rebreathing, small ripples at the heart rate '
      + 'late in a flat plateau, a small trace that decays over a few breaths in oesophageal '
      + 'intubation, and no trace at all in a disconnection.\n\n'
      + 'Learn the shapes. The number will catch up.',
    diagram: { kind: 'capnogram-phases', caption: 'The four phases, with the alpha angle marked between phase II and phase III.' },
    showMe: { scenarioId: 'routine-induction' },
    reflects: 'Standard capnography teaching.',
    review: UNSIGNED,
  },
  {
    id: 'airway-assessment-predicts-poorly',
    maturity: 'draft',
    title: 'Airway assessment predicts poorly, and what to do about it',
    body:
      'Bedside airway tests — the Mallampati classification, thyromental distance, mouth opening, '
      + 'neck movement — are used to predict which patients will be difficult to intubate.\n\n'
      + 'They do not do it well. No single bedside test reliably predicts difficult laryngoscopy. '
      + 'Sensitivity is modest, specificity is modest, and because genuinely difficult airways are '
      + 'uncommon, most patients a test flags will turn out to be easy while some it clears will '
      + 'not be.\n\n'
      + 'This is not an argument for skipping the assessment. It is an argument about what to do '
      + 'with the result. A reassuring assessment does not license a plan with no fallback. The '
      + 'behaviour the evidence supports is to prepare for difficulty you did not predict: know '
      + 'your next two steps before the first one, have the alternative device in the room, limit '
      + 'attempts, call for help early, and watch the clock and the saturation rather than the '
      + 'larynx.\n\n'
      + 'In this simulator the view you get is drawn from a distribution anchored to published '
      + 'elective-surgery incidence. Most of the time it is easy. Occasionally it is not, and that '
      + 'is the point.',
    diagram: { kind: 'hysteresis', caption: 'Predicted difficulty against observed difficulty: the overlap is large.' },
    showMe: { scenarioId: 'routine-induction' },
    reflects: '2022 ASA Practice Guidelines for Management of the Difficult Airway (PMID 34762729).',
    review: UNSIGNED,
  },
  {
    id: 'depth-monitoring-and-its-limits',
    maturity: 'draft',
    title: 'Depth of anaesthesia and what an index cannot tell you',
    body:
      'The depth value on this screen is a PREDICTION. It is computed from effect-site '
      + 'concentration through a published pharmacodynamic model, on the 0–100 scale those models '
      + 'were calibrated against. It is not the output of any commercial monitor and does not '
      + 'reproduce any proprietary algorithm.\n\n'
      + 'Even a real processed-electroencephalogram index has limits worth knowing. Such indices '
      + 'behave differently with ketamine and with nitrous oxide, which can deepen anaesthesia '
      + 'while the number goes up. They are susceptible to electromyographic artifact, so a '
      + 'partially paralysed patient can read differently from an unparalysed one at the same '
      + 'anaesthetic depth. They behave differently in the elderly. And large trials have not shown '
      + 'any single index to be uniformly superior to end-tidal agent guidance for preventing '
      + 'awareness.\n\n'
      + 'So treat the number as one input among several. Agent concentration, haemodynamic '
      + 'response to stimulus, and the clinical context all still matter.',
    diagram: { kind: 'synergy-surface', caption: 'The index is a model output, not a measurement.' },
    showMe: { scenarioId: 'routine-induction' },
    // Named trials, not "the awareness trial literature". This is the explainer
    // whose entire point is that a number deserves scepticism, so the claim it
    // makes about the evidence had better be checkable.
    reflects: 'Published pharmacodynamic models; B-Unaware (Avidan et al., N Engl J Med '
      + '2008;358:1097-108, PMID 18337600) and BAG-RECALL (Avidan et al., N Engl J Med '
      + '2011;365:591-600, PMID 21848460) for the comparison with end-tidal agent guidance.',
    review: UNSIGNED,
  },
  {
    id: 'train-of-four-and-residual-blockade',
    maturity: 'draft',
    title: 'Train-of-four and residual neuromuscular blockade',
    body:
      'A train-of-four monitor stimulates a peripheral nerve four times and measures the muscle '
      + 'response. The ratio of the fourth response to the first quantifies fade. A ratio near '
      + '1 means the responses are similar; a lower ratio means neuromuscular transmission is '
      + 'still impaired.\n\n'
      + 'Rocuronium causes paralysis. It does not cause sleep, amnesia, or analgesia. A patient '
      + 'can therefore be unable to breathe or move while still inadequately anesthetized. The '
      + 'hypnotic must come first, and ventilation must be available before the blocker is given.\n\n'
      + 'Counting visible twitches is not enough to exclude residual weakness. Fade becomes hard '
      + 'to detect by touch or sight before the quantitative ratio has recovered to 0.9. That is '
      + 'why current guidance calls for quantitative monitoring at the adductor pollicis and a '
      + 'ratio of at least 0.9 before extubation.\n\n'
      + 'The ratio here is produced by an Open Sim Lab teaching model. It demonstrates onset, '
      + 'paralysis, and recovery directionally; it does not predict an individual recovery time '
      + 'or readiness for extubation. The reversal controls use the measured depth and the 2/4 '
      + 'mg/kg sugammadex branches in current guidance. Neostigmine with an antimuscarinic is an '
      + 'agent-class teaching effect accepted only during minimal block; dose pharmacology is not modeled.',
    diagram: { kind: 'hysteresis', caption: 'Four measured responses: fade decreases as quantitative recovery approaches a ratio of 0.9.' },
    showMe: { scenarioId: 'rapid-sequence-induction' },
    reflects: '2023 ASA Practice Guidelines for Monitoring and Antagonism of Neuromuscular '
      + 'Blockade (PMID 36520073).',
    review: UNSIGNED,
  },
  {
    id: 'malignant-hyperthermia-early-pattern',
    maturity: 'draft',
    title: 'Malignant hyperthermia: carbon dioxide before temperature',
    body:
      'Malignant hyperthermia is a rare hypermetabolic response in a susceptible person exposed '
      + 'to a potent volatile anesthetic or succinylcholine. The name invites a dangerous mistake: '
      + 'waiting for hyperthermia. Rising carbon dioxide despite adequate minute ventilation and '
      + 'unexplained tachycardia are common early clues; rigidity may follow, while temperature is '
      + 'often later. None of these findings alone proves the diagnosis.\n\n'
      + 'When the pattern is suspected, stop triggering agents, use high-flow 100% oxygen and '
      + 'hyperventilation, and give intravenous dantrolene promptly. MHAUS specifies 2.5 mg/kg IV '
      + 'and repetition until carbon dioxide, rigidity, or heart rate improves. Cooling is guided '
      + 'by temperature, not started and continued without an endpoint.\n\n'
      + 'This scenario exposes only the early pattern and initial response. Its carbon-dioxide, '
      + 'rigidity, heat, and dantrolene trajectories are bounded teaching models. Real management '
      + 'also requires help, laboratory-guided treatment of acidosis and hyperkalemia, monitoring '
      + 'for rhabdomyolysis and complications, and continued post-crisis care.',
    diagram: {
      kind: 'capnogram-phases',
      caption: 'End-tidal carbon dioxide rises before the later modeled temperature increase.',
    },
    showMe: { scenarioId: 'early-malignant-hyperthermia-during-volatile-anesthesia', atTick: 2400 },
    reflects: 'MHAUS Managing a Crisis, current page consulted 2026-08-23; EMHG updated 2024 '
      + 'guideline (PMID 39482150); Larach et al. registry analysis (PMID 20081135).',
    review: {
      ...UNSIGNED,
      sources: [
        'MHAUS Managing a Crisis, current page consulted 2026-08-23',
        'EMHG updated 2024 guideline, PMID 39482150',
        'Larach et al. 2010, PMID 20081135',
      ],
    },
  },
  {
    id: 'aspiration-risk-is-more-than-fasting-time',
    maturity: 'draft',
    title: 'Aspiration risk is more than fasting time',
    body:
      'A fasting interval answers what the patient last ate or drank. It does not, by itself, '
      + 'prove that the stomach is empty. Conditions and medicines that delay gastric emptying '
      + 'can change the meaning of an otherwise ordinary fasting history.\n\n'
      + 'Current multi-society GLP-1 guidance therefore starts with the whole patient. Relevant '
      + 'signals include being early in treatment or dose escalation, a recent dose increase, '
      + 'higher doses, nausea, vomiting, abdominal pain, bloating or constipation, and other '
      + 'conditions that delay emptying. Procedure urgency and the consequences of interrupting '
      + 'treatment matter too.\n\n'
      + 'This is not a rule that every patient taking a GLP-1 medicine must stop it or cancel '
      + 'surgery. Most lower-risk patients can continue treatment. When concern is elevated, the '
      + 'patient, procedural team, anesthesia team, and prescribing team weigh options such as '
      + 'advance diet modification, gastric ultrasound where expertise exists, an anesthesia '
      + 'plan that accounts for aspiration risk, or deferral when the risk is expected to fall.\n\n'
      + 'In this vignette, dose escalation and active gastrointestinal symptoms coexist before an '
      + 'elective operation. That patient-specific combination supports deferral and shared '
      + 'replanning. The simulator does not know what is in the stomach and cannot show that '
      + 'aspiration was prevented.',
    diagram: {
      kind: 'hysteresis',
      caption: 'Medication phase, current symptoms, fasting history, procedure urgency, and available safeguards belong in one assessment.',
    },
    showMe: { scenarioId: 'aspiration-risk-recognition' },
    reflects: 'Kindel et al. multi-society GLP-1 perioperative guidance, published online 2024 '
      + '(PMID 39370500), and the ASA issuing-body summary dated October 29, 2024.',
    review: {
      ...UNSIGNED,
      sources: [
        'Kindel et al. multi-society GLP-1 perioperative guidance, PMID 39370500',
        'American Society of Anesthesiologists issuing-body summary, October 29, 2024',
      ],
    },
  },
];

export function getExplainer(id: string): Explainer {
  const explainer = EXPLAINERS.find((candidate) => candidate.id === id);
  if (!explainer) throw new Error(`Unknown explainer: ${id}`);
  return explainer;
}

/** Word count, so the under-250-word rule is checkable. */
export function wordCount(text: string): number {
  return text.trim().split(/\s+/).filter(Boolean).length;
}
