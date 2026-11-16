/**
 * The NCLEX-RN Test Plan's Client Needs categories
 * (framework-mapping-expansion → registry).
 *
 * The nursing module already maps to the clinical judgment model from the same
 * document. This is the other half of that test plan, and it is the half a
 * student actually plans their week around: the four Client Needs categories
 * and the eight categories and subcategories beneath them that every item on
 * the examination is assigned to.
 *
 * It is recorded as its own reading rather than folded into the clinical
 * judgment one because the document treats them as different things - clinical
 * judgment is an integrated process measured through case studies, and Client
 * Needs is the content framework - and because only this one is a blueprint a
 * learner can prepare against category by category.
 *
 * The percentages the test plan assigns to each category are deliberately NOT
 * recorded. They describe the examination's item distribution, and carrying
 * them here would invite reading this project's coverage of a category as
 * coverage of that share of the paper.
 */
import type { FrameworkRecord } from './framework-records';

export const NCSBN_NCLEX_CLIENT_NEEDS: FrameworkRecord = {
  id: 'ncsbn-nclex-client-needs',
  name: 'NCLEX-RN Test Plan Client Needs categories',
  shortLabel: 'NCLEX-RN client needs',
  body: 'National Council of State Boards of Nursing',
  version: 'As published in the NCLEX-RN Test Plan effective April 2026',
  url: 'https://www.nclex.com/files/2026_RN_Test%20Plan_English-F.pdf',
  appliesTo: 'Prelicensure registered nursing students preparing for the NCLEX-RN examination',
  fidelity: 'verbatim',
  recordedOn: '2026-11-16',
  reviewBy: '2028-11-16',
  note: 'The eight category and subcategory names are NCSBN\'s own, listed under Client Needs in '
    + 'the 2026 NCLEX-RN Test Plan (printed page 4). The descriptions beneath them are this '
    + 'project\'s summary. The item percentages the test plan assigns to each category are not '
    + 'recorded here, because covering a category in nine lessons is not coverage of that share '
    + 'of an examination. Mapping these lessons to the framework is this project\'s reading; '
    + 'NCSBN has not reviewed or endorsed it, and it predicts nothing about an examination. '
    + 'Portions copyrighted by the National Council of State Boards of Nursing, Inc. All rights '
    + 'reserved.',
  domains: [
    { id: 'management-of-care', label: 'Management of Care', description: 'Who owns a decision, who is told, what is recorded, and what travels to the next shift. Under Safe and Effective Care Environment.' },
    { id: 'safety-and-infection-prevention-and-control', label: 'Safety and Infection Prevention and Control', description: 'Protecting a patient from the environment, the equipment and the organism. Under Safe and Effective Care Environment.' },
    { id: 'health-promotion-and-maintenance', label: 'Health Promotion and Maintenance', description: 'Prevention, screening and the health of a person over time rather than in a shift.' },
    { id: 'psychosocial-integrity', label: 'Psychosocial Integrity', description: 'Cognition, mood, behaviour and coping, including the screen that was never done.' },
    { id: 'basic-care-and-comfort', label: 'Basic Care and Comfort', description: 'Comfort, rest, nutrition, mobility and pain, including pain in a person who cannot report it. Under Physiological Integrity.' },
    { id: 'pharmacological-and-parenteral-therapies', label: 'Pharmacological and Parenteral Therapies', description: 'Medication and infusion: what is given, by what route, and what is watched afterwards. Under Physiological Integrity.' },
    { id: 'reduction-of-risk-potential', label: 'Reduction of Risk Potential', description: 'The vital sign, the laboratory value, the screening result and what each does and does not exclude. Under Physiological Integrity.' },
    { id: 'physiological-adaptation', label: 'Physiological Adaptation', description: 'The patient whose physiology has changed: the deterioration, the emergency, the oxygen. Under Physiological Integrity.' },
  ],
};
