/**
 * The run sheet: a scenario written for someone running it away from this
 * simulator (learning/facilitation → run sheet).
 *
 * A facilitator with a mannequin, a room of students and no screen still needs
 * what the lesson is: the states it moves through, what each one looks like,
 * what a learner is expected to do, and what may not be claimed about any of
 * it. That is all already authored — the timeline is the state model and the
 * checked-in expert transcript is the expected actions — so the sheet is a view
 * of the scenario, never a second copy of it that can drift.
 *
 * It is emitted as plain text and as JSON carrying the same fields, and in no
 * vendor format: none is open, and producing one would imply this content is a
 * validated mannequin scenario, which it is not.
 *
 * VITALS. A closed-loop lesson's states carry the numbers its model produced at
 * that event, replaying the checked-in expert transcript under the fixture's
 * seed — sampled at build time, because the engine is not something a printed
 * sheet can run. They are a model output under one reference path and not a
 * prediction about any patient, and `vitalsNote` says exactly that where they
 * appear. The 217 state-transition lessons have no model to run and carry their
 * observations in the authored text of each state, which `vitalsNote` also says
 * rather than leaving a facilitator to read the absence as "this lesson has
 * none".
 */
import type { Scenario } from '@anesthesia/scenarios/types';
import { NOT_FOR_CLINICAL_USE, NOT_CLINICALLY_REVIEWED } from '@platform/transcript/transcript';
import { MATURITY_LABELS } from '@platform/governance/publication';
import type { ReferenceStep, ReferenceVitals } from './reference-paths';

/** One authored state of the scenario, in the order the timeline declares it. */
export interface RunSheetState {
  readonly id: string;
  /** `At start`, `Tick 1300`, or the condition the event fires on. */
  readonly at: string;
  readonly severity: string;
  /** The authored narration of this state, or the event's own type and target. */
  readonly text: string;
  /** What the model produced here, for a closed-loop lesson only. */
  readonly vitals?: Readonly<Record<string, number>>;
}

/** One step of the checked-in expert transcript. */
export interface RunSheetAction {
  readonly at: string;
  readonly action: string;
  readonly detail?: string;
}

export interface RunSheet {
  readonly moduleId: string;
  readonly scenarioId: string;
  readonly title: string;
  readonly contentVersion: string;
  readonly maturity: string;
  readonly licence: string;
  readonly estimatedMinutes: number;
  readonly objectives: readonly string[];
  readonly states: readonly RunSheetState[];
  readonly expectedActions: readonly RunSheetAction[];
  readonly sources: readonly string[];
  readonly notForClinicalUse: string;
  readonly notClinicallyReviewed: string;
  /** What the numbers are, or why there are none; absence is never read as "none". */
  readonly vitalsNote: string;
}

export const RUN_SHEET_MODELLED_VITALS_NOTE =
  'The numbers beside each state are what this lesson\'s model produced at that moment while '
  + 'replaying its checked-in expert transcript. They are a model output under one reference '
  + 'path, not a prediction about any patient, and a learner taking a different path will see '
  + 'different numbers.';

export const RUN_SHEET_AUTHORED_VITALS_NOTE =
  'This lesson runs no physiological model, so no numbers are sampled for it. Its observations '
  + 'are in the authored text of each state below, where its author put them.';

export const RUN_SHEET_EXPECTED_ACTIONS_NOTE =
  'The expected actions are one checked-in reference transcript through this lesson. They are '
  + 'not a mark scheme, not the only safe way through, and not a prediction about your group.';

/** `At start`, `Tick 1300`, the firing condition, or that nothing schedules it. */
function timingOf(event: { readonly atTick?: number; readonly when?: string }): string {
  if (event.atTick !== undefined) return event.atTick === 0 ? 'At start' : `Tick ${event.atTick}`;
  if (event.when !== undefined) return `When ${event.when}`;
  return 'Unscheduled';
}

export function buildRunSheet(
  moduleId: string,
  scenario: Scenario,
  expert: readonly ReferenceStep[],
  expertVitals: readonly ReferenceVitals[] = [],
): RunSheet {
  const { metadata } = scenario;
  const vitalsByTick = new Map(expertVitals.map((sample) => [sample.tick, sample.vitals]));
  return {
    moduleId,
    scenarioId: metadata.id,
    title: metadata.title,
    contentVersion: metadata.version,
    maturity: MATURITY_LABELS[metadata.maturity],
    licence: metadata.license,
    estimatedMinutes: metadata.estimatedMinutes,
    objectives: metadata.objectives.map((objective) => objective.statement),
    states: scenario.timeline.map((event) => {
      const vitals = event.atTick === undefined ? undefined : vitalsByTick.get(event.atTick);
      return {
        id: event.id,
        at: timingOf(event),
        severity: event.severity ?? 'info',
        text: event.message ?? `${event.type}${event.target === undefined ? '' : `: ${event.target}`}`,
        ...(vitals === undefined ? {} : { vitals }),
      };
    }),
    expectedActions: expert.map((step) => ({
      at: step.tick === 0 ? 'At start' : `Tick ${step.tick}`,
      action: step.label,
      ...(step.detail === undefined ? {} : { detail: step.detail }),
    })),
    sources: metadata.clinicalReview.sources,
    notForClinicalUse: NOT_FOR_CLINICAL_USE,
    notClinicallyReviewed: NOT_CLINICALLY_REVIEWED,
    vitalsNote: expertVitals.length > 0
      ? RUN_SHEET_MODELLED_VITALS_NOTE : RUN_SHEET_AUTHORED_VITALS_NOTE,
  };
}

/** The JSON form. Every field of the sheet, and nothing computed on the way out. */
export function runSheetJson(sheet: RunSheet): string {
  return `${JSON.stringify(sheet, null, 2)}\n`;
}

/**
 * The plain-text form, carrying the same fields as the JSON.
 *
 * Plain text because a facilitator prints it, writes on it, and reads it in a
 * room where the screen is showing something else.
 */
export function runSheetText(sheet: RunSheet): string {
  const lines: string[] = [
    sheet.title,
    `Module: ${sheet.moduleId}`,
    `Content version: ${sheet.contentVersion}`,
    `Published as: ${sheet.maturity}`,
    `Licence: ${sheet.licence}`,
    `About ${sheet.estimatedMinutes} simulated minutes`,
    '',
    'WHAT THIS LESSON IS FOR',
    ...sheet.objectives.map((objective) => `  - ${objective}`),
    '',
    'STATES',
  ];
  sheet.states.forEach((state, index) => {
    lines.push(`  ${index + 1}. [${state.at}] (${state.severity}) ${state.id}`);
    if (state.vitals !== undefined) {
      lines.push(`     ${Object.entries(state.vitals).map(([key, value]) => `${key} ${value}`).join('  ')}`);
    }
    lines.push(`     ${state.text}`);
  });
  lines.push('', 'EXPECTED LEARNER ACTIONS', `  ${RUN_SHEET_EXPECTED_ACTIONS_NOTE}`);
  for (const action of sheet.expectedActions) {
    lines.push(`  [${action.at}] ${action.action}${action.detail === undefined ? '' : ` (${action.detail})`}`);
  }
  lines.push('', 'VITAL SIGNS', `  ${sheet.vitalsNote}`);
  lines.push('', 'SOURCES', ...sheet.sources.map((source) => `  - ${source}`));
  lines.push('', sheet.notForClinicalUse, sheet.notClinicallyReviewed, '');
  return lines.join('\n');
}
