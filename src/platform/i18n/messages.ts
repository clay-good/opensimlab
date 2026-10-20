/**
 * The English source catalog's core, and the `t` every surface calls.
 *
 * Each surface moves its strings into the catalog as it is externalised.
 * Clinical content never appears in it: it is translated only with a clinical
 * review record. The core holds what every page can show: the site bar, the
 * document chrome, the not-found view, the first-visit acknowledgement, the
 * update notice, and the front door. Everything else lives in a group module
 * (`messages-documents`, `messages-educator`, `messages-session`) that
 * registers itself when a surface imports it, because the front door used to
 * download every surface's words and went over its size budget doing it.
 * `all-messages.ts` assembles the whole catalog for the checks that need it.
 */
import type { LocaleCatalog, Params, SourceMessage } from './catalog';
import { translate } from './catalog';
import type { DOCUMENT_MESSAGES } from './messages-documents';
import type { EDUCATOR_MESSAGES } from './messages-educator';
import type { SESSION_MESSAGES } from './messages-session';

export const CORE_MESSAGES = {
  'sitebar.skip': { class: 'interface', text: 'Skip to main content' },
  'sitebar.home': { class: 'interface', text: 'Open Sim Lab' },
  'sitebar.browse': { class: 'interface', text: 'Browse' },
  'sitebar.nav-label': { class: 'interface', text: 'Site' },
  'sitebar.anesthesia': { class: 'interface', text: 'Anesthesia' },
  'sitebar.emergency-medicine': { class: 'interface', text: 'Emergency' },
  'sitebar.critical-care': { class: 'interface', text: 'Critical care' },
  'sitebar.cardiology': { class: 'interface', text: 'Cardiology' },
  'sitebar.respiratory-medicine': { class: 'interface', text: 'Respiratory medicine' },
  'sitebar.pediatrics': { class: 'interface', text: 'Pediatrics' },
  'sitebar.neurology': { class: 'interface', text: 'Neurology' },
  'sitebar.toxicology': { class: 'interface', text: 'Toxicology' },
  'sitebar.obstetrics': { class: 'interface', text: 'Obstetrics' },
  'sitebar.neonatology': { class: 'interface', text: 'Neonatology' },
  'sitebar.endocrine-metabolic': { class: 'interface', text: 'Endocrine + metabolic' },
  'sitebar.renal-electrolyte': { class: 'interface', text: 'Renal + electrolyte' },
  'sitebar.infectious-disease': { class: 'interface', text: 'Infectious disease' },
  'sitebar.medical-surgical-nursing': { class: 'interface', text: 'Nursing' },
  'sitebar.oncology': { class: 'interface', text: 'Oncology' },
  'sitebar.surgery-trauma': { class: 'interface', text: 'Surgery + trauma' },
  'sitebar.about': { class: 'interface', text: 'About' },
  'sitebar.for-educators': { class: 'interface', text: 'For educators' },
  'sitebar.curriculum': { class: 'interface', text: 'Curriculum' },
  'sitebar.validation': { class: 'interface', text: 'Validation' },
  'sitebar.governance': { class: 'interface', text: 'Governance' },
  'sitebar.limitations': { class: 'interface', text: 'Limitations' },
  'documents.review-status': { class: 'interface', text: 'Review status' },
  'documents.corrections': { class: 'interface', text: 'Corrections' },
  'documents.privacy': { class: 'interface', text: 'Privacy' },
  'documents.content-review': { class: 'interface', text: 'Review the content' },
  'documents.heading-fallback': { class: 'interface', text: 'Document' },
  'documents.footer.home': { class: 'interface', text: 'Back to the front page' },
  'documents.footer.about': { class: 'interface', text: 'About Open Sim Lab' },
  'documents.footer.simulator': { class: 'interface', text: 'Open the simulator' },
  'region.monitor': { class: 'interface', text: 'monitor' },
  'region.analysis': { class: 'interface', text: 'analysis' },
  'region.actions': { class: 'interface', text: 'actions' },
  'update.failed': { class: 'interface', text: 'Update could not be prepared. Your session is unchanged. Try again later.' },
  'update.ready': { class: 'interface', text: 'A newer version is ready.' },
  'update.session-warning': { class: 'interface', text: 'Reloading ends this session and clears its unsaved progress.' },
  'update.reload': { class: 'interface', text: 'Reload to update' },
  'update.later': { class: 'interface', text: 'Not now' },
  'ack.title': { class: 'root-prose', text: 'Before you start' },
  'ack.accept': { class: 'root-prose', text: 'I understand' },
  'ack.predicts': { class: 'root-prose', text: 'It predicts what a virtual patient does. It never advises what to do to a real one. The numbers it shows are model predictions, not measurements, and several of the models in this build have not yet had the independent check the project requires before calling them published.' },
  'ack.unreviewed-lead': { class: 'root-prose', text: 'No clinician has reviewed this content.' },
  'ack.unreviewed': { class: 'root-prose', text: 'The editorial board is empty and published as empty, and every item here is labeled “Educational use only. Not clinically reviewed”.' },
  'ack.review-status-link': { class: 'root-prose', text: 'The review-status page lists every item and the label it carries.' },
  'ack.local': { class: 'root-prose', text: 'This is asked once on this device and the answer is stored here. Nothing about it is sent anywhere.' },
  'not-found.heading': { class: 'interface', text: 'Nothing here' },
  'not-found.body': { class: 'interface', text: 'That address does not match a page. Nothing has been lost — this site is a handful of pages, and they are all listed below.' },
  'not-found.where': { class: 'interface', text: 'Where you probably wanted to go' },
  'not-found.anesthesia.link': { class: 'interface', text: 'The anesthesia simulator' },
  'not-found.anesthesia.why': { class: 'interface', text: 'every scenario' },
  'not-found.about.link': { class: 'interface', text: 'About Open Sim Lab' },
  'not-found.about.why': { class: 'interface', text: 'what it teaches and who it is for' },
  'not-found.validation.link': { class: 'interface', text: 'The validation report' },
  'not-found.validation.why': { class: 'interface', text: 'how closely the patient matches the evidence' },
  'not-found.governance.link': { class: 'interface', text: 'Clinical governance' },
  'not-found.governance.why': { class: 'interface', text: 'who has reviewed what, and what is outstanding' },
  'not-found.review-status.link': { class: 'interface', text: 'Review status' },
  'not-found.review-status.why': { class: 'interface', text: 'every item and the label it is published under' },
  'not-found.corrections.link': { class: 'interface', text: 'Corrections' },
  'not-found.corrections.why': { class: 'interface', text: 'every clinical error found, and what changed' },
  'not-found.limitations.link': { class: 'interface', text: 'The limitations register' },
  'not-found.limitations.why': { class: 'interface', text: 'what this deliberately does not model' },
  'not-found.privacy.link': { class: 'interface', text: 'Privacy' },
  'not-found.privacy.why': { class: 'interface', text: 'what is stored on your device, which is all of it' },
  'landing.name': { class: 'root-prose', text: 'Open Sim Lab' },
  'landing.modules': { class: 'root-prose', text: 'Specialty modules' },
  'landing.scenario-count': { class: 'root-prose', text: '{count, plural, one {# scenario} other {# scenarios}}' },
  'landing.planned': { class: 'root-prose', text: 'planned. No dates.' },
  'landing.watch': { class: 'root-prose', text: 'Watch a 90-second demonstration' },
  'landing.about': { class: 'root-prose', text: 'About' },
  'about.heading': { class: 'root-prose', text: 'About Open Sim Lab' },
  'about.modules': { class: 'root-prose', text: 'Modules' },
  'about.available': { class: 'root-prose', text: 'Available' },
  'about.planned': { class: 'root-prose', text: 'Planned' },
  'about.no-dates': { class: 'root-prose', text: 'No dates are promised for planned modules.' },
  'about.watch-releases': { class: 'root-prose', text: 'Watch the repository releases to hear when one ships' },
  'about.no-email': { class: 'root-prose', text: '. No email address is collected.' },
  'about.proposed': { class: 'root-prose', text: 'Proposed, not planned' },
  'about.proposed-note': { class: 'root-prose', text: 'Candidates the catalog could grow into. None is a promise: each must first pass a stated breadth test, including eight scenario proposals that each have real choices and consequences, before it can even be listed as planned.' },
  'about.proposal': { class: 'root-prose', text: '({status}). Needs {needs}. {count} of 8 scenario proposals written.' },
  'about.questions': { class: 'root-prose', text: 'Questions' },
  'about.home': { class: 'root-prose', text: 'Home' },
  'land.tagline': { class: 'root-prose', text: 'Practice {scenarios} clinical scenarios across {modules} specialties, free online, for medical students, residents, and nurse anesthetists.' },
  'land.fact1.text': { class: 'root-prose', text: 'Free, with no account and nothing to install.' },
  'land.fact1.short': { class: 'root-prose', text: 'No account' },
  'land.fact1.link': { class: 'root-prose', text: 'Read what is stored on your device' },
  'land.fact2.text': { class: 'root-prose', text: 'Works offline after the offline download finishes and you reload, including every bundled scenario and citation.' },
  'land.fact2.short': { class: 'root-prose', text: 'Works offline' },
  'land.fact2.link': { class: 'root-prose', text: 'Read how offline operation works' },
  'land.fact3.text': { class: 'root-prose', text: 'The drug models come from published pharmacology, with citations you can check.' },
  'land.fact3.short': { class: 'root-prose', text: 'Cited pharmacology' },
  'land.fact3.link': { class: 'root-prose', text: 'Read the validation report' },
  'land.what-it-teaches.heading': { class: 'root-prose', text: 'What it teaches, and how' },
  'land.what-it-teaches.p1': { class: 'root-prose', text: 'Most of what makes anaesthesia hard is invisible. The drug you pushed thirty seconds ago is still on its way to where it works. The pressure that just fell did so for a reason that determines what will fix it. The saturation that looks fine is about to stop looking fine, and how much warning you get depends on the patient in front of you.' },
  'land.what-it-teaches.p2': { class: 'root-prose', text: 'A textbook can tell you those things. It cannot show you them happening on a patient you are responsible for. That is what this is for: you give the drug, and you watch the plasma concentration spike while the effect-site concentration climbs slowly behind it, and you see the pressure follow the second curve rather than the first.' },
  'land.what-it-teaches.p3': { class: 'root-prose', text: 'Every session ends in a structured debrief that names what happened, ranks why it happened using the engine\'s own attribution, and computes what the alternative would have produced by re-running the simulation on your decisions with one thing changed.' },
  'land.who-it-is-for.heading': { class: 'root-prose', text: 'Who it is for' },
  'land.who-it-is-for.p1': { class: 'root-prose', text: 'It is built first for medical students on an anaesthesia rotation, in particular the one opening it the night before their first day in theatre. After that: anaesthesiology residents in their first year, nurse anaesthetist students, and the faculty who teach all three.' },
  'land.who-it-is-for.p2': { class: 'root-prose', text: 'It assumes basic cardiovascular and respiratory physiology and no anaesthesia experience at all. It is not built for practising anaesthetists, but it needs them, because no clinician has yet checked whether this patient behaves the way a real one does. If that is you, the governance page says exactly what is unreviewed and there is a control on every clinical claim for telling us it is wrong.' },
  'land.inside-the-module.heading': { class: 'root-prose', text: 'What is actually in it' },
  'land.inside-the-module.p1': { class: 'root-prose', text: 'Every module is a set of short cases, each built around one thing going wrong and one decision worth rehearsing. An anaesthesia induction where the pressure falls and the reason determines the fix. A ward patient whose early-warning score stays reassuring while they deteriorate. A cancer-treatment complication that arrives weeks after the exposure that caused it. None of them takes longer than a coffee break.' },
  'land.inside-the-module.p2': { class: 'root-prose', text: 'The catalogue is not printed here, because a list of {scenarios} titles is not writing and it goes stale the moment a scenario is added. Every module has its own page listing its cases with what each one teaches, and every case has a page of its own, both generated from the same registry the simulator runs from. Those cannot drift from what ships; a paragraph on this page could, and once did, for as long as it took someone to notice.' },
  'land.inside-the-module.p3': { class: 'root-prose', text: 'What is common to all of them is the machinery: a sweeping monitor driven by the real waveform engine, population pharmacokinetics for the drugs that have published models, a clearly labelled teaching model for the ones that do not, and a structured debrief that re-runs your own decisions with one thing changed so you can see what the alternative would have produced.' },
  'land.inside-the-module.li1': { class: 'root-prose', text: 'A sweeping monitor with electrocardiogram, arterial pressure, capnography and plethysmography, all phase-coherent.' },
  'land.inside-the-module.li2': { class: 'root-prose', text: 'Propofol and remifentanil, with their compartment kinetics and interaction, pediatric propofol kinetics from Paedfusor, plus a clearly labeled teaching model of rocuronium onset and spontaneous recovery.' },
  'land.inside-the-module.li3': { class: 'root-prose', text: 'Apnoea and desaturation that follow the published times rather than a stopwatch, and a circulation that fails the way an unrelieved airway problem actually makes it fail.' },
  'land.inside-the-module.li4': { class: 'root-prose', text: 'Laryngoscopy with a Cormack-Lehane grade, where repeated attempts make things worse.' },
  'land.inside-the-module.li5': { class: 'root-prose', text: 'A PEARLS debrief with computed counterfactuals.' },
  'land.inside-the-module.link': { class: 'root-prose', text: 'See every module and what it covers' },
  'land.where-the-pharmacology-comes-from.heading': { class: 'root-prose', text: 'Where the pharmacology comes from' },
  'land.where-the-pharmacology-comes-from.p1': { class: 'root-prose', text: 'Every model parameter is transcribed by hand from its primary publication into typed source in this repository. There is no external dataset, nothing vendored, and nothing fetched at build or run time. Each model carries its citation, the table it was read from, and the range of patients it was derived in.' },
  'land.where-the-pharmacology-comes-from.p2': { class: 'root-prose', text: 'Applying a model outside that range does not silently produce a number. It marks the model out of range, names which covariate is out of bounds and by how much, and offers one that is not, and it still runs, so you can see what going out of range actually does.' },
  'land.where-the-pharmacology-comes-from.p3': { class: 'root-prose', text: 'The project requires that every parameter be independently checked by a second person against a second source before a model may be called published. That check has not been done for this build, so no model here carries that label, and the interface says so wherever a model drives a number.' },
  'land.where-the-pharmacology-comes-from.link': { class: 'root-prose', text: 'Read the validation report' },
  'land.how-it-is-reviewed.heading': { class: 'root-prose', text: 'How the clinical content is reviewed' },
  'land.how-it-is-reviewed.p1': { class: 'root-prose', text: 'Every scenario, protocol, drug card and explainer is meant to carry a machine-readable review record naming a credentialed clinician, their competing interests, the sources they consulted, and the date it is due for re-review. The build excludes anything without one.' },
  'land.how-it-is-reviewed.p2': { class: 'root-prose', text: 'In this build, nothing is signed. The editorial board is empty and recruiting it is ongoing. The governance page lists every outstanding item by name rather than reporting a reassuring percentage.' },
  'land.how-it-is-reviewed.link': { class: 'root-prose', text: 'Read the governance records' },
  'land.what-it-does-not-do.heading': { class: 'root-prose', text: 'What it deliberately does not do' },
  'land.what-it-does-not-do.p1': { class: 'root-prose', text: 'It does not teach psychomotor skills. You cannot learn to hold a laryngoscope from a screen, and this does not pretend otherwise. It does not teach physical airway technique, and it does not model team communication at all, which is a large part of what goes wrong in real crises.' },
  'land.what-it-does-not-do.p2': { class: 'root-prose', text: 'It does not replace mannequin-based simulation or supervised clinical time. The evidence that screen-based simulation helps is evidence that it helps BEFORE those things, not instead of them.' },
  'land.what-it-does-not-do.p3': { class: 'root-prose', text: 'And it is not a clinical tool. It predicts what a virtual patient does. It never advises what to do to a real one, there is no field anywhere that accepts a real patient\'s details, and the simulation core is structurally incapable of turning a target concentration into a dose.' },
  'land.what-it-does-not-do.link': { class: 'root-prose', text: 'Read the limitations register' },
  'land.using-it-in-a-course.heading': { class: 'root-prose', text: 'How to use it in a course' },
  'land.using-it-in-a-course.p1': { class: 'root-prose', text: 'It needs no licence, no procurement, no accounts and no institutional integration. Send your students a link and they are in, or clone the repository, run the documented build, and host the resulting files yourself from any static host, on your own domain, with no dependency on this project staying online.' },
  'land.using-it-in-a-course.p2': { class: 'root-prose', text: 'Because practice stays on the device, you cannot see what a student did unless they export a transcript and send it to you themselves. That is a deliberate trade: the confidentiality simulation standards ask for is easier to guarantee when the data was never collected.' },
  'land.using-it-in-a-course.p3': { class: 'root-prose', text: 'Scenarios are plain JSON validated against a published schema, so an educator can write one by hand, validate it in the browser, and run it without touching the application source or installing anything locally. If you build one worth sharing, the repository will take it.' },
  'land.q1.question': { class: 'root-prose', text: 'Is it free?' },
  'land.q1.answer': { class: 'root-prose', text: 'Yes, entirely, with no paid tier and nothing held back.' },
  'land.q2.question': { class: 'root-prose', text: 'Do I need an account?' },
  'land.q2.answer': { class: 'root-prose', text: 'No. There is no sign-in, learner account, or remote practice record anywhere.' },
  'land.q3.question': { class: 'root-prose', text: 'Does it work offline?' },
  'land.q3.answer': { class: 'root-prose', text: 'Yes. After the offline download finishes, reload once while online. Bundled scenarios, models, citations and debriefs then work with the network switched off. You can install it to your home screen. Clearing site data or browser storage eviction requires another download.' },
  'land.q4.question': { class: 'root-prose', text: 'Can I use it on a phone?' },
  'land.q4.answer': { class: 'root-prose', text: 'Yes. The layout reflows down to a 360-pixel-wide screen and a full induction is completable there. It is designed to run on a four-year-old mid-range Android.' },
  'land.q5.question': { class: 'root-prose', text: 'Where do the drug models come from?' },
  'land.q5.answer': { class: 'root-prose', text: 'From the primary literature, transcribed by hand into this repository with their citations. Marsh 1991, Schnider 1998, Eleveld 2018 and Minto 1997 are the models in this build.' },
  'land.q6.question': { class: 'root-prose', text: 'Who reviews the clinical content?' },
  'land.q6.answer': { class: 'root-prose', text: 'A named editorial board of credentialed clinicians is the intended answer. In this build the board is empty and nothing has been signed, which the governance page states plainly rather than glossing over.' },
  'land.q7.question': { class: 'root-prose', text: 'Can I use it in a course?' },
  'land.q7.answer': { class: 'root-prose', text: 'Yes. The code is MIT licensed and the educational content is openly licensed per scenario, so you can adopt it, adapt it, or self-host it without asking anyone.' },
  'land.q8.question': { class: 'root-prose', text: 'Does it replace mannequin simulation?' },
  'land.q8.answer': { class: 'root-prose', text: 'No. It is a different thing that works well before mannequin simulation, not instead of it. It teaches nothing about your hands.' },
  'land.q9.question': { class: 'root-prose', text: 'When are the other modules coming?' },
  'land.q9.answer': { class: 'root-prose', text: 'No date is promised. The project does not commit to a schedule it cannot keep. Releases are announced on the public repository, and no email address is collected for the purpose.' },
  'land.invitation': { class: 'root-prose', text: 'If you are a clinician, your review would change that.' },
  'land.footer.license': { class: 'root-prose', text: 'License' },
  'land.footer.source': { class: 'root-prose', text: 'Source' },
  'error.heading': { class: 'interface', text: 'Something in the {surface} broke' },
  'error.defect': { class: 'interface', text: 'This is a defect in Open Sim Lab, not something you did. The patient was never real and nothing has been lost that was not already only on this device.' },
  'error.try-heading': { class: 'interface', text: 'What to try' },
  'error.try-reload': { class: 'interface', text: 'Reload the page. Most render errors do not survive one.' },
  'error.try-clear': { class: 'interface', text: 'If it happens again, clear this site’s stored settings below. That resets your preferences and any saved session, and nothing else.' },
  'error.reload': { class: 'interface', text: 'Reload the page' },
  'error.retry': { class: 'interface', text: 'Try that screen again' },
  'error.clear': { class: 'interface', text: 'Clear stored settings and reload' },
  'error.send-heading': { class: 'interface', text: 'What to send if you report it' },
  'error.send': { class: 'interface', text: 'Copying this and saying what you were doing is genuinely the most useful thing you can do with a broken build. Nothing here has been sent anywhere.' },
  'error.issue': { class: 'interface', text: 'Open an issue on the public repository' },
  'error.simulator': { class: 'interface', text: 'The simulator' },
  'flag.existing': { class: 'interface', text: 'You flagged this as' },
  'flag.edit': { class: 'interface', text: 'Edit this note' },
  'flag.open': { class: 'interface', text: 'Something here is wrong' },
  'flag.remove': { class: 'interface', text: 'Remove note' },
  'flag.severity': { class: 'interface', text: 'How serious is it?' },
  'flag.what': { class: 'interface', text: 'What is wrong' },
  'flag.what-placeholder': { class: 'interface', text: 'The number, the mechanism, or the lesson a learner would take from this.' },
  'flag.correction': { class: 'interface', text: 'What it should say, if you know' },
  'flag.correction-placeholder': { class: 'interface', text: 'Optional. A source is more useful than a correction, if you have one.' },
  'flag.save': { class: 'interface', text: 'Save this note' },
  'flag.cancel': { class: 'interface', text: 'Cancel' },
  'flag.saved-locally': { class: 'interface', text: 'Saved on this device only. Nothing is sent anywhere; you export the notes as one file when you are finished.' },
} as const satisfies Readonly<Record<string, SourceMessage>>;

export type MessageKey = keyof typeof CORE_MESSAGES | keyof typeof DOCUMENT_MESSAGES
  | keyof typeof EDUCATOR_MESSAGES | keyof typeof SESSION_MESSAGES;

/** Every source message registered so far: the core, then each group a surface imported. */
const REGISTERED: Record<string, SourceMessage> = { ...CORE_MESSAGES };

/** Called once by each group module as it loads. */
export function registerMessages(group: Readonly<Record<string, SourceMessage>>): void {
  Object.assign(REGISTERED, group);
}

/**
 * Locale catalogs that exist. None yet: a locale is added only with named
 * translators, and offered only at full, non-stale coverage.
 */
export const LOCALE_CATALOGS: readonly LocaleCatalog[] = [];

let activeCatalog: LocaleCatalog | undefined;

/**
 * Switch the catalog `t` reads by default. Nothing in production calls this
 * yet, because no locale is offered; development uses it for the pseudo-locales.
 */
export function setActiveCatalog(catalog: LocaleCatalog | undefined): void {
  activeCatalog = catalog;
}

/** The interface string for a key, in English until a locale is offered. */
export function t(key: MessageKey, params?: Params, catalog: LocaleCatalog | undefined = activeCatalog): string {
  return translate(REGISTERED, key, params, catalog);
}
