/**
 * The ACGME's Surgery Milestones
 * (framework-mapping-expansion → registry).
 *
 * The seventh and last ACGME reading this catalogue needs, carrying the same
 * scope statement as the others and read the same way: subject-matter overlap
 * only, no level descriptors, nothing endorsed.
 *
 * Three of its eighteen subcompetencies are about operating - performance of
 * procedures, technical skills, and the anatomy behind them - and a
 * screen-based lesson cannot touch two of them. That is the honest shape of
 * mapping a surgical document to a module about surgical DECISIONS, and the
 * coverage table says so rather than reaching for a claim.
 */
import type { FrameworkRecord } from './framework-records';

export const ACGME_SURGERY_MILESTONES: FrameworkRecord = {
  id: 'acgme-surgery',
  name: 'Surgery Milestones',
  shortLabel: 'ACGME surgery milestones',
  body: 'Accreditation Council for Graduate Medical Education',
  version: 'Version 2.1; second revision January 2019',
  url: 'https://www.acgme.org/globalassets/pdfs/milestones/surgerymilestones.pdf',
  appliesTo: 'General surgery residents, and the programmes that assess them',
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
    + 'summary. The two intra-operative subcompetencies are covered by nothing and cannot be: '
    + 'this module teaches surgical decisions, and no screen-based lesson performs a procedure. '
    + 'Nothing here is reviewed or endorsed by the ACGME.',
  domains: [
    { id: 'pc-1-evaluation-and-decision-making', label: 'Patient Care 1: Patient Evaluation and Decision Making', description: 'Reading a patient, a clock and a record into a decision, and knowing what each of them cannot settle.' },
    { id: 'pc-2-performance-of-procedures', label: 'Patient Care 2: Intra-Operative Patient Care – Performance of Procedures', description: 'Conducting an operation.' },
    { id: 'pc-3-technical-skills', label: 'Patient Care 3: Intra-Operative Patient Care – Technical Skills', description: 'The hands: tissue handling, instruments, the operative field.' },
    { id: 'pc-4-post-operative-care', label: 'Patient Care 4: Post-Operative Patient Care', description: 'The course an operation predicts, and the deviation from it that matters.' },
    { id: 'mk-1-pathophysiology-and-treatment', label: 'Medical Knowledge 1: Pathophysiology and Treatment', description: 'What the injury or the operation does to the patient, and what treatment would change.' },
    { id: 'mk-2-anatomy', label: 'Medical Knowledge 2: Anatomy', description: 'Where things are, and why an artery is not a compartment.' },
    { id: 'sbp-1-patient-safety-and-quality-improvement', label: 'Systems-Based Practice 1: Patient Safety and Quality Improvement', description: 'The bounded intent, the step not taken outside a role, the wait that needs an owner.' },
    { id: 'sbp-2-system-navigation', label: 'Systems-Based Practice 2: System Navigation for Patient-Centered Care', description: 'Reaching the team that owns the question, and moving a patient’s care on.' },
    { id: 'sbp-3-physician-role-in-health-care-systems', label: 'Systems-Based Practice 3: Physician Role in Health Care Systems', description: 'Working within what a health system costs, allows and makes available.' },
    { id: 'pbli-1-evidence-based-practice', label: 'Practice-Based Learning and Improvement 1: Evidence-Based and Informed Practice', description: 'Reading the literature behind a step, including when it is small, weak or contradicts itself.' },
    { id: 'pbli-2-reflective-practice', label: 'Practice-Based Learning and Improvement 2: Reflective Practice and Commitment to Personal Growth', description: 'Looking back at what was done and naming what to do differently.' },
    { id: 'prof-1-ethical-principles', label: 'Professionalism 1: Ethical Principles', description: 'Acting under conflicting obligations.' },
    { id: 'prof-2-professional-behavior-and-accountability', label: 'Professionalism 2: Professional Behavior and Accountability', description: 'Conduct toward the patient and the team, and being answerable for it.' },
    { id: 'prof-3-administrative-tasks', label: 'Professionalism 3: Administrative Tasks', description: 'The paperwork a service runs on.' },
    { id: 'prof-4-self-awareness-and-help-seeking', label: 'Professionalism 4: Self-Awareness and Help-Seeking', description: 'Knowing what you do not know, and saying the doubt out loud in the room.' },
    { id: 'ics-1-patient-and-family-communication', label: 'Interpersonal and Communication Skills 1: Patient and Family-Centered Communication', description: 'Talking with the patient and the people with them.' },
    { id: 'ics-2-interprofessional-and-team-communication', label: 'Interpersonal and Communication Skills 2: Interprofessional and Team Communication', description: 'Asking the team that owns a question for a decision rather than a visit.' },
    { id: 'ics-3-communication-within-health-care-systems', label: 'Interpersonal and Communication Skills 3: Communication within Health Care Systems', description: 'Handing on a course, a clock or an unfinished examination so it survives the shift.' },
  ],
};
