/**
 * The ACGME's Neonatal-Perinatal Medicine Milestones
 * (framework-mapping-expansion → registry).
 *
 * The sixth ACGME reading, carrying the same scope statement as the others and
 * read the same way: subject-matter overlap only, no level descriptors, nothing
 * endorsed.
 *
 * It is a subspecialty set rather than a residency one, which is why the
 * neonatology module maps here and not to the paediatrics reading: a programme
 * assessing neonatal fellows uses this document, and the paediatrics milestones
 * have no emergency stabilization of a newborn in them. Two of its divisions
 * matter to this module in particular - family-centred communication and
 * complex communication around serious news are separate subcompetencies, and
 * the distinction decides what these lessons may claim.
 */
import type { FrameworkRecord } from './framework-records';

export const ACGME_NEONATAL_PERINATAL_MILESTONES: FrameworkRecord = {
  id: 'acgme-neonatal-perinatal',
  name: 'Neonatal-Perinatal Medicine Milestones',
  shortLabel: 'ACGME neonatal milestones',
  body: 'Accreditation Council for Graduate Medical Education',
  version: 'Version 2.1; second revision April 2023, implementation July 2023',
  url: 'https://www.acgme.org/globalassets/pdfs/milestones/neonatalperinatalmedicinemilestones.pdf',
  appliesTo: 'Neonatal-perinatal medicine fellows, and the programmes that assess them',
  fidelity: 'summarised',
  recordedOn: '2026-11-16',
  reviewBy: '2028-11-16',
  note: 'The ACGME states that the Milestones "are designed only for use in evaluation of '
    + 'residents in the context of their participation in ACGME-accredited residency programs" '
    + 'and that they are not "designed to be relevant in any other context". This mapping is '
    + 'therefore a finding aid for a programme that already uses them, never evidence toward a '
    + 'milestone level: the five levels are not reproduced here, because a lesson cannot place a '
    + 'learner on them. Subcompetency titles are the ACGME\'s own wording, used under the '
    + 'educational-use permission its copyright line grants; the descriptions are this project\'s '
    + 'summary. Nothing here is reviewed or endorsed by the ACGME.',
  domains: [
    { id: 'pc-1-neonatal-and-maternal-history', label: 'Patient Care 1: Neonatal and Maternal History', description: 'The pregnancy, the birth and the clock, taken together: the newborn\'s history is partly the mother\'s.' },
    { id: 'pc-2-physical-exam', label: 'Patient Care 2: Physical Exam', description: 'Breathing, tone, heart rate, colour and temperature, read now and read again.' },
    { id: 'pc-3-organization-and-prioritization', label: 'Patient Care 3: Organization and Prioritization of Patient Care', description: 'Holding the airway, the thermal, the glucose and the family threads at once, and ordering them.' },
    { id: 'pc-4-clinical-reasoning', label: 'Patient Care 4: Clinical Reasoning', description: 'Naming what is happening without closing on a cause, a calculator or an outcome.' },
    { id: 'pc-5-disease-management', label: 'Patient Care 5: Disease Management in Neonatal Care', description: 'Directing the care a newborn receives, and the boundaries a qualified team keeps inside.' },
    { id: 'pc-6-procedures', label: 'Patient Care 6: Procedures', description: 'The conduct of a procedure: positive-pressure ventilation, compressions, selective airway clearing.' },
    { id: 'pc-7-emergency-stabilization', label: 'Patient Care 7: Emergency Stabilization', description: 'The first minutes: the prepared team, the clock started, the newborn supported before anything is known.' },
    { id: 'pc-8-discharge-from-the-nicu', label: 'Patient Care 8: Discharge from the Neonatal Intensive Care Unit', description: 'Getting a baby home, and what has to be true first.' },
    { id: 'mk-1-neonatal-perinatal-knowledge', label: 'Medical Knowledge 1: Neonatal-Perinatal Medical Knowledge', description: 'The physiology of transition and of the preterm newborn that a recognition rests on.' },
    { id: 'mk-2-diagnostic-evaluation', label: 'Medical Knowledge 2: Diagnostic Evaluation', description: 'What a culture, a glucose or a confirmation would change, and what it would not.' },
    { id: 'sbp-1-patient-safety', label: 'Systems-Based Practice 1: Patient Safety', description: 'Where calling an improvement a recovery, or warming too fast, would be the harm.' },
    { id: 'sbp-2-quality-improvement', label: 'Systems-Based Practice 2: Quality Improvement', description: 'Improving the care a unit delivers, measured over cases rather than within one.' },
    { id: 'sbp-3-coordination-of-care', label: 'Systems-Based Practice 3: System Navigation for Patient-Centered Care – Coordination of Care', description: 'Getting the newborn, respiratory, thermal and family owners in the room, by name.' },
    { id: 'sbp-4-transitions-in-care', label: 'Systems-Based Practice 4: System Navigation for Patient-Centered Care – Transitions in Care', description: 'Moving a newborn between teams and places with the unresolved risk intact.' },
    { id: 'sbp-5-population-and-community-health', label: 'Systems-Based Practice 5: Population and Community Health', description: 'The health of a population rather than the newborn in front of you.' },
    { id: 'sbp-6-physician-role-in-health-care-systems', label: 'Systems-Based Practice 6: Physician Role in Health Care Systems', description: 'Working within what a health system costs, allows and makes available.' },
    { id: 'pbli-1-evidence-based-practice', label: 'Practice-Based Learning and Improvement 1: Evidence-Based and Informed Practice', description: 'Locating the evidence behind a step and applying it to this newborn.' },
    { id: 'pbli-2-reflective-practice', label: 'Practice-Based Learning and Improvement 2: Reflective Practice and Commitment to Personal Growth', description: 'Looking back at what was done and naming what to do differently.' },
    { id: 'prof-1-professional-behavior', label: 'Professionalism 1: Professional Behavior', description: 'Conduct toward the newborn, the parents and the team.' },
    { id: 'prof-2-ethical-principles', label: 'Professionalism 2: Ethical Principles', description: 'Acting under conflicting obligations, including between a newborn and a family.' },
    { id: 'prof-3-accountability', label: 'Professionalism 3: Accountability/Conscientiousness', description: 'Completing what was started and being answerable for it.' },
    { id: 'prof-4-well-being', label: 'Professionalism 4: Well-Being', description: 'Recognising the limits of one\'s own state and capacity.' },
    { id: 'ics-1-family-centered-communication', label: 'Interpersonal and Communication Skills 1: Family-Centered Communication', description: 'The parents as part of the care: kept with their newborn, kept informed, carried in the plan.' },
    { id: 'ics-2-interprofessional-and-team-communication', label: 'Interpersonal and Communication Skills 2: Interprofessional and Team Communication', description: 'Naming the owner of the airway, the clock and the dyad, and closing the loop on each.' },
    { id: 'ics-3-communication-within-health-care-systems', label: 'Interpersonal and Communication Skills 3: Communication within Health Care Systems', description: 'Handing a newborn on so the receiving team inherits the clocks and the reasoning.' },
    { id: 'ics-4-complex-communication-around-serious-news', label: 'Interpersonal and Communication Skills 4: Complex Communication with Patients’ Families around Serious News', description: 'Telling a family something that changes everything, and staying in the room afterwards.' },
  ],
};
