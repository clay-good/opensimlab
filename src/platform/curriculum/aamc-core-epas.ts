/**
 * The AAMC's Core Entrustable Professional Activities for Entering Residency
 * (framework-mapping-expansion → registry).
 *
 * This reading lives in the platform rather than in a specialty module, because
 * unlike the three anaesthesia readings it belongs to no specialty: the AAMC's
 * claim is that every entering resident should perform these "regardless of
 * specialty choice".
 *
 * TWO THINGS TO READ BEFORE RELYING ON IT.
 *
 * The AAMC itself treats this as a past initiative. Its Competency-Based
 * Medical Education page says the Core EPAs "were developed by the AAMC in
 * 2014", that "implementation was piloted by 10 medical schools from
 * 2014-2021", and that "use of the Core EPAs is currently being evaluated in
 * light of the release of the Foundational Competencies in 2024". A programme
 * mapping against this should know that, so the note says it and the re-check
 * date is what brings it back for review.
 *
 * And the locator printed inside the AAMC's own 2017 toolkit document
 * (aamc.org/initiatives/coreepas/publicationsandpresentations) no longer
 * resolves; the AAMC has restructured its site. The URL recorded here is the
 * live page that carries the status statement above, checked on the date
 * recorded. A dead link in a citation is a citation nobody can check.
 */
import type { FrameworkRecord } from './framework-records';

/**
 * The thirteen activity titles are the AAMC's own, transcribed from the
 * contents page of *Core Entrustable Professional Activities for Entering
 * Residency: Toolkits for the 13 Core EPAs* (AAMC, 2017), whose copyright page
 * carries the licence "may be reproduced and distributed with attribution for
 * educational or noncommercial purposes only".
 *
 * The record is nonetheless marked `summarised`, and the note says why: six of
 * the thirteen titles are longer than this project's verbatim-label limit, and
 * the descriptions beneath them are this project's own words. Under-claiming
 * the fidelity is the safe direction; the note carries the truth that the
 * labels themselves are exact.
 */
export const AAMC_CORE_EPAS: FrameworkRecord = {
  id: 'aamc-core-epas',
  name: 'Core Entrustable Professional Activities for Entering Residency',
  shortLabel: 'AAMC Core EPAs',
  body: 'Association of American Medical Colleges',
  version: 'Thirteen Core EPAs published 2014; toolkits published 2017',
  url: 'https://www.aamc.org/about-us/mission-areas/medical-education/cbme',
  appliesTo: 'Medical students approaching entry to residency, in any specialty',
  fidelity: 'summarised',
  recordedOn: '2026-11-14',
  reviewBy: '2028-11-14',
  note: 'The thirteen activity titles are the AAMC\'s own wording, transcribed from the contents '
    + 'page of its 2017 toolkits document and reproduced with attribution as that document\'s '
    + 'licence permits. The record is marked summarised because the descriptions beneath each '
    + 'title are this project\'s words rather than the AAMC\'s, and because six of the titles run '
    + 'longer than a short name. The AAMC describes this framework as a past initiative: it was '
    + 'developed in 2014, piloted by ten medical schools from 2014 to 2021, and its use is being '
    + 'evaluated in light of the Foundational Competencies released in 2024. Five of the thirteen '
    + 'activities are exercised nowhere in this simulator and the coverage report says so by '
    + 'name. Nothing here is endorsed by the AAMC.',
  domains: [
    {
      id: 'epa-1-history-and-physical',
      label: 'Gather a History and Perform a Physical Examination',
      description: 'Taking an account from the patient and examining them, and letting what is '
        + 'found there shape what happens next.',
    },
    {
      id: 'epa-2-differential-diagnosis',
      label: 'Prioritize a Differential Diagnosis Following a Clinical Encounter',
      description: 'Holding more than one explanation open and ordering them by what would hurt '
        + 'most if it were missed.',
    },
    {
      id: 'epa-3-diagnostic-and-screening-tests',
      label: 'Recommend and Interpret Common Diagnostic and Screening Tests',
      description: 'Choosing a test for what its result would change, and reading the result '
        + 'against the patient rather than instead of them.',
    },
    {
      id: 'epa-4-orders-and-prescriptions',
      label: 'Enter and Discuss Orders and Prescriptions',
      description: 'Committing to a treatment, at a stated dose and route, and saying why.',
    },
    {
      id: 'epa-5-document-an-encounter',
      label: 'Document a Clinical Encounter in the Patient Record',
      description: 'Recording what was found, what was decided, and what remains open, so the '
        + 'next clinician can act on it.',
    },
    {
      id: 'epa-6-oral-presentation',
      label: 'Provide an Oral Presentation of a Clinical Encounter',
      description: 'Telling the case aloud in an order someone else can follow and act on.',
    },
    {
      id: 'epa-7-clinical-questions-and-evidence',
      label: 'Form Clinical Questions and Retrieve Evidence to Advance Patient Care',
      description: 'Turning uncertainty into an answerable question, and knowing what the '
        + 'evidence does and does not settle.',
    },
    {
      id: 'epa-8-handover',
      label: 'Give or Receive a Patient Handover to Transition Care Responsibility',
      description: 'Transferring the active problems, the trajectory, what is unresolved, and '
        + 'who now owns it.',
    },
    {
      id: 'epa-9-interprofessional-team',
      label: 'Collaborate as a Member of an Interprofessional Team',
      description: 'Working with the people already in the room, including asking them for what '
        + 'only they can do.',
    },
    {
      id: 'epa-10-urgent-and-emergent-care',
      label: 'Recognize a Patient Requiring Urgent or Emergent Care and Initiate Evaluation and Management',
      description: 'Noticing that this patient cannot wait, and starting treatment while the '
        + 'cause is still open.',
    },
    {
      id: 'epa-11-informed-consent',
      label: 'Obtain Informed Consent for Tests and/or Procedures',
      description: 'Explaining what is proposed, what it risks, and what the alternatives are, '
        + 'and letting the patient decide.',
    },
    {
      id: 'epa-12-general-procedures',
      label: 'Perform General Procedures of a Physician',
      description: 'The procedures expected of any physician on day one, performed safely and '
        + 'within declared limits.',
    },
    {
      id: 'epa-13-system-failures-and-safety',
      label: 'Identify System Failures and Contribute to a Culture of Safety and Improvement',
      description: 'Seeing that the system, not only the person, produced the outcome, and '
        + 'reporting it so it can be changed.',
    },
  ],
};
