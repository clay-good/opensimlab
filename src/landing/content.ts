/**
 * The landing page's prose (platform/landing → Substantive Content Lives Below
 * The Fold).
 *
 * Written for a human who scrolled because they wanted to know more. Every
 * paragraph would be worth reading to that person. There is no keyword filler, no
 * hidden text, no location or specialty permutation, and no claim the validation
 * report and the limitations register do not support.
 */

export const ONE_LINE_DESCRIPTION =
  'A free, browser-based clinical simulator for medical students, residents, and nurse anesthetists.';

/** Exactly three facts, chosen because they answer the objections a visitor has. */
export interface SupportingFact {
  /** The full sentence, used on the About page. */
  readonly text: string;
  /** Two or three words, used as the front door's one quiet line. */
  readonly short: string;
  readonly linkLabel: string;
  readonly href: string;
}

export const THREE_FACTS: readonly SupportingFact[] = [
  {
    text: 'Free, with no account and nothing to install.',
    short: 'No account',
    linkLabel: 'Read what is stored on your device',
    href: '/privacy',
  },
  {
    text: 'Works offline once it has loaded, including every scenario and every citation.',
    short: 'Works offline',
    linkLabel: 'Read how offline operation works',
    href: '/privacy',
  },
  {
    text: 'The drug models come from published pharmacology, with citations you can check.',
    short: 'Published pharmacology',
    linkLabel: 'Read the validation report',
    href: '/validation',
  },
];

export interface ContentSection {
  readonly id: string;
  readonly heading: string;
  readonly paragraphs: readonly string[];
  readonly list?: readonly string[];
  readonly link?: { readonly label: string; readonly href: string };
}

/** In this order, because that is the order a stranger's questions arrive in. */
export const CONTENT_SECTIONS: readonly ContentSection[] = [
  {
    id: 'what-it-teaches',
    heading: 'What it teaches, and how',
    paragraphs: [
      'Most of what makes anaesthesia hard is invisible. The drug you pushed thirty seconds ago is '
      + 'still on its way to where it works. The pressure that just fell did so for a reason that '
      + 'determines what will fix it. The saturation that looks fine is about to stop looking fine, '
      + 'and how much warning you get depends on the patient in front of you.',
      'A textbook can tell you those things. It cannot show you them happening on a patient you are '
      + 'responsible for. That is what this is for: you give the drug, and you watch the plasma '
      + 'concentration spike while the effect-site concentration climbs slowly behind it, and you '
      + 'see the pressure follow the second curve rather than the first.',
      'Every session ends in a structured debrief that names what happened, ranks why it happened '
      + 'using the engine\'s own attribution, and computes what the alternative would have produced '
      + 'by re-running the simulation on your decisions with one thing changed.',
    ],
  },
  {
    id: 'who-it-is-for',
    heading: 'Who it is for',
    paragraphs: [
      'It is built first for medical students on an anaesthesia rotation, in particular the one '
      + 'opening it the night before their first day in theatre. After that: anaesthesiology '
      + 'residents in their first year, nurse anaesthetist students, and the faculty who teach '
      + 'all three.',
      'It assumes basic cardiovascular and respiratory physiology and no anaesthesia experience at '
      + 'all. It is not built for practising anaesthetists — but it needs them, because no clinician '
      + 'has yet checked whether this patient behaves the way a real one does. If that is you, the '
      + 'governance page says exactly what is unreviewed and there is a control on every clinical '
      + 'claim for telling us it is wrong.',
    ],
  },
  {
    id: 'inside-the-module',
    heading: 'What is inside the anesthesia module',
    paragraphs: [
      'This is an early build. It contains twenty-one scenarios — a routine induction on a healthy '
      + 'adult, rapid desaturation in an obese patient, hypotension after induction, and '
      + 'bronchospasm after intubation with a region-aware inhaled bronchodilator response, plus unexpected intraoperative hemorrhage with crystalloid '
      + 'temporization, bounded adult packed-red-cell support, and a dilution-only coagulation panel with plasma support, rapid-sequence induction with modeled rocuronium onset, and silent TIVA-line '
      + 'disconnection under paralysis, initial laryngospasm response after airway stimulation, '
      + 'initial perioperative anaphylaxis response after antibiotic exposure, and early '
      + 'malignant-hyperthermia response during volatile anesthesia, plus a bounded routine '
      + 'pediatric intravenous induction for a healthy 6-year-old, an unanticipated difficult-airway case '
      + 'limited to help escalation and supraglottic rescue oxygenation, and a known difficult-airway case '
      + 'about using the prior record and stopping repeated laryngoscopy attempts '
      + 'and initial local-anesthetic systemic-toxicity response with weight-banded 20% lipid '
      + 'and a bounded third-cycle persistent ventricular-fibrillation arrest response through initial modeled ROSC '
      + 'and high spinal after an epidural top-up with bounded help, oxygen, ventilation, fluid, and ephedrine actions '
      + 'and venous air embolism during central-line removal with escalation, source-control intent, and oxygen support '
      + 'and a stable-ventilation capnography sampling-line obstruction that separates monitor failure from patient change '
      + 'and a dedicated dilutional-coagulopathy handoff that rehearses panel-guided plasma and repeat testing '
      + 'and an arterial-pressure transducer artifact that separates hydrostatic offset, waveform damping, cuff verification, and patient physiology '
      + 'and circle-system rebreathing from exhausted absorbent with a raised inspiratory carbon-dioxide baseline, fresh-gas bridge, and confirmed washout '
      + '— with three drugs: population PK/PD for propofol and remifentanil, pediatric Paedfusor PK, '
      + 'a clearly labeled rocuronium teaching model, scripted cefazolin exposure, and dedicated '
      + 'epinephrine, dantrolene, benzodiazepine-class, lipid-emulsion, compression, and defibrillation crisis actions, the real monitor, the real design system, '
      + 'and the real debrief.',
      'That narrowness is deliberate. The riskiest things in a project like this are whether the '
      + 'waveforms convince a clinician, whether it holds its frame rate on a modest phone, and '
      + 'whether the physiology is plausible to someone who does this for a living. None of those '
      + 'are answered by many mediocre scenarios, and all of them are answered by a few good '
      + 'ones that each teach a different failure.',
    ],
    list: [
      'A sweeping monitor with electrocardiogram, arterial pressure, capnography and plethysmography, all phase-coherent.',
      'Propofol and remifentanil, with their compartment kinetics and interaction, pediatric '
      + 'propofol kinetics from Paedfusor, plus a clearly '
      + 'labeled teaching model of rocuronium onset and spontaneous recovery.',
      'Apnoea and desaturation that follow the published times rather than a stopwatch, and a '
      + 'circulation that fails the way an unrelieved airway problem actually makes it fail.',
      'Laryngoscopy with a Cormack-Lehane grade, where repeated attempts make things worse.',
      'A PEARLS debrief with computed counterfactuals.',
    ],
  },
  {
    id: 'where-the-pharmacology-comes-from',
    heading: 'Where the pharmacology comes from',
    paragraphs: [
      'Every model parameter is transcribed by hand from its primary publication into typed source '
      + 'in this repository. There is no external dataset, nothing vendored, and nothing fetched at '
      + 'build or run time. Each model carries its citation, the table it was read from, and the '
      + 'range of patients it was derived in.',
      'Applying a model outside that range does not silently produce a number. It marks the model '
      + 'out of range, names which covariate is out of bounds and by how much, and offers one that '
      + 'is not — and it still runs, so you can see what going out of range actually does.',
      'The project requires that every parameter be independently checked by a second person '
      + 'against a second source before a model may be called published. That check has not been '
      + 'done for this build, so no model here carries that label, and the interface says so '
      + 'wherever a model drives a number.',
    ],
    link: { label: 'Read the validation report', href: '/validation' },
  },
  {
    id: 'how-it-is-reviewed',
    heading: 'How the clinical content is reviewed',
    paragraphs: [
      'Every scenario, protocol, drug card and explainer is meant to carry a machine-readable '
      + 'review record naming a credentialed clinician, their competing interests, the sources they '
      + 'consulted, and the date it is due for re-review. The build excludes anything without one.',
      'In this build, nothing is signed. The editorial board is empty and recruiting it is ongoing. '
      + 'The governance page lists every outstanding item by name rather than reporting a '
      + 'reassuring percentage.',
    ],
    link: { label: 'Read the governance records', href: '/governance' },
  },
  {
    id: 'what-it-does-not-do',
    heading: 'What it deliberately does not do',
    paragraphs: [
      'It does not teach psychomotor skills. You cannot learn to hold a laryngoscope from a screen, '
      + 'and this does not pretend otherwise. It does not teach physical airway technique, and it '
      + 'does not model team communication at all, which is a large part of what goes wrong in real '
      + 'crises.',
      'It does not replace mannequin-based simulation or supervised clinical time. The evidence that '
      + 'screen-based simulation helps is evidence that it helps BEFORE those things, not instead of '
      + 'them.',
      'And it is not a clinical tool. It predicts what a virtual patient does. It never advises what '
      + 'to do to a real one, there is no field anywhere that accepts a real patient\'s details, and '
      + 'the simulation core is structurally incapable of turning a target concentration into a dose.',
    ],
    link: { label: 'Read the limitations register', href: '/limitations' },
  },
  {
    id: 'using-it-in-a-course',
    heading: 'How to use it in a course',
    paragraphs: [
      'It needs no licence, no procurement, no accounts and no institutional integration, because '
      + 'there is no server to integrate with. Send your students a link and they are in, or clone '
      + 'the repository, run the documented build, and host the resulting files yourself from any '
      + 'static host, on your own domain, with no dependency on this project staying online.',
      'Because nothing leaves the device, you cannot see what a student did unless they export a '
      + 'transcript and send it to you themselves. That is a deliberate trade: the confidentiality '
      + 'simulation standards ask for is easier to guarantee when the data was never collected.',
      'Scenarios are plain JSON validated against a published schema, so an educator can write one '
      + 'by hand, validate it in the browser, and run it without touching the application source '
      + 'or installing anything locally. If you build one worth sharing, the repository will take it.',
    ],
  },
];

export interface QuestionAnswer {
  readonly question: string;
  readonly answer: string;
}

/** The questions a visitor actually asks, answered plainly. */
export const QUESTIONS: readonly QuestionAnswer[] = [
  {
    question: 'Is it free?',
    answer: 'Yes, entirely, with no paid tier and nothing held back.',
  },
  {
    question: 'Do I need an account?',
    answer: 'No. There is no sign-in anywhere, because there is no server to sign in to.',
  },
  {
    question: 'Does it work offline?',
    answer: 'Yes. Once it has loaded once, every scenario, model, citation and debrief works with '
      + 'the network switched off, and you can install it to your home screen.',
  },
  {
    question: 'Can I use it on a phone?',
    answer: 'Yes. The layout reflows down to a 360-pixel-wide screen and a full induction is '
      + 'completable there. It is designed to run on a four-year-old mid-range Android.',
  },
  {
    question: 'Where do the drug models come from?',
    answer: 'From the primary literature, transcribed by hand into this repository with their '
      + 'citations. Marsh 1991, Schnider 1998, Eleveld 2018 and Minto 1997 are the models in this '
      + 'build.',
  },
  {
    question: 'Who reviews the clinical content?',
    answer: 'A named editorial board of credentialed clinicians is the intended answer. In this '
      + 'build the board is empty and nothing has been signed, which the governance page states '
      + 'plainly rather than glossing over.',
  },
  {
    question: 'Can I use it in a course?',
    answer: 'Yes. The code is MIT licensed and the educational content is openly licensed per '
      + 'scenario, so you can adopt it, adapt it, or self-host it without asking anyone.',
  },
  {
    question: 'Does it replace mannequin simulation?',
    answer: 'No. It is a different thing that works well before mannequin simulation, not instead '
      + 'of it. It teaches nothing about your hands.',
  },
  {
    question: 'When are the other modules coming?',
    answer: 'No date is promised. The project does not commit to a schedule it cannot keep. '
      + 'Releases are announced on the public repository, and no email address is collected for '
      + 'the purpose.',
  },
];

/** The footer trust block. Each link names its destination. */
export const FOOTER_LINKS: readonly { readonly label: string; readonly href: string }[] = [
  { label: 'Validation report', href: '/validation' },
  { label: 'Clinical governance', href: '/governance' },
  { label: 'Limitations register', href: '/limitations' },
  { label: 'Privacy', href: '/privacy' },
  { label: 'License', href: 'https://github.com/clay-good/opensimlab/blob/main/LICENSE' },
  { label: 'Source repository', href: 'https://github.com/clay-good/opensimlab' },
];

export const SUGGESTED_CITATION =
  'Open Sim Lab. An open-source browser-native clinical simulator. opensimlab.com. '
  + 'Cite the release version shown in the about panel.';

/** Words the one-line description is forbidden to contain. */
export const FORBIDDEN_MARKETING_WORDS = ['revolutionary', 'cutting-edge', 'AI-powered', 'platform'];
