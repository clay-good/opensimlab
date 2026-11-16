/**
 * The ACGME's Internal Medicine Milestones
 * (framework-mapping-expansion → registry).
 *
 * The fifth ACGME reading, carrying the same scope statement as the other four
 * and read the same way: subject-matter overlap only, no level descriptors,
 * nothing endorsed.
 *
 * This one covers more of the catalogue than any other reading will. Eight
 * modules - cardiology, respiratory medicine, renal and electrolyte, endocrine
 * and metabolic, infectious disease, oncology, critical care and toxicology -
 * are internal medicine by subject, and each maps to this same twenty-one
 * subcompetency set rather than to a reading of its own. Keeping one reading
 * for all eight is deliberate: a programme recognises the document it assesses
 * against, and inventing eight subspecialty readings nobody uses would be this
 * project's vocabulary rather than theirs.
 *
 * One footnote in the document is reproduced here rather than dropped, because
 * dropping it would change what the subcompetency claims. The well-being
 * subcompetency carries an asterisk reading, in the ACGME's words, that it "is
 * not intended to evaluate a resident's well-being"; the label here omits the
 * marker and the description carries the point.
 */
import type { FrameworkRecord } from './framework-records';

export const ACGME_INTERNAL_MEDICINE_MILESTONES: FrameworkRecord = {
  id: 'acgme-internal-medicine',
  name: 'Internal Medicine Milestones',
  shortLabel: 'ACGME internal medicine milestones',
  body: 'Accreditation Council for Graduate Medical Education',
  version: 'Version 2.1; second revision November 2020, implementation 1 July 2021',
  url: 'https://www.acgme.org/globalassets/pdfs/milestones/internalmedicinemilestones.pdf',
  appliesTo: 'Internal medicine residents, and the programmes that assess them',
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
    + 'summary. The well-being subcompetency is marked in the document with a footnote saying it '
    + '"is not intended to evaluate a resident\'s well-being", which is carried into its '
    + 'description here. Nothing in this mapping is reviewed or endorsed by the ACGME.',
  domains: [
    { id: 'pc-1-history', label: 'Patient Care 1: History', description: 'The account of what changed and when, gathered to the point the presentation needs.' },
    { id: 'pc-2-physical-examination', label: 'Patient Care 2: Physical Examination', description: 'What the patient shows now - perfusion, congestion, pulse, work of breathing - and what it shows when repeated.' },
    { id: 'pc-3-clinical-reasoning', label: 'Patient Care 3: Clinical Reasoning', description: 'Holding competing explanations open, weighing likelihood against harm, and refusing to close on one cause too early.' },
    { id: 'pc-4-inpatient-management', label: 'Patient Care 4: Patient Management – Inpatient', description: 'Directing what happens next for an admitted or critically ill patient.' },
    { id: 'pc-5-outpatient-management', label: 'Patient Care 5: Patient Management – Outpatient', description: 'Directing what happens next for a patient who is in clinic rather than a bed, including what happens after they leave.' },
    { id: 'pc-6-digital-health', label: 'Patient Care 6: Digital Health', description: 'Care delivered or supported through telehealth and patient-facing digital tools.' },
    { id: 'mk-1-applied-foundational-sciences', label: 'Medical Knowledge 1: Applied Foundational Sciences', description: 'The physiology and pathophysiology a decision rests on, including the mechanism behind a phenotype.' },
    { id: 'mk-2-therapeutic-knowledge', label: 'Medical Knowledge 2: Therapeutic Knowledge', description: 'What a treatment does, what its response looks like, and what its bounds are.' },
    { id: 'mk-3-knowledge-of-diagnostic-testing', label: 'Medical Knowledge 3: Knowledge of Diagnostic Testing', description: 'What a test would change, what a panel or a device report actually says, and what remains unknown after it.' },
    { id: 'sbp-1-patient-safety-and-quality-improvement', label: 'Systems-Based Practice 1: Patient Safety and Quality Improvement', description: 'The bound, the restraint and the safety net: where acting harder, or stopping sooner, would be the harm.' },
    { id: 'sbp-2-system-navigation', label: 'Systems-Based Practice 2: System Navigation for Patient-Centered Care', description: 'Activating the service, the centre or the expertise a patient needs, and moving their care on.' },
    { id: 'sbp-3-physician-role-in-health-care-systems', label: 'Systems-Based Practice 3: Physician Role in Health Care Systems', description: 'Working within what a health system costs, allows and makes available.' },
    { id: 'pbli-1-evidence-based-practice', label: 'Practice-Based Learning and Improvement 1: Evidence-Based and Informed Practice', description: 'Locating the evidence behind a step and applying it to this patient.' },
    { id: 'pbli-2-reflective-practice', label: 'Practice-Based Learning and Improvement 2: Reflective Practice and Commitment to Personal Growth', description: 'Looking back at what was done and naming what to do differently.' },
    { id: 'prof-1-professional-behavior', label: 'Professionalism 1: Professional Behavior', description: 'Conduct toward the patient, the family and the team.' },
    { id: 'prof-2-ethical-principles', label: 'Professionalism 2: Ethical Principles', description: 'Acting under conflicting obligations, including what may be concluded and what may be shared.' },
    { id: 'prof-3-accountability', label: 'Professionalism 3: Accountability/Conscientiousness', description: 'Completing what was started and being answerable for it.' },
    { id: 'prof-4-knowledge-of-well-being-factors', label: 'Professionalism 4: Knowledge of Systemic and Individual Factors of Well-Being', description: 'Knowledge of what supports and erodes well-being. The document marks this subcompetency with a footnote saying it is not intended to evaluate a resident\'s own well-being.' },
    { id: 'ics-1-patient-and-family-communication', label: 'Interpersonal and Communication Skills 1: Patient- and Family-Centered Communication', description: 'Talking with the patient and the people with them, including what to watch for after they go home.' },
    { id: 'ics-2-interprofessional-and-team-communication', label: 'Interpersonal and Communication Skills 2: Interprofessional and Team Communication', description: 'Asking a named service for what it can act on, and closing the loop on what was asked.' },
    { id: 'ics-3-communication-within-health-care-systems', label: 'Interpersonal and Communication Skills 3: Communication within Health Care Systems', description: 'Handing over so the next clinician inherits the trajectory and the unresolved risk, not only the result.' },
  ],
};
