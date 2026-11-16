/**
 * The ACGME's Neurology Milestones
 * (framework-mapping-expansion → registry).
 *
 * The third ACGME reading, carrying the same scope statement as the other two
 * - the Milestones are "designed only for use in evaluation of residents in the
 * context of their participation in ACGME-accredited residency programs" and
 * are not "designed to be relevant in any other context" - and read the same
 * way: subject-matter overlap only, no level descriptors, nothing endorsed.
 *
 * Neurology divides its subcompetencies more finely than either of the others:
 * twenty-seven rather than twenty-two, with the diagnostic procedures a
 * neurologist performs or interprets given one subcompetency each
 * (neuroimaging, EEG, nerve conduction, lumbar puncture) and the setting of
 * management split three ways (outpatient, inpatient, emergencies). That is
 * what makes this reading worth having rather than folding into a general one:
 * a lesson that reviews an MRI and a lesson that reviews an EEG land in
 * different places here, and a ward lesson is not an emergency department one.
 */
import type { FrameworkRecord } from './framework-records';

export const ACGME_NEUROLOGY_MILESTONES: FrameworkRecord = {
  id: 'acgme-neurology',
  name: 'Neurology Milestones',
  shortLabel: 'ACGME neurology milestones',
  body: 'Accreditation Council for Graduate Medical Education',
  version: 'Version 2.1; second revision December 2020, implementation 1 July 2021',
  url: 'https://www.acgme.org/globalassets/pdfs/milestones/neurologymilestones.pdf',
  appliesTo: 'Neurology residents, and the programmes that assess them',
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
    { id: 'pc-1-history', label: 'Patient Care 1: History', description: 'The account of what changed and when, gathered to the point the presentation needs.' },
    { id: 'pc-2-neurologic-exam', label: 'Patient Care 2: Neurologic Exam', description: 'What the examination shows now - consciousness, pupils, power, speech, reflexes - and what it shows when repeated.' },
    { id: 'pc-3-formulation', label: 'Patient Care 3: Formulation', description: 'Naming the syndrome and the boundary of what naming it claims, before any confirmation arrives.' },
    { id: 'pc-4-outpatient-management', label: 'Patient Care 4: Diagnosis and Management of Neurologic Disorders in the Outpatient Setting', description: 'Care given in clinic, over visits rather than within one admission.' },
    { id: 'pc-5-inpatient-management', label: 'Patient Care 5: Diagnosis and Management of Neurologic Disorders in the Inpatient Setting', description: 'Care given on the ward: directing what happens next for an admitted patient, and who owns it.' },
    { id: 'pc-6-neurologic-emergencies', label: 'Patient Care 6: Diagnosis and Management of Neurologic Emergencies', description: 'The deterioration that will not wait, and the escalation it needs before confirmation.' },
    { id: 'pc-7-determination-of-death', label: 'Patient Care 7: Determination of Death by Neurologic Criteria', description: 'The examination and the standard by which death is determined neurologically.' },
    { id: 'pc-8-neuroimaging', label: 'Patient Care 8: Interpretation of Neuroimaging', description: 'Reading the CT, the angiogram or the MRI against the patient, including what a reported negative does not exclude.' },
    { id: 'pc-9-eeg', label: 'Patient Care 9: Electroencephalogram (EEG)', description: 'What an EEG can settle, what it cannot, and how urgently one is needed.' },
    { id: 'pc-10-ncs-emg', label: 'Patient Care 10: Nerve Conduction Study/Electromyogram (NCS/EMG)', description: 'Nerve conduction and needle electromyography, and what they localise.' },
    { id: 'pc-11-lumbar-puncture', label: 'Patient Care 11: Lumbar Puncture', description: 'When the tap is safe, when imaging must precede it, and what the fluid answers.' },
    { id: 'pc-12-psychiatric-and-functional', label: 'Patient Care 12: Psychiatric and Functional Aspects of Neurology', description: 'Cognition, perception and behaviour as neurological findings, including the reversible contributors behind them.' },
    { id: 'mk-1-localization', label: 'Medical Knowledge 1: Localization', description: 'Where in the nervous system the findings place the lesion, and what that predicts next.' },
    { id: 'mk-2-diagnostic-investigation', label: 'Medical Knowledge 2: Diagnostic Investigation', description: 'What an investigation would change, read in parallel with the alternatives it does not close.' },
    { id: 'sbp-1-patient-safety', label: 'Systems-Based Practice 1: Patient Safety', description: 'The places where calling an improvement a recovery, or acting outside a role, would be the harm.' },
    { id: 'sbp-2-quality-improvement', label: 'Systems-Based Practice 2: Quality Improvement', description: 'Improving the care a service delivers, measured over cases rather than within one.' },
    { id: 'sbp-3-system-navigation', label: 'Systems-Based Practice 3: System Navigation for Patient-Centered Care', description: 'Getting the qualified service the patient needs, keeping its ownership explicit, and moving their care on.' },
    { id: 'sbp-4-physician-role-in-health-care-systems', label: 'Systems-Based Practice 4: Physician Role in Health Care Systems', description: 'The duties a clinician carries beyond the patient in front of them, including public health notification.' },
    { id: 'pbli-1-evidence-based-practice', label: 'Practice-Based Learning and Improvement 1: Evidence-Based and Informed Practice', description: 'Locating the evidence behind a step and applying it to this patient.' },
    { id: 'pbli-2-reflective-practice', label: 'Practice-Based Learning and Improvement 2: Reflective Practice and Commitment to Personal Growth', description: 'Looking back at what was done and naming what to do differently.' },
    { id: 'prof-1-professional-behavior-and-ethics', label: 'Professionalism 1: Professional Behavior and Ethical Principles', description: 'Acting under conflicting obligations: capacity, consent, and what may be concluded or shared.' },
    { id: 'prof-2-accountability', label: 'Professionalism 2: Accountability/Conscientiousness', description: 'Completing what was started and being answerable for it.' },
    { id: 'prof-3-well-being', label: 'Professionalism 3: Well-Being', description: 'Recognising the limits of one\'s own state and capacity.' },
    { id: 'ics-1-patient-and-family-communication', label: 'Interpersonal and Communication Skills 1: Patient- and Family-Centered Communication', description: 'Talking with the patient and the people with them, and letting what they say change the plan.' },
    { id: 'ics-2-barrier-and-bias-mitigation', label: 'Interpersonal and Communication Skills 2: Barrier and Bias Mitigation', description: 'Recognising the barriers and biases that degrade care, and mitigating them.' },
    { id: 'ics-3-interprofessional-and-team-communication', label: 'Interpersonal and Communication Skills 3: Interprofessional and Team Communication', description: 'Asking a named service for what it can act on, and closing the loop on what was asked.' },
    { id: 'ics-4-communication-within-health-care-systems', label: 'Interpersonal and Communication Skills 4: Communication within Health Care Systems', description: 'Handing a patient over so the next clinician inherits the reasoning, the clocks and the unresolved risk.' },
  ],
};
