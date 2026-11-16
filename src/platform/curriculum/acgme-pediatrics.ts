/**
 * The ACGME's Pediatrics Milestones
 * (framework-mapping-expansion → registry).
 *
 * The same reading as the emergency medicine one, and for the same reasons:
 * the document's second page says the Milestones "are designed only for use in
 * evaluation of residents in the context of their participation in
 * ACGME-accredited residency programs" and are not "designed to be relevant in
 * any other context". So this names subject-matter overlap and nothing else,
 * carries that statement wherever it is shown, and records no level
 * descriptors, because a lesson cannot place a learner on a developmental
 * scale.
 *
 * Pediatrics divides its subcompetencies differently from emergency medicine,
 * and the differences matter to a mapping: history and physical examination
 * are separate subcompetencies here, coordination of care and transitions in
 * care are separate, and professional behavior and ethical principles are
 * separate. The mapping follows the document's divisions rather than reusing
 * the emergency medicine shape.
 */
import type { FrameworkRecord } from './framework-records';

export const ACGME_PEDIATRICS_MILESTONES: FrameworkRecord = {
  id: 'acgme-pediatrics',
  name: 'Pediatrics Milestones',
  shortLabel: 'ACGME paediatrics milestones',
  body: 'Accreditation Council for Graduate Medical Education',
  version: 'Version 2.1; second revision March 2021, implementation 1 July 2021',
  url: 'https://www.acgme.org/globalassets/pdfs/milestones/pediatricsmilestones.pdf',
  appliesTo: 'Pediatrics residents, and the programmes that assess them',
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
    { id: 'pc-1-history', label: 'Patient Care 1: History', description: 'What the child, the caregiver and the record say happened, gathered to the point the presentation needs.' },
    { id: 'pc-2-physical-exam', label: 'Patient Care 2: Physical Exam', description: 'What the child looks like now: appearance, effort, perfusion and mentation, read again after time passes.' },
    { id: 'pc-3-organize-and-prioritize', label: 'Patient Care 3: Organize and Prioritize Patient Care', description: 'Holding several unresolved threads at once - cause, trajectory, alternative, escalation trigger - and ordering them.' },
    { id: 'pc-4-clinical-reasoning', label: 'Patient Care 4: Clinical Reasoning', description: 'Joining what was supplied with what is observed into a pattern, and naming the boundary of what that pattern claims.' },
    { id: 'pc-5-patient-management', label: 'Patient Care 5: Patient Management', description: 'Directing the care the child receives, including the care an experienced team carries out.' },
    { id: 'mk-1-clinical-knowledge', label: 'Medical Knowledge 1: Clinical Knowledge', description: 'The paediatric physiology and illness behaviour a recognition rests on, including how a child compensates and then does not.' },
    { id: 'mk-2-diagnostic-evaluation', label: 'Medical Knowledge 2: Diagnostic Evaluation', description: 'What a test, a panel or a trend would change, and what remains unknown after it.' },
    { id: 'sbp-1-patient-safety', label: 'Systems-Based Practice 1: Patient Safety', description: 'The places where declaring recovery, or acting faster, would be the harm: the improvement that is not a cure, the pathway that must be preserved.' },
    { id: 'sbp-2-quality-improvement', label: 'Systems-Based Practice 2: Quality Improvement', description: 'Improving the care a service delivers, measured over cases rather than within one.' },
    { id: 'sbp-3-coordination-of-care', label: 'Systems-Based Practice 3: System Navigation for Patient Centered Care – Coordination of Care', description: 'Getting the qualified team, service or expertise that the child needs, and keeping its ownership explicit.' },
    { id: 'sbp-4-transitions-in-care', label: 'Systems-Based Practice 4: System Navigation for Patient-Centered Care – Transitions in Care', description: 'Handing the child on with the trajectory, the unresolved risk and the named owner intact.' },
    { id: 'sbp-5-population-and-community-health', label: 'Systems-Based Practice 5: Population and Community Health', description: 'The health of a population rather than the child in front of you.' },
    { id: 'sbp-6-physician-role-in-health-care-systems', label: 'Systems-Based Practice 6: Physician Role in Health Care Systems', description: 'Working within what a health system costs, allows and makes available.' },
    { id: 'pbli-1-evidence-based-practice', label: 'Practice-Based Learning and Improvement 1: Evidence-Based and Informed Practice', description: 'Locating the evidence behind a step and applying it to this child.' },
    { id: 'pbli-2-reflective-practice', label: 'Practice-Based Learning and Improvement 2: Reflective Practice and Commitment to Personal Growth', description: 'Looking back at what was done and naming what to do differently.' },
    { id: 'prof-1-professional-behavior', label: 'Professionalism 1: Professional Behavior', description: 'Conduct toward the child, the family and the team.' },
    { id: 'prof-2-ethical-principles', label: 'Professionalism 2: Ethical Principles', description: 'Acting on a duty under conflicting obligations: what may be said, to whom, and what may not yet be concluded.' },
    { id: 'prof-3-accountability', label: 'Professionalism 3: Accountability/Conscientiousness', description: 'Completing what was started and being answerable for it.' },
    { id: 'prof-4-well-being', label: 'Professionalism 4: Well-Being', description: 'Recognising the limits of one\'s own state and capacity.' },
    { id: 'ics-1-patient-and-family-centered-communication', label: 'Interpersonal and Communication Skills 1: Patient- and Family-Centered Communication', description: 'The caregiver as part of the care: keeping a child calm with them, and carrying what they need into the plan.' },
    { id: 'ics-2-interprofessional-and-team-communication', label: 'Interpersonal and Communication Skills 2: Interprofessional and Team Communication', description: 'Asking for help in terms the person called can act on, and closing the loop on what was asked.' },
    { id: 'ics-3-communication-within-health-care-systems', label: 'Interpersonal and Communication Skills 3: Communication within Health Care Systems', description: 'Recording and transmitting the reasoning, not only the result, so the next clinician inherits it.' },
  ],
};
