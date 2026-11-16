/**
 * The USMLE Content Outline's system sections
 * (framework-mapping-expansion → registry).
 *
 * A Step 2 CK candidate plans by system, and this is the list every USMLE
 * examination's content is organised under. Selecting one on the "preparing
 * for" page answers the question a student actually has: which lessons here
 * touch the cardiovascular system, or the renal one.
 *
 * WHAT IS RECORDED, AND WHY ONLY THAT. The eighteen section names below are
 * the outline's own, transcribed from its table of contents. Nothing beneath
 * them is reproduced: the outline's body runs to forty-two pages of topics and
 * examples, it is published under "all rights reserved" with no educational-use
 * permission of the kind the ACGME grants, and a mapping needs the sections
 * rather than the topics. The project's own rule applies on top of that - a
 * mapping claims subject-matter overlap and nothing more.
 *
 * The outline is common to every Step, and each Step emphasises different parts
 * of it; the document says so itself, and the note repeats it, because a
 * learner reading "Cardiovascular System" here should not take this project's
 * coverage of it for the examination's weighting of it.
 */
import type { FrameworkRecord } from './framework-records';

export const USMLE_CONTENT_OUTLINE: FrameworkRecord = {
  id: 'usmle-content-outline',
  name: 'USMLE Content Outline system sections',
  shortLabel: 'USMLE systems',
  body: 'Federation of State Medical Boards and NBME',
  version: 'For Public Release: USMLE Content Outline (2026)',
  url: 'https://www.usmle.org/sites/default/files/2022-01/USMLE_Content_Outline_0.pdf',
  appliesTo: 'Medical students and physicians preparing for a USMLE examination',
  fidelity: 'summarised',
  recordedOn: '2026-11-16',
  reviewBy: '2028-11-16',
  note: 'The eighteen section names are the outline\'s own, from its table of contents; the '
    + 'descriptions beneath them are this project\'s words, and nothing from the outline\'s body '
    + 'is reproduced. The outline is common to every Step and each Step emphasises different '
    + 'parts of it, so coverage of a section here says nothing about that section\'s weight on '
    + 'any examination. Mapping these lessons to the sections is this project\'s reading; neither '
    + 'the FSMB nor NBME has reviewed or endorsed it, and it predicts nothing about an '
    + 'examination. USMLE is a joint program of the FSMB and NBME, and the outline is copyright '
    + 'the FSMB and NBME, all rights reserved.',
  domains: [
    { id: 'human-development', label: 'Human Development', description: 'The normal course of a life and the care of a well patient at each stage of it, including the newborn.' },
    { id: 'immune-system', label: 'Immune System', description: 'Immunodeficiency, immunologically mediated disease, and the response to infection.' },
    { id: 'blood-and-lymphoreticular-system', label: 'Blood & Lymphoreticular System', description: 'Anaemia, cytopenias, coagulation and the haematological malignancies.' },
    { id: 'behavioral-health', label: 'Behavioral Health', description: 'Mood, psychosis, substance use, and the cognitive and behavioural disorders.' },
    { id: 'nervous-system-and-special-senses', label: 'Nervous System & Special Senses', description: 'Stroke, seizure, consciousness, the peripheral nerve and the neuromuscular junction.' },
    { id: 'skin-and-subcutaneous-tissue', label: 'Skin & Subcutaneous Tissue', description: 'The skin and what lies under it.' },
    { id: 'musculoskeletal-system', label: 'Musculoskeletal System', description: 'Bone, muscle and joint, including the injured limb and the compartment in it.' },
    { id: 'cardiovascular-system', label: 'Cardiovascular System', description: 'Rhythm, perfusion, the coronary circulation, and the failing or obstructed heart.' },
    { id: 'respiratory-system', label: 'Respiratory System', description: 'The airway, gas exchange, ventilation and the pleura.' },
    { id: 'gastrointestinal-system', label: 'Gastrointestinal System', description: 'The gut, the liver and the bleeding within them.' },
    { id: 'renal-and-urinary-system', label: 'Renal & Urinary System', description: 'Kidney function, the electrolytes it governs, and the acid-base state it defends.' },
    { id: 'pregnancy-childbirth-and-the-puerperium', label: 'Pregnancy, Childbirth, & the Puerperium', description: 'The pregnancy, the birth and the weeks after it, for the person giving birth.' },
    { id: 'female-and-transgender-reproductive-system-and-breast', label: 'Female and Transgender Reproductive System & Breast', description: 'The reproductive system outside pregnancy, and the breast.' },
    { id: 'male-and-transgender-reproductive-system', label: 'Male and Transgender Reproductive System', description: 'The male and transgender reproductive system.' },
    { id: 'endocrine-system', label: 'Endocrine System', description: 'The glands, their hormones, and the metabolic emergencies when either fails.' },
    { id: 'multisystem-processes-and-disorders', label: 'Multisystem Processes & Disorders', description: 'Shock, sepsis, poisoning, trauma and the other processes that belong to no single system.' },
    { id: 'biostatistics-epidemiology-and-the-medical-literature', label: 'Biostatistics, Epidemiology/Population Health, & Interpretation of the Medical Literature', description: 'Reading a study, a rate or an estimate, and knowing what it can support.' },
    { id: 'social-sciences', label: 'Social Sciences', description: 'Communication, ethics, systems of care and the person’s circumstances.' },
  ],
};
