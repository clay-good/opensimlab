/**
 * The ACGME's Emergency Medicine Milestones
 * (framework-mapping-expansion → registry).
 *
 * READ THE SCOPE STATEMENT BEFORE RELYING ON THIS. The document's own second
 * page says the Milestones "are designed only for use in evaluation of
 * residents in the context of their participation in ACGME-accredited
 * residency programs", and that they are not "designed to be relevant in any
 * other context". A simulator is another context. So this reading is a finding
 * aid for a programme that already uses the Milestones - it says which lessons
 * touch the subject matter of which subcompetency - and it is not an assessment
 * instrument, not evidence toward a level, and not endorsed by the ACGME.
 * The note below carries that statement to every surface that shows the
 * reading, which is the same thing the NCSBN reading does with its model's
 * scope.
 *
 * Levels are deliberately absent. The document's value to a programme is its
 * level descriptors, which are the part a mapping cannot honestly touch: a
 * lesson cannot place a learner on a five-level developmental scale, and
 * recording the levels here would invite exactly that reading. The
 * subcompetency titles are what a mapping needs, and they are reproduced
 * verbatim under the educational-use permission the copyright line grants.
 */
import type { FrameworkRecord } from './framework-records';

/**
 * The twenty-two subcompetency titles are the ACGME's own, transcribed from
 * the report worksheet headings of *Emergency Medicine Milestones* (ACGME,
 * second revision February 2021, implementation July 1 2021), whose copyright
 * line grants third parties the right to use them on a non-exclusive basis for
 * educational purposes.
 *
 * The record is marked `summarised` because the descriptions beneath the
 * titles are this project's words and several titles run longer than the
 * shared verbatim-label limit. The titles themselves are exact.
 */
export const ACGME_EMERGENCY_MEDICINE_MILESTONES: FrameworkRecord = {
  id: 'acgme-emergency-medicine',
  name: 'Emergency Medicine Milestones',
  shortLabel: 'ACGME EM milestones',
  body: 'Accreditation Council for Graduate Medical Education',
  version: 'Version 2.1; second revision February 2021, implementation 1 July 2021',
  url: 'https://www.acgme.org/globalassets/pdfs/milestones/emergencymedicinemilestones.pdf',
  appliesTo: 'Emergency medicine residents, and the programmes that assess them',
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
    {
      id: 'pc-1-emergency-stabilization',
      label: 'Patient Care 1: Emergency Stabilization',
      description: 'Acting on the unstable patient first: airway, breathing and circulation, the '
        + 'immediately reversible threat, and reassessment after the intervention.',
    },
    {
      id: 'pc-2-focused-history-and-physical',
      label: 'Patient Care 2: Performance of a Focused History and Physical Exam',
      description: 'Gathering what the presentation needs rather than everything available, and '
        + 'repeating the examination when the picture changes.',
    },
    {
      id: 'pc-3-diagnostic-studies',
      label: 'Patient Care 3: Diagnostic Studies',
      description: 'Choosing a test for what its result would change, and reading the result '
        + 'against the patient rather than instead of them.',
    },
    {
      id: 'pc-4-diagnosis',
      label: 'Patient Care 4: Diagnosis',
      description: 'Holding a working diagnosis open under uncertainty, ordered by what would '
        + 'hurt most if it were missed.',
    },
    {
      id: 'pc-5-pharmacotherapy',
      label: 'Patient Care 5: Pharmacotherapy',
      description: 'Selecting and recording a drug, its dose and its timing, and knowing what '
        + 'would have to be true for it to be the wrong one.',
    },
    {
      id: 'pc-6-reassessment-and-disposition',
      label: 'Patient Care 6: Reassessment and Disposition',
      description: 'Looking again after acting, and deciding where the patient goes next on what '
        + 'the second look showed.',
    },
    {
      id: 'pc-7-multitasking',
      label: 'Patient Care 7: Multitasking (Task-Switching)',
      description: 'Running parallel threads of care without dropping one, and ordering them by '
        + 'what will not wait.',
    },
    {
      id: 'pc-8-general-approach-to-procedures',
      label: 'Patient Care 8: General Approach to Procedures',
      description: 'Deciding that a procedure is indicated, preparing for it, and reassessing '
        + 'after it without assuming it worked.',
    },
    {
      id: 'mk-1-scientific-knowledge',
      label: 'Medical Knowledge 1: Scientific Knowledge',
      description: 'The physiology and pathophysiology a decision rests on, including what the '
        + 'model being used can and cannot represent.',
    },
    {
      id: 'mk-2-treatment-and-clinical-reasoning',
      label: 'Medical Knowledge 2: Treatment and Clinical Reasoning',
      description: 'Reasoning from the evidence in front of you to a treatment, and naming the '
        + 'reasoning so it can be challenged.',
    },
    {
      id: 'sbp-1-patient-safety',
      label: 'Systems-Based Practice 1: Patient Safety',
      description: 'The bounded dose, the gate before an intervention, the ceiling on a '
        + 'correction: the places where acting faster would do harm.',
    },
    {
      id: 'sbp-2-quality-improvement',
      label: 'Systems-Based Practice 2: Quality Improvement',
      description: 'Improving the care a department delivers, measured over cases rather than '
        + 'within one.',
    },
    {
      id: 'sbp-3-system-navigation',
      label: 'Systems-Based Practice 3: System Navigation for Patient-Centered Care',
      description: 'Activating the pathway, the team or the service a patient needs, and '
        + 'coordinating transfer of their care.',
    },
    {
      id: 'sbp-4-physician-role-in-health-care-systems',
      label: 'Systems-Based Practice 4: Physician Role in Health Care Systems',
      description: 'Working within the constraints a health system imposes, including cost, '
        + 'access and the limits of the setting.',
    },
    {
      id: 'pbli-1-evidence-based-practice',
      label: 'Practice-Based Learning and Improvement 1: Evidence-Based and Informed Practice',
      description: 'Locating the evidence behind a step and applying it to the patient in front '
        + 'of you, including when the evidence is weak.',
    },
    {
      id: 'pbli-2-reflective-practice',
      label: 'Practice-Based Learning and Improvement 2: Reflective Practice and Commitment to Personal Growth',
      description: 'Looking back at what was done and naming what to do differently.',
    },
    {
      id: 'prof-1-professional-behavior-and-ethics',
      label: 'Professionalism 1: Professional Behavior and Ethical Principles',
      description: 'Acting on a duty to the patient, including when the right action is costly or '
        + 'uncomfortable.',
    },
    {
      id: 'prof-2-accountability',
      label: 'Professionalism 2: Accountability/Conscientiousness',
      description: 'Completing what was started, and recording what was done so somebody else can '
        + 'rely on it.',
    },
    {
      id: 'prof-3-self-awareness-and-well-being',
      label: 'Professionalism 3: Self-Awareness and Well-Being',
      description: 'Recognising the limits of one\'s own state and capacity, and acting on them.',
    },
    {
      id: 'ics-1-patient-and-family-communication',
      label: 'Interpersonal and Communication Skills 1: Patient- and Family-Centered Communication',
      description: 'Talking with the patient and the people with them, and letting what they say '
        + 'change the plan.',
    },
    {
      id: 'ics-2-interprofessional-and-team-communication',
      label: 'Interpersonal and Communication Skills 2: Interprofessional and Team Communication',
      description: 'Calling for help in terms the person called can act on, and closing the loop '
        + 'on what was asked.',
    },
    {
      id: 'ics-3-communication-within-health-care-systems',
      label: 'Interpersonal and Communication Skills 3: Communication within Health Care Systems',
      description: 'Handing a patient over so the next clinician inherits the reasoning and not '
        + 'only the result.',
    },
  ],
};
