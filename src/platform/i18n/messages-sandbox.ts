/**
 * The pharmacology sandbox's words.
 *
 * Its own group rather than the session's, because the session group ships with
 * the cockpit and the sandbox is a separate page: putting these here keeps them
 * out of every lesson's download. Importing this module registers it with `t`.
 */
import type { SourceMessage } from './catalog';
import { registerMessages } from './messages';

export const SANDBOX_MESSAGES = {
  'sandbox.heading': { class: 'interface', text: 'Sandbox' },
  'sandbox.intro': { class: 'interface', text: 'Give one bolus to one of the lessons\' patients and watch the plasma and effect-site concentrations. Hold the dose and vary age or weight to see one variable change the curves.' },
  'sandbox.boundary': { class: 'interface', text: 'A dose goes in and a curve comes out; nothing here works out a dose for you. Every patient, dose and value is one a lesson already uses. Not for clinical use.' },
  'sandbox.link-problem': { class: 'interface', text: 'That link could not be opened, so the default is shown instead. {problem}' },
  'sandbox.inputs': { class: 'interface', text: 'What to give, and to whom' },
  'sandbox.model': { class: 'interface', text: 'Drug and model' },
  'sandbox.patient-label': { class: 'interface', text: 'Patient' },
  'sandbox.patient': { class: 'interface', text: '{age} y, {sex}, {weight} kg, {height} cm' },
  'sandbox.dose': { class: 'interface', text: 'Bolus ({unit})' },
  'sandbox.minutes': { class: 'interface', text: 'Show' },
  'sandbox.minutes-option': { class: 'interface', text: '{minutes} min' },
  'sandbox.vary': { class: 'interface', text: 'Hold the dose and vary' },
  'sandbox.vary-none': { class: 'interface', text: 'Nothing' },
  'sandbox.vary-ageYears': { class: 'interface', text: 'Age' },
  'sandbox.vary-weightKg': { class: 'interface', text: 'Weight' },
  'sandbox.values': { class: 'interface', text: 'Values to compare (2 to {max}, each one a lesson\'s patient has)' },
  'sandbox.plasma': { class: 'interface', text: 'Plasma concentration ({unit})' },
  'sandbox.effect': { class: 'interface', text: 'Effect-site concentration ({unit})' },
  'sandbox.plot-label': { class: 'interface', text: '{what} over {minutes} minutes, one line per patient; the table below gives the values.' },
  'sandbox.views': { class: 'interface', text: 'Sandbox views' },
  'sandbox.view-pharmacology': { class: 'interface', text: 'Pharmacology' },
  'sandbox.view-physiology': { class: 'interface', text: 'Physiology: oxygen during apnoea' },
  'sandbox.physiology-intro': { class: 'interface', text: 'Breathe the chosen oxygen for {minutes} minutes, then switch to the chosen breathing pattern and watch saturation and arterial oxygen. This is the gas-exchange model the lessons run.' },
  'sandbox.physiology-inputs': { class: 'interface', text: 'The patient, and what happens next' },
  'sandbox.physiology-suggest': { class: 'interface', text: 'Where this matters in a case:' },
  'sandbox.stopped': { class: 'interface', text: 'The run stopped at {minutes} minutes, when saturation fell below {floor}% (oxygen tension {pao2} mmHg, carbon dioxide tension {paco2} mmHg). The model is held to the time to 90%; below {floor}% it does not describe a course worth learning, so nothing further is drawn.' },
  'sandbox.profile': { class: 'interface', text: 'Patient profile' },
  'sandbox.profile-healthy': { class: 'interface', text: 'Healthy adult' },
  'sandbox.profile-moderately-ill': { class: 'interface', text: 'Moderately ill adult' },
  'sandbox.profile-obese': { class: 'interface', text: 'Obese adult' },
  'sandbox.profile-term-pregnancy': { class: 'interface', text: 'Term pregnancy' },
  'sandbox.fio2': { class: 'interface', text: 'Oxygen breathed beforehand' },
  'sandbox.pattern': { class: 'interface', text: 'Then' },
  'sandbox.pattern-apnea': { class: 'interface', text: 'Apnoea' },
  'sandbox.pattern-spontaneous': { class: 'interface', text: 'Normal breathing' },
  'sandbox.pattern-half-tidal-volume': { class: 'interface', text: 'Half the tidal volume' },
  'sandbox.basis-published': { class: 'interface', text: 'Held to a published result' },
  'sandbox.basis-teaching': { class: 'interface', text: 'Teaching calibration' },
  'sandbox.spo2': { class: 'interface', text: 'Arterial oxygen saturation (%)' },
  'sandbox.pao2': { class: 'interface', text: 'Arterial oxygen tension (mmHg)' },
  'sandbox.plot-label-one': { class: 'interface', text: '{what} over {minutes} minutes; the line below gives the values.' },
  'sandbox.to-90': { class: 'interface', text: 'Saturation reached 90% after {minutes} minutes.' },
  'sandbox.no-desaturation': { class: 'interface', text: 'Saturation stayed above 90% for all {minutes} minutes.' },
  'sandbox.end-values': { class: 'interface', text: 'At {minutes} minutes: saturation {spo2}%, oxygen tension {pao2} mmHg, carbon dioxide tension {paco2} mmHg.' },
  'sandbox.physiology-source': { class: 'interface', text: 'Apnoea in the healthy, moderately ill and obese adult is held to Benumof, Dagg and Benumof 1997 (about 8, 5 and 2.7 minutes to 90% after preoxygenation). Breathing runs through a teaching calibration of the body\'s carbon dioxide store.' },
  'sandbox.physiology-case': { class: 'interface', text: 'Rapid desaturation' },
  'sandbox.no-effect-site': { class: 'interface', text: 'This model declares no effect site, so only plasma is drawn.' },
  'sandbox.table-caption': { class: 'interface', text: 'One {dose} {unit} bolus at time zero, over {minutes} minutes. Out-of-range curves are drawn dimmed and dashed.' },
  'sandbox.col-patient': { class: 'interface', text: 'Patient' },
  'sandbox.col-envelope': { class: 'interface', text: 'Model envelope' },
  'sandbox.col-plasma-end': { class: 'interface', text: 'Plasma at {minutes} min' },
  'sandbox.col-effect-peak': { class: 'interface', text: 'Effect-site peak' },
  'sandbox.peak': { class: 'interface', text: '{value} {unit} at {seconds} s' },
  'sandbox.none': { class: 'interface', text: 'None' },
  'sandbox.model-source': { class: 'interface', text: 'Model: {citation}, {locator}.' },
  'sandbox.suggest': { class: 'interface', text: 'Where this pharmacology matters in a case:' },
} as const satisfies Readonly<Record<string, SourceMessage>>;

registerMessages(SANDBOX_MESSAGES);
