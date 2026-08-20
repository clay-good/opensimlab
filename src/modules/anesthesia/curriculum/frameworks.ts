/**
 * The training frameworks scenarios are mapped to
 * (platform/adoption → Curriculum Mapping To Recognized Frameworks).
 *
 * WHAT THIS IS, AND WHAT IT IS NOT.
 *
 * These are the project's own reading of published framework documents, recorded
 * as data so a program can filter and export it. They are NOT endorsed by,
 * affiliated with, or reviewed by any of the bodies named here. No accrediting
 * or certifying body has recognised this simulator for any requirement, and a
 * mapping is an editorial judgement about subject matter — nothing more.
 *
 * Each framework names its body and the version this reading was taken from, so
 * a program director can tell at a glance whether it reflects the document they
 * are actually accredited against. Where the domain list is a summary rather
 * than a verbatim transcription, the entry says so.
 */

export interface FrameworkDomain {
  /** Stable id used by scenario mappings. */
  readonly id: string;
  /** The body's own label, or the project's summary of it. */
  readonly label: string;
  /** What the domain covers, in the project's words. */
  readonly description: string;
}

export interface Framework {
  readonly id: string;
  readonly name: string;
  /** A few words for a tab. Derived truncation of the body name reads as garbage. */
  readonly shortLabel: string;
  /** The organisation that publishes it. */
  readonly body: string;
  /** The version or year this reading was taken from. */
  readonly version: string;
  readonly url: string;
  /** Who this framework governs, so a reader knows if it applies to them. */
  readonly appliesTo: string;
  /**
   * How faithful this list is to the published document. Stated because a
   * summary presented as a transcription is a quiet misrepresentation.
   */
  readonly fidelity: 'verbatim' | 'summarised';
  readonly note: string;
  readonly domains: readonly FrameworkDomain[];
}

/**
 * The National Board of Certification and Recertification for Nurse Anesthetists
 * publishes the content outline its national certifying examination is built on.
 * The five top-level content areas below are that outline's own divisions; the
 * sub-content beneath each is summarised rather than transcribed.
 */
export const NBCRNA_NCE: Framework = {
  id: 'nbcrna-nce',
  name: 'National Certification Examination content outline',
  shortLabel: 'NBCRNA exam',
  body: 'National Board of Certification and Recertification for Nurse Anesthetists',
  version: 'Content outline as published for the current examination',
  url: 'https://www.nbcrna.com/',
  appliesTo: 'Student registered nurse anesthetists preparing for certification',
  fidelity: 'summarised',
  note: 'The five content areas are the outline\'s own top-level divisions. The descriptions '
    + 'are this project\'s summary, not the board\'s wording, and the mapping is not endorsed '
    + 'by the board.',
  domains: [
    {
      id: 'basic-sciences',
      label: 'Basic sciences',
      description: 'Anatomy, physiology and pathophysiology, pharmacology, chemistry and physics '
        + 'as they bear on anaesthetic practice.',
    },
    {
      id: 'equipment-instrumentation-technology',
      label: 'Equipment, instrumentation and technology',
      description: 'The anaesthesia machine, breathing circuits, monitors, airway equipment, and '
        + 'the interpretation of what they display.',
    },
    {
      id: 'basic-principles',
      label: 'Basic principles of anesthesia',
      description: 'Preoperative assessment, induction, maintenance, emergence, airway '
        + 'management, fluid management and routine monitoring.',
    },
    {
      id: 'advanced-principles',
      label: 'Advanced principles of anesthesia',
      description: 'Anaesthetic management in the presence of coexisting disease, and management '
        + 'of complications and crises.',
    },
    {
      id: 'professional-aspects',
      label: 'Professional aspects',
      description: 'Scope of practice, patient safety, legal and ethical responsibilities, and '
        + 'quality improvement.',
    },
  ],
};

/**
 * The Council on Accreditation of Nurse Anesthesia Educational Programs sets the
 * standards a programme is accredited against. The entries below are the content
 * areas this simulator could plausibly touch, summarised.
 */
export const COA_STANDARDS: Framework = {
  id: 'coa-standards',
  name: 'Standards for Accreditation of Nurse Anesthesia Programs — Practice Doctorate',
  shortLabel: 'COA standards',
  body: 'Council on Accreditation of Nurse Anesthesia Educational Programs',
  version: 'Practice doctorate standards, as revised 2022',
  url: 'https://www.coacrna.org/',
  appliesTo: 'Nurse anesthesia programs and their curricula',
  fidelity: 'summarised',
  note: 'These are the curriculum content areas this simulator could plausibly contribute to, '
    + 'in this project\'s words. They are not a transcription of the standards, they are not '
    + 'a claim of compliance with them, and the Council has not reviewed this. A programme '
    + 'documenting accreditation should read the standards themselves.',
  domains: [
    {
      id: 'pharmacology-of-anesthetic-agents',
      label: 'Pharmacology of anesthetic agents and adjuvants',
      description: 'The kinetics and dynamics of the drugs used to induce and maintain '
        + 'anaesthesia, including their interactions.',
    },
    {
      id: 'anesthesia-equipment-and-monitoring',
      label: 'Anesthesia equipment and patient monitoring',
      description: 'Monitoring modalities, what each measures, and how to interpret them '
        + 'together.',
    },
    {
      id: 'airway-management',
      label: 'Airway management',
      description: 'Assessment, laryngoscopy, securing the airway, and recognising and '
        + 'responding to a difficult airway.',
    },
    {
      id: 'physiology-and-pathophysiology',
      label: 'Physiology and pathophysiology',
      description: 'Cardiovascular and respiratory physiology and the way anaesthesia and '
        + 'coexisting disease disturb them.',
    },
    {
      id: 'clinical-decision-making',
      label: 'Clinical correlation and decision making',
      description: 'Choosing and adjusting a plan from what the patient is doing, and '
        + 'recognising when the plan is not working.',
    },
  ],
};

/**
 * The ACGME Milestones describe what a residency programme assesses a resident
 * against. Only the subcompetencies this simulator could plausibly touch are
 * listed; the numbering follows the published Milestones 2.0 document.
 */
export const ACGME_ANESTHESIOLOGY_MILESTONES: Framework = {
  id: 'acgme-anesthesiology-milestones-2',
  name: 'Anesthesiology Milestones 2.0',
  shortLabel: 'ACGME milestones',
  body: 'Accreditation Council for Graduate Medical Education',
  version: '2.0, published 2020',
  url: 'https://www.acgme.org/specialties/anesthesiology/milestones/',
  appliesTo: 'Anesthesiology residents and their programs',
  fidelity: 'summarised',
  note: 'A subset of the published subcompetencies: only those a screen-based simulator could '
    + 'plausibly contribute evidence toward. Subcompetency labels are summarised rather than '
    + 'transcribed, and the mapping is not endorsed by the Council.',
  domains: [
    {
      id: 'pc-preanesthetic-evaluation',
      label: 'Patient Care: preanesthetic evaluation and preparation',
      description: 'Reading the patient before induction and preparing accordingly.',
    },
    {
      id: 'pc-anesthetic-plan-and-conduct',
      label: 'Patient Care: anesthetic plan and conduct',
      description: 'Forming a plan, carrying it out, and adjusting it as the case moves.',
    },
    {
      id: 'pc-pharmacologic-management',
      label: 'Patient Care: pharmacologic management',
      description: 'Selecting, dosing and titrating anaesthetic drugs to effect.',
    },
    {
      id: 'pc-airway-management',
      label: 'Patient Care: airway management',
      description: 'Managing the airway, including when the first approach fails.',
    },
    {
      id: 'pc-monitoring-and-equipment',
      label: 'Patient Care: use and interpretation of monitoring and equipment',
      description: 'Reading the monitor as a whole rather than one number at a time.',
    },
    {
      id: 'pc-crisis-management',
      label: 'Patient Care: crisis management',
      description: 'Recognising and managing an intraoperative crisis.',
    },
    {
      id: 'mk-applied-foundational-science',
      label: 'Medical Knowledge: applied foundational sciences',
      description: 'Physiology and pharmacology applied to the patient in front of you.',
    },
  ],
};

export const FRAMEWORKS: readonly Framework[] = [
  NBCRNA_NCE,
  COA_STANDARDS,
  ACGME_ANESTHESIOLOGY_MILESTONES,
];

export function getFramework(id: string): Framework | undefined {
  return FRAMEWORKS.find((framework) => framework.id === id);
}

/** The disclaimer every curriculum surface carries, in one place. */
export const MAPPING_DISCLAIMER =
  'These mappings are Open Sim Lab\'s own reading of published framework documents. No '
  + 'accrediting or certifying body has reviewed, endorsed or recognised them, and time spent '
  + 'in this simulator does not count toward any case requirement, clinical hour or supervised '
  + 'experience. A programme documenting accreditation should read the source documents.';
