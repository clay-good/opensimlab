import type { GuidanceLevel } from '@anesthesia/tutor/guidance';
import type { SepticShockLabelSnapshot } from '@platform/kernel/protocol';

export const SEPTIC_SHOCK_LABEL_TUTOR_VERSION = '0.1.0';

/**
 * These prompts carry no external link, deliberately.
 *
 * This scenario declares its sources as full citations without URLs, and a link
 * built from a citation is a guess rather than a lookup. The tray already sends
 * a reader to the source view, which shows the declared citations in full.
 */

/**
 * Observed-state guidance for a label the treatment creates.
 *
 * The definition needs vasopressors running and a lactate above threshold
 * despite adequate resuscitation, so nothing here can be classified until the
 * resuscitation has happened — the label is downstream of the treatment rather
 * than upstream of it. The prompts therefore never apply it early and never
 * withhold care while waiting for it. Two more corrections come with their
 * grades attached: the lactate is not a measure of tissue hypoxia in sepsis,
 * and the 65 mmHg recommendation is comparative against higher targets rather
 * than a floor to raise.
 */
export function septicShockLabelInlinePrompt(level: GuidanceLevel, input: {
  readonly scenarioVersion: string; readonly septicShockLabel?: SepticShockLabelSnapshot;
}) {
  const patient = input.septicShockLabel;
  if (level === 'unassisted' || input.scenarioVersion !== '0.1.1' || !patient || patient.ended) return null;
  const prompt = (id: string, urgent: boolean, suggestion: string, because: string) =>
    level === 'coached' && !urgent ? null : { id, suggestion, because };

  if (patient.hypoperfusionAtTick === null) return prompt('septic-shock-hypoperfusion', true,
    'Record what is measurable now, without naming it.',
    'A mean pressure of 60, a lactate of 3.6, and no vasopressor running. That is hypoperfusion with infection, which is a description rather than a classification.');
  if (patient.criticalCareAtTick === null) return prompt('septic-shock-critical-care', true,
    'Activate critical care on the perfusion, not on a label.',
    'Nothing about the activation waits for the classification. That is the point: the team is needed for the perfusion, and the label will follow the treatment rather than precede it.');
  if (patient.classificationOpenAtTick === null) return prompt('septic-shock-classification', true,
    'Record the classification as open, and say why.',
    'The definition needs vasopressors holding a mean at or above 65 with a lactate above 2 despite adequate resuscitation. No vasopressor is running, so the criteria cannot be evaluated yet — not because the patient is well.');
  if (patient.resuscitationIntentAtTick === null) return prompt('septic-shock-intent', true,
    'Record bounded resuscitation intent against the ceiling.',
    'The trial is what makes the definition readable later. Recording whether the intent falls inside the hour is part of the record rather than a formality.');
  if (patient.boundariesReviewedAtTick === null) return prompt('septic-shock-boundaries', true,
    'Review the recommendations with their grades attached.',
    'The 65 mmHg target is a strong recommendation over higher targets, which is comparative rather than a floor. An elevated lactate in sepsis is not a measure of tissue hypoxia, and the guidance says to individualize fluid after the initial bolus rather than chase the number to normal.');
  if (patient.monitoringAtTick === null) return prompt('septic-shock-monitor', true,
    'Keep perfusion monitoring running through the resuscitation.',
    'The trial is the measurement, and an unmonitored trial measures nothing. Whatever the label turns out to be, it will be read off this.');
  if (!patient.trialComplete) return prompt('septic-shock-observe', false,
    'Let the resuscitation run and keep watching.',
    'This authored interval is a contrast rather than a real response time. The classification is not available until it finishes, and nothing needs restating while it does.');
  if (!patient.trialObserved) return prompt('septic-shock-reassess', true,
    'Take a current full assessment now the trial has completed.',
    `The definition is readable from what the resuscitation produced: ${patient.vasopressorDependent ? 'a vasopressor is running' : 'no vasopressor is running'}, and the mean pressure and lactate can now be read against the criteria.`);
  return prompt('septic-shock-handoff', false,
    'Hand off what the trial showed, and the classification with it.',
    'The label was never available at the start, and it is available now only because the treatment happened. What travels is the perfusion, the trial, and which criteria it did or did not satisfy.');
}
