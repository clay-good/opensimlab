/**
 * The ACGME's Obstetrics and Gynecology Milestones
 * (framework-mapping-expansion → registry).
 *
 * The fourth ACGME reading, carrying the same scope statement as the other
 * three and read the same way: subject-matter overlap only, no level
 * descriptors, nothing endorsed.
 *
 * Thirty-two subcompetencies, most of them about procedures and settings this
 * project has no lesson for - endoscopy, laparoscopy, open surgery, family
 * planning, ambulatory gynaecology. Recording them anyway is the point: the
 * obstetrics module is a set of obstetric emergencies, and a programme reading
 * the coverage table should see at a glance how much of their specialty it
 * does not touch. Half of this reading is uncovered, and the table says so.
 */
import type { FrameworkRecord } from './framework-records';

export const ACGME_OBSTETRICS_GYNECOLOGY_MILESTONES: FrameworkRecord = {
  id: 'acgme-obstetrics-gynecology',
  name: 'Obstetrics and Gynecology Milestones',
  shortLabel: 'ACGME OB/GYN milestones',
  body: 'Accreditation Council for Graduate Medical Education',
  version: 'Version 2.0; second revision August 2021, implementation July 2022',
  url: 'https://www.acgme.org/globalassets/pdfs/milestones/obstetricsandgynecologymilestones.pdf',
  appliesTo: 'Obstetrics and gynecology residents, and the programmes that assess them',
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
    + 'summary. Sixteen of the thirty-two are covered by no lesson at all, because this module is '
    + 'obstetric emergencies and not gynaecology. Nothing here is reviewed or endorsed by the '
    + 'ACGME.',
  domains: [
    { id: 'pc-1-antepartum-care', label: 'Patient Care 1: Antepartum Care and Complications of Pregnancy', description: 'The pregnancy before birth, and the complications that arise in it.' },
    { id: 'pc-2-first-trimester-bleeding', label: 'Patient Care 2: First-Trimester Bleeding', description: 'Bleeding in early pregnancy and what it may mean.' },
    { id: 'pc-3-intrapartum-care', label: 'Patient Care 3: Care of Patients in the Intrapartum Period', description: 'Labour and birth: the clocks, the fetal trajectory, and the decisions that cannot wait for them.' },
    { id: 'pc-4-postpartum-care', label: 'Patient Care 4: Care of Patients in the Postpartum and Interconception Period', description: 'After birth: the bleeding, the pressure, the infection, and the newborn in the room.' },
    { id: 'pc-5-obstetric-technical-skills', label: 'Patient Care 5: Obstetric Technical Skills', description: 'The manoeuvres of birth, including the ones that are forbidden and why.' },
    { id: 'pc-6-obstetric-emergencies', label: 'Patient Care 6: Critically Ill Obstetric Patients and Obstetric Emergencies', description: 'The collapsing or critically ill obstetric patient, recognised and escalated before confirmation.' },
    { id: 'pc-7-peri-procedural-care', label: 'Patient Care 7: Peri-Procedural Care', description: 'Getting a theatre, an anaesthetist and a team ready around a procedure that is about to happen.' },
    { id: 'pc-8-endoscopic-procedures', label: 'Patient Care 8: Endoscopic Procedures (Hysteroscopy and Cystoscopy)', description: 'Hysteroscopy and cystoscopy.' },
    { id: 'pc-9-laparoscopic-procedures', label: 'Patient Care 9: Laparoscopic Procedures', description: 'Laparoscopic gynaecological surgery.' },
    { id: 'pc-10-vulvar-vaginal-procedures', label: 'Patient Care 10: Vulvar-Vaginal Procedures', description: 'Procedures on the vulva and vagina.' },
    { id: 'pc-11-open-surgical-procedures', label: 'Patient Care 11: Open Surgical Procedures (excludes Cesarean section)', description: 'Open gynaecological surgery other than caesarean section.' },
    { id: 'pc-12-family-planning', label: 'Patient Care 12: Family Planning', description: 'Contraception, abortion care, and the counselling around them.' },
    { id: 'pc-13-ambulatory-gynecology', label: 'Patient Care 13: Ambulatory Gynecology and Office-Based Procedures', description: 'Gynaecological care given in clinic.' },
    { id: 'pc-14-consultations', label: 'Patient Care 14: Consultations', description: 'Giving another service a usable answer to the question it asked.' },
    { id: 'mk-1-reproductive-anatomy-and-pathophysiology', label: 'Medical Knowledge 1: Anatomy and Pathophysiology of Female Reproduction', description: 'The uterus, the placenta and the birth canal as structures whose behaviour explains the findings.' },
    { id: 'mk-2-differential-diagnosis', label: 'Medical Knowledge 2: Differential Diagnosis', description: 'Holding competing explanations open, and refusing to close on a threshold, a value or one cause.' },
    { id: 'sbp-1-patient-safety', label: 'Systems-Based Practice 1: Patient Safety', description: 'The bound, the prohibition and the attempt limit: where acting harder would be the harm.' },
    { id: 'sbp-2-quality-improvement', label: 'Systems-Based Practice 2: Quality Improvement', description: 'Improving the care a service delivers, measured over cases rather than within one.' },
    { id: 'sbp-3-coordination-of-care', label: 'Systems-Based Practice 3: System Navigation for Patient-Centered Care - Coordination of Care', description: 'Bringing the obstetric, anaesthetic, blood-bank, theatre and newborn owners together, by name.' },
    { id: 'sbp-4-transitions-of-care', label: 'Systems-Based Practice 4: System Navigation for Patient-Centered Care – Transitions of Care', description: 'Handing two patients on at once, with the unresolved risk of both intact.' },
    { id: 'sbp-5-community-and-population-health', label: 'Systems-Based Practice 5: Community and Population Health', description: 'The health of a population rather than the patient in front of you.' },
    { id: 'sbp-6-physician-role-in-health-care-systems', label: 'Systems-Based Practice 6: Physician Role in Health Care Systems', description: 'Working within what a health system costs, allows and makes available.' },
    { id: 'pbli-1-evidence-based-practice', label: 'Practice-Based Learning and Improvement 1: Evidence-Based and Informed Practice', description: 'Locating the evidence behind a step and applying it to this patient.' },
    { id: 'pbli-2-reflective-practice', label: 'Practice-Based Learning and Improvement 2: Reflective Practice and Commitment to Personal Growth', description: 'Looking back at what was done and naming what to do differently.' },
    { id: 'prof-1-professional-behavior', label: 'Professionalism 1: Professional Behavior', description: 'Conduct toward the patient, the family and the team.' },
    { id: 'prof-2-ethical-principles', label: 'Professionalism 2: Ethical Principles', description: 'Acting under conflicting obligations, including between two patients.' },
    { id: 'prof-3-accountability', label: 'Professionalism 3: Accountability/Conscientiousness', description: 'Recording what was done and when, so the account survives the night.' },
    { id: 'prof-4-well-being', label: 'Professionalism 4: Well-Being', description: 'Recognising the limits of one\'s own state and capacity.' },
    { id: 'ics-1-patient-and-family-communication', label: 'Interpersonal and Communication Skills 1: Patient- and Family-Centered Communication', description: 'The person in the bed and the people with her, including her dignity while a room fills with strangers.' },
    { id: 'ics-2-counseling-and-shared-decision-making', label: 'Interpersonal and Communication Skills 2: Patient Counseling and Shared Decision-Making', description: 'A decision that is hers to weigh - fertility, waking or proceeding - put to her in terms she can weigh it in.' },
    { id: 'ics-3-interprofessional-and-team-communication', label: 'Interpersonal and Communication Skills 3: Interprofessional and Team Communication', description: 'Naming a leader, a timekeeper and an owner, and closing the loop on each.' },
    { id: 'ics-4-communication-within-health-care-systems', label: 'Interpersonal and Communication Skills 4: Communication within Health Care Systems', description: 'Handing over so the next clinician inherits the clocks and the reasoning, not only the result.' },
  ],
};
