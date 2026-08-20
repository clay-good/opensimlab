/**
 * Drug cards (engine/pharmacology → Drug Cards Teach The Drug, Not Just The Math).
 *
 * Each card carries class, mechanism, typical dosing, onset and duration, the
 * adverse effects a student must anticipate, contraindications, and what to watch
 * on the monitor after giving it.
 */

import type { ClinicalReview } from './explainers';

export interface DrugCard {
  readonly drugId: string;
  readonly name: string;
  readonly drugClass: string;
  readonly mechanism: string;
  readonly inductionDose: string;
  readonly maintenanceDose: string;
  readonly onset: string;
  readonly duration: string;
  readonly adverseEffects: readonly string[];
  readonly contraindications: readonly string[];
  /** What to watch on the monitor after giving it. */
  readonly watchFor: string;
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

export const DRUG_CARDS: readonly DrugCard[] = [
  {
    drugId: 'propofol',
    name: 'Propofol',
    drugClass: 'Intravenous hypnotic',
    mechanism: 'Potentiates GABA-A receptor activity, producing hypnosis. It has no analgesic effect.',
    inductionDose: '1.5–2.5 mg/kg in a healthy adult, reduced in the elderly and in the haemodynamically compromised.',
    maintenanceDose: '4–12 mg/kg/h by infusion, titrated to effect.',
    onset: 'Loss of consciousness within one arm–brain circulation time; peak effect-site concentration around 1.5–2 minutes after a bolus.',
    duration: 'A single bolus wears off by redistribution in 5–10 minutes. Offset after a long infusion is longer, and grows with duration.',
    adverseEffects: [
      'Dose-dependent hypotension, by vasodilation, venodilation reducing preload, and some '
        + 'myocardial depression.',
      'Apnoea, which is expected rather than a complication.',
      'Pain on injection.',
      'Loss of airway reflexes.',
      'Propofol infusion syndrome: metabolic acidosis, rhabdomyolysis, arrhythmia and cardiac '
        + 'failure, associated with prolonged high-rate infusion. Risk rises above roughly '
        + '4 mg/kg/h continued beyond 48 hours, which is an intensive care exposure rather than '
        + 'a theatre one, but it is the reason the rate is not simply turned up and left.',
    ],
    contraindications: [
      'Known allergy to propofol.',
      'The formulation is an emulsion of soybean oil and egg lecithin. Anaphylaxis is usually to '
        + 'propofol itself rather than to the lipid, and current guidance does not treat egg or '
        + 'soy allergy as an absolute contraindication, but it is what to ask about.',
      'Caution wherever a fall in vascular resistance would be poorly tolerated, such as severe aortic stenosis or hypovolaemia.',
    ],
    watchFor:
      'The blood pressure, which will fall over the two minutes after the bolus rather than '
      + 'immediately; the capnogram, which will disappear when the patient stops breathing; and '
      + 'the effect-site curve, so you dose against where the drug is going rather than where it is.',
    review: UNSIGNED,
  },
  {
    drugId: 'remifentanil',
    name: 'Remifentanil',
    drugClass: 'Ultra-short-acting synthetic opioid',
    mechanism: 'Mu-opioid receptor agonist. Metabolized by non-specific plasma and tissue esterases, independently of liver and kidney.',
    inductionDose: '0.5–1 µg/kg over 30–60 seconds, given slowly because a rapid bolus causes '
      + 'bradycardia and chest wall rigidity. NOTE: this simulator injects a bolus '
      + 'instantaneously and does not model injection rate, so it will let you do the thing this '
      + 'line warns against and show you no consequence. See the limitations register.',
    maintenanceDose: '0.05–0.5 µg/kg/min by infusion, titrated to the stimulus.',
    onset: 'Peak effect within about 1.5 minutes.',
    duration:
      'Context-sensitive half-time stays around 3–4 minutes however long the infusion has run, '
      + 'which is what makes it different from every other opioid — and why analgesia must be '
      + 'established before it is stopped.',
    adverseEffects: [
      'Bradycardia and hypotension, particularly with a rapid bolus.',
      'Apnoea and respiratory depression.',
      'Chest wall and glottic rigidity after a fast large bolus.',
      'No residual analgesia at all once it is off.',
    ],
    contraindications: [
      'Known allergy.',
      'Avoid as a sole agent for postoperative analgesia, because there is none once the infusion stops.',
    ],
    watchFor:
      'The heart rate, which falls; and the haemodynamic response to stimulus, which should be '
      + 'blunted. The synergy is strongest for tolerance of stimulation — laryngoscopy, incision '
      + '— and much weaker for the hypnotic endpoint itself: an opioid buys you a patient who '
      + 'does not respond, not a patient who is more deeply asleep. Watching only the depth index '
      + 'while leaning on the opioid is a recognised route to awareness.',
    review: UNSIGNED,
  },
];

export function getDrugCard(drugId: string): DrugCard | undefined {
  return DRUG_CARDS.find((card) => card.drugId === drugId);
}
