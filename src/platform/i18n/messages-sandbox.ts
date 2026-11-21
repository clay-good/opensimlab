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
  'sandbox.heading': { class: 'interface', text: 'Pharmacology sandbox' },
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
